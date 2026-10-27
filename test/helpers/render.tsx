// Render con los proveedores de la app: TanStack Query (un cliente nuevo por prueba) y un router en memoria.
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { clearSession, startSession } from '../../src/lib/session';
import type { AuthSession } from '../../src/lib/types';
import { makeSession } from './factories';
import { LocationProbe } from './LocationProbe';

type Route = string | { pathname: string; search?: string; state?: unknown };

export type RenderOptions = {
  /** Ruta inicial, por ejemplo '/login?next=/dashboard'. */
  route?: Route;
  /** Patrón de la ruta donde se monta `ui`, por ejemplo '/:username'. Por defecto, '/'. */
  path?: string;
  /**
   * `true` (o una sesión concreta) inicia la sesión antes de renderizar. `'ended'` la deja cerrada por el
   * usuario (`clearSession(true)`). Sin él, no hay sesión.
   */
  session?: boolean | AuthSession | 'ended';
  /** Otras rutas, por ejemplo la página a la que se navega. */
  routes?: RouteObject[];
  queryClient?: QueryClient;
  /** Opciones de user-event (por ejemplo, `advanceTimers` con temporizadores falsos). */
  userOptions?: Parameters<typeof userEvent.setup>[0];
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', path = '/', session, routes = [], queryClient = createTestQueryClient(), userOptions } = options;

  if (session === 'ended') clearSession(true);
  else if (session) startSession(session === true ? makeSession() : session);
  else clearSession();

  const router = createMemoryRouter([{ path, element: ui }, ...routes, { path: '*', element: <LocationProbe /> }], {
    initialEntries: [route],
  });
  const user = userEvent.setup(userOptions);
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...utils, user, router, queryClient };
}
