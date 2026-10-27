// `session.ts` tiene estado de módulo (lee localStorage al importarse, escucha `storage` y programa la
// renovación). Cada prueba prepara localStorage y lo vuelve a importar con vi.resetModules().
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '../../../src/lib/types';
import { makeMe, makeSession } from '../../helpers/factories';
import { deferred, errorResponse, jsonResponse } from '../../helpers/http';

type SessionModule = typeof import('../../../src/lib/session');

const STORAGE_KEY = 'strim.session';
const fetchMock = vi.fn<typeof fetch>();
let mod: SessionModule | null = null;

async function loadSession(stored?: AuthSession) {
  if (stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  vi.resetModules();
  mod = await import('../../../src/lib/session');
  return mod;
}

function stored(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const inTwoHours = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

describe('session', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    // Apaga el temporizador de renovación del módulo de esta prueba.
    mod?.clearSession();
    mod = null;
    vi.useRealTimers();
  });

  describe('al importarse', () => {
    it('lee la sesión guardada en localStorage', async () => {
      const session = makeSession();
      const { getSession } = await loadSession(session);
      expect(getSession()).toEqual(session);
    });

    it('sin nada guardado (o con un valor corrupto) no hay sesión', async () => {
      localStorage.setItem(STORAGE_KEY, '{roto');
      const { getSession } = await loadSession();
      expect(getSession()).toBeNull();
    });
  });

  describe('startSession y clearSession', () => {
    it('startSession guarda la sesión en localStorage', async () => {
      const { startSession, getSession } = await loadSession();
      const session = makeSession();

      startSession(session);

      expect(getSession()).toEqual(session);
      expect(stored()).toEqual(session);
    });

    it('clearSession(true) borra la sesión y marca endedByUser', async () => {
      const { startSession, clearSession, useSession } = await loadSession();
      startSession(makeSession());
      const { result } = renderHook(() => useSession());

      act(() => clearSession(true));

      expect(result.current).toEqual({ status: 'ready', session: null, endedByUser: true });
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('clearSession() (vencida o rechazada) no marca endedByUser', async () => {
      const { startSession, clearSession, useSession } = await loadSession();
      startSession(makeSession());
      const { result } = renderHook(() => useSession());

      act(() => clearSession());

      expect(result.current.endedByUser).toBe(false);
      expect(result.current.session).toBeNull();
    });

    it('updateUser cambia el usuario guardado y no hace nada sin sesión', async () => {
      const { startSession, updateUser, getSession, clearSession } = await loadSession();
      updateUser((user) => ({ ...user, email: 'x@mail.com' }));
      expect(getSession()).toBeNull();

      startSession(makeSession());
      updateUser((user) => ({ ...user, profile: { ...user.profile, displayName: 'Ana T.' } }));
      expect(getSession()!.user.profile.displayName).toBe('Ana T.');
      expect(stored()!.user.profile.displayName).toBe('Ana T.');
      clearSession();
    });

    it('onTokenChange avisa solo cuando cambia el access token', async () => {
      const { startSession, clearSession, updateUser, onTokenChange } = await loadSession();
      const listener = vi.fn();
      const unsubscribe = onTokenChange(listener);

      startSession(makeSession({ accessToken: 'a-1' }));
      updateUser((user) => ({ ...user, email: 'otro@mail.com' }));
      clearSession();

      expect(listener.mock.calls).toEqual([['a-1'], [null]]);
      unsubscribe();
    });
  });

  describe('refreshSession', () => {
    it('sin sesión devuelve false sin llamar al backend', async () => {
      const { refreshSession } = await loadSession();
      await expect(refreshSession()).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('hace una sola petición aunque la pidan varias llamadas a la vez', async () => {
      const { refreshSession, getSession } = await loadSession(makeSession({ refreshToken: 'r-1' }));
      const response = deferred<Response>();
      fetchMock.mockReturnValueOnce(response.promise);

      const first = refreshSession();
      const second = refreshSession();
      const third = refreshSession();
      expect(second).toBe(first);
      expect(third).toBe(first);

      const expiresAt = inTwoHours();
      response.resolve(jsonResponse({ accessToken: 'a-2', refreshToken: 'r-2', expiresAt }));

      await expect(Promise.all([first, second, third])).resolves.toEqual([true, true, true]);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/auth/refresh');
      expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ refreshToken: 'r-1' });
      expect(getSession()).toMatchObject({ accessToken: 'a-2', refreshToken: 'r-2', expiresAt, user: makeMe() });
      expect(stored()).toMatchObject({ accessToken: 'a-2', refreshToken: 'r-2' });
    });

    it('cuando termina, una llamada nueva vuelve a pedir', async () => {
      const { refreshSession } = await loadSession(makeSession());
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ accessToken: 'a-2', refreshToken: 'r-2', expiresAt: inOneHour() }))
        .mockResolvedValueOnce(jsonResponse({ accessToken: 'a-3', refreshToken: 'r-3', expiresAt: inOneHour() }));

      await refreshSession();
      await refreshSession();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('adopta los tokens si otra pestaña ya renovó', async () => {
      const current = makeSession({ accessToken: 'a-1', expiresAt: inOneHour() });
      const { refreshSession, getSession } = await loadSession(current);
      const fromOtherTab = { ...current, accessToken: 'a-otra', refreshToken: 'r-otra', expiresAt: inTwoHours() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromOtherTab));

      await expect(refreshSession()).resolves.toBe(true);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(getSession()).toEqual(fromOtherTab);
    });

    it('si el backend rechaza el refresh token (401), borra la sesión', async () => {
      const { refreshSession, getSession, useSession } = await loadSession(makeSession());
      fetchMock.mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.'));
      const { result } = renderHook(() => useSession());

      await act(async () => {
        await expect(refreshSession()).resolves.toBe(false);
      });

      expect(getSession()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.endedByUser).toBe(false);
    });

    it('sin conexión (NETWORK_ERROR) conserva la sesión', async () => {
      const session = makeSession();
      const { refreshSession, getSession } = await loadSession(session);
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(refreshSession()).resolves.toBe(false);

      expect(getSession()).toEqual(session);
      expect(stored()).toEqual(session);
    });

    it('se programa sola un minuto antes de que venza el access token', async () => {
      const { startSession, getSession } = await loadSession();
      vi.useFakeTimers();
      startSession(makeSession({ expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() }));
      fetchMock.mockImplementation(async () => jsonResponse({ accessToken: 'a-2', refreshToken: 'r-2', expiresAt: inOneHour() }));

      await vi.advanceTimersByTimeAsync(59_000);
      expect(fetchMock).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1_000);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/auth/refresh');
      await vi.waitFor(() => expect(getSession()!.accessToken).toBe('a-2'));
    });
  });

  describe('bootSession', () => {
    it('sin sesión guardada no llama al backend', async () => {
      const { bootSession } = await loadSession();
      await bootSession();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('pasa por "checking" y actualiza el usuario con GET /api/me', async () => {
      const { bootSession, useSession, getSession } = await loadSession(makeSession());
      const response = deferred<Response>();
      fetchMock.mockReturnValueOnce(response.promise);
      const { result } = renderHook(() => useSession());

      let booting!: Promise<void>;
      act(() => {
        booting = bootSession();
      });
      expect(result.current.status).toBe('checking');

      const fresh = makeMe({ profile: { displayName: 'Ana Actualizada' } });
      await act(async () => {
        response.resolve(jsonResponse(fresh));
        await booting;
      });

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/me');
      expect(result.current.status).toBe('ready');
      expect(getSession()!.user).toEqual(fresh);
    });

    it('con 401 (y renovación rechazada) borra la sesión', async () => {
      const { bootSession, getSession, useSession } = await loadSession(makeSession());
      fetchMock
        .mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.')) // GET /me
        .mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.')); // POST /auth/refresh
      const { result } = renderHook(() => useSession());

      await act(async () => {
        await bootSession();
      });

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://api.test/api/me', 'http://api.test/api/auth/refresh']);
      expect(getSession()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.status).toBe('ready');
    });

    it('sin conexión sigue con el usuario guardado', async () => {
      const session = makeSession();
      const { bootSession, getSession, useSession } = await loadSession(session);
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useSession());

      await act(async () => {
        await bootSession();
      });

      expect(getSession()).toEqual(session);
      expect(result.current.status).toBe('ready');
    });
  });

  describe('logout', () => {
    it('borra la sesión como hecha por el usuario aunque el backend falle', async () => {
      const { logout, getSession, useSession } = await loadSession(makeSession());
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useSession());

      await act(async () => {
        await logout();
      });

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/auth/logout');
      expect(getSession()).toBeNull();
      expect(result.current.endedByUser).toBe(true);
    });
  });

  describe('sincronización entre pestañas (evento storage)', () => {
    it('adopta la sesión que otra pestaña guardó', async () => {
      const { getSession } = await loadSession();
      const other = makeSession({ accessToken: 'a-otra' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(other));

      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      });

      expect(getSession()).toEqual(other);
    });

    it('si otra pestaña cerró sesión, aquí cuenta como hecho por el usuario', async () => {
      const { getSession, useSession } = await loadSession(makeSession());
      const { result } = renderHook(() => useSession());
      localStorage.removeItem(STORAGE_KEY);

      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      });

      expect(getSession()).toBeNull();
      expect(result.current.endedByUser).toBe(true);
    });

    it('localStorage.clear() en otra pestaña (key null) también sincroniza', async () => {
      const { getSession } = await loadSession(makeSession());
      localStorage.clear();

      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: null }));
      });

      expect(getSession()).toBeNull();
    });

    it('ignora los cambios de otras claves', async () => {
      const session = makeSession();
      const { getSession } = await loadSession(session);
      localStorage.removeItem(STORAGE_KEY);

      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: 'strim.player' }));
      });

      expect(getSession()).toEqual(session);
    });
  });
});
