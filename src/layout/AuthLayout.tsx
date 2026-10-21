import { Link, Outlet } from 'react-router';
import { Logo } from '../components/Logo';
import { Toaster } from '../components/Toaster';
import { SkipLink } from './SkipLink';

/** Páginas de cuenta: solo el logo y una columna centrada de 400 px (RF-01.5). */
export function AuthLayout() {
  return (
    <>
      <SkipLink />
      <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
        <header className="mb-8">
          <Link to="/" aria-label="strim, inicio" className="inline-flex rounded-full">
            <Logo size={40} />
          </Link>
        </header>
        <main id="contenido" tabIndex={-1} className="w-full max-w-[400px] outline-none">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </>
  );
}
