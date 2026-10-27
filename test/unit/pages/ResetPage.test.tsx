import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../src/lib/api';
import { clearSession } from '../../../src/lib/session';
import LoginPage from '../../../src/pages/LoginPage';
import ResetPage from '../../../src/pages/ResetPage';
import { apiError } from '../../helpers/http';
import { renderWithProviders } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

function renderReset(route = '/reset') {
  return renderWithProviders(<ResetPage />, {
    route,
    path: '/reset',
    routes: [{ path: '/login', element: <LoginPage /> }],
  });
}

/** Paso 1 completo: pide el código para ana@mail.com. */
async function goToCodeStep(user: ReturnType<typeof renderReset>['user']) {
  vi.mocked(api.forgotPassword).mockResolvedValue({ message: 'ok' });
  await user.type(screen.getByLabelText('Correo'), 'Ana@Mail.com');
  await user.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByLabelText('Código');
}

describe('ResetPage', () => {
  afterEach(() => {
    clearSession();
  });

  describe('paso 1: el correo', () => {
    it('pide el correo con el foco puesto en él', () => {
      renderReset();

      expect(screen.getByRole('heading', { level: 1, name: 'Recupera tu contraseña' })).toBeInTheDocument();
      expect(document.title).toBe('Recupera tu contraseña | strim');
      expect(screen.getByLabelText('Correo')).toHaveFocus();
    });

    it('valida el correo antes de enviarlo', async () => {
      const { user } = renderReset();

      await user.click(screen.getByRole('button', { name: 'Enviar código' }));

      expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument();
      expect(api.forgotPassword).not.toHaveBeenCalled();
    });

    it('envía el código y pasa al paso 2 con el aviso y la espera para reenviar', async () => {
      const { user } = renderReset();

      await goToCodeStep(user);

      expect(api.forgotPassword).toHaveBeenCalledExactlyOnceWith('ana@mail.com');
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Si existe una cuenta con ese correo, te enviamos un código. Revisa ana@mail.com.'));
      expect(await screen.findByRole('button', { name: 'Reenviar en 1:00' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'Enviar código' })).not.toBeInTheDocument();
    });

    it('si falla, muestra el error general y se queda en el paso 1', async () => {
      vi.mocked(api.forgotPassword).mockRejectedValue(apiError('EMAIL_NOT_SENT', 'No pudimos enviar el correo.', 502));
      const { user } = renderReset();

      await user.type(screen.getByLabelText('Correo'), 'ana@mail.com');
      await user.click(screen.getByRole('button', { name: 'Enviar código' }));

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No pudimos enviar el correo.'));
      expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
    });
  });

  describe('paso 2: el código y la contraseña nueva', () => {
    it('cambia la contraseña y vuelve a /login con el correo escrito y el aviso', async () => {
      vi.mocked(api.resetPassword).mockResolvedValue({ message: 'ok' });
      const { user, router } = renderReset('/reset?next=/dashboard');
      await goToCodeStep(user);

      await user.click(screen.getByLabelText('Código'));
      await user.paste('12345678');
      await user.type(screen.getByLabelText('Contraseña nueva'), 'nueva1234');
      await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

      await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
      expect(vi.mocked(api.resetPassword).mock.calls[0][0]).toEqual({ email: 'ana@mail.com', otp: '12345678', newPassword: 'nueva1234' });
      expect(router.state.location.search).toBe('?next=/dashboard');
      // La página de login se monta después de que cambia la ruta.
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Contraseña actualizada. Inicia sesión.'));
      expect(await screen.findByLabelText('Correo')).toHaveValue('ana@mail.com');
    });

    it('con el código incompleto pide los 8 dígitos', async () => {
      const { user } = renderReset();
      await goToCodeStep(user);

      await user.type(screen.getByLabelText('Código'), '1234');
      await user.type(screen.getByLabelText('Contraseña nueva'), 'nueva1234');
      await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

      await waitFor(() => expect(screen.getByLabelText('Código')).toHaveAccessibleDescription('Escribe los 8 dígitos del código.'));
      expect(api.resetPassword).not.toHaveBeenCalled();
    });

    it('INVALID_OTP vacía el código y muestra el error en él', async () => {
      vi.mocked(api.resetPassword).mockRejectedValue(apiError('INVALID_OTP', 'El código no es válido o venció.'));
      const { user } = renderReset();
      await goToCodeStep(user);

      await user.click(screen.getByLabelText('Código'));
      await user.paste('12345678');
      await user.type(screen.getByLabelText('Contraseña nueva'), 'nueva1234');
      await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

      await waitFor(() => expect(screen.getByLabelText('Código')).toHaveValue(''));
      expect(screen.getByLabelText('Código')).toHaveAccessibleDescription('El código no es válido o venció.');
    });

    it('"Usar otro correo" vuelve al paso 1', async () => {
      const { user } = renderReset();
      await goToCodeStep(user);

      await user.click(screen.getByRole('button', { name: 'Usar otro correo' }));

      expect(await screen.findByRole('button', { name: 'Enviar código' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
    });
  });
});
