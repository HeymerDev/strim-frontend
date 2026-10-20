import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { cx } from './cx';

type EmptyStateProps = {
  title: string;
  text?: ReactNode;
  action?: ReactNode;
  /** Nivel del título: h1 en páginas completas (no encontrada), h2 dentro de una página. */
  as?: 'h1' | 'h2';
  className?: string;
};

/** Símbolo en contorno, título, texto y una acción (diseño §9.8). */
export function EmptyState({ title, text, action, as: Heading = 'h2', className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10', className)}>
      <span className="hidden sm:block">
        <Logo size={120} variant="contorno" wordmark={false} />
      </span>
      <span className="sm:hidden">
        <Logo size={72} variant="contorno" wordmark={false} />
      </span>
      <div className="flex max-w-[44ch] flex-col items-start gap-3">
        <Heading className="text-2xl font-extrabold">{title}</Heading>
        {text && <p className="text-base text-texto-suave">{text}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
