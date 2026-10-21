import { NavLink, useLocation } from 'react-router';
import { cx } from './cx';

/** Dos enlaces con forma de pestañas entre "Iniciar sesión" y "Crear cuenta" (diseño §10.6). */
export function AuthTabs() {
  // Conserva `next` al cambiar de pestaña.
  const { search } = useLocation();
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150',
      isActive ? 'bg-relieve text-texto' : 'text-texto-suave hover:text-texto',
    );

  return (
    <nav aria-label="Cuenta" className="mb-6 flex gap-1 rounded-full border border-linea bg-noche p-1">
      <NavLink to={{ pathname: '/login', search }} className={linkClasses}>
        Iniciar sesión
      </NavLink>
      <NavLink to={{ pathname: '/register', search }} className={linkClasses}>
        Crear cuenta
      </NavLink>
    </nav>
  );
}
