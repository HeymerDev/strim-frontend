import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatRoom } from '../../../../src/features/chat/useChatRoom';
import { queryClient, queryKeys } from '../../../../src/lib/queries';
import { getSession, refreshSession } from '../../../../src/lib/session';
import { socket as realSocket } from '../../../../src/lib/socket';
import type { ChatMessage, PublicChannel } from '../../../../src/lib/types';
import { asFakeSocket } from '../../../helpers/fakeSocket';
import { makeChannel, makeMessage, makeSession } from '../../../helpers/factories';

vi.mock('../../../../src/lib/socket', async () => {
  const { createFakeSocket } = await import('../../../helpers/fakeSocket');
  return { socket: createFakeSocket(), connectSocket: () => {} };
});

vi.mock('../../../../src/lib/session', () => ({
  getSession: vi.fn(() => null),
  refreshSession: vi.fn(async () => true),
}));

const socket = asFakeSocket(realSocket);
const channelKey = queryKeys.channel('ana');

type Ack = Record<string, unknown>;

/** Respuestas del servidor por evento. */
function serverAcks(acks: { join?: () => Ack | Promise<Ack>; send?: () => Ack | Promise<Ack> }) {
  socket.emitWithAck.mockImplementation(async (event: string) => {
    if (event === 'chat:join') return acks.join ? acks.join() : { ok: true, channel: makeChannel(), messages: [] };
    if (event === 'chat:send') return acks.send ? acks.send() : { ok: true, message: makeMessage() };
    throw new Error(`Evento inesperado: ${event}`);
  });
}

function joinOk(messages: ChatMessage[] = [], channel: PublicChannel = makeChannel()) {
  return () => ({ ok: true, channel, messages });
}

async function renderReadyRoom(messages: ChatMessage[] = []) {
  serverAcks({ join: joinOk(messages) });
  const hook = renderHook(() => useChatRoom('ana'));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
}

