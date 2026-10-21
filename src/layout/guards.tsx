import type { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { Spinner } from '../components/Spinner';
import { loginPath, safeNext } from '../lib/navigation';
import { useSession } from '../lib/session';

/** Rutas privadas: sin sesión lleva a /login?next=<ruta> (RF-02.5). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, session } = useSession();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="grid min-h-[50dvh] place-items-center text-senal">
        <Spinner size={28} label="Comprobando tu sesión" />
      </div>
    );
  }
  if (!session) return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  return children;
}

/** Rutas "solo sin sesión": con sesión lleva a `next` o a / (RF-02.6). */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [params] = useSearchParams();
  if (session) return <Navigate to={safeNext(params.get('next'))} replace />;
  return children;
}
