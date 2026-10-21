// Caché de los datos del servidor con TanStack Query (diseño §5.3).
// El usuario (`me`) vive en el store de la sesión, que ya se guarda y se comparte entre pestañas.
import { QueryClient, useQuery } from '@tanstack/react-query';
import { ApiError, getChannel, getLiveChannels, getStream } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Un reintento, salvo los errores que no van a cambiar solos (404, 401, validación…).
      retry: (failures, error) => failures < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export const queryKeys = {
  liveChannels: ['channels', 'live'] as const,
  channel: (username: string) => ['channel', username] as const,
  stream: ['stream'] as const,
};

/** Canales en vivo: cada 30 s y al volver a la pestaña (RF-07.5). */
export function useLiveChannels() {
  return useQuery({
    queryKey: queryKeys.liveChannels,
    queryFn: getLiveChannels,
    // Al volver a la pestaña solo se pide de nuevo si pasaron más de 15 s.
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useChannel(username: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.channel(username), queryFn: () => getChannel(username), enabled });
}

export function useStream() {
  return useQuery({ queryKey: queryKeys.stream, queryFn: getStream });
}

/** Al cerrar sesión se vacía todo menos la lista pública de canales en vivo. */
export function clearPrivateQueries() {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'channels' });
}
