import { Link } from 'react-router';
import { Button } from '../components/Button';
import { ChannelCard } from '../components/ChannelCard';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { buttonClasses } from '../components/buttonStyles';
import { ApiError } from '../lib/api';
import { usePageTitle } from '../lib/navigation';
import { useLiveChannels } from '../lib/queries';
import { useNow } from '../lib/useNow';

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-x-6 gap-y-8';

/** Inicio: los canales en vivo (RF-07, diseño §10.2). */
export default function HomePage() {
  usePageTitle(null);
  const { data: channels, isPending, isError, error, refetch, isRefetching } = useLiveChannels();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-extrabold">En vivo ahora</h1>
        {channels && channels.length > 0 && (
          <p className="shrink-0 text-sm whitespace-nowrap text-texto-suave tabular-nums">
            {channels.length} {channels.length === 1 ? 'canal' : 'canales'}
          </p>
        )}
      </div>

      {isPending ? (
        <LoadingGrid />
      ) : isError ? (
        <EmptyState
          className="py-10"
          title="No pudimos cargar los canales."
          text={error instanceof ApiError ? error.message : 'Algo salió mal.'}
          action={
            <Button variant="secondary" loading={isRefetching} onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : channels.length === 0 ? (
        <EmptyState
          className="py-10"
          title="Nadie está en vivo ahora"
          text="Cuando alguien empiece a transmitir, aparece aquí."
          action={
            <Link to="/dashboard" className={buttonClasses('primary')}>
              Transmite tú
            </Link>
          }
        />
      ) : (
        <ChannelGrid channels={channels} />
      )}
    </div>
  );
}

function ChannelGrid({ channels }: { channels: NonNullable<ReturnType<typeof useLiveChannels>['data']> }) {
  const now = useNow(); // El tiempo en vivo de las tarjetas avanza cada segundo.
  return (
    <ul className={GRID}>
      {channels.map((channel) => (
        <li key={channel.username}>
          <ChannelCard channel={channel} now={now} />
        </li>
      ))}
    </ul>
  );
}

/** Mismo tamaño que las tarjetas, para que la página no salte (RF-07.4). */
function LoadingGrid() {
  return (
    <div className={GRID} role="status" aria-label="Cargando canales en vivo">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-video rounded-panel" />
          <div className="flex flex-col gap-2 px-1">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
