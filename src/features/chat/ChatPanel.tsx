import { Spinner } from '../../components/Spinner';
import { cx } from '../../components/cx';
import type { useChatRoom } from './useChatRoom';

type ChatPanelProps = {
  room: ReturnType<typeof useChatRoom>;
  className?: string;
};

/** Panel del chat (diseño §10.3). La lista de mensajes y el campo de texto llegan en la tarea 11. */
export function ChatPanel({ room, className }: ChatPanelProps) {
  return (
    <aside aria-label="Chat" className={cx('flex flex-col bg-panel', className)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-linea px-4">
        <h2 className="text-base font-bold">Chat</h2>
        {room.status === 'reconnecting' && (
          <span className="inline-flex items-center gap-2 text-sm text-texto-suave">
            <Spinner size={14} />
            Reconectando…
          </span>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col justify-end p-4">
        {room.status === 'deleted' && <p className="text-sm text-texto-suave">Este canal ya no existe.</p>}
      </div>
    </aside>
  );
}
