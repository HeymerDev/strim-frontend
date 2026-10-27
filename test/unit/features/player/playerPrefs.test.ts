import { describe, expect, it, vi } from 'vitest';
import { readPrefs, writePrefs } from '../../../../src/features/player/playerPrefs';

describe('playerPrefs', () => {
  it('sin preferencias guardadas: volumen 1 y en silencio', () => {
    expect(readPrefs()).toEqual({ volume: 1, muted: true });
  });

  it('guarda y lee el volumen y el silencio en `strim.player`', () => {
    writePrefs({ volume: 0.4, muted: false });

    expect(JSON.parse(localStorage.getItem('strim.player')!)).toEqual({ volume: 0.4, muted: false });
    expect(readPrefs()).toEqual({ volume: 0.4, muted: false });
  });

  it('corrige un volumen fuera de rango', () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 3, muted: false }));
    expect(readPrefs()).toEqual({ volume: 1, muted: false });
  });

  it('solo quita el silencio si se guardó `muted: false` de forma explícita', () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 0.5, muted: 'no' }));
    expect(readPrefs().muted).toBe(true);
  });

  it('con un valor corrupto usa los valores por defecto', () => {
    localStorage.setItem('strim.player', '{no es json');
    expect(readPrefs()).toEqual({ volume: 1, muted: true });
  });

  it('sin almacenamiento, writePrefs no lanza errores', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writePrefs({ volume: 0.2, muted: false })).not.toThrow();
  });
});
