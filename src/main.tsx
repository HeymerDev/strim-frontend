import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Logo } from './components/Logo';

// Página provisional hasta que exista el router (tarea 5).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="grid min-h-dvh place-items-center">
      <Logo size={40} />
    </main>
  </StrictMode>,
);
