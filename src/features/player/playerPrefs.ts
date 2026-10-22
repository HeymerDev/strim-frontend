// Preferencias del reproductor en el navegador (RF-09.4): volumen y si el usuario quitó el silencio.

const KEY = 'strim.player';

export type PlayerPrefs = { volume: number; muted: boolean };

const DEFAULTS: PlayerPrefs = { volume: 1, muted: true };

export function readPrefs(): PlayerPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<PlayerPrefs> | null;
    if (!raw) return DEFAULTS;
    const volume = typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : DEFAULTS.volume;
    return { volume, muted: raw.muted !== false };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(prefs: PlayerPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento: se usan los valores por defecto la próxima vez.
  }
}
