import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { AuthTabs } from '../components/AuthTabs';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { FormAlert } from '../components/FormAlert';
import { PasswordField } from '../components/PasswordField';
import { register as registerAccount } from '../lib/api';
import { applyApiError } from '../lib/formErrors';
import { usePageTitle } from '../lib/navigation';
import { setPendingEmail } from '../lib/pendingEmail';
import { emailSchema, passwordSchema, usernameSchema } from '../lib/validation';

const schema = z.object({ email: emailSchema, username: usernameSchema, password: passwordSchema });
type Values = z.infer<typeof schema>;
const FIELDS = ['email', 'username', 'password'] as const;

/** Crear cuenta (RF-03, diseño §10.6). */
export default function RegisterPage() {
  usePageTitle('Crea tu cuenta');
  const navigate = useNavigate();
  const { search } = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, control, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: ({ email }) => {
      setPendingEmail(email);
      navigate({ pathname: '/verify', search }, { state: { email } });
    },
    onError: (error) => setFormError(applyApiError(error, setError, FIELDS)),
  });

  const username = useWatch({ control, name: 'username' });
  // Se registran en el orden del formulario: el foco va al primer campo con error.
  const emailField = register('email');
  const usernameField = register('username');
  const passwordField = register('password');
  const { errors } = formState;

  return (
    <div className="rounded-panel border border-linea bg-panel p-6 sm:p-8">
      <AuthTabs />
      <h1 className="mb-6 text-2xl font-extrabold">Crea tu cuenta</h1>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
      >
        <Field label="Correo" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...emailField} />
        <Field
          label="Nombre de usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          hint={`Será tu canal: strim/${username || 'tu-usuario'}`}
          error={errors.username?.message}
          {...usernameField}
          onChange={(event) => {
            // RF-03.2: se convierte a minúsculas mientras se escribe.
            event.target.value = event.target.value.toLowerCase();
            return usernameField.onChange(event);
          }}
        />
        <PasswordField label="Contraseña" autoComplete="new-password" rules error={errors.password?.message} {...passwordField} />
        <FormAlert message={formError} />
        <Button type="submit" loading={mutation.isPending} className="mt-1 w-full">
          Crear cuenta
        </Button>
      </form>
    </div>
  );
}
