// Acciones del estudio (RF-12): cada respuesta trae el `StreamDashboard` actualizado, que se guarda
// en la caché y en la sesión (la barra superior muestra si estás en vivo, RF-01.4).
import { useMutation } from '@tanstack/react-query';
import { toast } from '../../components/toast';
import { ApiError, regenerateKey, startStream, stopStream, updateTitle } from '../../lib/api';
import { queryClient, queryKeys } from '../../lib/queries';
import { updateUser } from '../../lib/session';
import type { StreamDashboard } from '../../lib/types';

function store(dashboard: StreamDashboard) {
  queryClient.setQueryData(queryKeys.stream, dashboard);
  const { status, title, liveStartedAt } = dashboard;
  updateUser((user) => ({ ...user, channel: { status, title, liveStartedAt } }));
}

function showError(error: unknown) {
  toast(error instanceof ApiError ? error.message : 'Algo salió mal.', 'error');
}

export function useStudioActions() {
  const start = useMutation({ mutationFn: (title: string) => startStream(title), onSuccess: store, onError: showError });
  const stop = useMutation({ mutationFn: stopStream, onSuccess: store, onError: showError });
  const saveTitle = useMutation({
    mutationFn: (title: string) => updateTitle(title),
    onSuccess: (dashboard) => {
      store(dashboard);
      toast('Título guardado');
    },
    onError: showError,
  });
  const regenerate = useMutation({
    mutationFn: regenerateKey,
    onSuccess: (dashboard) => {
      store(dashboard);
      toast('Clave regenerada. Pégala en OBS.');
    },
    onError: showError,
  });
  return { start, stop, saveTitle, regenerate };
}
