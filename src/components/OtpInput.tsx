import { useId, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';

type OtpInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Se llama al completar los 6 dígitos (RF-04.2). */
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
};

const LENGTH = 6;

/**
 * Un solo <input> dibujado como 6 casillas (diseño §9.8): así funcionan pegar el código,
 * el autocompletado del sistema y los lectores de pantalla.
 */
export function OtpInput({ label = 'Código', value, onChange, onComplete, error, disabled, autoFocus, name }: OtpInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const active = Math.min(value.length, LENGTH - 1);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-texto">
        {label}
      </label>
      <div className="relative">
        <div aria-hidden="true" className="grid grid-cols-6 gap-2">
          {Array.from({ length: LENGTH }, (_, i) => (
            <div
              key={i}
              className={cx(
                'flex aspect-[5/6] max-h-16 items-center justify-center rounded-campo border bg-relieve font-display text-2xl font-bold tabular-nums transition-[border-color] duration-150',
                error ? 'border-error' : 'border-linea',
                focused && i === active && 'border-senal outline-2 outline-offset-1 outline-senal/50',
                disabled && 'opacity-60',
              )}
            >
              {value[i] ?? ''}
            </div>
          ))}
        </div>
        <input
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={LENGTH}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, LENGTH);
            onChange(digits);
            if (digits.length === LENGTH) onComplete?.(digits);
          }}
          onSelect={(event) => {
            const input = event.currentTarget;
            input.setSelectionRange(input.value.length, input.value.length);
          }}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-error">
          <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
