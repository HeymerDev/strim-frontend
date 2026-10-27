import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../src/lib/api';
import { getPendingEmail } from '../../../src/lib/pendingEmail';
import { clearSession, getSession } from '../../../src/lib/session';
import LoginPage from '../../../src/pages/LoginPage';
import { makeSession } from '../../helpers/factories';
import { apiError } from '../../helpers/http';
import { renderWithProviders, type RenderOptions } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  login: vi.fn(),
  resendOtp: vi.fn(),
}));

type Route = RenderOptions['route'];

function renderLogin(route: Route = '/login') {
  return renderWithProviders(<LoginPage />, { route, path: '/login' });
}

const email = () => screen.getByLabelText('Correo');
const password = () => screen.getByLabelText('Contraseña');
const submit = () => screen.getByRole('button', { name: 'Iniciar sesión' });

describe('LoginPage', () => {
  afterEach(() => {
    clearSession();
  });

  it('muestra el formulario con el título de la pestaña y el enlace para recuperar la contraseña', () => {
    renderLogin('/login?next=/dashboard');

    expect(screen.getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeInTheDocument();
    expect(document.title).toBe('Inicia sesión | strim');
    expect(email()).toHaveFocus();
    expect(screen.getByRole('link', { name: '¿La olvidaste?' })).toHaveAttribute('href', '/reset?next=/dashboard');
  });

  it('valida antes de enviar', async () => {
    const { user } = renderLogin();

    await user.click(submit());

    expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('con éxito inicia la sesión y lleva a `next`', async () => {
    const session = makeSession();
    vi.mocked(api.login).mockResolvedValue(session);
    const { user, router } = renderLogin('/login?next=/dashboard');

    await user.type(email(), 'Ana@Mail.com');
    await user.type(password(), 'secreta1');
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'));
    expect(vi.mocked(api.login).mock.calls[0][0]).toEqual({ email: 'ana@mail.com', password: 'secreta1' });
    expect(getSession()).toEqual(session);
  });

  it('con un `next` externo lleva al inicio', async () => {
    vi.mocked(api.login).mockResolvedValue(makeSession());
    const { user, router } = renderLogin('/login?next=https://evil.test');

    await user.type(email(), 'ana@mail.com');
    await user.type(password(), 'secreta1');
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('INVALID_CREDENTIALS muestra un error general sin marcar los campos', async () => {
    vi.mocked(api.login).mockRejectedValue(apiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401));
    const { user, router } = renderLogin();

    await user.type(email(), 'ana@mail.com');
    await user.type(password(), 'equivocada');
    await user.click(submit());

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.'));
    expect(email()).not.toHaveAttribute('aria-invalid');
    expect(password()).not.toHaveAttribute('aria-invalid');
    expect(router.state.location.pathname).toBe('/login');
    expect(getSession()).toBeNull();
  });

  it('EMAIL_NOT_VERIFIED pide un código nuevo y lleva a /verify con el correo y el aviso', async () => {
    vi.mocked(api.login).mockRejectedValue(apiError('EMAIL_NOT_VERIFIED', 'Verifica tu correo.', 403));
    vi.mocked(api.resendOtp).mockResolvedValue({ message: 'ok' });
    const { user, router } = renderLogin('/login?next=/dashboard');

    await user.type(email(), 'Ana@Mail.com');
    await user.type(password(), 'secreta1');
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe('/verify'));
    expect(api.resendOtp).toHaveBeenCalledExactlyOnceWith('ana@mail.com');
    expect(router.state.location.search).toBe('?next=/dashboard');
    expect(router.state.location.state).toEqual({
      email: 'ana@mail.com',
      notice: 'Tu correo aún no está verificado. Te enviamos un código nuevo.',
    });
    expect(getPendingEmail()).toBe('ana@mail.com');
  });

  it('EMAIL_NOT_VERIFIED lleva a /verify aunque reenviar el código falle', async () => {
    vi.mocked(api.login).mockRejectedValue(apiError('EMAIL_NOT_VERIFIED', 'Verifica tu correo.', 403));
    vi.mocked(api.resendOtp).mockRejectedValue(apiError('TOO_MANY_REQUESTS', 'Espera un poco.', 429));
    const { user, router } = renderLogin();

    await user.type(email(), 'ana@mail.com');
    await user.type(password(), 'secreta1');
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe('/verify'));
  });

  it('con el correo y el aviso de otra página: los muestra y enfoca la contraseña', () => {
    renderLogin({ pathname: '/login', state: { email: 'ana@mail.com', notice: 'Contraseña actualizada. Inicia sesión.' } });

    expect(screen.getByRole('status')).toHaveTextContent('Contraseña actualizada. Inicia sesión.');
    expect(email()).toHaveValue('ana@mail.com');
    expect(password()).toHaveFocus();
  });
});
