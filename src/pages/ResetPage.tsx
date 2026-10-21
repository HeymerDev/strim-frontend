import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en una tarea posterior.
export default function ResetPage() {
  usePageTitle('Recupera tu contraseña');
  return <h1 className="text-2xl font-extrabold">Recupera tu contraseña</h1>;
}
