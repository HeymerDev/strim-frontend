import { CircleAlert } from 'lucide-react';

/** Error general del formulario, arriba del botón (diseño §5.4). */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-campo border border-error/40 bg-error/10 px-4 py-3 text-sm text-texto">
      <CircleAlert size={18} aria-hidden="true" className="mt-px shrink-0 text-error" />
      {message}
    </p>
  );
}
