import { cx } from './cx';

type SpinnerProps = {
  size?: number;
  /** Si se pasa, el spinner se anuncia como estado ("Cargando canales"). Si no, es decorativo. */
  label?: string;
  className?: string;
};

export function Spinner({ size = 18, label, className }: SpinnerProps) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={cx('animate-spin', className)}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  if (!label) return svg;
  return (
    <span role="status" className="inline-flex">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
}
