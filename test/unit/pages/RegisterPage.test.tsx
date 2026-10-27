import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../src/lib/api';
import { getPendingEmail } from '../../../src/lib/pendingEmail';
import { clearSession } from '../../../src/lib/session';
import RegisterPage from '../../../src/pages/RegisterPage';
import { apiError } from '../../helpers/http';
import { renderWithProviders } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  register: vi.fn(),
}));

function renderRegister(route = '/register') {
  return renderWithProviders(<RegisterPage />, { route, path: '/register' });
}

const email = () => screen.getByLabelText('Correo');
const username = () => screen.getByLabelText('Nombre de usuario');
const password = () => screen.getByLabelText('Contraseña');
const submit = () => screen.getByRole('button', { name: 'Crear cuenta' });

describe('RegisterPage', () => {
  afterEach(() => {
    clearSession();
  });

  it('muestra el formulario con las reglas de la contraseña', () => {
    renderRegister();

    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(document.title).toBe('Crea tu cuenta | strim');
    expect(username()).toHaveAccessibleDescription('Será tu canal: strim/tu-usuario');
    expect(screen.getByRole('list', { name: 'Requisitos de la contraseña' })).toBeInTheDocument();
  });

  it('el nombre de usuario pasa a minúsculas al escribir', async () => {
    const { user } = renderRegister();

    await user.type(username(), 'AnaTorres');

    expect(username()).toHaveValue('anatorres');
    expect(username()).toHaveAccessibleDescription('Será tu canal: strim/anatorres');
  });

  it('al enviar con errores, el foco va al primer campo con error', async () => {
    const { user } = renderRegister();

    await user.type(username(), 'ab');
    await user.click(submit());

    expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument();
    expect(screen.getByText('De 3 a 20 caracteres: letras, números o guion bajo.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    await waitFor(() => expect(email()).toHaveFocus());
    expect(api.register).not.toHaveBeenCalled();
  });

  it('si solo falla el usuario, el foco va a ese campo', async () => {
    const { user } = renderRegister();

    await user.type(email(), 'ana@mail.com');
    await user.type(username(), 'admin');
    await user.type(password(), 'secreta12');
    await user.click(submit());

    expect(await screen.findByText('Ese nombre de usuario no está disponible.')).toBeInTheDocument();
    await waitFor(() => expect(username()).toHaveFocus());
  });

  it('EMAIL_TAKEN se muestra en el campo del correo', async () => {
    vi.mocked(api.register).mockRejectedValue(apiError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.', 409));
    const { user } = renderRegister();

    await user.type(email(), 'ana@mail.com');
    await user.type(username(), 'ana');
    await user.type(password(), 'secreta12');
    await user.click(submit());

    await waitFor(() => expect(email()).toHaveAttribute('aria-invalid', 'true'));
    expect(email()).toHaveAccessibleDescription('Ya existe una cuenta con ese correo.');
    expect(email()).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('con éxito guarda el correo pendiente y lleva a /verify conservando `next`', async () => {
    vi.mocked(api.register).mockResolvedValue({ status: 'verification_pending', email: 'ana@mail.com' });
    const { user, router } = renderRegister('/register?next=/ana');

    await user.type(email(), 'Ana@Mail.com');
    await user.type(username(), 'Ana');
    await user.type(password(), 'secreta12');
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe('/verify'));
    expect(vi.mocked(api.register).mock.calls[0][0]).toEqual({ email: 'ana@mail.com', username: 'ana', password: 'secreta12' });
    expect(router.state.location.search).toBe('?next=/ana');
    expect(router.state.location.state).toEqual({ email: 'ana@mail.com' });
    expect(getPendingEmail()).toBe('ana@mail.com');
  });
});
