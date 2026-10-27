import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { WAIT_MESSAGE } from '../../../../src/features/settings/ChangePasswordModal';
import { DeleteAccountModal } from '../../../../src/features/settings/DeleteAccountModal';
import * as api from '../../../../src/lib/api';
import { queryClient, queryKeys } from '../../../../src/lib/queries';
import { clearSession } from '../../../../src/lib/session';
import { makeChannel, makeDashboard } from '../../../helpers/factories';
import { apiError } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  deleteAccount: vi.fn(),
}));

vi.mock('../../../../src/lib/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../../src/lib/session')>();
  // Se espía clearSession sin perder lo que hace (el render de prueba también la usa).
  return { ...original, clearSession: vi.fn(original.clearSession) };
});

function renderModal(onClose = vi.fn()) {
  const utils = renderWithProviders(
    <>
      <DeleteAccountModal open onClose={onClose} />
      <Toaster />
    </>,
    { route: '/settings', path: '/settings', session: true },
  );
  vi.mocked(clearSession).mockClear(); // Solo cuentan las llamadas del modal.
  return { ...utils, onClose };
}

const password = () => screen.getByLabelText('Contraseña');
const confirm = () => screen.getByRole('button', { name: 'Borrar mi cuenta' });

describe('DeleteAccountModal', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    queryClient.clear();
    clearSession();
  });

  it('advierte que no se puede deshacer y enfoca "Cancelar"', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: '¿Borrar tu cuenta?' });
    expect(dialog).toHaveAccessibleDescription(/No se puede deshacer\./);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(password()).toHaveAccessibleDescription('Escríbela para confirmar.');
  });

  it('pide la contraseña antes de enviar', async () => {
    const { user } = renderModal();

    await user.click(confirm());

    expect(await screen.findByText('Escribe tu contraseña.')).toBeInTheDocument();
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });

  it('al borrar: clearSession(true), vacía la caché privada y avisa', async () => {
    vi.mocked(api.deleteAccount).mockResolvedValue(undefined);
    queryClient.setQueryData(queryKeys.stream, makeDashboard());
    const live = [makeChannel()];
    queryClient.setQueryData(queryKeys.liveChannels, live);
    const { user, onClose } = renderModal();

    await user.type(password(), 'secreta1');
    await user.click(confirm());

    await waitFor(() => expect(api.deleteAccount).toHaveBeenCalledExactlyOnceWith('secreta1'));
    await waitFor(() => expect(clearSession).toHaveBeenCalledWith(true));
    expect(onClose).toHaveBeenCalled();
    expect(await screen.findByText('Tu cuenta se borró')).toBeInTheDocument();
    expect(queryClient.getQueryData(queryKeys.stream)).toBeUndefined();
    // La lista pública de canales en vivo se conserva.
    expect(queryClient.getQueryData(queryKeys.liveChannels)).toEqual(live);
  });

  it('INVALID_CURRENT_PASSWORD se muestra en el campo "Contraseña"', async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(apiError('INVALID_CURRENT_PASSWORD', 'La contraseña no es correcta.'));
    const { user, onClose } = renderModal();

    await user.type(password(), 'equivocada');
    await user.click(confirm());

    await waitFor(() => expect(password()).toHaveAttribute('aria-invalid', 'true'));
    expect(password()).toHaveAccessibleDescription(/La contraseña no es correcta\./);
    expect(password()).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(clearSession).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('TOO_MANY_REQUESTS muestra el mensaje de espera', async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(apiError('TOO_MANY_REQUESTS', 'Too many requests', 429));
    const { user } = renderModal();

    await user.type(password(), 'secreta1');
    await user.click(confirm());

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(WAIT_MESSAGE));
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('"Cancelar" cierra sin borrar', async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });
});
