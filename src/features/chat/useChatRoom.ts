// Sala del chat de un canal (diseño §6.2). Los mensajes viven en el estado del hook y no en un
// contexto, para no redibujar toda la página con cada uno. La página se monta con `key={username}`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { queryClient, queryKeys } from '../../lib/queries';
import { getSession, refreshSession } from '../../lib/session';
import { socket } from '../../lib/socket';
import type { ChatMessage, ErrorCode, PublicChannel } from '../../lib/types';

export type ChatStatus = 'joining' | 'ready' | 'reconnecting' | 'deleted' | 'notFound';
export type SendResult = { ok: true } | { ok: false; code: ErrorCode | 'TIMEOUT'; message: string };

const MAX_MESSAGES = 200; // RF-10.9
const ACK_TIMEOUT_MS = 8000;
const TIMEOUT_MESSAGE = 'No pudimos enviar el mensaje. Intenta de nuevo.';

export function useChatRoom(username: string) {
  const [status, setStatus] = useState<ChatStatus>('joining');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Quien espera a que la sala vuelva a estar lista (reintento de envío, RF-11.6).
  const readyWaiters = useRef<Array<() => void>>([]);

  useEffect(() => {
    let active = true;
    const key = queryKeys.channel(username);
    const patchChannel = (patch: Partial<PublicChannel>) =>
      queryClient.setQueryData<PublicChannel>(key, (current) => (current ? { ...current, ...patch } : current));

    // RF-10.2 y RF-10.7: al montar y en cada reconexión, unirse y recargar los últimos 50.
    const join = async () => {
      try {
        const res = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck('chat:join', { username });
        if (!active) return;
        if (res.ok) {
          setMessages(res.messages);
          queryClient.setQueryData(key, res.channel);
          setStatus('ready');
          for (const resolve of readyWaiters.current.splice(0)) resolve();
        } else {
          setStatus(res.error.code === 'NOT_FOUND' ? 'notFound' : 'reconnecting');
        }
      } catch {
        if (active) setStatus('reconnecting'); // Sin respuesta: se reintenta en el próximo `connect`.
      }
    };

    const onConnect = () => void join();
    const onDisconnect = () => setStatus((s) => (s === 'deleted' || s === 'notFound' ? s : 'reconnecting'));
    const onMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
    const onStatus = (payload: Pick<PublicChannel, 'isLive' | 'liveStartedAt' | 'playbackUrl'>) => patchChannel(payload);
    const onTitle = ({ title }: { title: string }) => patchChannel({ title });
    const onViewers = ({ viewers }: { viewers: number }) => patchChannel({ viewers });
    const onDeleted = () => setStatus('deleted'); // RF-08.6

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onMessage);
    socket.on('stream:status', onStatus);
    socket.on('stream:title', onTitle);
    socket.on('viewers:count', onViewers);
    socket.on('channel:deleted', onDeleted);
    if (socket.connected) void join();

    return () => {
      active = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onMessage);
      socket.off('stream:status', onStatus);
      socket.off('stream:title', onTitle);
      socket.off('viewers:count', onViewers);
      socket.off('channel:deleted', onDeleted);
      if (socket.connected) socket.emit('chat:leave', () => {});
    };
  }, [username]);

  /** Envía un mensaje. Aparece en la lista cuando llega su `chat:message`, no con el ack (RF-11.4). */
  const send = useCallback(async (content: string): Promise<SendResult> => {
    const attempt = () => socket.timeout(ACK_TIMEOUT_MS).emitWithAck('chat:send', { content });
    try {
      let res = await attempt();
      // RF-11.6: token vencido teniendo sesión → renovar, esperar la reconexión y reintentar una vez.
      if (!res.ok && (res.error.code === 'UNAUTHORIZED' || res.error.code === 'AUTH_REQUIRED') && getSession()) {
        if (await refreshSession()) {
          await waitUntilReady(readyWaiters.current);
          res = await attempt();
        }
      }
      return res.ok ? { ok: true } : { ok: false, code: res.error.code, message: res.error.message };
    } catch {
      return { ok: false, code: 'TIMEOUT', message: TIMEOUT_MESSAGE };
    }
  }, []);

  return { status, messages, send };
}

function waitUntilReady(waiters: Array<() => void>) {
  return new Promise<void>((resolve) => {
    waiters.push(resolve);
    window.setTimeout(resolve, ACK_TIMEOUT_MS);
  });
}
