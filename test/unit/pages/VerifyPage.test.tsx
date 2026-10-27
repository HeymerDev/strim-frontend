import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../src/components/toast';
import * as api from '../../../src/lib/api';
import { getPendingEmail, setPendingEmail } from '../../../src/lib/pendingEmail';
import { clearSession, getSession } from '../../../src/lib/session';
import VerifyPage from '../../../src/pages/VerifyPage';
import { makeSession } from '../../helpers/factories';
import { apiError } from '../../helpers/http';
import { renderWithProviders, type RenderOptions } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  verifyEmail: vi.fn(),
  resendOtp: vi.fn(),
}));

function renderVerify(route: RenderOptions['route'] = '/verify', userOptions?: RenderOptions['userOptions']) {
  return renderWithProviders(
    <>
      <VerifyPage />
      <Toaster />
    </>,
    { route, path: '/verify', userOptions },
  );
}

const code = () => screen.getByLabelText('Código');

describe('VerifyPage', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    clearSession();
    vi.useRealTimers();
  });

  it('sin correo pendiente lleva a /login', async () => {
    const { router } = renderVerify();

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(screen.getByText('Ruta: /login')).toBeInTheDocument();
  });

  it('toma el correo del estado de la navegación y muestra el aviso', () => {
    renderVerify({ pathname: '/verify', state: { email: 'ana@mail.com', notice: 'Tu correo aún no está verificado.' } });

    expect(screen.getByRole('heading', { level: 1, name: 'Revisa tu correo' })).toBeInTheDocument();
    expect(screen.getByText(/Enviamos un código de 8 dígitos a/)).toHaveTextContent('Enviamos un código de 8 dígitos a ana@mail.com.');
    expect(screen.getByText('Tu correo aún no está verificado.')).toBeInTheDocument();
    expect(code()).toHaveFocus();
  });

  it('tras recargar, toma el correo de sessionStorage', () => {
    setPendingEmail('luis@mail.com');
    renderVerify();
    expect(screen.getByText('luis@mail.com')).toBeInTheDocument();
  });

  it('al completar el código lo verifica, inicia la sesión y lleva a `next`', async () => {
    setPendingEmail('ana@mail.com');
    const session = makeSession();
    vi.mocked(api.verifyEmail).mockResolvedValue(session);
    const { user, router } = renderVerify('/verify?next=/dashboard');

    await user.click(code());
    await user.paste('12345678');

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'));
    expect(api.verifyEmail).toHaveBeenCalledExactlyOnceWith({ email: 'ana@mail.com', otp: '12345678' });
    expect(getSession()).toEqual(session);
    expect(getPendingEmail()).toBeNull();
  });

  it('INVALID_OTP vacía el campo y muestra el error en él', async () => {
    setPendingEmail('ana@mail.com');
    vi.mocked(api.verifyEmail).mockRejectedValue(apiError('INVALID_OTP', 'El código no es válido o venció.'));
    const { user } = renderVerify();

    await user.click(code());
    await user.paste('12345678');

    await waitFor(() => expect(code()).toHaveValue(''));
    expect(code()).toHaveAttribute('aria-invalid', 'true');
    expect(code()).toHaveAccessibleDescription('El código no es válido o venció.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('otros errores van como error general', async () => {
    setPendingEmail('ana@mail.com');
    vi.mocked(api.verifyEmail).mockRejectedValue(apiError('INTERNAL_ERROR', 'Algo salió mal.', 500));
    const { user } = renderVerify();

    await user.click(code());
    await user.paste('12345678');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal.'));
  });

  it('"Verificar" con el código incompleto pide los 8 dígitos', async () => {
    setPendingEmail('ana@mail.com');
    const { user } = renderVerify();

    await user.type(code(), '123');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(code()).toHaveAccessibleDescription('Escribe los 8 dígitos del código.');
    expect(api.verifyEmail).not.toHaveBeenCalled();
  });

  it('la cuenta regresiva bloquea "Reenviar" 60 s y luego reenvía el código', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setPendingEmail('ana@mail.com');
    vi.mocked(api.resendOtp).mockResolvedValue({ message: 'ok' });
    const { user } = renderVerify('/verify', { advanceTimers: vi.advanceTimersByTime });

    const waiting = screen.getByRole('button', { name: 'Reenviar en 1:00' });
    expect(waiting).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(18_000);
    });
    expect(screen.getByRole('button', { name: /^Reenviar en 0:4\d$/ })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(42_000);
    });
    const resend = screen.getByRole('button', { name: 'Reenviar código' });
    expect(resend).toBeEnabled();

    await user.click(resend);

    await waitFor(() => expect(api.resendOtp).toHaveBeenCalledExactlyOnceWith('ana@mail.com'));
    expect(await screen.findByText('Te enviamos un código nuevo.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Reenviar en 1:00' })).toBeDisabled();
  });

  it('TOO_MANY_REQUESTS al reenviar reinicia la espera y muestra el mensaje', async () => {
    sessionStorage.setItem('strim.pendingEmail', 'ana@mail.com'); // Sin hora de envío: se puede reenviar ya.
    vi.mocked(api.resendOtp).mockRejectedValue(apiError('TOO_MANY_REQUESTS', 'Espera un minuto antes de pedir otro código.', 429));
    const { user } = renderVerify();

    await user.click(screen.getByRole('button', { name: 'Reenviar código' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Espera un minuto antes de pedir otro código.'));
    expect(await screen.findByRole('button', { name: 'Reenviar en 1:00' })).toBeDisabled();
  });

  it('"Usar otro correo" vuelve a /register y olvida el correo pendiente', async () => {
    setPendingEmail('ana@mail.com');
    const { user, router } = renderVerify('/verify?next=/ana');

    const link = screen.getByRole('link', { name: 'Usar otro correo' });
    expect(link).toHaveAttribute('href', '/register?next=/ana');

    await user.click(link);

    await waitFor(() => expect(router.state.location.pathname).toBe('/register'));
    expect(getPendingEmail()).toBeNull();
  });
});
