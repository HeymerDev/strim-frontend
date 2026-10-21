import { useState, type ComponentProps } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Field } from './Field';
import { IconButton } from './IconButton';
import { cx } from './cx';
import { passwordRules } from '../lib/validation';

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, 'type' | 'trailing' | 'below'> & {
  /** Muestra las reglas de la contraseña nueva, marcadas mientras se escribe (RF-03.2). */
  rules?: boolean;
};

export function PasswordField({ rules = false, onChange, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');

  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      onChange={(event) => {
        setValue(event.target.value);
        onChange?.(event);
      }}
      trailing={
        <IconButton
          label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          icon={visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          onClick={() => setVisible((v) => !v)}
        />
      }
      below={
        rules && (
          <ul className="flex flex-col gap-1 text-sm" aria-label="Requisitos de la contraseña">
            {passwordRules.map((rule) => {
              const ok = rule.test(value);
              return (
                <li key={rule.text} className={cx('flex items-center gap-2', ok ? 'text-texto' : 'text-texto-suave')}>
                  {ok ? (
                    <Check size={14} strokeWidth={3} aria-hidden="true" className="text-senal" />
                  ) : (
                    <span aria-hidden="true" className="mx-[3px] size-2 rounded-full border border-texto-tenue" />
                  )}
                  {rule.text}
                  <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
                </li>
              );
            })}
          </ul>
        )
      }
    />
  );
}
