import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en una tarea posterior.
export default function LoginPage() {
  usePageTitle('Inicia sesión');
  return <h1 className="text-2xl font-extrabold">Inicia sesión</h1>;
}
