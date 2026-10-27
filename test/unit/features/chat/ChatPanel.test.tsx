import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatPanel } from '../../../../src/features/chat/ChatPanel';
import type { ChatStatus, SendResult } from '../../../../src/features/chat/useChatRoom';
import { clearSession } from '../../../../src/lib/session';
import type { ChatMessage } from '../../../../src/lib/types';
import { makeMessage } from '../../../helpers/factories';
import { renderWithProviders } from '../../../helpers/render';

function room(status: ChatStatus, messages: ChatMessage[] = []) {
  return { status, messages, send: vi.fn(async (): Promise<SendResult> => ({ ok: true })) };
}

function renderPanel(status: ChatStatus, messages: ChatMessage[] = [], signedIn = true) {
  return renderWithProviders(<ChatPanel room={room(status, messages)} username="ana" signedIn={signedIn} />, {
    route: '/ana',
    path: '/:username',
  });
}

const log = () => screen.getByRole('log', { name: 'Mensajes del chat' });

describe('ChatPanel', () => {
  afterEach(() => {
    clearSession();
  });

  it('es un panel "Chat" con un registro enfocable que se anuncia sin interrumpir', async () => {
    const { user } = renderPanel('ready');

    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
    expect(log()).toHaveAttribute('aria-live', 'polite');
    expect(log()).toHaveAttribute('tabindex', '0');

    await user.tab();
    expect(log()).toHaveFocus();
  });

  it('vacío con sesión invita a escribir el primero', () => {
    renderPanel('ready', [], true);
    expect(log()).toHaveTextContent('Todavía no hay mensajes. Escribe el primero.');
    expect(screen.getByRole('textbox', { name: 'Mensaje para el chat' })).toBeInTheDocument();
  });

  it('vacío sin sesión solo dice que no hay mensajes y ofrece iniciar sesión', () => {
    renderPanel('ready', [], false);
    expect(log()).toHaveTextContent(/^Todavía no hay mensajes\.$/);
    expect(screen.getByRole('link', { name: 'Inicia sesión para comentar' })).toBeInTheDocument();
  });

  it('cargando: spinner "Cargando el chat" y el envío deshabilitado', () => {
    renderPanel('joining');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando el chat');
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
  });

  it('reconectando: avisa en la cabecera y conserva los mensajes', () => {
    renderPanel('reconnecting', [makeMessage({ content: 'sigo aquí' })]);
    expect(screen.getByText('Reconectando…')).toBeInTheDocument();
    expect(screen.getByText('sigo aquí')).toBeInTheDocument();
  });

  it('canal borrado: lo dice y quita el campo para escribir', () => {
    renderPanel('deleted', [makeMessage()]);
    expect(log()).toHaveTextContent('Este canal ya no existe.');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inicia sesión para comentar' })).not.toBeInTheDocument();
  });

  it('lista los mensajes y marca los del streamer', () => {
    renderPanel('ready', [
      makeMessage({ content: 'hola', author: { username: 'luis', displayName: 'Luis' } }),
      makeMessage({ content: 'bienvenidos', author: { username: 'ana', displayName: 'Ana Torres' } }),
    ]);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Luis: hola');
    expect(items[0]).not.toHaveTextContent('Streamer');
    expect(items[1]).toHaveTextContent('Streamer');
  });


  describe('desplazamiento (RF-10.6)', () => {
    /** Panel cuyos mensajes crecen al pulsar "Simular mensaje", sin volver a montarlo. */
    function GrowingRoom() {
      const [messages, setMessages] = useState<ChatMessage[]>(() => [makeMessage({ content: 'uno' })]);
      return (
        <>
          <button type="button" onClick={() => setMessages((prev) => [...prev, makeMessage({ content: 'nuevo' })])}>
            Simular mensaje
          </button>
          <ChatPanel room={{ ...room('ready'), messages }} username="ana" signedIn />
        </>
      );
    }

    /** jsdom no calcula tamaños: se simula la posición del scroll. */
    function scrollLog(scrollTop: number) {
      const el = log();
      Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(el, 'clientHeight', { configurable: true, value: 200 });
      Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: scrollTop });
      fireEvent.scroll(el);
    }

    it('al final, cada mensaje nuevo baja el scroll', async () => {
      const scrollTo = vi.spyOn(Element.prototype, 'scrollTo');
      const { user } = renderWithProviders(<GrowingRoom />, { route: '/ana', path: '/:username' });
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
      scrollTo.mockClear();

      await user.click(screen.getByRole('button', { name: 'Simular mensaje' }));

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(screen.queryByRole('button', { name: 'Mensajes nuevos' })).not.toBeInTheDocument();
    });

    it('si el usuario subió a leer, no lo mueve y muestra "Mensajes nuevos"', async () => {
      const scrollTo = vi.spyOn(Element.prototype, 'scrollTo');
      const { user } = renderWithProviders(<GrowingRoom />, { route: '/ana', path: '/:username' });
      scrollLog(100);
      scrollTo.mockClear();

      await user.click(screen.getByRole('button', { name: 'Simular mensaje' }));

      expect(scrollTo).not.toHaveBeenCalled();
      const jump = screen.getByRole('button', { name: 'Mensajes nuevos' });

      await user.click(jump);

      expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
      expect(screen.queryByRole('button', { name: 'Mensajes nuevos' })).not.toBeInTheDocument();
    });

    it('volver al final a mano también quita el aviso', async () => {
      const { user } = renderWithProviders(<GrowingRoom />, { route: '/ana', path: '/:username' });
      scrollLog(100);
      await user.click(screen.getByRole('button', { name: 'Simular mensaje' }));
      expect(screen.getByRole('button', { name: 'Mensajes nuevos' })).toBeInTheDocument();

      scrollLog(790);

      expect(screen.queryByRole('button', { name: 'Mensajes nuevos' })).not.toBeInTheDocument();
    });
  });
});
