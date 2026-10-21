import { useId, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Clock, Users } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { LiveBadge } from '../../components/LiveBadge';
import { Stat } from '../../components/Stat';
import { buttonClasses } from '../../components/buttonStyles';
import { cx } from '../../components/cx';
import { elapsedLabel, formatElapsed, formatViewers, viewersLabel } from '../../lib/format';
import type { PublicChannel } from '../../lib/types';
import { useNow } from '../../lib/useNow';

/**
 * Datos del canal debajo del video (diseño §10.3). En escritorio se ve todo; en móvil, una fila
 * compacta y un botón que abre el título completo, el tiempo en vivo y la bio.
 */
export function ChannelInfo({ channel, isOwner }: { channel: PublicChannel; isOwner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const live = channel.isLive;

  return (
    <section aria-label="Sobre el canal" className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:pt-0 lg:pb-8">
      <div className="flex items-center gap-3 lg:gap-4">
        <Avatar src={channel.avatarUrl} name={channel.displayName} username={channel.username} size={64} live={live} className="max-lg:hidden" />
        <Avatar src={channel.avatarUrl} name={channel.displayName} username={channel.username} size={40} live={live} className="lg:hidden" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{channel.displayName}</h1>
          <p className="truncate text-sm text-texto-suave">@{channel.username}</p>
        </div>
        {live && (
          <div className="flex shrink-0 items-center gap-3 lg:hidden">
            <LiveBadge />
            <Stat icon={Users} value={formatViewers(channel.viewers)} label={viewersLabel(channel.viewers)} />
          </div>
        )}
        {isOwner && (
          <Link to="/dashboard" className={cx(buttonClasses('secondary', 'sm'), 'max-lg:hidden')}>
            Ir al estudio
          </Link>
        )}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? 'Ocultar detalles del canal' : 'Ver detalles del canal'}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-texto-suave transition-colors duration-150 hover:bg-relieve hover:text-texto lg:hidden"
        >
          <ChevronDown size={20} aria-hidden="true" className={cx('transition-transform duration-150', expanded && 'rotate-180')} />
        </button>
      </div>

      {channel.title && (
        <p className={cx('font-display text-base font-bold tracking-[-0.02em] lg:text-xl', !expanded && 'max-lg:truncate')}>
          {channel.title}
        </p>
      )}

      <div id={detailsId} className={cx('flex flex-col gap-3 lg:gap-4', !expanded && 'max-lg:hidden')}>
        {live && channel.liveStartedAt && (
          <div className="flex flex-wrap items-center gap-4">
            <LiveBadge className="max-lg:hidden" />
            <Stat icon={Users} value={formatViewers(channel.viewers)} label={viewersLabel(channel.viewers)} className="max-lg:hidden" />
            <LiveTime since={channel.liveStartedAt} />
          </div>
        )}
        {channel.bio && <p className="max-w-[70ch] text-base text-texto-suave">{channel.bio}</p>}
        {isOwner && (
          <Link to="/dashboard" className={cx(buttonClasses('secondary', 'sm'), 'self-start lg:hidden')}>
            Ir al estudio
          </Link>
        )}
      </div>
    </section>
  );
}

/** Aislado para que solo este texto se redibuje cada segundo. */
function LiveTime({ since }: { since: string }) {
  const now = useNow();
  return <Stat icon={Clock} value={formatElapsed(since, now)} label={elapsedLabel(since, now)} />;
}
