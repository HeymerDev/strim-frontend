import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { ProfileForm } from '../../../../src/features/settings/ProfileForm';
import * as api from '../../../../src/lib/api';
import { clearSession, getSession } from '../../../../src/lib/session';
import type { Me } from '../../../../src/lib/types';
import { makeMe, makeSession } from '../../../helpers/factories';
import { apiError } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  updateMe: vi.fn(),
}));

const baseUser = makeMe({ profile: { username: 'ana', displayName: 'Ana Torres', bio: 'Hola' } });

function renderForm(user: Me = baseUser) {
  return renderWithProviders(
    <>
      <ProfileForm user={user} />
      <Toaster />
    </>,
    { route: '/settings', path: '/settings', session: makeSession({ user }) },
  );
}

const displayName = () => screen.getByRole('textbox', { name: 'Nombre visible' });
const username = () => screen.getByRole('textbox', { name: 'Nombre de usuario' });
const bio = () => screen.getByRole('textbox', { name: 'Bio' });
const save = () => screen.getByRole('button', { name: 'Guardar cambios' });

describe('ProfileForm', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    clearSession();
  });

  it('muestra los datos guardados, el correo fijo y "Guardar cambios" deshabilitado', () => {
    renderForm();

    expect(displayName()).toHaveValue('Ana Torres');
    expect(username()).toHaveValue('ana');
    expect(bio()).toHaveValue('Hola');
    expect(screen.getByText('4 / 200')).toBeInTheDocument();
    expect(screen.getByText('ana@mail.com')).toBeInTheDocument();
    expect(screen.getByText('(no se puede cambiar)')).toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it('envía solo los campos que cambiaron', async () => {
    vi.mocked(api.updateMe).mockResolvedValue(makeMe({ profile: { displayName: 'Ana T.', bio: 'Hola' } }));
    const { user } = renderForm();

    await user.clear(displayName());
    await user.type(displayName(), 'Ana T.');
    expect(save()).toBeEnabled();
    await user.click(save());

    await waitFor(() => expect(api.updateMe).toHaveBeenCalledOnce());
    expect(vi.mocked(api.updateMe).mock.calls[0][0]).toEqual({ displayName: 'Ana T.' });
    expect(await screen.findByText('Cambios guardados')).toBeInTheDocument();
    expect(getSession()!.user.profile.displayName).toBe('Ana T.');
  });

  it('si el campo vuelve a su valor guardado, no envía nada', async () => {
    const { user } = renderForm();

    await user.type(bio(), '!');
    await user.type(bio(), '{Backspace}');
    await user.click(save());

    expect(api.updateMe).not.toHaveBeenCalled();
  });

  it('el nombre de usuario pasa a minúsculas al escribir y actualiza la ayuda', async () => {
    const { user } = renderForm();

    await user.clear(username());
    await user.type(username(), 'Ana_Nueva');

    expect(username()).toHaveValue('ana_nueva');
    expect(username()).toHaveAccessibleDescription('Tu canal: strim/ana_nueva');
  });

  it('en vivo no deja cambiar el nombre de usuario y explica por qué', () => {
    renderForm(makeMe({ channel: { status: 'live' } }));

    expect(username()).toBeDisabled();
    expect(username()).toHaveAccessibleDescription('Finaliza el stream para cambiar tu nombre de usuario.');
  });

  it('esperando la señal tampoco deja cambiarlo', () => {
    renderForm(makeMe({ channel: { status: 'waiting' } }));
    expect(username()).toBeDisabled();
  });

  it('USERNAME_TAKEN se muestra en el campo del nombre de usuario', async () => {
    vi.mocked(api.updateMe).mockRejectedValue(apiError('USERNAME_TAKEN', 'Ese nombre de usuario ya está en uso.', 409));
    const { user } = renderForm();

    await user.clear(username());
    await user.type(username(), 'luis');
    await user.click(save());

    await waitFor(() => expect(username()).toHaveAttribute('aria-invalid', 'true'));
    expect(username()).toHaveAccessibleDescription(/Ese nombre de usuario ya está en uso\./);
    expect(username()).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(vi.mocked(api.updateMe).mock.calls[0][0]).toEqual({ username: 'luis' });
  });

  it('un error sin campo aparece como error general', async () => {
    vi.mocked(api.updateMe).mockRejectedValue(apiError('INTERNAL_ERROR', 'Algo salió mal.', 500));
    const { user } = renderForm();

    await user.type(bio(), ' y chau');
    await user.click(save());

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal.'));
  });

  it('valida en el navegador antes de enviar', async () => {
    const { user } = renderForm();

    await user.clear(displayName());
    await user.clear(username());
    await user.type(username(), 'ab');
    await user.click(save());

    expect(await screen.findByText('El nombre visible no puede estar vacío.')).toBeInTheDocument();
    expect(screen.getByText('De 3 a 20 caracteres: letras, números o guion bajo.')).toBeInTheDocument();
    await waitFor(() => expect(displayName()).toHaveFocus());
    expect(api.updateMe).not.toHaveBeenCalled();
  });
});
