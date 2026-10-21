import { useParams } from 'react-router';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { ChannelInfo } from '../features/channel/ChannelInfo';
import { VideoFrame } from '../features/channel/VideoFrame';
import { ChatPanel } from '../features/chat/ChatPanel';
import { useChatRoom } from '../features/chat/useChatRoom';
import { ApiError } from '../lib/api';
import { usePageTitle } from '../lib/navigation';
import { useChannel } from '../lib/queries';
import { useSession } from '../lib/session';
import NotFoundPage from './NotFoundPage';

/** Canal (RF-08). Se monta de nuevo al cambiar de canal: cada uno tiene su sala y su estado. */
export default function ChannelPage() {
  const { username = '' } = useParams();
  return <ChannelView key={username} username={username} />;
}

// Alto bajo la barra superior (56 px + 1 px de borde).
const FULL_HEIGHT = 'h-[calc(100dvh-57px)]';

function ChannelView({ username }: { username: string }) {
  const query = useChannel(username);
  const room = useChatRoom(username);
  const { session } = useSession();
  usePageTitle(query.data?.displayName ?? username);

  const notFound = (query.error instanceof ApiError && query.error.code === 'NOT_FOUND') || room.status === 'notFound';
  if (notFound) return <NotFoundPage channel />; // RF-08.7

  if (query.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          title="No pudimos cargar el canal."
          text={query.error instanceof ApiError ? query.error.message : 'Algo salió mal.'}
          action={
            <Button variant="secondary" loading={query.isRefetching} onClick={() => query.refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const channel = query.data;
  const isOwner = session?.user.profile.username === username; // RF-08.8

  return (
    // RF-08.9: en escritorio el chat va a la derecha; en móvil, debajo del video ocupando el resto.
    <div className={`flex ${FULL_HEIGHT} flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]`}>
      <div className="shrink-0 lg:min-h-0 lg:overflow-y-auto">
        <div className="lg:p-6">
          {channel ? <VideoFrame channel={channel} deleted={room.status === 'deleted'} /> : <Skeleton className="aspect-video w-full rounded-none lg:rounded-panel" />}
        </div>
        {channel ? (
          <ChannelInfo channel={channel} isOwner={isOwner} />
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:pt-0">
            <Skeleton className="size-10 rounded-full lg:size-16" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        )}
      </div>
      <ChatPanel room={room} username={username} signedIn={Boolean(session)} className="min-h-0 flex-1 border-t border-linea lg:border-t-0 lg:border-l" />
    </div>
  );
}
