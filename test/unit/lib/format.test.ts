import { describe, expect, it } from 'vitest';
import { elapsedLabel, formatElapsed, formatTime, formatViewers, initials, toneOf, viewersLabel } from '../../../src/lib/format';

const SINCE = '2026-01-01T20:00:00.000Z';
const base = new Date(SINCE).getTime();
const after = (seconds: number) => base + seconds * 1000;

describe('formatElapsed', () => {
  it('muestra minutos y segundos cuando lleva menos de una hora', () => {
    expect(formatElapsed(SINCE, after(12 * 60 + 5))).toBe('12:05');
  });

  it('no rellena los minutos sin horas: 0:05', () => {
    expect(formatElapsed(SINCE, after(5))).toBe('0:05');
  });

  it('muestra horas, minutos y segundos con dos dígitos', () => {
    expect(formatElapsed(SINCE, after(3600 + 2 * 60 + 33))).toBe('1:02:33');
  });

  it('nunca es negativo si el reloj local va atrasado', () => {
    expect(formatElapsed(SINCE, after(-30))).toBe('0:00');
  });
});

describe('elapsedLabel', () => {
  it('dice "menos de un minuto" durante el primer minuto', () => {
    expect(elapsedLabel(SINCE, after(59))).toBe('En vivo desde hace menos de un minuto');
  });

  it('usa el singular para un minuto', () => {
    expect(elapsedLabel(SINCE, after(60))).toBe('En vivo desde hace 1 minuto');
  });

  it('une horas y minutos con "y"', () => {
    expect(elapsedLabel(SINCE, after(3600 + 2 * 60))).toBe('En vivo desde hace 1 hora y 2 minutos');
  });

  it('omite los minutos cuando son cero y hay horas', () => {
    expect(elapsedLabel(SINCE, after(2 * 3600 + 30))).toBe('En vivo desde hace 2 horas');
  });
});

describe('formatViewers', () => {
  it('deja los números chicos tal cual', () => {
    expect(formatViewers(124)).toBe('124');
  });

  it('compacta los miles en español: "1,2 mil"', () => {
    expect(formatViewers(1200)).toMatch(/^1,2\smil$/);
  });
});

describe('viewersLabel', () => {
  it('usa el singular para un espectador', () => {
    expect(viewersLabel(1)).toBe('1 espectador');
  });

  it('usa el plural para cero y para varios', () => {
    expect(viewersLabel(0)).toBe('0 espectadores');
    expect(viewersLabel(37)).toBe('37 espectadores');
  });
});

describe('formatTime', () => {
  it('da la hora del mensaje como HH:MM', () => {
    expect(formatTime('2026-01-01T21:07:00.000Z')).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('initials', () => {
  it('toma la primera letra del primer y del último nombre', () => {
    expect(initials('Ana Torres')).toBe('AT');
    expect(initials('Ana María Torres')).toBe('AT');
  });

  it('con una sola palabra toma sus dos primeras letras en mayúsculas', () => {
    expect(initials('ana')).toBe('AN');
  });

  it('ignora los espacios de sobra', () => {
    expect(initials('  luis   pérez ')).toBe('LP');
  });

  it('devuelve "?" sin nombre', () => {
    expect(initials('   ')).toBe('?');
  });
});

describe('toneOf', () => {
  it('es estable: el mismo username da siempre el mismo tono', () => {
    expect(toneOf('ana_torres')).toBe(toneOf('ana_torres'));
  });

  it('calcula el tono con el hash del username', () => {
    // 'a' = 97 → 97 % 5 + 1 = 3
    expect(toneOf('a')).toBe(3);
  });

  it('siempre da un tono del 1 al 5', () => {
    for (const username of ['ana', 'luis', 'streamer_01', 'x', 'zzz', 'maria_jose', 'pepe123']) {
      const tone = toneOf(username);
      expect(tone).toBeGreaterThanOrEqual(1);
      expect(tone).toBeLessThanOrEqual(5);
    }
  });
});
