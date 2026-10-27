import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { AvatarPicker } from '../../../../src/features/settings/AvatarPicker';
import * as api from '../../../../src/lib/api';
import { clearSession, getSession } from '../../../../src/lib/session';
import type { Me } from '../../../../src/lib/types';
import { apiError, deferred } from '../../../helpers/http';
import { makeMe, makeSession } from '../../../helpers/factories';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  uploadAvatar: vi.fn(),
}));

const INVALID = 'Elige una imagen JPG, PNG o WebP de hasta 2 MB.';
const image = (type: string, size = 1024, name = 'foto') => new File([new Uint8Array(size)], name, { type });

function renderPicker(user: Me = makeMe()) {
  return renderWithProviders(
    <>
      <AvatarPicker user={user} />
      <Toaster />
    </>,
    // `applyAccept: false`: se pueden elegir archivos que el atributo `accept` filtraría, como haría
    // alguien que cambia el filtro del diálogo del sistema.
    { route: '/settings', path: '/settings', session: makeSession({ user }), userOptions: { applyAccept: false } },
  );
}

const fileInput = () => screen.getByLabelText('Cambiar foto') as HTMLInputElement;

describe('AvatarPicker', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    clearSession();
  });

  it('muestra las iniciales sin foto, el botón y la ayuda', () => {
    renderPicker();

    expect(screen.getByText('AT')).toBeInTheDocument();
    expect(fileInput()).toHaveAttribute('type', 'file');
    expect(fileInput()).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    expect(fileInput()).toHaveAccessibleDescription('JPG, PNG o WebP de hasta 2 MB.');
  });

  it('con foto la muestra', () => {
    renderPicker(makeMe({ profile: { avatarUrl: 'https://cdn.test/ana.png' } }));
    expect(screen.getByRole('img', { name: 'Tu foto de perfil' })).toHaveAttribute('src', 'https://cdn.test/ana.png');
  });

  it('un archivo de otro tipo muestra el error sin llamar a uploadAvatar', async () => {
    const { user } = renderPicker();

    await user.upload(fileInput(), image('image/gif'));

    expect(screen.getByRole('alert')).toHaveTextContent(INVALID);
    expect(api.uploadAvatar).not.toHaveBeenCalled();
  });

  it('un archivo de más de 2 MB muestra el error sin llamar a uploadAvatar', async () => {
    const { user } = renderPicker();

    await user.upload(fileInput(), image('image/png', 2 * 1024 * 1024 + 1));

    expect(screen.getByRole('alert')).toHaveTextContent(INVALID);
    expect(api.uploadAvatar).not.toHaveBeenCalled();
  });

  it('un archivo válido muestra la vista previa, lo sube y actualiza la sesión', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:vista-previa');
    const updated = makeMe({ profile: { avatarUrl: 'https://cdn.test/nueva.png' } });
    const upload = deferred<Me>();
    vi.mocked(api.uploadAvatar).mockReturnValue(upload.promise);
    const { user } = renderPicker();
    const file = image('image/png');

    await user.upload(fileInput(), file);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole('img', { name: 'Tu foto de perfil' })).toHaveAttribute('src', 'blob:vista-previa');
    expect(await screen.findByText('Subiendo la foto')).toBeInTheDocument();
    expect(fileInput()).toBeDisabled();
    expect(vi.mocked(api.uploadAvatar).mock.calls[0][0]).toBe(file);

    upload.resolve(updated);

    expect(await screen.findByText('Foto actualizada')).toBeInTheDocument();
    await waitFor(() => expect(getSession()!.user.profile.avatarUrl).toBe('https://cdn.test/nueva.png'));
    await waitFor(() => expect(screen.queryByText('Subiendo la foto')).not.toBeInTheDocument());
  });

  it('si el backend rechaza la foto, quita la vista previa y muestra su mensaje', async () => {
    vi.mocked(api.uploadAvatar).mockRejectedValue(apiError('INVALID_FILE', 'La imagen está dañada.'));
    const { user } = renderPicker();

    await user.upload(fileInput(), image('image/jpeg'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La imagen está dañada.'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  it('un error que no viene de la API dice "Algo salió mal."', async () => {
    vi.mocked(api.uploadAvatar).mockRejectedValue(new Error('boom'));
    const { user } = renderPicker();

    await user.upload(fileInput(), image('image/webp'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal.'));
  });

  it('al elegir otro archivo se borra el error anterior', async () => {
    vi.mocked(api.uploadAvatar).mockResolvedValue(makeMe());
    const { user } = renderPicker();

    await user.upload(fileInput(), image('image/gif'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.upload(fileInput(), image('image/png'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
