// Hora actual que avanza sola, para el tiempo en vivo (RF-08.2). Un solo intervalo para toda la app.
import { useSyncExternalStore } from 'react';

let now = Date.now();
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

/** Milisegundos actuales, actualizados cada segundo mientras haya alguien mirando. */
export function useNow() {
  return useSyncExternalStore(subscribe, () => now);
}
