import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Field, TextAreaField } from '../../../src/components/Field';

describe('Field', () => {
  it('enlaza la etiqueta visible con el input', () => {
    render(<Field label="Correo" type="email" />);
    const input = screen.getByLabelText('Correo');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('sin error ni ayuda no tiene aria-invalid ni aria-describedby', () => {
    render(<Field label="Correo" />);
    const input = screen.getByLabelText('Correo');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('la ayuda describe el campo', () => {
    render(<Field label="Nombre de usuario" hint="Será tu canal: strim/ana" />);
    expect(screen.getByLabelText('Nombre de usuario')).toHaveAccessibleDescription('Será tu canal: strim/ana');
  });

  it('con error marca aria-invalid y lo enlaza antes que la ayuda', () => {
    render(<Field label="Nombre de usuario" hint="Será tu canal: strim/ana" error="Ese nombre ya está en uso." />);
    const input = screen.getByLabelText('Nombre de usuario');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Ese nombre ya está en uso. Será tu canal: strim/ana');
    expect(input.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
  });

  it('muestra el contador y la acción junto a la etiqueta', () => {
    render(<Field label="Contraseña" counter="54 / 200" labelAction={<a href="/reset">¿La olvidaste?</a>} />);
    expect(screen.getByText('54 / 200')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '¿La olvidaste?' })).toHaveAttribute('href', '/reset');
  });

  it('pasa los atributos y eventos al input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Field label="Correo" placeholder="tu@correo.com" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'ana');
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(screen.getByLabelText('Correo')).toHaveValue('ana');
  });

  it('dibuja lo que va dentro del campo (trailing)', () => {
    render(<Field label="Contraseña" trailing={<button type="button">Mostrar</button>} />);
    expect(screen.getByRole('button', { name: 'Mostrar' })).toBeInTheDocument();
  });
});

describe('TextAreaField', () => {
  it('enlaza etiqueta, error y ayuda en un textarea', () => {
    render(<TextAreaField label="Bio" hint="Cuéntale a tu audiencia quién eres." error="La bio puede tener como máximo 200 caracteres." />);
    const textarea = screen.getByLabelText('Bio');

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription(
      'La bio puede tener como máximo 200 caracteres. Cuéntale a tu audiencia quién eres.',
    );
  });

  it('sin error no marca aria-invalid', () => {
    render(<TextAreaField label="Bio" />);
    expect(screen.getByLabelText('Bio')).not.toHaveAttribute('aria-invalid');
  });
});
