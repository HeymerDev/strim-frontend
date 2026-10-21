import { Outlet } from 'react-router';
import { Toaster } from '../components/Toaster';
import { SkipLink } from './SkipLink';
import { TopBar } from './TopBar';

/** Barra superior completa, contenido y avisos (diseño §4). */
export function AppLayout() {
  return (
    <>
      <SkipLink />
      <TopBar />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Toaster />
    </>
  );
}
