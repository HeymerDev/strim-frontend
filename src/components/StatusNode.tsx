import { cx } from './cx';

export type ChannelStatus = 'offline' | 'waiting' | 'live';

type StatusNodeProps = {
  status: ChannelStatus;
  size?: 12 | 24 | 72;
  className?: string;
};

/**
 * El cuarto nodo del logo dibuja el estado del canal (diseño §9.6):
 * anillo hueco (desconectado), anillos que se cierran (esperando señal) o nodo lleno con anillos (en vivo).
 * Es decorativo: el estado siempre va también en texto.
 */
export function StatusNode({ status, size = 24, className }: StatusNodeProps) {
  // Grosor mínimo visible: ~1,5 px reales a cualquier tamaño.
  const stroke = Math.max(1.6, (1.5 * 40) / size);
  const small = size <= 12;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cx('shrink-0 overflow-visible', className)}
      fill="none"
    >
      {status === 'offline' && <circle cx="20" cy="20" r={20 - stroke} strokeWidth={stroke} className="stroke-texto-suave" />}

      {status === 'waiting' && (
        <g className="stroke-senal" strokeWidth={stroke}>
          <circle cx="20" cy="20" r={20 - stroke / 2} className="opacity-35" />
          {!small && [0, 1, 2].map((i) => <circle key={i} cx="20" cy="20" r={18 - stroke / 2} className={`nodo-entrante nodo-entrante-${i}`} />)}
          <circle cx="20" cy="20" r={small ? 7 : 4} className="fill-senal stroke-none" />
        </g>
      )}

      {status === 'live' && (
        <g className="stroke-senal" strokeWidth={stroke}>
          <circle cx="20" cy="20" r={small ? 9 : 8} className="fill-senal stroke-none" />
          {small ? (
            <circle cx="20" cy="20" r={20 - stroke / 2} />
          ) : (
            <>
              <circle cx="20" cy="20" r="13" />
              <circle cx="20" cy="20" r={20 - stroke / 2} />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
