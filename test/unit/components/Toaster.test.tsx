import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../src/components/Toaster';
import { dismissToast, getToasts, toast } from '../../../src/components/toast';

describe('Toaster y toast', () => {
  afterEach(() => {
    // El store es de módulo: se vacía entre pruebas.
    for (const item of getToasts()) dismissToast(item.id);
    vi.useRealTimers();
  });

  it('es una región de estado que no interrumpe', () => {
    render(<Toaster />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('muestra el aviso que se pide con toast()', () => {
    render(<Toaster />);
    act(() => toast('Cambios guardados'));
    expect(screen.getByRole('status')).toHaveTextContent('Cambios guardados');
  });

  it('muestra también los avisos de error', () => {
    render(<Toaster />);
    act(() => toast('No pudimos guardar.', 'error'));
    expect(screen.getByText('No pudimos guardar.')).toBeInTheDocument();
    expect(getToasts()[0]).toMatchObject({ message: 'No pudimos guardar.', tone: 'error' });
  });

  it('deja como mucho los tres últimos', () => {
    render(<Toaster />);
    act(() => {
      toast('Uno');
      toast('Dos');
      toast('Tres');
      toast('Cuatro');
    });

    expect(screen.queryByText('Uno')).not.toBeInTheDocument();
    for (const text of ['Dos', 'Tres', 'Cuatro']) expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('cada aviso se va solo a los 4 s', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Toaster />);
    act(() => toast('Foto actualizada'));

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('Foto actualizada')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Foto actualizada')).not.toBeInTheDocument();
  });

  it('dismissToast quita un aviso concreto', () => {
    render(<Toaster />);
    act(() => {
      toast('Uno');
      toast('Dos');
    });

    act(() => dismissToast(getToasts()[0].id));

    expect(screen.queryByText('Uno')).not.toBeInTheDocument();
    expect(screen.getByText('Dos')).toBeInTheDocument();
  });
});
