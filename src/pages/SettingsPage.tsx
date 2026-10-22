import { useId } from 'react';
import { AvatarPicker } from '../features/settings/AvatarPicker';
import { ProfileForm } from '../features/settings/ProfileForm';
import { usePageTitle } from '../lib/navigation';
import { useSession } from '../lib/session';

/** Ajustes (RF-13 a RF-15, diseño §10.5). La contraseña y borrar la cuenta llegan en la tarea 15. */
export default function SettingsPage() {
  usePageTitle('Ajustes');
  const { session } = useSession();
  const user = session!.user; // RequireAuth garantiza la sesión.
  const profileId = useId();

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
    </div>
  );
}
