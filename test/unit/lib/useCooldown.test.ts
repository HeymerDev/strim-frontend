import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCountdown, useCooldown } from '../../../src/lib/useCooldown';

const NOW = new Date('2026-01-01T12:00:00.000Z').getTime();

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin código enviado no hay espera', () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.seconds).toBe(0);
  });

  it('cuenta los 60 s desde el último envío, también tras recargar', () => {
    sessionStorage.setItem('strim.otpSentAt', String(NOW - 10_000));
    const { result } = renderHook(() => useCooldown());
    expect(result.current.seconds).toBe(50);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(49);

    act(() => {
      vi.advanceTimersByTime(49_000);
    });
    expect(result.current.seconds).toBe(0);
  });

  it('restart marca el envío y vuelve a contar desde 60', () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.seconds).toBe(0);

    act(() => {
      result.current.restart();
    });
    expect(result.current.seconds).toBe(60);
    const sentAt = Number(sessionStorage.getItem('strim.otpSentAt'));
    expect(sentAt).toBeGreaterThanOrEqual(NOW);
    expect(sentAt).toBeLessThan(NOW + 1000);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(57);
  });
});

describe('formatCountdown', () => {
  it('muestra minutos y segundos con dos dígitos', () => {
    expect(formatCountdown(42)).toBe('0:42');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(60)).toBe('1:00');
  });
});
