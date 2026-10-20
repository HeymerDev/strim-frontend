import { StatusNode } from './StatusNode';
import { cx } from './cx';

/** Cápsula "En vivo" con el nodo del logo (diseño §9.6). */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1.5 rounded-full bg-al-aire pr-2.5 pl-1.5 text-xs font-bold text-blanco',
        className,
      )}
    >
      <StatusNode status="live" size={12} />
      En vivo
    </span>
  );
}
