// Ayudas de navegación (diseño §4).
import { useEffect } from 'react';
import { USERNAME_PATTERN } from './validation';

/** `next` solo acepta rutas internas: empiezan con "/" y no con "//" (RNF-03). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}

export function loginPath(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

export function isUsername(value: string) {
  return USERNAME_PATTERN.test(value);
}

/** Título de la pestaña: "Estudio | strim". */
export function usePageTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | strim` : 'strim';
  }, [title]);
}
