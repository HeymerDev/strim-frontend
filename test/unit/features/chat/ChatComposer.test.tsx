import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ChatComposer } from '../../../../src/features/chat/ChatComposer';
import type { SendResult } from '../../../../src/features/chat/useChatRoom';
import { clearSession } from '../../../../src/lib/session';
import { deferred } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

type SendFn = (content: string) => Promise<SendResult>;

function renderComposer({
  signedIn = true,
  ready = true,
  send = vi.fn<SendFn>(async () => ({ ok: true })),
  userOptions,
}: {
  signedIn?: boolean;
  ready?: boolean;
  send?: Mock<SendFn>;
  userOptions?: Parameters<typeof userEvent.setup>[0];
} = {}) {
  const utils = renderWithProviders(<ChatComposer username="ana" signedIn={signedIn} ready={ready} send={send} />, {
    route: '/ana',
    path: '/:username',
    userOptions,
  });
  return { ...utils, send, input: screen.queryByRole('textbox', { name: 'Mensaje para el chat' }) as HTMLInputElement };
}

const sendButton = () => screen.getByRole('button', { name: 'Enviar mensaje' });

describe('ChatComposer', () => {
  afterEach(() => {
    clearSession();
    vi.useRealTimers();
  });

  it('sin sesión muestra el enlace para iniciar sesión y volver al canal', () => {
    renderComposer({ signedIn: false });

    expect(screen.getByRole('link', { name: 'Inicia sesión para comentar' })).toHaveAttribute('href', '/login?next=%2Fana');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('con texto vacío o solo espacios no se puede enviar', async () => {
    const { user, input, send } = renderComposer();
    expect(sendButton()).toBeDisabled();

    await user.type(input, '   ');
    expect(sendButton()).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(send).not.toHaveBeenCalled();

    await user.type(input, 'hola');
    expect(sendButton()).toBeEnabled();
  });

  it('mientras la sala no está lista no se puede enviar', async () => {
    const { user, input } = renderComposer({ ready: false });
    await user.type(input, 'hola');
    expect(sendButton()).toBeDisabled();
  });

  it('Enter envía el texto sin espacios de los extremos y vacía el campo', async () => {
    const { user, input, send } = renderComposer();

    await user.type(input, '  hola chat  {Enter}');

    expect(send).toHaveBeenCalledExactlyOnceWith('hola chat');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('el botón también envía', async () => {
    const { user, input, send } = renderComposer();

    await user.type(input, 'hola');
    await user.click(sendButton());

    expect(send).toHaveBeenCalledWith('hola');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('mientras envía no deja enviar otra vez', async () => {
    const pending = deferred<SendResult>();
    const send = vi.fn<SendFn>(() => pending.promise);
    const { user, input } = renderComposer({ send });

    await user.type(input, 'hola{Enter}');
    expect(sendButton()).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(send).toHaveBeenCalledOnce();

    await act(async () => pending.resolve({ ok: true }));
    expect(input).toHaveValue('');
  });

  it('RATE_LIMITED muestra "Vas muy rápido." y conserva el texto', async () => {
    const send = vi.fn<SendFn>(async () => ({ ok: false, code: 'RATE_LIMITED', message: 'Too many messages' }));
    const { user, input } = renderComposer({ send });

    await user.type(input, 'hola{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Vas muy rápido.');
    expect(input).toHaveValue('hola');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Vas muy rápido.');
  });

  it('otros errores muestran el mensaje del servidor', async () => {
    const send = vi.fn<SendFn>(async () => ({ ok: false, code: 'TIMEOUT', message: 'No pudimos enviar el mensaje. Intenta de nuevo.' }));
    const { user, input } = renderComposer({ send });

    await user.type(input, 'hola{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos enviar el mensaje. Intenta de nuevo.');
    expect(input).toHaveValue('hola');
  });

  it('el error desaparece a los 3 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const send = vi.fn<SendFn>(async () => ({ ok: false, code: 'RATE_LIMITED', message: 'x' }));
    const { user, input } = renderComposer({ send, userOptions: { advanceTimers: vi.advanceTimersByTime } });

    await user.type(input, 'hola{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('el contador aparece desde 260 caracteres', async () => {
    const { user, input } = renderComposer();

    await user.click(input);
    await user.paste('a'.repeat(259));
    expect(screen.queryByText(/caracteres/)).not.toBeInTheDocument();

    await user.paste('a');
    expect(screen.getByText('40 caracteres')).toBeInTheDocument();
  });

  it('el contador usa el singular con 1 carácter y no deja pasar de 300', async () => {
    const { user, input } = renderComposer();

    await user.click(input);
    await user.paste('a'.repeat(299));
    expect(screen.getByText('1 carácter')).toBeInTheDocument();

    await user.paste('bcd');
    expect(input).toHaveValue(`${'a'.repeat(299)}b`);
    expect(screen.getByText('0 caracteres')).toBeInTheDocument();
  });
});
