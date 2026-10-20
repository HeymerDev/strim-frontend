import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  /** Nombre accesible obligatorio: el botón solo muestra un ícono. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'primary';
  size?: 'md' | 'sm';
};

const variants = {
  ghost: 'text-texto-suave hover:bg-relieve hover:text-texto',
  secondary: 'border border-linea bg-relieve text-texto hover:border-texto-tenue',
  primary: 'bg-senal text-noche hover:bg-senal-fuerte',
};

export function IconButton({ label, icon, variant = 'ghost', size = 'md', type = 'button', className, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'size-11' : 'size-9',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
