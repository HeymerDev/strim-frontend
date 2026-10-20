import { useState } from 'react';
import { initials, toneOf } from '../lib/format';
import { cx } from './cx';

type AvatarProps = {
  src: string | null;
  /** Nombre visible: de aquí salen las iniciales. */
  name: string;
  /** Username: fija el tono de las iniciales. */
  username: string;
  size?: 24 | 32 | 40 | 64 | 96 | 120;
  /** Anillo `senal` de en vivo, como el nodo del logo (diseño §9.6). */
  live?: boolean;
  /** Texto alternativo. Vacío cuando el nombre ya se lee al lado. */
  alt?: string;
  className?: string;
};

/** Imagen redonda o iniciales sobre el tono del username (RF-13.3). */
export function Avatar({ src, name, username, size = 40, live = false, alt = '', className }: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const tone = toneOf(username);
  const showImage = src && failed !== src;

  return (
    <span
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        live && 'outline-2 outline-offset-2 outline-senal',
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: `color-mix(in oklab, var(--color-nombre-${tone}) 22%, var(--color-relieve))`,
        color: `var(--color-nombre-${tone})`,
      }}
    >
      {showImage ? (
        <img src={src} alt={alt} width={size} height={size} className="size-full object-cover" onError={() => setFailed(src)} />
      ) : (
        <span aria-hidden={alt ? undefined : true} className="font-semibold select-none" style={{ fontSize: Math.max(10, size * 0.38) }}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
