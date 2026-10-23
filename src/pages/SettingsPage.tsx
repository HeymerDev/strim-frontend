import { useId, useState } from 'react';
import { Button } from '../components/Button';
import { AvatarPicker } from '../features/settings/AvatarPicker';
import { ChangePasswordModal } from '../features/settings/ChangePasswordModal';
import { DeleteAccountModal } from '../features/settings/DeleteAccountModal';
import { ProfileForm } from '../features/settings/ProfileForm';
import { usePageTitle } from '../lib/navigation';
import { useSession } from '../lib/session';

/** Ajustes: perfil, contraseña y borrar la cuenta (RF-13 a RF-15, diseño §10.5). */
export default function SettingsPage() {
  usePageTitle('Ajustes');
  const { session } = useSession();
  const profileId = useId();
  const passwordId = useId();
  const deleteId = useId();
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Al borrar la cuenta la sesión desaparece mientras se sale de la página.
  if (!session) return null;
  const { user } = session;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-extrabold">Ajustes</h1>

      <section aria-labelledby={profileId} className="flex flex-col gap-6 rounded-panel border border-linea bg-panel p-5 sm:p-6">
        <h2 id={profileId} className="text-lg font-bold">
          Perfil
        </h2>
        <AvatarPicker user={user} />
        <ProfileForm user={user} />
      </section>

      <section
        aria-labelledby={passwordId}
        className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-linea bg-panel p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id={passwordId} className="text-lg font-bold">
            Contraseña
          </h2>
          <p className="text-base text-texto-suave">Cámbiala cuando quieras. Te pediremos la actual.</p>
        </div>
        <Button variant="secondary" onClick={() => setChangingPassword(true)}>
          Cambiar contraseña
        </Button>
      </section>

      {/* RF-15.1: separado del resto y con aspecto de acción destructiva. */}
      <section
        aria-labelledby={deleteId}
        className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-error/50 bg-panel p-5 sm:p-6"
      >
        <div className="flex max-w-[44ch] flex-col gap-1">
          <h2 id={deleteId} className="text-lg font-bold">
            Borrar cuenta
          </h2>
          <p className="text-base text-texto-suave">Se borran tu perfil, tu canal y tus mensajes. No se puede deshacer.</p>
        </div>
        <Button variant="danger" onClick={() => setDeleting(true)}>
          Borrar cuenta
        </Button>
      </section>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
      <DeleteAccountModal open={deleting} onClose={() => setDeleting(false)} />
    </div>
  );
}
