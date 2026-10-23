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
import { ApiError, changePassword } from '../../lib/api';
import { applyApiError } from '../../lib/formErrors';
import { currentPasswordSchema, passwordSchema } from '../../lib/validation';

const schema = z.object({ currentPassword: currentPasswordSchema, newPassword: passwordSchema });
type Values = z.infer<typeof schema>;

/** RF-14.4: el límite de intentos se explica con más detalle que el mensaje general. */
export const WAIT_MESSAGE = 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';

/** Cambiar la contraseña confirmando la actual (RF-14). La sesión sigue abierta. */
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const close = () => {
    reset();
    setFormError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      close();
      toast('Contraseña actualizada'); // RF-14.5
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') setFormError(WAIT_MESSAGE);
      else setFormError(applyApiError(error, setError, ['currentPassword', 'newPassword']));
    },
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Cambiar contraseña"
      actions={
        <>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            Cambiar contraseña
          </Button>
        </>
      }
    >
      {/* Se monta solo abierto: así las reglas de la contraseña empiezan de cero cada vez. */}
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
          label="Contraseña actual"
          autoComplete="current-password"
          data-autofocus
          error={formState.errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          label="Contraseña nueva"
          autoComplete="new-password"
          rules
          error={formState.errors.newPassword?.message}
          {...register('newPassword')}
        />
        <FormAlert message={formError} />
      </form>
      )}
    </Modal>
  );
}
