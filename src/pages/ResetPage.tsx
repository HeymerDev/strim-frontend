import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { z } from 'zod';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { FormAlert } from '../components/FormAlert';
import { OtpInput } from '../components/OtpInput';
import { PasswordField } from '../components/PasswordField';
import { toast } from '../components/toast';
import { ApiError, forgotPassword, resetPassword } from '../lib/api';
import { applyApiError } from '../lib/formErrors';
import { usePageTitle } from '../lib/navigation';
import { formatCountdown, useCooldown } from '../lib/useCooldown';
import { emailSchema, passwordSchema } from '../lib/validation';

const SENT_NOTICE = 'Si existe una cuenta con ese correo, te enviamos un código.';

/** Recuperar la contraseña en dos pasos (RF-06, diseño §10.6). El paso vive en el estado de la página. */
export default function ResetPage() {
  usePageTitle('Recupera tu contraseña');
  const [email, setEmail] = useState<string | null>(null);
  const cooldown = useCooldown();

  return (
    <div className="rounded-panel border border-linea bg-panel p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Recupera tu contraseña</h1>
      {email ? (
        <CodeStep email={email} cooldown={cooldown} onChangeEmail={() => setEmail(null)} />
      ) : (
        <EmailStep
          onSent={(sentTo) => {
            cooldown.restart();
            setEmail(sentTo);
          }}
        />
      )}
    </div>
  );
}

const emailForm = z.object({ email: emailSchema });

/** Paso 1: el correo (RF-06.1). La respuesta es la misma exista o no la cuenta. */
function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof emailForm>>({
    resolver: zodResolver(emailForm),
    defaultValues: { email: '' },
  });
  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email).then(() => email),
    onSuccess: onSent,
    onError: (error) => setFormError(error instanceof ApiError ? error.message : 'Algo salió mal.'),
  });

  return (
    <>
      <p className="mt-3 text-base text-texto-suave">Escribe el correo de tu cuenta y te enviaremos un código para crear una contraseña nueva.</p>
      <form
        noValidate
        className="mt-6 flex flex-col gap-5"
        onSubmit={handleSubmit(({ email }) => {
          setFormError(null);
          mutation.mutate(email);
        })}
      >
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <FormAlert message={formError} />
        <Button type="submit" loading={mutation.isPending} className="w-full">
          Enviar código
        </Button>
      </form>
    </>
  );
}

const codeForm = z.object({ newPassword: passwordSchema });

/** Paso 2: el código y la contraseña nueva (RF-06.2 a RF-06.5). */
function CodeStep({
  email,
  cooldown,
  onChangeEmail,
}: {
  email: string;
  cooldown: ReturnType<typeof useCooldown>;
  onChangeEmail: () => void;
}) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<z.infer<typeof codeForm>>({
    resolver: zodResolver(codeForm),
    defaultValues: { newPassword: '' },
  });

  const reset = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      // RF-06.4: a /login con el correo escrito y el aviso.
      navigate({ pathname: '/login', search }, { replace: true, state: { email, notice: 'Contraseña actualizada. Inicia sesión.' } });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INVALID_OTP') {
        setOtpError(error.message);
        setOtp('');
        return;
      }
      setFormError(applyApiError(error, setError, ['newPassword']));
    },
  });

  const resend = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      cooldown.restart();
      toast('Te enviamos un código nuevo.');
    },
    onError: (error) => setFormError(error instanceof ApiError ? error.message : 'Algo salió mal.'),
  });

  return (
    <>
      <p role="status" className="mt-4 flex items-start gap-2 rounded-campo border border-senal/40 bg-senal/10 px-4 py-3 text-sm text-texto">
        <CircleCheck size={18} aria-hidden="true" className="mt-px shrink-0 text-senal" />
        <span>
          {SENT_NOTICE} Revisa <strong className="font-semibold break-all">{email}</strong>.
        </span>
      </p>
      <form
        noValidate
        className="mt-6 flex flex-col gap-5"
        onSubmit={handleSubmit(({ newPassword }) => {
          setFormError(null);
          if (otp.length !== 6) {
            setOtpError('Escribe los 6 dígitos del código.');
            return;
          }
          reset.mutate({ email, otp, newPassword });
        })}
      >
        <OtpInput
          autoFocus
          value={otp}
          onChange={(value) => {
            setOtp(value);
            setOtpError(undefined);
          }}
          error={otpError}
          disabled={reset.isPending}
        />
        <PasswordField
          label="Contraseña nueva"
          autoComplete="new-password"
          rules
          error={formState.errors.newPassword?.message}
          {...register('newPassword')}
        />
        <FormAlert message={formError} />
        <Button type="submit" loading={reset.isPending} className="w-full">
          Cambiar contraseña
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-4"
          disabled={cooldown.seconds > 0}
          loading={resend.isPending}
          onClick={() => {
            setFormError(null);
            resend.mutate();
          }}
        >
          {cooldown.seconds > 0 ? <span className="tabular-nums">Reenviar en {formatCountdown(cooldown.seconds)}</span> : 'Reenviar código'}
        </Button>
        <button type="button" onClick={onChangeEmail} className="text-sm font-semibold text-senal underline-offset-4 hover:underline">
          Usar otro correo
        </button>
      </div>
    </>
  );
}
