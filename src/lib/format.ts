// Utilidades de formato (diseño §3): tiempo en vivo, espectadores, horas e iniciales.

const compact = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 });
const timeOfDay = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });

function elapsedSeconds(since: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
}

/** Tiempo en vivo para mostrar: "12:05" o "1:02:33". */
export function formatElapsed(since: string, now = Date.now()): string {
  const total = elapsedSeconds(since, now);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Tiempo en vivo para lectores de pantalla: "En vivo desde hace 1 hora y 2 minutos". */
export function elapsedLabel(since: string, now = Date.now()): string {
  const total = elapsedSeconds(since, now);
  if (total < 60) return 'En vivo desde hace menos de un minuto';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const parts = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m > 0 || h === 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  return `En vivo desde hace ${parts.join(' y ')}`;
}

/** Espectadores compactos: 124, "1,2 mil". */
export function formatViewers(count: number): string {
  return compact.format(count);
}

export function viewersLabel(count: number): string {
  return `${count.toLocaleString('es')} ${count === 1 ? 'espectador' : 'espectadores'}`;
}

/** Hora del chat: "21:07". */
export function formatTime(iso: string): string {
  return timeOfDay.format(new Date(iso));
}

/** Iniciales para el avatar sin foto: "Ana Torres" → "AT", "ana" → "AN". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Tono estable (1 a 5) a partir del username: colores del chat y de las iniciales (D3). */
export function toneOf(username: string): 1 | 2 | 3 | 4 | 5 {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ((hash % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}
