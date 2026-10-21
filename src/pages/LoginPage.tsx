import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { z } from 'zod';
import { AuthTabs } from '../components/AuthTabs';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { FormAlert } from '../components/FormAlert';
import { PasswordField } from '../components/PasswordField';
import { ApiError, login, resendOtp } from '../lib/api';
import { applyApiError } from '../lib/formErrors';
import { safeNext, usePageTitle } from '../lib/navigation';
import { setPendingEmail } from '../lib/pendingEmail';
import { startSession } from '../lib/session';
import { currentPasswordSchema, emailSchema } from '../lib/validation';

const schema = z.object({ email: emailSchema, password: currentPasswordSchema });
type Values = z.infer<typeof schema>;

/** Lo que pueden pasar otras páginas: el correo ya escrito y un aviso (RF-06.4). */
type LoginState = { email?: string; notice?: string } | null;

/** Iniciar sesión (RF-05, diseño §10.6). */
export default function LoginPage() {
  usePageTitle('Inicia sesión');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const state = location.state as LoginState;
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: state?.email ?? '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (auth) => {
      startSession(auth);
      navigate(safeNext(params.get('next')), { replace: true });
    },
    onError: async (error) => {
      // RF-05.4: correo sin verificar → código nuevo y a /verify.
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        const email = getValues('email').trim().toLowerCase();
        try {
          await resendOtp(email);
        } catch {
          // Si se pidió hace menos de 60 s, el código anterior sigue sirviendo.
        }
        setPendingEmail(email);
        navigate(
          { pathname: '/verify', search: location.search },
          { state: { email, notice: 'Tu correo aún no está verificado. Te enviamos un código nuevo.' } },
        );
        return;
      }
      // RF-05.3: credenciales incorrectas → error general, sin marcar un campo.
      setFormError(applyApiError(error, setError, ['email', 'password']));
    },
  });

  const { errors } = formState;

  return (
    <div className="rounded-panel border border-linea bg-panel p-6 sm:p-8">
      <AuthTabs />
      <h1 className="mb-6 text-2xl font-extrabold">Inicia sesión</h1>
      {state?.notice && (
        <p role="status" className="mb-5 flex items-start gap-2 rounded-campo border border-senal/40 bg-senal/10 px-4 py-3 text-sm text-texto">
          <CircleCheck size={18} aria-hidden="true" className="mt-px shrink-0 text-senal" />
          {state.notice}
        </p>
      )}
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus={!state?.email}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          autoFocus={Boolean(state?.email)}
          error={errors.password?.message}
          labelAction={
            <Link
              to={{ pathname: '/reset', search: location.search }}
              className="text-sm font-semibold text-senal underline-offset-4 hover:underline"
            >
              ¿La olvidaste?
            </Link>
          }
          {...register('password')}
        />
        <FormAlert message={formError} />
        <Button type="submit" loading={mutation.isPending} className="mt-1 w-full">
          Iniciar sesión
        </Button>
      </form>
    </div>
  );
}
