import { cx } from './cx';

/** Bloque de carga que reserva el tamaño final (RF-07.4). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-campo bg-relieve', className)} />;
}
