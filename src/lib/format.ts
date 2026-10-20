// Utilidades de formato (diseño §3). La tarea 4 agrega tiempo en vivo, espectadores y horas.

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
