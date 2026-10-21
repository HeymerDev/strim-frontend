import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { cx } from '../components/cx';
import { clearPrivateQueries } from '../lib/queries';
import { logout } from '../lib/session';
import type { Me } from '../lib/types';

const itemClasses =
  'flex h-11 w-full items-center rounded-campo px-3 text-left text-base text-texto transition-colors duration-150 hover:bg-relieve';

/**
 * Menú del usuario (diseño §2 y §10.1): es navegación, no un menú de comandos.
 * Botón con aria-expanded y una lista de enlaces; cierra con Escape, al hacer clic afuera y al navegar.
 */
export function UserMenu({ user }: { user: Me }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = user;

  // Cerrar al cambiar de página.
  const [path, setPath] = useState(location.pathname);
  if (path !== location.pathname) {
    setPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await logout();
    clearPrivateQueries();
    navigate('/');
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Menú de ${profile.displayName}`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1 rounded-full pr-1 pl-1.5 transition-colors duration-150 hover:bg-relieve"
      >
        <Avatar src={profile.avatarUrl} name={profile.displayName} username={profile.username} size={32} />
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cx('text-texto-suave transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full right-0 mt-2 w-64 rounded-panel border border-linea bg-panel p-2 shadow-[0_16px_40px_-12px_rgb(5_4_12/0.8)]"
      >
        <div className="flex items-center gap-3 px-3 pt-2 pb-3">
          <Avatar src={profile.avatarUrl} name={profile.displayName} username={profile.username} size={40} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-texto">{profile.displayName}</p>
            <p className="truncate text-sm text-texto-suave">@{profile.username}</p>
          </div>
        </div>
        <ul className="border-t border-linea pt-2">
          <li>
            <Link to={`/${profile.username}`} className={itemClasses}>
              Mi canal
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={itemClasses}>
              Estudio
            </Link>
          </li>
          <li>
            <Link to="/settings" className={itemClasses}>
              Ajustes
            </Link>
          </li>
          <li className="mt-2 border-t border-linea pt-2">
            <button type="button" onClick={signOut} className={itemClasses}>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
