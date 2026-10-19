type LogoProps = {
  /** Alto del símbolo en px: 28 en la barra, 40 en las páginas de cuenta, 120 en estados vacíos. */
  size?: number;
  /** `contorno` dibuja el símbolo apagado, para estados vacíos. */
  variant?: 'color' | 'contorno';
  /** Muestra la palabra "strim" junto al símbolo. */
  wordmark?: boolean;
  className?: string;
};

/**
 * Logo de strim (diseño §9.7, D1): el símbolo de cuatro nodos redibujado en SVG y la palabra
 * escrita con Bricolage Grotesque. El SVG es decorativo; el nombre lo da la palabra visible
 * o el enlace que lo envuelve.
 */
export function Logo({ size = 28, variant = 'color', wordmark = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] ${className}`} style={{ fontSize: size }}>
      <LogoMark size={size} variant={variant} />
      {wordmark && (
        <span className="font-display leading-none font-extrabold tracking-[-0.035em] text-teal" style={{ fontSize: size * 1.05 }}>
          strim
        </span>
      )}
    </span>
  );
}

function LogoMark({ size, variant }: { size: number; variant: 'color' | 'contorno' }) {
  if (variant === 'contorno') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0 fill-none stroke-linea">
        <g strokeWidth={size >= 80 ? 0.6 : 1.2}>
          <circle cx="10" cy="10" r="9.4" />
          <circle cx="30" cy="10" r="9.4" />
          <circle cx="10" cy="30" r="9.4" />
          <circle cx="30" cy="30" r="9.4" />
          <circle cx="30" cy="30" r="6.4" />
          <circle cx="30" cy="30" r="3.4" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <circle cx="10" cy="10" r="10" className="fill-logo-cian" />
      <circle cx="30" cy="10" r="10" className="fill-logo-indigo" />
      <circle cx="10" cy="30" r="10" className="fill-logo-cian" />
      <circle cx="30" cy="30" r="10" className="fill-logo-onda" />
      <g className="fill-none stroke-logo-cian" strokeWidth={1.2}>
        <circle cx="30" cy="30" r="9.4" />
        <circle cx="30" cy="30" r="6.4" />
        <circle cx="30" cy="30" r="3.4" />
      </g>
    </svg>
  );
}
