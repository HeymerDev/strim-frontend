import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { FormAlert } from '../../components/FormAlert';
import { Modal } from '../../components/Modal';
import { PasswordField } from '../../components/PasswordField';
import { toast } from '../../components/toast';
import { ApiError, deleteAccount } from '../../lib/api';
import { applyApiError } from '../../lib/formErrors';
import { clearPrivateQueries } from '../../lib/queries';
import { clearSession } from '../../lib/session';
import { currentPasswordSchema } from '../../lib/validation';
import { WAIT_MESSAGE } from './ChangePasswordModal';

const schema = z.object({ password: currentPasswordSchema });
type Values = z.infer<typeof schema>;

/** Borrar la cuenta con la contraseña (RF-15). No se puede deshacer. */
export function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });

  const close = () => {
    reset();
    setFormError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: ({ password }: Values) => deleteAccount(password),
    onSuccess: () => {
      // RF-15.4: sin sesión, al inicio y con el aviso. RequireAuth lleva a / porque la terminó el usuario.
      onClose();
      clearSession(true);
      clearPrivateQueries();
      toast('Tu cuenta se borró');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') setFormError(WAIT_MESSAGE);
      else setFormError(applyApiError(error, setError, ['password'], { currentPassword: 'password' }));
    },
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="¿Borrar tu cuenta?"
      description={
        <>
          Se borran tu perfil, tu canal y todos tus mensajes del chat. <strong className="font-semibold text-texto">No se puede deshacer.</strong>
        </>
      }
      actions={
        <>
          <Button variant="ghost" data-autofocus onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={mutation.isPending}>
            Borrar mi cuenta
          </Button>
        </>
      }
    >
      {open && (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => {
            setFormError(null);
            mutation.mutate(values);
          })}
        >
          <PasswordField
            label="Contraseña"
            hint="Escríbela para confirmar."
            autoComplete="current-password"
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <FormAlert message={formError} />
        </form>
      )}
    </Modal>
  );
}
