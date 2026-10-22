import { useEffect, useId, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, CircleAlert } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { Spinner } from '../../components/Spinner';
import { buttonClasses } from '../../components/buttonStyles';
import { cx } from '../../components/cx';
import { toast } from '../../components/toast';
import { ApiError, uploadAvatar } from '../../lib/api';
import { updateUser } from '../../lib/session';
import type { Me } from '../../lib/types';
import { avatarFileSchema } from '../../lib/validation';

/**
 * Foto de perfil (RF-13.2 y RF-13.3): se comprueba en el navegador, se muestra la vista previa y se
 * sube al elegirla, sin esperar a "Guardar cambios".
 */
export function AvatarPicker({ user }: { user: Me }) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { profile } = user;

  // La URL temporal de la vista previa se libera al cambiarla o al salir.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (me) => {
      updateUser(() => me); // La barra y el menú muestran la foto nueva (RF-13.7).
      setPreview(null);
      toast('Foto actualizada');
    },
    onError: (err) => {
      setPreview(null);
      setError(err instanceof ApiError ? err.message : 'Algo salió mal.');
    },
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const check = avatarFileSchema.safeParse(file);
    if (!check.success) {
      setError(check.error.issues[0].message); // RF-13.2: se explica sin enviarla.
      return;
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <Avatar src={preview ?? profile.avatarUrl} name={profile.displayName} username={profile.username} size={120} alt="Tu foto de perfil" />
        {upload.isPending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-noche/60 text-senal">
            <Spinner size={28} label="Subiendo la foto" />
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-describedby={hintId}
          disabled={upload.isPending}
          onChange={(event) => {
            onPick(event.target.files?.[0]);
            event.target.value = ''; // Permite elegir el mismo archivo otra vez.
          }}
        />
        <label
          htmlFor={inputId}
          className={cx(
            buttonClasses('secondary', 'sm'),
            'cursor-pointer',
            // El input real está oculto: su foco se dibuja en la etiqueta que va justo después.
            'outline-senal [:focus-visible+&]:outline-2 [:focus-visible+&]:outline-offset-2',
            upload.isPending && 'pointer-events-none opacity-50',
          )}
        >
          <Camera size={16} aria-hidden="true" />
          Cambiar foto
        </label>
        <p id={hintId} className="text-sm text-texto-suave">
          JPG, PNG o WebP de hasta 2 MB.
        </p>
        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-error">
            <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
