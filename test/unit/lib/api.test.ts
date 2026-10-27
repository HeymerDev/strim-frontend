import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getChannel, getMe, login, logout, setAuthBridge, updateMe, uploadAvatar } from '../../../src/lib/api';
import { makeMe } from '../../helpers/factories';
import { errorResponse, jsonResponse } from '../../helpers/http';

const fetchMock = vi.fn<typeof fetch>();

/** Opciones (`RequestInit`) de la llamada número `index` a fetch. */
function requestInit(index = 0) {
  return fetchMock.mock.calls[index][1]!;
}

function headersOf(index = 0) {
  return requestInit(index).headers as Record<string, string>;
}

function bridge(token: string | null, refresh: () => Promise<boolean> = async () => false) {
  const getAccessToken = vi.fn(() => token);
  const refreshMock = vi.fn(refresh);
  setAuthBridge({ getAccessToken, refresh: refreshMock });
  return { getAccessToken, refresh: refreshMock };
}

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    bridge(null);
  });

  describe('cabeceras y cuerpo', () => {
    it('manda Authorization con el token de la sesión', async () => {
      bridge('token-1');
      fetchMock.mockResolvedValueOnce(jsonResponse(makeMe()));

      await getMe();

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/me');
      expect(requestInit().method).toBe('GET');
      expect(headersOf()).toEqual({ Authorization: 'Bearer token-1' });
      expect(requestInit().body).toBeUndefined();
    });

    it('sin sesión no manda Authorization', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(makeMe()));
      await getMe();
      expect(headersOf()).toEqual({});
    });

    it('las rutas de cuenta (withAuth: false) no mandan el token aunque haya sesión', async () => {
      bridge('token-1');
      fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'a' }));

      await login({ email: 'ana@mail.com', password: 'secreta1' });

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/auth/login');
      expect(requestInit().method).toBe('POST');
      expect(headersOf()).toEqual({ 'Content-Type': 'application/json' });
      expect(JSON.parse(requestInit().body as string)).toEqual({ email: 'ana@mail.com', password: 'secreta1' });
    });

    it('manda el cuerpo como JSON junto con el token', async () => {
      bridge('token-1');
      fetchMock.mockResolvedValueOnce(jsonResponse(makeMe()));

      await updateMe({ displayName: 'Ana T.' });

      expect(requestInit().method).toBe('PATCH');
      expect(headersOf()).toEqual({ Authorization: 'Bearer token-1', 'Content-Type': 'application/json' });
      expect(requestInit().body).toBe(JSON.stringify({ displayName: 'Ana T.' }));
    });

    it('con FormData no pone Content-Type (lo pone el navegador con el boundary)', async () => {
      bridge('token-1');
      fetchMock.mockResolvedValueOnce(jsonResponse(makeMe()));
      const file = new File(['x'], 'foto.png', { type: 'image/png' });

      await uploadAvatar(file);

      expect(requestInit().method).toBe('PUT');
      expect(headersOf()).toEqual({ Authorization: 'Bearer token-1' });
      const body = requestInit().body;
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get('avatar')).toBe(file);
    });

    it('codifica el username en la ruta del canal', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      await getChannel('a b');
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/channels/a%20b');
    });
  });

  describe('respuestas', () => {
    it('devuelve el JSON de una respuesta correcta', async () => {
      const me = makeMe();
      fetchMock.mockResolvedValueOnce(jsonResponse(me));
      await expect(getMe()).resolves.toEqual(me);
    });

    it('un 204 da `undefined`', async () => {
      bridge('token-1');
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
      await expect(logout()).resolves.toBeUndefined();
    });

    it('un error del backend se convierte en ApiError con status, code, message y details', async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(400, 'VALIDATION_ERROR', 'Datos inválidos.', { email: 'Correo inválido.' }));

      const error = await login({ email: 'x', password: 'y' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        name: 'ApiError',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos.',
        details: { email: 'Correo inválido.' },
      });
    });

    it('si fetch falla (sin conexión) lanza NETWORK_ERROR', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getMe()).rejects.toMatchObject({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'No pudimos conectar con el servidor.',
      });
    });

    it('un cuerpo de error que no es JSON da INTERNAL_ERROR', async () => {
      fetchMock.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502 }));

      await expect(getMe()).rejects.toMatchObject({ status: 502, code: 'INTERNAL_ERROR', message: 'Algo salió mal.' });
    });
  });

  describe('renovación del token (401)', () => {
    it('ante UNAUTHORIZED renueva y repite la petición una vez con el token nuevo', async () => {
      let token = 'viejo';
      const getAccessToken = vi.fn(() => token);
      const refresh = vi.fn(async () => {
        token = 'nuevo';
        return true;
      });
      setAuthBridge({ getAccessToken, refresh });
      const me = makeMe();
      fetchMock
        .mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.'))
        .mockResolvedValueOnce(jsonResponse(me));

      await expect(getMe()).resolves.toEqual(me);

      expect(refresh).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(headersOf(0)).toEqual({ Authorization: 'Bearer viejo' });
      expect(headersOf(1)).toEqual({ Authorization: 'Bearer nuevo' });
    });

    it('no repite más de una vez si el reintento también da 401', async () => {
      const { refresh } = bridge('token-1', async () => true);
      fetchMock
        .mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.'))
        .mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.'));

      await expect(getMe()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
      expect(refresh).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('si la renovación falla, propaga el error sin repetir', async () => {
      const { refresh } = bridge('token-1', async () => false);
      fetchMock.mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Sesión vencida.'));

      await expect(getMe()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED', message: 'Sesión vencida.' });
      expect(refresh).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('sin token no intenta renovar', async () => {
      const { refresh } = bridge(null, async () => true);
      fetchMock.mockResolvedValueOnce(errorResponse(401, 'UNAUTHORIZED', 'Inicia sesión.'));

      await expect(getMe()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
      expect(refresh).not.toHaveBeenCalled();
    });

    it('otros errores no renuevan', async () => {
      const { refresh } = bridge('token-1', async () => true);
      fetchMock.mockResolvedValueOnce(errorResponse(404, 'NOT_FOUND', 'No existe.'));

      await expect(getMe()).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});
