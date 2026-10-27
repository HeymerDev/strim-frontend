import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyField } from '../../../src/components/CopyField';

describe('CopyField', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la etiqueta y el valor', () => {
    render(<CopyField label="Servidor" value="rtmp://media.test:1935" />);
    expect(screen.getByText('Servidor')).toBeInTheDocument();
    expect(screen.getByText('rtmp://media.test:1935')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mostrar/ })).not.toBeInTheDocument();
  });

  it('"Copiar" copia el valor, dice "Copiado" y lo anuncia', async () => {
    const user = userEvent.setup();
    render(<CopyField label="Servidor" value="rtmp://media.test:1935" />);

    const button = screen.getByRole('button', { name: 'Copiar servidor' });
    expect(button).toHaveTextContent('Copiar');

    await user.click(button);

    expect(await navigator.clipboard.readText()).toBe('rtmp://media.test:1935');
    expect(button).toHaveTextContent('Copiado');
    expect(screen.getByRole('status')).toHaveTextContent('Servidor copiado');
  });

  it('vuelve a "Copiar" a los 2 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyField label="Servidor" value="rtmp://media.test:1935" />);
    const button = screen.getByRole('button', { name: 'Copiar servidor' });

    await user.click(button);
    // `copy()` espera al portapapeles antes de marcar "Copiado".
    await waitFor(() => expect(button).toHaveTextContent('Copiado'));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(button).toHaveTextContent('Copiar');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('si la Clipboard API falla, copia con el respaldo', async () => {
    const user = userEvent.setup();
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: execCommand });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('NotAllowedError'));
    render(<CopyField label="Servidor" value="rtmp://media.test:1935" />);

    await user.click(screen.getByRole('button', { name: 'Copiar servidor' }));

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByRole('button', { name: 'Copiar servidor' })).toHaveTextContent('Copiado');
    // El textarea temporal se quita.
    expect(document.querySelector('textarea')).toBeNull();
  });

  describe('secreto', () => {
    it('oculta el valor hasta pulsar "Mostrar"', async () => {
      const user = userEvent.setup();
      render(<CopyField label="Clave de transmisión" value="ana?key=clave-secreta" secret />);

      expect(screen.queryByText('ana?key=clave-secreta')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Valor oculto')).toBeInTheDocument();

      const show = screen.getByRole('button', { name: 'Mostrar' });
      expect(show).toHaveAttribute('aria-pressed', 'false');
      await user.click(show);

      expect(screen.getByText('ana?key=clave-secreta')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('copia el valor real aunque esté oculto', async () => {
      const user = userEvent.setup();
      render(<CopyField label="Clave de transmisión" value="ana?key=clave-secreta" secret />);

      await user.click(screen.getByRole('button', { name: 'Copiar clave de transmisión' }));
      expect(await navigator.clipboard.readText()).toBe('ana?key=clave-secreta');
      expect(screen.queryByText('ana?key=clave-secreta')).not.toBeInTheDocument();
    });
  });
});
