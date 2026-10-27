import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPendingEmail, codeSentAt, getPendingEmail, markCodeSent, setPendingEmail } from '../../../src/lib/pendingEmail';

const NOW = new Date('2026-01-01T12:00:00.000Z');

describe('pendingEmail', () => {
  beforeEach(() => {
    // Solo se congela la hora: este módulo no usa temporizadores.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin nada guardado no hay correo ni hora de envío', () => {
    expect(getPendingEmail()).toBeNull();
    expect(codeSentAt()).toBeNull();
  });

  it('setPendingEmail guarda el correo en sessionStorage y marca el envío', () => {
    setPendingEmail('ana@mail.com');

    expect(getPendingEmail()).toBe('ana@mail.com');
    expect(sessionStorage.getItem('strim.pendingEmail')).toBe('ana@mail.com');
    expect(codeSentAt()).toBe(NOW.getTime());
  });

  it('markCodeSent actualiza la hora del último código', () => {
    setPendingEmail('ana@mail.com');
    vi.setSystemTime(NOW.getTime() + 30_000);
    markCodeSent();
    expect(codeSentAt()).toBe(NOW.getTime() + 30_000);
  });

  it('clearPendingEmail borra el correo y la hora', () => {
    setPendingEmail('ana@mail.com');
    clearPendingEmail();

    expect(getPendingEmail()).toBeNull();
    expect(codeSentAt()).toBeNull();
    expect(sessionStorage.getItem('strim.otpSentAt')).toBeNull();
  });

  it('ignora una hora guardada que no es un número válido', () => {
    sessionStorage.setItem('strim.otpSentAt', 'ayer');
    expect(codeSentAt()).toBeNull();
  });

  it('con el almacenamiento bloqueado no lanza errores', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => setPendingEmail('ana@mail.com')).not.toThrow();
    expect(getPendingEmail()).toBeNull();
    expect(codeSentAt()).toBeNull();
  });
});
