import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNow } from '../../../src/lib/useNow';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('avanza cada segundo mientras alguien lo usa', () => {
    const { result } = renderHook(() => useNow());
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current - first).toBeGreaterThanOrEqual(1000);
  });

  it('todos los componentes ven la misma hora (un solo intervalo)', () => {
    const a = renderHook(() => useNow());
    const b = renderHook(() => useNow());

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(a.result.current).toBe(b.result.current);
  });
});
