// Cliente HTTP del backend (diseño §5.2). Nadie más llama a `fetch`.
import type { AuthSession, ErrorCode, Me, PublicChannel, StreamDashboard, Tokens } from './types';

export const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | 'NETWORK_ERROR';
  readonly details?: Record<string, string>;

  constructor(status: number, code: ErrorCode | 'NETWORK_ERROR', message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Enlace con la sesión. `session.ts` lo conecta en la tarea 5; hasta entonces las peticiones
 * van sin token y no se renueva nada.
 */
type AuthBridge = {
  getAccessToken: () => string | null;
  /** Renueva el token. Devuelve `false` si no se pudo (y la sesión ya se borró). */
  refresh: () => Promise<boolean>;
};

let auth: AuthBridge = { getAccessToken: () => null, refresh: async () => false };

export function setAuthBridge(bridge: AuthBridge) {
  auth = bridge;
}

type RequestOptions = {
  body?: unknown;
  /** Manda el token si hay sesión (por defecto). `false` para las rutas de cuenta. */
  withAuth?: boolean;
};

async function request<T>(method: string, path: string, { body, withAuth = true }: RequestOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  const token = withAuth ? auth.getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // El navegador pone el Content-Type con el boundary.
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No pudimos conectar con el servidor.');
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const error = await readError(response);

  // RF-02.3: token vencido → renovar una vez y repetir la petición.
  if (error.code === 'UNAUTHORIZED' && token && !retried) {
    if (await auth.refresh()) return request<T>(method, path, { body, withAuth }, true);
  }

  throw error;
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const { error } = await response.json();
    if (error?.code) return new ApiError(response.status, error.code, error.message, error.details);
  } catch {
    // El cuerpo no era JSON (por ejemplo, un proxy caído).
  }
  return new ApiError(response.status, 'INTERNAL_ERROR', 'Algo salió mal.');
}

// ─── Cuentas ───────────────────────────────────────────────────────────────

type Message = { message: string };

export const register = (body: { email: string; username: string; password: string }) =>
  request<{ status: 'verification_pending'; email: string }>('POST', '/auth/register', { body, withAuth: false });

export const verifyEmail = (body: { email: string; otp: string }) =>
  request<AuthSession>('POST', '/auth/verify-email', { body, withAuth: false });

export const resendOtp = (email: string) => request<Message>('POST', '/auth/resend-otp', { body: { email }, withAuth: false });

export const login = (body: { email: string; password: string }) =>
  request<AuthSession>('POST', '/auth/login', { body, withAuth: false });

export const refresh = (refreshToken: string) =>
  request<Tokens>('POST', '/auth/refresh', { body: { refreshToken }, withAuth: false });

export const logout = () => request<void>('POST', '/auth/logout');

export const forgotPassword = (email: string) =>
  request<Message>('POST', '/auth/password/forgot', { body: { email }, withAuth: false });

export const resetPassword = (body: { email: string; otp: string; newPassword: string }) =>
  request<Message>('POST', '/auth/password/reset', { body, withAuth: false });

// ─── Mi cuenta ─────────────────────────────────────────────────────────────

export const getMe = () => request<Me>('GET', '/me');

export const updateMe = (body: { username?: string; displayName?: string; bio?: string }) =>
  request<Me>('PATCH', '/me', { body });

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('avatar', file);
  return request<Me>('PUT', '/me/avatar', { body: form });
}

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  request<void>('PUT', '/me/password', { body });

export const deleteAccount = (password: string) => request<void>('DELETE', '/me', { body: { password } });

// ─── Estudio ───────────────────────────────────────────────────────────────

export const getStream = () => request<StreamDashboard>('GET', '/stream');

export const regenerateKey = () => request<StreamDashboard>('POST', '/stream/key');

export const startStream = (title?: string) => request<StreamDashboard>('POST', '/stream/start', { body: { title } });

export const stopStream = () => request<StreamDashboard>('POST', '/stream/stop');

export const updateTitle = (title: string) => request<StreamDashboard>('PATCH', '/stream', { body: { title } });

// ─── Canales públicos ──────────────────────────────────────────────────────

export const getLiveChannels = () => request<PublicChannel[]>('GET', '/channels/live');

export const getChannel = (username: string) => request<PublicChannel>('GET', `/channels/${encodeURIComponent(username)}`);
