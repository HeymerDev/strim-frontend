import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

type StatProps = {
  icon: LucideIcon;
  /** Lo que se ve: "124", "1:02:33". */
  value: string;
  /** Lo que se lee: "124 espectadores", "En vivo desde hace 1 hora y 2 minutos". */
  label: string;
  className?: string;
};

/** Ícono + número con nombre accesible completo (diseño §9.8). */
export function Stat({ icon: Icon, value, label, className }: StatProps) {
  return (
    <span title={label} className={cx('inline-flex items-center gap-1.5 text-sm text-texto-suave tabular-nums', className)}>
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
