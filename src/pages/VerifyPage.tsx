import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en una tarea posterior.
export default function VerifyPage() {
  usePageTitle('Revisa tu correo');
  return <h1 className="text-2xl font-extrabold">Revisa tu correo</h1>;
}
