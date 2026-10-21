import { Link } from 'react-router';
import { Clock, Users } from 'lucide-react';
import { elapsedLabel, formatElapsed, formatViewers, toneOf, viewersLabel } from '../lib/format';
import type { PublicChannel } from '../lib/types';
import { Avatar } from './Avatar';
import { LiveBadge } from './LiveBadge';
import { Stat } from './Stat';

/**
 * Tarjeta de canal en vivo (diseño §10.2, D3): sin miniatura de video, un marco 16:9 con el avatar
 * y su anillo de en vivo. Toda la tarjeta es un solo enlace.
 */
export function ChannelCard({ channel, now }: { channel: PublicChannel; now: number }) {
  const tone = toneOf(channel.username);

  return (
    <Link to={`/${channel.username}`} className="group flex flex-col gap-3 rounded-panel focus-visible:outline-offset-4">
      <div
        className="@container relative grid aspect-video place-items-center overflow-hidden rounded-panel border border-linea transition-[border-color] duration-150 group-hover:border-senal group-focus-visible:border-senal"
        style={{ backgroundColor: `color-mix(in oklab, var(--color-nombre-${tone}) 8%, var(--color-panel))` }}
      >
        {/* En tarjetas angostas el avatar se achica y sube para no tapar las insignias. */}
        <div className="flex -translate-y-2.5 scale-[0.72] @[20rem]:translate-y-0 @[20rem]:scale-100">
          <Avatar src={channel.avatarUrl} name={channel.displayName} username={channel.username} size={96} live />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <LiveBadge />
          <span className="inline-flex h-6 items-center rounded-full bg-noche/80 px-2">
            <Stat icon={Users} value={formatViewers(channel.viewers)} label={viewersLabel(channel.viewers)} className="text-xs text-texto" />
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-1">
        <p className="truncate font-bold text-texto">{channel.displayName}</p>
        <p className="line-clamp-2 text-sm text-texto-suave">{channel.title || 'Sin título'}</p>
        {channel.liveStartedAt && (
          <Stat
            icon={Clock}
            value={formatElapsed(channel.liveStartedAt, now)}
            label={elapsedLabel(channel.liveStartedAt, now)}
            className="mt-0.5 text-xs text-texto-tenue"
          />
        )}
      </div>
    </Link>
  );
}
