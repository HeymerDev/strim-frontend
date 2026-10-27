// Socket falso para reemplazar `src/lib/socket` con vi.mock. Nunca se importa socket.io-client.
//
// Uso:
//   vi.mock('../../../../src/lib/socket', async () => {
//     const { createFakeSocket } = await import('../../../helpers/fakeSocket');
//     return { socket: createFakeSocket(), connectSocket: () => {} };
//   });
import { vi, type Mock } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Handler = (...args: any[]) => void;
type AckFn = (event: string, ...args: any[]) => Promise<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type FakeSocket = {
  connected: boolean;
  on: Mock<(event: string, handler: Handler) => FakeSocket>;
  off: Mock<(event: string, handler: Handler) => FakeSocket>;
  emit: Mock<(event: string, ...args: unknown[]) => FakeSocket>;
  connect: Mock<() => FakeSocket>;
  disconnect: Mock<() => FakeSocket>;
  listeners: (event: string) => Handler[];
  /** Respuesta (ack) del servidor. Cada prueba le pone su implementación. */
  emitWithAck: Mock<AckFn>;
  timeout: Mock<(ms: number) => { emitWithAck: Mock<AckFn> }>;
  /** Solo para las pruebas: simula un evento que llega del servidor (o `connect` / `disconnect`). */
  serverEmit: (event: string, ...args: unknown[]) => void;
  /** Solo para las pruebas: vuelve al estado inicial, conectado y sin listeners. */
  reset: () => void;
};

export function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, Set<Handler>>();

  const socket: FakeSocket = {
    connected: true,
    on: vi.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return socket;
    }),
    off: vi.fn((event: string, handler: Handler) => {
      handlers.get(event)?.delete(handler);
      return socket;
    }),
    emit: vi.fn(() => socket),
    connect: vi.fn(() => {
      socket.connected = true;
      return socket;
    }),
    disconnect: vi.fn(() => {
      socket.connected = false;
      return socket;
    }),
    listeners: (event) => [...(handlers.get(event) ?? [])],
    emitWithAck: vi.fn<AckFn>(async () => ({ ok: true })),
    timeout: vi.fn(() => ({ emitWithAck: socket.emitWithAck })),
    serverEmit(event, ...args) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler(...args);
    },
    reset() {
      handlers.clear();
      socket.connected = true;
    },
  };

  return socket;
}

/** El `socket` importado de `src/lib/socket` (ya mockeado) visto como el socket falso. */
export function asFakeSocket(socket: unknown): FakeSocket {
  return socket as FakeSocket;
}
