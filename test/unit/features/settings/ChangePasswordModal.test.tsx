import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { ChangePasswordModal, WAIT_MESSAGE } from '../../../../src/features/settings/ChangePasswordModal';
import * as api from '../../../../src/lib/api';
import { clearSession } from '../../../../src/lib/session';
import { apiError } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  changePassword: vi.fn(),
}));

function renderModal(onClose = vi.fn()) {
  const utils = renderWithProviders(
    <>
      <ChangePasswordModal open onClose={onClose} />
      <Toaster />
    </>,
    { route: '/settings', path: '/settings', session: true },
  );
  return { ...utils, onClose };
}

const current = () => screen.getByLabelText('Contraseña actual');
const next = () => screen.getByLabelText('Contraseña nueva');
const submit = () => screen.getByRole('button', { name: 'Cambiar contraseña' });

describe('ChangePasswordModal', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    clearSession();
  });

  it('abre con el foco en la contraseña actual y muestra las reglas de la nueva', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Cambiar contraseña' })).toBeVisible();
    expect(current()).toHaveFocus();
    expect(screen.getByRole('list', { name: 'Requisitos de la contraseña' })).toBeInTheDocument();
  });

  it('valida antes de enviar', async () => {
    const { user } = renderModal();

    await user.type(next(), 'corta');
    await user.click(submit());

    expect(await screen.findByText('Escribe tu contraseña.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('envía la actual y la nueva; al terminar cierra y avisa', async () => {
    vi.mocked(api.changePassword).mockResolvedValue(undefined);
    const { user, onClose } = renderModal();

    await user.type(current(), 'vieja123');
    await user.type(next(), 'nueva1234');
    await user.click(submit());

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(vi.mocked(api.changePassword).mock.calls[0][0]).toEqual({ currentPassword: 'vieja123', newPassword: 'nueva1234' });
    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
  });

  it('INVALID_CURRENT_PASSWORD se muestra en el campo de la contraseña actual', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(apiError('INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta.'));
    const { user, onClose } = renderModal();

    await user.type(current(), 'equivocada1');
    await user.type(next(), 'nueva1234');
    await user.click(submit());

    await waitFor(() => expect(current()).toHaveAttribute('aria-invalid', 'true'));
    expect(current()).toHaveAccessibleDescription('La contraseña actual no es correcta.');
    expect(current()).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('SAME_PASSWORD se muestra en el campo de la contraseña nueva', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(apiError('SAME_PASSWORD', 'La contraseña nueva debe ser distinta.'));
    const { user } = renderModal();

    await user.type(current(), 'misma1234');
    await user.type(next(), 'misma1234');
    await user.click(submit());

    await waitFor(() => expect(next()).toHaveAccessibleDescription('La contraseña nueva debe ser distinta.'));
  });

  it('TOO_MANY_REQUESTS muestra el mensaje de espera', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(apiError('TOO_MANY_REQUESTS', 'Too many requests', 429));
    const { user } = renderModal();

    await user.type(current(), 'vieja123');
    await user.type(next(), 'nueva1234');
    await user.click(submit());

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(WAIT_MESSAGE));
    expect(WAIT_MESSAGE).toBe('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.');
  });

  it('"Cancelar" cierra', async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(api.changePassword).not.toHaveBeenCalled();
  });
});
