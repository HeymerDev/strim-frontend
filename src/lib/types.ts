// Tipos de la API y del socket, copiados del backend (diseño §3):
// backend/src/models/dto.ts, backend/src/utils/AppError.ts y backend/src/sockets/types.ts.
// Si el contrato cambia en el backend, se actualizan a mano.

export type ChannelStatus = 'offline' | 'waiting' | 'live';

export type Tokens = { accessToken: string; refreshToken: string; expiresAt: string };

export type Profile = { username: string; displayName: string; bio: string; avatarUrl: string | null };

export type Me = {
  id: string;
  email: string;
  profile: Profile;
  channel: { status: ChannelStatus; title: string; liveStartedAt: string | null };
};

export type AuthSession = Tokens & { user: Me };

export type StreamDashboard = {
  status: ChannelStatus;
  title: string;
  liveStartedAt: string | null;
  /** `streamKey` ya viene como `<username>?key=<clave>`, listo para OBS. */
  obs: { server: string; streamKey: string };
};

export type PublicChannel = Profile & {
  title: string;
  isLive: boolean;
  liveStartedAt: string | null;
  viewers: number;
  /** Solo cuando `isLive`. */
  playbackUrl: string | null;
};

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; displayName: string; avatarUrl: string | null };
};

/** Códigos de error del backend (diseño §9 del backend). */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_OTP'
  | 'INVALID_CURRENT_PASSWORD'
  | 'SAME_PASSWORD'
  | 'INVALID_FILE'
  | 'NOT_IN_ROOM'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'AUTH_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'CHANNEL_LIVE'
  | 'PAYLOAD_TOO_LARGE'
  | 'TOO_MANY_REQUESTS'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'EMAIL_NOT_SENT';

export type ApiErrorBody = { error: { code: ErrorCode; message: string; details?: Record<string, string> } };

/** Respuesta (ack) de cada evento que emite el cliente. */
export type AckResponse<T> = ({ ok: true } & T) | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };
type Ack<T> = (response: AckResponse<T>) => void;

export interface ClientToServerEvents {
  'chat:join': (payload: { username: string }, ack: Ack<{ channel: PublicChannel; messages: ChatMessage[] }>) => void;
  'chat:leave': (ack: Ack<object>) => void;
  'chat:send': (payload: { content: string }, ack: Ack<{ message: ChatMessage }>) => void;
}

export interface ServerToClientEvents {
  'chat:message': (message: ChatMessage) => void;
  'stream:status': (payload: { isLive: boolean; liveStartedAt: string | null; playbackUrl: string | null }) => void;
  'stream:title': (payload: { title: string }) => void;
  'stream:state': (payload: { status: ChannelStatus; title: string; liveStartedAt: string | null }) => void;
  'viewers:count': (payload: { viewers: number }) => void;
  'channel:deleted': (payload: Record<string, never>) => void;
}
