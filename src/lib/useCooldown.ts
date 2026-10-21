// Espera entre envíos de código (RF-04.4 y RF-06.5): 60 s desde el último, también tras recargar.
import { useEffect, useState } from 'react';
import { codeSentAt, markCodeSent } from './pendingEmail';

const COOLDOWN_S = 60;

function secondsLeft() {
  const sent = codeSentAt();
  return sent ? Math.max(0, COOLDOWN_S - Math.floor((Date.now() - sent) / 1000)) : 0;
}

export function useCooldown() {
  const [seconds, setSeconds] = useState(secondsLeft);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (secondsLeft() === 0) return;
    const timer = window.setInterval(() => {
      const value = secondsLeft();
      setSeconds(value);
      if (value === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [round]);

  return {
    seconds,
    /** Marca que se acaba de enviar un código y vuelve a contar. */
    restart: () => {
      markCodeSent();
      setSeconds(secondsLeft());
      setRound((r) => r + 1);
    },
  };
}

/** "0:42" */
export function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
