import { useParams } from 'react-router';
import { usePageTitle } from '../lib/navigation';

// Provisional: se construye en la tarea 10.
export default function ChannelPage() {
  const { username = '' } = useParams();
  usePageTitle(username);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">@{username}</h1>
    </div>
  );
}
