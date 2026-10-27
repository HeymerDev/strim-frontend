import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from '../../../src/layout/UserMenu';
import { clearSession, logout } from '../../../src/lib/session';
import { makeMe } from '../../helpers/factories';
import { renderWithProviders } from '../../helpers/render';

vi.mock('../../../src/lib/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/session')>()),
  logout: vi.fn(async () => {}),
}));

const me = makeMe();

function renderMenu(route = '/ana') {
  return renderWithProviders(
    <>
      <UserMenu user={me} />
      <button type="button">Afuera</button>
    </>,
    { route, path: '*' },
  );
}

const menuButton = () => screen.getByRole('button', { name: 'Menú de Ana Torres' });

describe('UserMenu', () => {
  afterEach(() => {
    clearSession();
  });

  it('empieza cerrado', () => {
    renderMenu();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Mi canal' })).not.toBeInTheDocument();
  });

  it('el clic abre el panel con los enlaces del usuario', async () => {
    const { user } = renderMenu();

    await user.click(menuButton());

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(menuButton().getAttribute('aria-controls')!);
    expect(panel).toBeVisible();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi canal' })).toHaveAttribute('href', '/ana');
    expect(screen.getByRole('link', { name: 'Estudio' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('href', '/settings');
  });

  it('Enter con el teclado lo abre', async () => {
    const { user } = renderMenu();

    await user.tab();
    expect(menuButton()).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
  });

  it('Escape lo cierra y devuelve el foco al botón', async () => {
    const { user } = renderMenu();

    await user.click(menuButton());
    await user.tab(); // El foco entra al panel.
    expect(menuButton()).not.toHaveFocus();
    await user.keyboard('{Escape}');

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).toHaveFocus();
  });

  it('un clic afuera lo cierra', async () => {
    const { user } = renderMenu();

    await user.click(menuButton());
    await user.click(screen.getByRole('button', { name: 'Afuera' }));

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('al navegar se cierra', async () => {
    const { user, router } = renderMenu();

    await user.click(menuButton());
    await user.click(screen.getByRole('link', { name: 'Ajustes' }));

    expect(router.state.location.pathname).toBe('/settings');
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('"Cerrar sesión" llama a logout y lleva al inicio', async () => {
    const { user, router } = renderMenu('/settings');

    await user.click(menuButton());
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(logout).toHaveBeenCalledOnce();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });
});
