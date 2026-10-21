// Rutas, layouts y guardas (diseño §4).
// Este módulo exporta el router, no componentes: no participa de la recarga en caliente.
/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useParams, type RouteObject } from 'react-router';
import { Spinner } from './components/Spinner';
import { AppLayout } from './layout/AppLayout';
import { AuthLayout } from './layout/AuthLayout';
import { GuestOnly, RequireAuth } from './layout/guards';
import { isUsername } from './lib/navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import ResetPage from './pages/ResetPage';
import VerifyPage from './pages/VerifyPage';

// Páginas diferidas: el estudio y el canal traen el reproductor (RNF-08).
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ChannelPage = lazy(() => import('./pages/ChannelPage'));
const DevUiPage = import.meta.env.DEV ? lazy(() => import('./pages/DevUiPage')) : null;

function Deferred({ page: Page }: { page: ComponentType }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50dvh] place-items-center text-senal">
          <Spinner size={28} label="Cargando" />
        </div>
      }
    >
      <Page />
    </Suspense>
  );
}

/** `/:username`: minúsculas y el patrón del backend antes de llamar a la API (diseño §4). */
function ChannelRoute() {
  const { username = '' } = useParams();
  const lower = username.toLowerCase();
  if (lower !== username && isUsername(lower)) return <Navigate to={`/${lower}`} replace />;
  if (!isUsername(username)) return <NotFoundPage channel />;
  return <Deferred page={ChannelPage} />;
}

const guest = (page: ReactNode) => <GuestOnly>{page}</GuestOnly>;
const privateRoute = (page: ComponentType) => (
  <RequireAuth>
    <Deferred page={page} />
  </RequireAuth>
);

const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: guest(<LoginPage />) },
      { path: '/register', element: guest(<RegisterPage />) },
      { path: '/verify', element: guest(<VerifyPage />) },
      { path: '/reset', element: guest(<ResetPage />) },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/dashboard', element: privateRoute(DashboardPage) },
      { path: '/settings', element: privateRoute(SettingsPage) },
      ...(DevUiPage ? [{ path: '/dev/ui', element: <Deferred page={DevUiPage} /> }] : []),
      { path: '/:username', element: <ChannelRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
