import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { cx } from '../../components/cx';
import { ChatComposer } from './ChatComposer';
import { ChatMessageItem } from './ChatMessage';
import type { useChatRoom } from './useChatRoom';

type ChatPanelProps = {
  room: ReturnType<typeof useChatRoom>;
  /** Username del canal: marca los mensajes del dueño con "Streamer" (RF-10.4). */
  username: string;
  signedIn: boolean;
  className?: string;
};

/** Se considera que el usuario está al final si le faltan menos de 48 px (diseño §6.3). */
const AT_BOTTOM_PX = 48;

/** Panel del chat (diseño §10.3, RF-10 y RF-11). */
export function ChatPanel({ room, username, signedIn, className }: ChatPanelProps) {
  const { status, messages, send } = room;
  const list = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [hasNew, setHasNew] = useState(false);
  const seen = useRef(0);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    atBottom.current = true;
    setHasNew(false);
  }, []);

  // RF-10.6: si estaba al final, bajar con cada mensaje; si subió a leer, no moverlo y avisar.
  useLayoutEffect(() => {
    const count = messages.length;
    const grew = count > seen.current;
    seen.current = count;
    if (!grew) return;
    if (atBottom.current) scrollToBottom();
    else setHasNew(true);
  }, [messages, scrollToBottom]);

  const onScroll = () => {
    const el = list.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_PX;
    if (atBottom.current) setHasNew(false);
  };

  const deleted = status === 'deleted';

  return (
    <aside aria-label="Chat" className={cx('flex flex-col bg-panel', className)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-linea px-4">
        <h2 className="text-base font-bold">Chat</h2>
        {status === 'reconnecting' && (
          <span className="inline-flex items-center gap-2 text-sm text-texto-suave">
            <Spinner size={14} />
            Reconectando…
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        {/* La zona con scroll es el registro del chat: se anuncia sin interrumpir y se puede enfocar para
            desplazarla con el teclado (RNF-05). */}
        <div
          ref={list}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Mensajes del chat"
          tabIndex={0}
          className="absolute inset-0 overflow-y-auto overscroll-contain py-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-senal"
        >
          {deleted ? (
            <p className="px-4 py-2 text-sm text-texto-suave">Este canal ya no existe.</p>
          ) : status === 'joining' && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-senal">
              <Spinner size={20} label="Cargando el chat" />
            </div>
          ) : messages.length === 0 ? (
            <p className="flex h-full items-end px-4 pb-2 text-sm text-texto-suave">
              {signedIn ? 'Todavía no hay mensajes. Escribe el primero.' : 'Todavía no hay mensajes.'}
            </p>
          ) : (
            <ul className="flex min-h-full flex-col justify-end">
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} isStreamer={message.author.username === username} />
              ))}
            </ul>
          )}
        </div>

        {hasNew && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="mensajes-nuevos absolute bottom-3 left-1/2 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-senal px-4 text-sm font-semibold text-noche shadow-[0_8px_20px_-6px_rgb(5_4_12/0.8)] transition-colors duration-150 hover:bg-senal-fuerte"
          >
            <ArrowDown size={16} aria-hidden="true" />
            Mensajes nuevos
          </button>
        )}
      </div>

      {!deleted && <ChatComposer username={username} signedIn={signedIn} ready={status === 'ready'} send={send} />}
    </aside>
  );
}
