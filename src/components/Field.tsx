import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';

type ShellProps = {
  label: string;
  /** Ayuda debajo del campo, por ejemplo "Será tu canal: strim/ana". */
  hint?: ReactNode;
  error?: string;
  /** Contador a la derecha, por ejemplo "54 / 200". */
  counter?: string;
  /** Algo a la derecha de la etiqueta, por ejemplo el enlace "¿La olvidaste?". */
  labelAction?: ReactNode;
  /** Contenido extra al final (las reglas de la contraseña). */
  below?: ReactNode;
  className?: string;
};

type ControlProps = { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string };

const controlClasses = cx(
  'w-full rounded-campo border border-linea bg-relieve px-4 text-base text-texto',
  'transition-[border-color] duration-150 hover:border-texto-tenue',
  'focus:border-senal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-senal/50',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-linea',
  'aria-invalid:border-error',
);

/** Etiqueta visible arriba, control, error y ayuda debajo, enlazados con aria-describedby (diseño §9.8). */
function FieldShell({
  label,
  hint,
  error,
  counter,
  labelAction,
  below,
  className,
  children,
}: ShellProps & { children: (control: ControlProps) => ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-texto">
          {label}
        </label>
        {labelAction}
      </div>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {(error || hint || counter) && (
        <div className="flex items-start justify-between gap-3 text-sm">
          <div className="flex flex-col gap-1">
            {error && (
              <p id={errorId} className="flex items-start gap-1.5 text-error">
                <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            {hint && (
              <p id={hintId} className="text-texto-suave">
                {hint}
              </p>
            )}
          </div>
          {counter && <span className="shrink-0 text-xs leading-5 text-texto-tenue tabular-nums">{counter}</span>}
        </div>
      )}
      {below}
    </div>
  );
}

type FieldProps = ShellProps &
  InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>;
    /** Algo dentro del campo, a la derecha, por ejemplo el botón de mostrar contraseña. */
    trailing?: ReactNode;
  };

export function Field({ label, hint, error, counter, labelAction, below, className, trailing, ...input }: FieldProps) {
  return (
    <FieldShell {...{ label, hint, error, counter, labelAction, below, className }}>
      {(control) => (
        <div className="relative">
          <input {...control} {...input} className={cx(controlClasses, 'h-11', trailing ? 'pr-12' : null)} />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-0.5">{trailing}</div>}
        </div>
      )}
    </FieldShell>
  );
}

type TextAreaFieldProps = ShellProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> };

export function TextAreaField({ label, hint, error, counter, labelAction, below, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldShell {...{ label, hint, error, counter, labelAction, below, className }}>
      {(control) => <textarea {...control} {...textarea} className={cx(controlClasses, 'min-h-24 resize-y py-2.5')} />}
    </FieldShell>
  );
}
