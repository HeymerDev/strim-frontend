import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuestOnly, RequireAuth } from '../../../src/layout/guards';
import * as api from '../../../src/lib/api';
import { bootSession, clearSession } from '../../../src/lib/session';
import type { Me } from '../../../src/lib/types';
import { makeMe } from '../../helpers/factories';
import { deferred } from '../../helpers/http';
import { renderWithProviders } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  getMe: vi.fn(),
}));

describe('RequireAuth', () => {
  afterEach(() => {
    clearSession();
  });

  it('mientras se comprueba la sesión muestra el spinner', async () => {
    const me = deferred<Me>();
    vi.mocked(api.getMe).mockReturnValueOnce(me.promise);
    const { router } = renderWithProviders(
      <RequireAuth>
        <p>Estudio privado</p>
      </RequireAuth>,
      { route: '/dashboard', path: '/dashboard', session: true },
    );

    // Como al arrancar la app: hay sesión guardada y se comprueba con GET /api/me.
    let booting!: Promise<void>;
    act(() => {
      booting = bootSession();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Comprobando tu sesión');
    expect(screen.queryByText('Estudio privado')).not.toBeInTheDocument();

    await act(async () => {
      me.resolve(makeMe());
      await booting;
    });
    expect(screen.getByText('Estudio privado')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('con sesión muestra la página', () => {
    renderWithProviders(
      <RequireAuth>
        <p>Estudio privado</p>
      </RequireAuth>,
      { route: '/dashboard', path: '/dashboard', session: true },
    );
    expect(screen.getByText('Estudio privado')).toBeInTheDocument();
  });

  it('sin sesión lleva a /login?next=<ruta y búsqueda>', () => {
    const { router } = renderWithProviders(
      <RequireAuth>
        <p>Estudio privado</p>
      </RequireAuth>,
      { route: '/dashboard?tab=obs', path: '/dashboard' },
    );

    expect(screen.queryByText('Estudio privado')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?next=%2Fdashboard%3Ftab%3Dobs');
    expect(screen.getByText('Ruta: /login?next=%2Fdashboard%3Ftab%3Dobs')).toBeInTheDocument();
  });

  it('si el usuario cerró la sesión (endedByUser) lleva al inicio', () => {
    const { router } = renderWithProviders(
      <RequireAuth>
        <p>Ajustes privados</p>
      </RequireAuth>,
      { route: '/settings', path: '/settings', session: 'ended', routes: [{ path: '/', element: <p>Inicio</p> }] },
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('si la sesión se cierra mientras está en la página, sale de ella', () => {
    const { router } = renderWithProviders(
      <RequireAuth>
        <p>Ajustes privados</p>
      </RequireAuth>,
      { route: '/settings', path: '/settings', session: true },
    );

    act(() => clearSession());

    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('GuestOnly', () => {
  afterEach(() => {
    clearSession();
  });

  it('sin sesión muestra la página', () => {
    renderWithProviders(
      <GuestOnly>
        <p>Formulario de login</p>
      </GuestOnly>,
      { route: '/login', path: '/login' },
    );
    expect(screen.getByText('Formulario de login')).toBeInTheDocument();
  });

  it('con sesión lleva a `next` si es una ruta interna', () => {
    const { router } = renderWithProviders(
      <GuestOnly>
        <p>Formulario de login</p>
      </GuestOnly>,
      { route: '/login?next=/dashboard', path: '/login', session: true },
    );

    expect(screen.queryByText('Formulario de login')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('con sesión y un `next` externo lleva al inicio', () => {
    const { router } = renderWithProviders(
      <GuestOnly>
        <p>Formulario de login</p>
      </GuestOnly>,
      { route: '/login?next=//evil.test', path: '/login', session: true },
    );
    expect(router.state.location.pathname).toBe('/');
  });

  it('con sesión y sin `next` lleva al inicio', () => {
    const { router } = renderWithProviders(
      <GuestOnly>
        <p>Formulario de login</p>
      </GuestOnly>,
      { route: '/register', path: '/register', session: true },
    );
    expect(router.state.location.pathname).toBe('/');
  });
});
