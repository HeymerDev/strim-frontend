import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'al-aire';
export type ButtonSize = 'md' | 'sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-senal text-noche hover:bg-senal-fuerte',
  secondary: 'border border-linea bg-relieve text-texto hover:border-texto-tenue',
  ghost: 'text-texto hover:bg-relieve',
  danger: 'bg-peligro text-blanco hover:brightness-110',
  'al-aire': 'bg-al-aire text-blanco hover:brightness-125',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-base gap-2',
  sm: 'h-9 px-4 text-sm gap-1.5',
};

/** Clases de botón (diseño §9.8). También sirven para enlaces con forma de botón. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cx(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap select-none',
    'transition-[background-color,border-color,filter] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}
