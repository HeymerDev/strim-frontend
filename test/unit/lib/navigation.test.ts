import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { isUsername, loginPath, safeNext, usePageTitle } from '../../../src/lib/navigation';

describe('safeNext', () => {
  it('acepta rutas internas con su búsqueda', () => {
    expect(safeNext('/dashboard')).toBe('/dashboard');
    expect(safeNext('/ana?x=1')).toBe('/ana?x=1');
  });

  it('cae en "/" sin valor', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext(undefined)).toBe('/');
    expect(safeNext('')).toBe('/');
  });

  it('rechaza direcciones externas', () => {
    expect(safeNext('https://evil.test')).toBe('/');
    expect(safeNext('//evil.test')).toBe('/');
    expect(safeNext('/\\evil.test')).toBe('/');
    expect(safeNext('dashboard')).toBe('/');
  });
});

describe('loginPath', () => {
  it('codifica la ruta de vuelta en `next`', () => {
    expect(loginPath('/ana')).toBe('/login?next=%2Fana');
    expect(loginPath('/dashboard?tab=1')).toBe('/login?next=%2Fdashboard%3Ftab%3D1');
  });
});

describe('isUsername', () => {
  it('sigue el patrón del backend', () => {
    expect(isUsername('ana_01')).toBe(true);
    expect(isUsername('Ana')).toBe(false);
    expect(isUsername('ab')).toBe(false);
    expect(isUsername('ana.torres')).toBe(false);
  });
});

describe('usePageTitle', () => {
  it('pone "<título> | strim" y solo "strim" sin título', () => {
    const { rerender } = renderHook(({ title }: { title: string | null }) => usePageTitle(title), {
      initialProps: { title: 'Estudio' as string | null },
    });
    expect(document.title).toBe('Estudio | strim');

    rerender({ title: null });
    expect(document.title).toBe('strim');
  });
});
