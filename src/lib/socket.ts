// Conexión única de Socket.IO para toda la app (diseño §6.1).
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';
import { queryClient, queryKeys } from './queries';
import { getSession, onTokenChange, refreshSession, updateUser } from './session';
import type { ClientToServerEvents, ServerToClientEvents, StreamDashboard } from './types';

export type StrimSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socket: StrimSocket = io(API_URL, {
  autoConnect: false,
  // Se lee en cada intento: cada reconexión usa el último token (RF-10.1).
  auth: (cb) => {
    const token = getSession()?.accessToken;
    cb(token ? { token } : {});
  },
});

let retryTimer: number | undefined;

function reconnect() {
  window.clearTimeout(retryTimer);
  socket.disconnect();
  socket.connect();
}

// Login, logout o renovación: reconectar con el token nuevo (RF-10.8). El chat vuelve a unirse
// a su sala en el evento `connect`.
onTokenChange(reconnect);

// El servidor rechazó el token. Socket.IO no reintenta solo en este caso.
socket.on('connect_error', async (error) => {
  if (error.message !== 'UNAUTHORIZED') return; // Errores de red: Socket.IO ya reintenta.
  const renewed = await refreshSession();
  // Si se renovó, o si falló y se borró la sesión, el cambio de token ya reconectó.
  if (renewed || !getSession()) return;
  // Sin conexión para renovar: probar de nuevo en un rato.
  retryTimer = window.setTimeout(() => {
    if (getSession()) void refreshSession();
    else reconnect();
  }, 5000);
});

// El estado del canal propio llega a la sala `user:<id>` (diseño §6.1): estudio y barra al día (RF-01.4, RF-12.1).
socket.on('stream:state', ({ status, title, liveStartedAt }) => {
  updateUser((user) => ({ ...user, channel: { status, title, liveStartedAt } }));
  queryClient.setQueryData<StreamDashboard>(queryKeys.stream, (current) =>
    current ? { ...current, status, title, liveStartedAt } : current,
  );
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
