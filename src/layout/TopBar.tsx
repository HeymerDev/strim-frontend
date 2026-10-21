import { Link } from 'react-router';
import { Logo } from '../components/Logo';
import { StatusNode } from '../components/StatusNode';
import { buttonClasses } from '../components/buttonStyles';
import { cx } from '../components/cx';
import { useSession } from '../lib/session';
import { UserMenu } from './UserMenu';

/** Barra superior (diseño §10.1, RF-01). */
export function TopBar() {
  const { session } = useSession();
  const status = session?.user.channel.status ?? 'offline';
  const live = status === 'live';

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-noche">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="strim, inicio" className="inline-flex shrink-0 rounded-full">
          <Logo size={28} />
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/dashboard"
            aria-label={live ? 'En vivo: ir al estudio' : 'Transmitir'}
            className={cx(
              buttonClasses(live ? 'al-aire' : 'secondary', 'sm'),
              'size-11 px-0 sm:size-auto sm:h-9 sm:px-4',
            )}
          >
            <StatusNode status={status} size={12} />
            <span className="hidden sm:inline">{live ? 'En vivo' : 'Transmitir'}</span>
          </Link>

          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Link to="/login" className={cx(buttonClasses('ghost', 'sm'), 'h-11 sm:h-9')}>
                <span className="sm:hidden">Entrar</span>
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
              <Link to="/register" className={cx(buttonClasses('primary', 'sm'), 'max-sm:hidden')}>
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
