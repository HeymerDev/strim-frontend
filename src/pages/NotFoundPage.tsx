import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { buttonClasses } from '../components/buttonStyles';
import { usePageTitle } from '../lib/navigation';

/** Rutas desconocidas y canales inexistentes (RF-16.5, diseño §10.7). */
export default function NotFoundPage({ channel = false }: { channel?: boolean }) {
  const title = channel ? 'Este canal no existe' : 'Esta página no existe';
  usePageTitle(title);
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <EmptyState
        as="h1"
        title={title}
        text={channel ? 'Revisa el nombre del canal o vuelve al inicio para ver quién está en vivo.' : 'Revisa la dirección o vuelve al inicio.'}
        action={
          <Link to="/" className={buttonClasses('primary')}>
            Ir al inicio
          </Link>
        }
      />
    </div>
  );
}
