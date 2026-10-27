import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OtpInput } from '../../../src/components/OtpInput';

/** OtpInput es controlado: este envoltorio guarda el valor como lo hacen las páginas. */
function Controlled({ onComplete, error }: { onComplete?: (value: string) => void; error?: string }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} error={error} />;
}

describe('OtpInput', () => {
  it('es un solo input con autocompletado de código y teclado numérico', () => {
    render(<Controlled />);
    const input = screen.getByLabelText('Código');

    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('maxlength', '8');
    expect(input).toHaveAttribute('pattern', '\\d{8}');
  });

  it('acepta una etiqueta propia', () => {
    render(<OtpInput label="Código de verificación" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument();
  });

  it('descarta lo que no es dígito', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByLabelText('Código');

    await user.type(input, 'a1b2-3');
    expect(input).toHaveValue('123');
  });

  it('llama a onComplete al pegar el código completo', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Controlled onComplete={onComplete} />);

    await user.click(screen.getByLabelText('Código'));
    await user.paste('12345678');

    expect(screen.getByLabelText('Código')).toHaveValue('12345678');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('12345678');
  });

  it('al escribir dígito a dígito llama a onComplete solo con el último', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Controlled onComplete={onComplete} />);

    await user.type(screen.getByLabelText('Código'), '1234567');
    expect(onComplete).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Código'), '8');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('12345678');
  });

  it('corta en OTP_LENGTH lo que llega con espacios o de más', () => {
    // user-event respeta `maxLength` al pegar; fireEvent simula el autocompletado del sistema.
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<OtpInput value="" onChange={onChange} onComplete={onComplete} />);

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '12 34 56 78 90' } });

    expect(onChange).toHaveBeenCalledWith('12345678');
    expect(onComplete).toHaveBeenCalledWith('12345678');
  });

  it('muestra el error enlazado al input', () => {
    render(<Controlled error="El código no es válido o venció." />);
    const input = screen.getByLabelText('Código');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('El código no es válido o venció.');
  });

  it('sin error no tiene aria-invalid', () => {
    render(<Controlled />);
    expect(screen.getByLabelText('Código')).not.toHaveAttribute('aria-invalid');
  });

  it('deshabilitado no deja escribir', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} disabled />);

    await user.type(screen.getByLabelText('Código'), '123');
    expect(screen.getByLabelText('Código')).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
