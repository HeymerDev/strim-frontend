import type { ReactNode } from 'react';
import { Avatar } from '../../components/Avatar';
import { StatusNode } from '../../components/StatusNode';
import type { PublicChannel } from '../../lib/types';

type VideoFrameProps = {
  channel: PublicChannel;
  deleted: boolean;
  /** El reproductor (tarea 12). Sin él, un canal en vivo muestra "Conectando…". */
  player?: ReactNode;
};

/**
 * Marco 16:9 que siempre mide lo mismo, esté en vivo o no, para que la página no salte (diseño §7).
 * El contenido cambia con un fundido de 200 ms (diseño §9.6).
 */
export function VideoFrame({ channel, deleted, player }: VideoFrameProps) {
  const state = deleted ? 'deleted' : channel.isLive ? 'live' : 'offline';

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-pantalla lg:rounded-panel lg:border lg:border-linea">
      <div key={state} className="fundido absolute inset-0">
        {state === 'deleted' && (
          <Centered>
            <p className="font-display text-lg font-bold text-texto">Este canal ya no existe</p>
          </Centered>
        )}
        {state === 'live' && (player ?? <Connecting />)}
        {state === 'offline' && (
          <Centered>
            <Avatar src={channel.avatarUrl} name={channel.displayName} username={channel.username} size={96} className="max-sm:hidden" />
            <Avatar src={channel.avatarUrl} name={channel.displayName} username={channel.username} size={64} className="sm:hidden" />
            <div className="flex flex-col items-center gap-1 px-4 text-center">
              <p className="font-display text-lg font-bold text-texto">{channel.displayName} no está en vivo</p>
              <p className="text-sm text-texto-suave">El chat sigue abierto.</p>
            </div>
          </Centered>
        )}
      </div>
    </div>
  );
}

/** Mientras el video todavía no llega (RF-09.5). */
export function Connecting() {
  return (
    <Centered>
      <StatusNode status="waiting" size={72} className="max-sm:size-12" />
      <p className="text-sm font-semibold text-texto-suave">Conectando…</p>
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center gap-4">{children}</div>;
}
