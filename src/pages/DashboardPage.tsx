import { ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { buttonClasses } from '../components/buttonStyles';
import { ObsGuide, ObsPanel } from '../features/studio/ObsPanel';
import { StatusPanel } from '../features/studio/StatusPanel';
import { ApiError } from '../lib/api';
import { usePageTitle } from '../lib/navigation';
import { useStream } from '../lib/queries';
import { useSession } from '../lib/session';

/** Estudio (RF-12, diseño §10.4). Se mantiene al día con `stream:state` (lib/socket.ts). */
export default function DashboardPage() {
  usePageTitle('Estudio');
  const { session } = useSession();
  const { data: stream, isPending, isError, error, refetch, isRefetching } = useStream();
  const username = session!.user.profile.username; // RequireAuth garantiza la sesión.

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Estudio</h1>
        {/* RF-12.11: el chat se lee en el canal, en otra pestaña. */}
        <a href={`/${username}`} target="_blank" rel="noopener" className={buttonClasses('secondary', 'sm')}>
          Ver mi canal
          <ExternalLink size={16} aria-hidden="true" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      </div>

      {isPending ? (
        <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
          <Skeleton className="h-80 rounded-panel" />
          <Skeleton className="h-80 rounded-panel" />
        </div>
      ) : isError ? (
        <EmptyState
          title="No pudimos cargar tu estudio."
          text={error instanceof ApiError ? error.message : 'Algo salió mal.'}
          action={
            <Button variant="secondary" loading={isRefetching} onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
          <StatusPanel stream={stream} username={username} />
          <div className="flex flex-col gap-6">
            <ObsPanel stream={stream} />
            <ObsGuide />
          </div>
        </div>
      )}
    </div>
  );
}
