import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Field, TextAreaField } from '../../components/Field';
import { FormAlert } from '../../components/FormAlert';
import { toast } from '../../components/toast';
import { updateMe } from '../../lib/api';
import { applyApiError } from '../../lib/formErrors';
import { updateUser } from '../../lib/session';
import type { Me } from '../../lib/types';
import { bioSchema, displayNameSchema, usernameSchema } from '../../lib/validation';

const schema = z.object({ displayName: displayNameSchema, username: usernameSchema, bio: bioSchema });
type Values = z.infer<typeof schema>;
const FIELDS = ['displayName', 'username', 'bio'] as const;

/** Datos del perfil (RF-13.1, RF-13.4 a RF-13.7). Se envían solo los campos que cambiaron. */
export function ProfileForm({ user }: { user: Me }) {
  const { profile } = user;
  const [formError, setFormError] = useState<string | null>(null);
  const saved: Values = { displayName: profile.displayName, username: profile.username, bio: profile.bio };
  const { register, handleSubmit, setError, reset, control, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    values: saved, // Si el perfil cambia en otra pestaña, el formulario se pone al día.
    resetOptions: { keepDirtyValues: true },
  });
  const [username = '', bio = ''] = useWatch({ control, name: ['username', 'bio'] });
  const { errors, dirtyFields, isDirty } = formState;
  const live = user.channel.status !== 'offline';

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (me) => {
      updateUser(() => me); // RF-13.7: la barra superior se actualiza.
      reset({ displayName: me.profile.displayName, username: me.profile.username, bio: me.profile.bio });
      toast('Cambios guardados');
    },
    onError: (error) => setFormError(applyApiError(error, setError, FIELDS)),
  });

  // Se registran en el orden del formulario: el foco va al primer campo con error.
  const displayNameField = register('displayName');
  const usernameField = register('username');
  const bioField = register('bio');

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={handleSubmit((values) => {
        setFormError(null);
        const changes: Partial<Values> = {};
        for (const key of FIELDS) if (dirtyFields[key] && values[key] !== saved[key]) changes[key] = values[key];
        if (Object.keys(changes).length === 0) return;
        mutation.mutate(changes);
      })}
    >
      <Field label="Nombre visible" autoComplete="nickname" maxLength={30} error={errors.displayName?.message} {...displayNameField} />
      <Field
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={20}
        disabled={live}
        hint={live ? 'Finaliza el stream para cambiar tu username.' : `Tu canal: strim/${username || profile.username}`}
        error={errors.username?.message}
        {...usernameField}
        onChange={(event) => {
          event.target.value = event.target.value.toLowerCase();
          return usernameField.onChange(event);
        }}
      />
      <TextAreaField label="Bio" maxLength={200} rows={3} counter={`${bio.length} / 200`} error={errors.bio?.message} {...bioField} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-texto">Correo</span>
        <p className="text-base break-all text-texto">
          {user.email} <span className="text-sm text-texto-suave">(no se puede cambiar)</span>
        </p>
      </div>

      <FormAlert message={formError} />
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty} loading={mutation.isPending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
