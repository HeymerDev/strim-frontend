import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { Spinner } from './Spinner';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícono a la izquierda del texto. */
  icon?: ReactNode;
  /** Muestra el spinner, conserva el texto y bloquea más clics (RF-16.3). */
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      // Cargando no es lo mismo que deshabilitado: se ve con su color, solo bloquea clics.
      className={buttonClasses(variant, size, loading ? `cursor-progress! opacity-100! ${className ?? ''}` : className)}
      {...rest}
    >
      {loading ? <Spinner size={size === 'md' ? 18 : 16} /> : icon}
      {children}
    </button>
  );
}
