import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en una tarea posterior.
export default function RegisterPage() {
  usePageTitle('Crea tu cuenta');
  return <h1 className="text-2xl font-extrabold">Crea tu cuenta</h1>;
}
