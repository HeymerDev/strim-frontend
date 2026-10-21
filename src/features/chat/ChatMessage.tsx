import { memo } from 'react';
import { formatTime, toneOf } from '../../lib/format';
import type { ChatMessage as Message } from '../../lib/types';

/**
 * Un mensaje (diseño §10.3): el nombre en su color (D3) y en negrita, seguido del texto en la misma
 * línea. La hora aparece al pasar el mouse y siempre está en un <time> para los lectores de pantalla.
 * El texto es texto de React: nunca HTML (RF-10.5).
 */
export const ChatMessageItem = memo(function ChatMessageItem({ message, isStreamer }: { message: Message; isStreamer: boolean }) {
  const { author } = message;
  return (
    <li className="group px-4 py-1 text-chat break-words transition-colors duration-150 hover:bg-relieve/50">
      <time
        dateTime={message.createdAt}
        className="float-right ml-2 text-xs leading-[1.375rem] text-texto-suave tabular-nums opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        {formatTime(message.createdAt)}
      </time>
      {isStreamer && (
        <span className="mr-1.5 inline-flex h-5 translate-y-[-1px] items-center rounded-full bg-al-aire px-2 align-middle text-xs font-bold text-blanco">
          Streamer
        </span>
      )}
      <span className="font-bold" style={{ color: `var(--color-nombre-${toneOf(author.username)})` }} title={`@${author.username}`}>
        {author.displayName}
      </span>
      <span className="text-texto-suave">: </span>
      <span className="text-texto">{message.content}</span>
    </li>
  );
});
