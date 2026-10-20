import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Logo } from './components/Logo';

// Catálogo de componentes, solo en desarrollo: Vite quita esta rama del build.
const DevUiPage = import.meta.env.DEV ? lazy(() => import('./pages/DevUiPage')) : null;

// Página provisional hasta que exista el router (tarea 5).
const page =
  DevUiPage && location.pathname === '/dev/ui' ? (
    <Suspense>
      <DevUiPage />
    </Suspense>
  ) : (
    <main className="grid min-h-dvh place-items-center">
      <Logo size={40} />
    </main>
  );

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
