import { lazy, Suspense, useId, useState } from 'react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { StatusNode } from '../../components/StatusNode';
import { cx } from '../../components/cx';
import { elapsedLabel, formatElapsed } from '../../lib/format';
import { useChannel } from '../../lib/queries';
import type { StreamDashboard } from '../../lib/types';
import { useNow } from '../../lib/useNow';
import { Connecting } from '../channel/VideoFrame';
import { useStudioActions } from './useStudioActions';

const LivePlayer = lazy(() => import('../player/LivePlayer'));

const TITLE_MAX = 100; // RF-12.3

const COPY = {
  offline: { title: 'Desconectado', text: 'Pega los datos en OBS y pulsa Iniciar stream.' },
  waiting: { title: 'Esperando la señal de OBS', text: 'En OBS, pulsa Iniciar transmisión. Tarda unos segundos en aparecer.' },
  live: { title: 'En vivo', text: 'Tu stream se está viendo en strim.' },
} as const;

/**
 * Panel de estado del estudio (diseño §10.4 y §9.6). El nodo del logo dice el estado; en vivo, todo
 * el panel pasa a `al-aire` para que se note desde la otra pantalla.
 */
export function StatusPanel({ stream, username }: { stream: StreamDashboard; username: string }) {
  const { start, stop, saveTitle } = useStudioActions();
  const titleId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const { status } = stream;
  const live = status === 'live';
  const copy = COPY[status];

  // El campo muestra el título guardado hasta que el streamer lo edita.
  const title = draft ?? stream.title;
  const dirty = draft !== null && draft.trim() !== stream.title;

  return (
    <section
      aria-labelledby={`${titleId}-estado`}
      className={cx(
        'flex flex-col gap-6 rounded-panel border p-5 transition-colors duration-200 sm:p-6',
        live ? 'border-al-aire bg-al-aire text-blanco' : 'border-linea bg-panel',
      )}
    >
      <div className="flex items-start gap-5">
        <StatusNode status={status} size={72} className="shrink-0 max-sm:size-14" />
        <div className="flex min-w-0 flex-col gap-1.5" aria-live="polite">
          <h2 id={`${titleId}-estado`} className="text-2xl font-extrabold sm:text-3xl">
            {copy.title}
            {live && stream.liveStartedAt && <LiveClock since={stream.liveStartedAt} />}
          </h2>
          <p className={cx('max-w-[52ch] text-base', live ? 'text-blanco/80' : 'text-texto-suave')}>{copy.text}</p>
        </div>
      </div>

      <form
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty) saveTitle.mutate(title.trim(), { onSuccess: () => setDraft(null) });
        }}
      >
        <label htmlFor={titleId} className="text-sm font-semibold">
          Título del stream
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={titleId}
            value={title}
            maxLength={TITLE_MAX}
            placeholder="¿Qué vas a transmitir?"
            onChange={(event) => setDraft(event.target.value)}
            className="h-11 w-full min-w-0 rounded-campo border border-linea bg-relieve px-4 text-base text-texto transition-[border-color] sm:flex-1 duration-150 hover:border-texto-tenue focus:border-senal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-senal/50"
          />
          <Button type="submit" variant="secondary" disabled={!dirty} loading={saveTitle.isPending}>
            Guardar título
          </Button>
        </div>
        <span className={cx('self-end text-xs tabular-nums', live ? 'text-blanco/70' : 'text-texto-tenue')}>
          {title.length} / {TITLE_MAX}
        </span>
      </form>

      <div>
        {status === 'offline' ? (
          <Button
            loading={start.isPending}
            onClick={() => start.mutate(title.trim(), { onSuccess: () => setDraft(null) })}
          >
            Iniciar stream
          </Button>
        ) : (
          <Button
            variant="secondary"
            loading={stop.isPending}
            onClick={() => (live ? setConfirmStop(true) : stop.mutate())}
          >
            Finalizar stream
          </Button>
        )}
      </div>

      {live && <Preview username={username} />}

      {/* RF-12.5: finalizar estando en vivo pide confirmación. */}
      <Modal
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="¿Finalizar el stream?"
        description="Tu canal dejará de estar en vivo y OBS se desconectará."
        actions={
          <>
            <Button variant="ghost" data-autofocus onClick={() => setConfirmStop(false)}>
              Seguir en vivo
            </Button>
            <Button
              variant="danger"
              loading={stop.isPending}
              onClick={() => stop.mutate(undefined, { onSettled: () => setConfirmStop(false) })}
            >
              Finalizar stream
            </Button>
          </>
        }
      />
    </section>
  );
}

function LiveClock({ since }: { since: string }) {
  const now = useNow();
  return (
    <span className="ml-3 font-sans text-xl font-semibold tabular-nums sm:text-2xl">
      <span aria-hidden="true">{formatElapsed(since, now)}</span>
      <span className="sr-only">{elapsedLabel(since, now)}</span>
    </span>
  );
}

/** Vista previa en silencio mientras está en vivo (RF-12.10). `StreamDashboard` no trae la URL: se pide el canal. */
function Preview({ username }: { username: string }) {
  const { data: channel } = useChannel(username);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-campo border border-blanco/15 bg-pantalla">
      {channel?.playbackUrl ? (
        <Suspense fallback={<Connecting />}>
          <LivePlayer src={channel.playbackUrl} preview label="Vista previa de tu stream" />
        </Suspense>
      ) : (
        <Connecting />
      )}
    </div>
  );
}
