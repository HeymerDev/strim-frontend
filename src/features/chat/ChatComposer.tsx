import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { CircleAlert, Send } from 'lucide-react';
import { IconButton } from '../../components/IconButton';
import { buttonClasses } from '../../components/buttonStyles';
import { cx } from '../../components/cx';
import { loginPath } from '../../lib/navigation';
import type { SendResult } from './useChatRoom';

const MAX_LENGTH = 300; // RF-11.2
const SHOW_COUNTER_FROM = 260;
const ERROR_MS = 3000;

type ChatComposerProps = {
  username: string;
  signedIn: boolean;
  /** Mientras la sala no está lista no se puede enviar. */
  ready: boolean;
  send: (content: string) => Promise<SendResult>;
};

/** Campo para escribir en el chat (RF-11, diseño §10.3). */
export function ChatComposer({ username, signedIn, ready, send }: ChatComposerProps) {
  const inputId = useId();
  const errorId = useId();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<number>(undefined);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(errorTimer.current), []);

  // RF-11.1: sin sesión, en lugar del campo, el botón para iniciar sesión.
  if (!signedIn) {
    return (
      <div className="border-t border-linea p-3">
        <Link to={loginPath(`/${username}`)} className={cx(buttonClasses('secondary'), 'w-full')}>
          Inicia sesión para comentar
        </Link>
      </div>
    );
  }

  const trimmed = text.trim();
  const remaining = MAX_LENGTH - text.length;
  const canSend = ready && !sending && trimmed.length > 0;

  const showError = (message: string) => {
    setError(message);
    window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), ERROR_MS);
  };

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    const result = await send(trimmed);
    setSending(false);
    input.current?.focus(); // El botón se deshabilita mientras envía: el foco vuelve al campo.
    if (result.ok) {
      setText(''); // RF-11.4
      setError(null);
    } else {
      // RF-11.5: el texto se conserva para reintentar.
      showError(result.code === 'RATE_LIMITED' ? 'Vas muy rápido.' : result.message);
    }
  };

  return (
    <form
      className="border-t border-linea p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Mensaje para el chat
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={input}
          id={inputId}
          value={text}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          placeholder="Escribe un mensaje"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setText(event.target.value)}
          className={cx(
            'h-11 min-w-0 flex-1 rounded-campo border border-linea bg-relieve px-4 text-base text-texto',
            'transition-[border-color] duration-150 hover:border-texto-tenue focus:border-senal',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-senal/50 aria-invalid:border-error',
          )}
        />
        <IconButton type="submit" label="Enviar mensaje" variant="primary" disabled={!canSend} icon={<Send size={18} aria-hidden="true" />} />
      </div>
      <div className="mt-1.5 flex min-h-5 items-center justify-between gap-3 text-sm">
        {error ? (
          <p id={errorId} role="alert" className="flex items-center gap-1.5 text-error">
            <CircleAlert size={14} aria-hidden="true" />
            {error}
          </p>
        ) : (
          <span />
        )}
        {text.length >= SHOW_COUNTER_FROM && (
          <span className={cx('text-xs tabular-nums', remaining <= 10 ? 'text-error' : 'text-texto-tenue')} aria-live="polite">
            {remaining} {remaining === 1 ? 'carácter' : 'caracteres'}
          </span>
        )}
      </div>
    </form>
  );
}
