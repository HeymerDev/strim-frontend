// Store de la sesión (diseño §5.1): tokens y usuario en localStorage, compartidos entre pestañas,
// con renovación programada y única. Los componentes lo leen con `useSession()`.
import { useSyncExternalStore } from 'react';
import * as api from './api';
import type { AuthSession, Me, Tokens } from './types';

export type Session = Tokens & { user: Me };
export type SessionState = {
  status: 'checking' | 'ready';
  session: Session | null;
  /**
   * `true` si el usuario terminó la sesión a propósito (cerrar sesión o borrar la cuenta), aquí o en otra
   * pestaña: las rutas privadas llevan a / y no a /login (RF-02.4 y RF-02.7).
   */
  endedByUser: boolean;
};

const STORAGE_KEY = 'strim.session';
/** Se renueva este tiempo antes de que venza el access token (RF-02.3). */
const REFRESH_MARGIN_MS = 60_000;

let state: SessionState = { status: 'ready', session: readStorage(), endedByUser: false };
const listeners = new Set<() => void>();
const tokenListeners = new Set<(token: string | null) => void>();
let refreshTimer: number | undefined;
let refreshing: Promise<boolean> | null = null;

function readStorage(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStorage(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): la sesión vive solo en esta pestaña.
  }
}

function setState(next: SessionState, persist = true) {
  const previousToken = state.session?.accessToken ?? null;
  state = next;
  if (persist) writeStorage(next.session);
  scheduleRefresh();
  for (const listener of listeners) listener();
  const token = next.session?.accessToken ?? null;
  if (token !== previousToken) for (const listener of tokenListeners) listener(token);
}

function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  const session = state.session;
  if (!session) return;
  const delay = new Date(session.expiresAt).getTime() - Date.now() - REFRESH_MARGIN_MS;
  // setTimeout no acepta más de ~24,8 días; los tokens de Supabase duran 1 h.
  refreshTimer = window.setTimeout(() => void refreshSession(), Math.min(Math.max(delay, 0), 2 ** 31 - 1));
}

// ─── API pública ───────────────────────────────────────────────────────────

export function getSession() {
  return state.session;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Avisa cuando cambia el access token: login, logout o renovación. Lo usa el socket (diseño §6.1). */
export function onTokenChange(listener: (token: string | null) => void) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state);
}

/** Inicia la sesión con lo que devuelve login o verify-email. */
export function startSession(auth: AuthSession) {
  setState({ status: 'ready', session: auth, endedByUser: false });
}

/** Actualiza el usuario guardado (ajustes, estado del canal). */
export function updateUser(update: (user: Me) => Me) {
  if (!state.session) return;
  setState({ ...state, session: { ...state.session, user: update(state.session.user) } });
}

/** `byUser`: la terminó el usuario (cerrar sesión, borrar la cuenta). Si no, venció o se rechazó. */
export function clearSession(byUser = false) {
  setState({ status: 'ready', session: null, endedByUser: byUser });
}

/**
 * Renueva el access token. Una sola petición aunque la pidan varias llamadas a la vez.
 * Devuelve `false` si no hay sesión o si el backend la rechazó (y entonces la borra).
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const current = state.session;
    if (!current) return false;

    // Si otra pestaña ya renovó, se adoptan sus tokens.
    const stored = readStorage();
    if (stored && stored.accessToken !== current.accessToken && new Date(stored.expiresAt) > new Date(current.expiresAt)) {
      setState({ ...state, session: stored }, false);
      return true;
    }

    try {
      const tokens = await api.refresh(current.refreshToken);
      setState({ ...state, session: { ...current, ...tokens } });
      return true;
    } catch (error) {
      // Sin conexión no se borra la sesión: se reintenta en la próxima petición.
      if (error instanceof api.ApiError && error.code === 'NETWORK_ERROR') return false;
      clearSession();
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Cierra la sesión aunque el backend no responda (RF-02.7). */
export async function logout() {
  try {
    await api.logout();
  } catch {
    // La sesión se borra igual.
  }
  clearSession(true);
}

/** Al arrancar: si hay sesión guardada, la comprueba con GET /api/me (RF-02.2). */
export async function bootSession() {
  if (!state.session) return;
  setState({ ...state, status: 'checking' }, false);
  try {
    const user = await api.getMe();
    if (state.session) setState({ ...state, status: 'ready', session: { ...state.session, user } });
  } catch (error) {
    // Sin conexión se sigue con el usuario guardado. Con 401 la renovación ya falló y borró la sesión.
    if (error instanceof api.ApiError && error.code === 'UNAUTHORIZED') clearSession();
    else setState({ ...state, status: 'ready' }, false);
  }
}

// Conexión con el cliente HTTP y con las otras pestañas (RF-02.8).
api.setAuthBridge({ getAccessToken: () => state.session?.accessToken ?? null, refresh: refreshSession });

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  const session = readStorage();
  // Si otra pestaña cerró sesión, aquí cuenta como hecho por el usuario.
  setState({ status: 'ready', session, endedByUser: !session && Boolean(state.session) }, false);
});

scheduleRefresh();