describe('useChatRoom', () => {
  beforeEach(() => {
    socket.reset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('unirse a la sala', () => {
    it('con el socket conectado envía chat:join al montar y carga los mensajes y el canal', async () => {
      const messages = [makeMessage({ content: 'hola' })];
      const channel = makeChannel({ viewers: 7 });
      serverAcks({ join: joinOk(messages, channel) });

      const { result } = renderHook(() => useChatRoom('ana'));
      expect(result.current.status).toBe('joining');

      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(socket.timeout).toHaveBeenCalledWith(8000);
      expect(socket.emitWithAck).toHaveBeenCalledWith('chat:join', { username: 'ana' });
      expect(result.current.messages).toEqual(messages);
      expect(queryClient.getQueryData(channelKey)).toEqual(channel);
    });

    it('desconectado no se une hasta el evento `connect`', async () => {
      socket.connected = false;
      serverAcks({ join: joinOk() });
      const { result } = renderHook(() => useChatRoom('ana'));

      expect(socket.emitWithAck).not.toHaveBeenCalled();

      act(() => socket.serverEmit('connect'));

      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(socket.emitWithAck).toHaveBeenCalledWith('chat:join', { username: 'ana' });
    });

    it('en cada reconexión vuelve a unirse y recarga los mensajes', async () => {
      const { result } = await renderReadyRoom([makeMessage({ content: 'viejo' })]);
      const recent = [makeMessage({ content: 'reciente' })];
      serverAcks({ join: joinOk(recent) });

      act(() => socket.serverEmit('disconnect'));
      expect(result.current.status).toBe('reconnecting');

      act(() => socket.serverEmit('connect'));

      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(result.current.messages).toEqual(recent);
      expect(socket.emitWithAck).toHaveBeenCalledTimes(2);
    });

    it('un canal que no existe queda en notFound', async () => {
      serverAcks({ join: () => ({ ok: false, error: { code: 'NOT_FOUND', message: 'Este canal no existe.' } }) });
      const { result } = renderHook(() => useChatRoom('ana'));
      await waitFor(() => expect(result.current.status).toBe('notFound'));
    });

    it('otro error al unirse queda en reconnecting', async () => {
      serverAcks({ join: () => ({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Algo salió mal.' } }) });
      const { result } = renderHook(() => useChatRoom('ana'));
      await waitFor(() => expect(result.current.status).toBe('reconnecting'));
    });

    it('sin respuesta del servidor (timeout) queda en reconnecting', async () => {
      serverAcks({ join: () => Promise.reject(new Error('operation has timed out')) });
      const { result } = renderHook(() => useChatRoom('ana'));
      await waitFor(() => expect(result.current.status).toBe('reconnecting'));
    });
  });

  describe('eventos del servidor', () => {
    it('chat:message agrega el mensaje al final', async () => {
      const { result } = await renderReadyRoom([makeMessage({ content: 'uno' })]);
      const incoming = makeMessage({ content: 'dos' });

      act(() => socket.serverEmit('chat:message', incoming));

      expect(result.current.messages.map((m) => m.content)).toEqual(['uno', 'dos']);
    });

    it('conserva como mucho los últimos 200 mensajes', async () => {
      const history = Array.from({ length: 200 }, (_, i) => makeMessage({ content: `m${i}` }));
      const { result } = await renderReadyRoom(history);
      const incoming = makeMessage({ content: 'nuevo' });

      act(() => socket.serverEmit('chat:message', incoming));

      expect(result.current.messages).toHaveLength(200);
      expect(result.current.messages[0].content).toBe('m1');
      expect(result.current.messages.at(-1)).toEqual(incoming);
    });

    it('stream:status, stream:title y viewers:count actualizan el canal en la caché', async () => {
      await renderReadyRoom();

      act(() => socket.serverEmit('stream:status', { isLive: false, liveStartedAt: null, playbackUrl: null }));
      expect(queryClient.getQueryData<PublicChannel>(channelKey)).toMatchObject({ isLive: false, liveStartedAt: null, playbackUrl: null });

      act(() => socket.serverEmit('stream:title', { title: 'Nuevo título' }));
      expect(queryClient.getQueryData<PublicChannel>(channelKey)?.title).toBe('Nuevo título');

      act(() => socket.serverEmit('viewers:count', { viewers: 42 }));
      expect(queryClient.getQueryData<PublicChannel>(channelKey)?.viewers).toBe(42);
      // El resto del canal se conserva.
      expect(queryClient.getQueryData<PublicChannel>(channelKey)?.displayName).toBe('Ana Torres');
    });

    it('sin el canal en la caché, los eventos no lo inventan', async () => {
      await renderReadyRoom();
      queryClient.removeQueries({ queryKey: channelKey });

      act(() => socket.serverEmit('viewers:count', { viewers: 3 }));

      expect(queryClient.getQueryData(channelKey)).toBeUndefined();
    });

    it('channel:deleted deja la sala en deleted, y una desconexión no lo cambia', async () => {
      const { result } = await renderReadyRoom();

      act(() => socket.serverEmit('channel:deleted', {}));
      expect(result.current.status).toBe('deleted');

      act(() => socket.serverEmit('disconnect'));
      expect(result.current.status).toBe('deleted');
    });
  });

  describe('al desmontar', () => {
    it('envía chat:leave y quita sus listeners', async () => {
      const { unmount } = await renderReadyRoom();
      expect(socket.listeners('chat:message')).toHaveLength(1);

      unmount();

      expect(socket.emit).toHaveBeenCalledWith('chat:leave', expect.any(Function));
      for (const event of ['connect', 'disconnect', 'chat:message', 'stream:status', 'stream:title', 'viewers:count', 'channel:deleted']) {
        expect(socket.listeners(event)).toHaveLength(0);
      }
    });

    it('desconectado no envía chat:leave', async () => {
      const { unmount } = await renderReadyRoom();
      socket.connected = false;

      unmount();

      expect(socket.emit).not.toHaveBeenCalled();
    });

    it('una respuesta que llega después de desmontar se ignora', async () => {
      let answer!: (ack: Ack) => void;
      serverAcks({ join: () => new Promise<Ack>((resolve) => (answer = resolve)) });
      const { result, unmount } = renderHook(() => useChatRoom('ana'));
      await waitFor(() => expect(socket.emitWithAck).toHaveBeenCalled());

      unmount();
      await act(async () => answer({ ok: true, channel: makeChannel(), messages: [makeMessage()] }));

      expect(result.current.status).toBe('joining');
      expect(queryClient.getQueryData(channelKey)).toBeUndefined();
    });
  });

  describe('send', () => {
    it('envía chat:send y devuelve ok', async () => {
      const { result } = await renderReadyRoom();
      serverAcks({ join: joinOk() });

      let response: unknown;
      await act(async () => {
        response = await result.current.send('hola');
      });

      expect(response).toEqual({ ok: true });
      expect(socket.emitWithAck).toHaveBeenCalledWith('chat:send', { content: 'hola' });
    });

    it('devuelve el código y el mensaje del error', async () => {
      const { result } = await renderReadyRoom();
      serverAcks({ send: () => ({ ok: false, error: { code: 'RATE_LIMITED', message: 'Vas muy rápido.' } }) });

      let response: unknown;
      await act(async () => {
        response = await result.current.send('hola');
      });

      expect(response).toEqual({ ok: false, code: 'RATE_LIMITED', message: 'Vas muy rápido.' });
    });

    it('sin respuesta devuelve TIMEOUT con un mensaje para reintentar', async () => {
      const { result } = await renderReadyRoom();
      serverAcks({ send: () => Promise.reject(new Error('operation has timed out')) });

      let response: unknown;
      await act(async () => {
        response = await result.current.send('hola');
      });

      expect(response).toEqual({ ok: false, code: 'TIMEOUT', message: 'No pudimos enviar el mensaje. Intenta de nuevo.' });
    });

    it('con UNAUTHORIZED y sesión: renueva, espera la reconexión y reintenta una vez', async () => {
      vi.mocked(getSession).mockReturnValue(makeSession());
      const { result } = await renderReadyRoom();
      const sendAcks = [
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sesión vencida.' } },
        { ok: true, message: makeMessage() },
      ];
      serverAcks({ join: joinOk(), send: () => sendAcks.shift()! });

      let sending!: Promise<unknown>;
      act(() => {
        sending = result.current.send('hola');
      });
      await waitFor(() => expect(refreshSession).toHaveBeenCalledOnce());

      // El token nuevo reconecta el socket: la sala vuelve a unirse y el envío se reintenta.
      act(() => socket.serverEmit('connect'));

      await act(async () => {
        await expect(sending).resolves.toEqual({ ok: true });
      });
      const sends = socket.emitWithAck.mock.calls.filter(([event]) => event === 'chat:send');
      expect(sends).toEqual([
        ['chat:send', { content: 'hola' }],
        ['chat:send', { content: 'hola' }],
      ]);
    });

    it('si la renovación falla no reintenta', async () => {
      vi.mocked(getSession).mockReturnValue(makeSession());
      vi.mocked(refreshSession).mockResolvedValue(false);
      const { result } = await renderReadyRoom();
      serverAcks({ send: () => ({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Sesión vencida.' } }) });

      let response: unknown;
      await act(async () => {
        response = await result.current.send('hola');
      });

      expect(response).toEqual({ ok: false, code: 'UNAUTHORIZED', message: 'Sesión vencida.' });
      expect(socket.emitWithAck.mock.calls.filter(([event]) => event === 'chat:send')).toHaveLength(1);
    });

    it('con UNAUTHORIZED sin sesión no intenta renovar', async () => {
      const { result } = await renderReadyRoom();
      serverAcks({ send: () => ({ ok: false, error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión.' } }) });

      let response: unknown;
      await act(async () => {
        response = await result.current.send('hola');
      });

      expect(refreshSession).not.toHaveBeenCalled();
      expect(response).toEqual({ ok: false, code: 'AUTH_REQUIRED', message: 'Inicia sesión.' });
    });
  });
});
