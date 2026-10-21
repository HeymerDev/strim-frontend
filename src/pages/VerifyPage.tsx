import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { FormAlert } from '../components/FormAlert';
import { OtpInput } from '../components/OtpInput';
import { toast } from '../components/toast';
import { ApiError, resendOtp, verifyEmail } from '../lib/api';
import { safeNext, usePageTitle } from '../lib/navigation';
import { clearPendingEmail, getPendingEmail } from '../lib/pendingEmail';
import { startSession } from '../lib/session';
import { formatCountdown, useCooldown } from '../lib/useCooldown';

type VerifyState = { email?: string; notice?: string } | null;

/** Verificar el correo con el código de 6 dígitos (RF-04, diseño §10.6). */
export default function VerifyPage() {
  usePageTitle('Revisa tu correo');
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = location.state as VerifyState;
  const email = state?.email ?? getPendingEmail();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const remaining = useCooldown();

  const verify = useMutation({
    mutationFn: (code: string) => verifyEmail({ email: email!, otp: code }),
    onSuccess: (auth) => {
      clearPendingEmail();
      startSession(auth);
      navigate(safeNext(params.get('next')), { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INVALID_OTP') {
        setOtpError(error.message);
        setOtp(''); // RF-04.3: vaciar para escribir de nuevo.
      } else {
        setFormError(error instanceof ApiError ? error.message : 'Algo salió mal.');
      }
    },
  });

  const resend = useMutation({
    mutationFn: () => resendOtp(email!),
    onSuccess: () => {
      remaining.restart();
      toast('Te enviamos un código nuevo.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') {
          remaining.restart();
      }
      setFormError(error instanceof ApiError ? error.message : 'Algo salió mal.');
    },
  });

  if (!email) return <Navigate to="/login" replace />; // RF-04.5

  const submit = (code: string) => {
    if (verify.isPending) return;
    setFormError(null);
    setOtpError(undefined);
    verify.mutate(code);
  };

  return (
    <div className="rounded-panel border border-linea bg-panel p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Revisa tu correo</h1>
      <p className="mt-3 text-base text-texto-suave">
        {state?.notice && <span className="mb-2 block text-texto">{state.notice}</span>}
        Enviamos un código de 6 dígitos a <strong className="font-semibold break-all text-texto">{email}</strong>.
      </p>

      <form
        noValidate
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (otp.length === 6) submit(otp);
          else setOtpError('Escribe los 6 dígitos del código.');
        }}
      >
        <OtpInput
          autoFocus
          value={otp}
          onChange={(value) => {
            setOtp(value);
            setOtpError(undefined);
          }}
          onComplete={submit}
          error={otpError}
          disabled={verify.isPending}
        />
        <FormAlert message={formError} />
        <Button type="submit" loading={verify.isPending} className="w-full">
          Verificar
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-4"
          disabled={remaining.seconds > 0}
          loading={resend.isPending}
          onClick={() => {
            setFormError(null);
            resend.mutate();
          }}
        >
          {remaining.seconds > 0 ? (
            <span className="tabular-nums">Reenviar en {formatCountdown(remaining.seconds)}</span>
          ) : (
            'Reenviar código'
          )}
        </Button>
        <Link
          to={{ pathname: '/register', search: location.search }}
          onClick={clearPendingEmail}
          className="text-sm font-semibold text-senal underline-offset-4 hover:underline"
        >
          Usar otro correo
        </Link>
      </div>
    </div>
  );
}
