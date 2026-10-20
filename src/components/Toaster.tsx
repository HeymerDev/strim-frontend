import { useSyncExternalStore } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { getToasts, subscribeToasts } from './toast';

/** Zona de avisos: abajo a la derecha (abajo al centro en móvil). No toma el foco. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast flex max-w-sm items-center gap-2.5 rounded-campo border border-linea bg-relieve px-4 py-3 text-sm font-medium text-texto shadow-[0_12px_32px_-8px_rgb(5_4_12/0.7)]"
        >
          {t.tone === 'exito' ? (
            <CircleCheck size={18} aria-hidden="true" className="shrink-0 text-senal" />
          ) : (
            <CircleAlert size={18} aria-hidden="true" className="shrink-0 text-error" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
