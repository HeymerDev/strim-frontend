import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en una tarea posterior.
export default function HomePage() {
  usePageTitle(null);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">En vivo ahora</h1>
    </div>
  );
}
