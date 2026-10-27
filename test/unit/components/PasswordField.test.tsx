import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordField } from '../../../src/components/PasswordField';

function rule(text: string) {
  const list = screen.getByRole('list', { name: 'Requisitos de la contraseña' });
  return within(list)
    .getAllByRole('listitem')
    .find((item) => item.textContent?.startsWith(text))!;
}

describe('PasswordField', () => {
  it('empieza oculta y "Mostrar contraseña" la muestra (aria-pressed)', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" />);
    const input = screen.getByLabelText('Contraseña');

    expect(input).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');

    await user.click(hide);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('sin `rules` no muestra los requisitos', () => {
    render(<PasswordField label="Contraseña" />);
    expect(screen.queryByRole('list', { name: 'Requisitos de la contraseña' })).not.toBeInTheDocument();
  });

  it('con `rules` muestra las tres reglas pendientes para lectores de pantalla', () => {
    render(<PasswordField label="Contraseña nueva" rules />);
    const items = within(screen.getByRole('list', { name: 'Requisitos de la contraseña' })).getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(rule('Entre 8 y 72 caracteres')).toHaveTextContent('(pendiente)');
    expect(rule('Al menos una letra')).toHaveTextContent('(pendiente)');
    expect(rule('Al menos un número')).toHaveTextContent('(pendiente)');
  });

  it('marca cada regla como "(cumplido)" mientras se escribe', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña nueva" rules />);
    const input = screen.getByLabelText('Contraseña nueva');

    await user.type(input, 'abc');
    expect(rule('Al menos una letra')).toHaveTextContent('(cumplido)');
    expect(rule('Al menos un número')).toHaveTextContent('(pendiente)');
    expect(rule('Entre 8 y 72 caracteres')).toHaveTextContent('(pendiente)');

    await user.type(input, '12345');
    expect(rule('Al menos un número')).toHaveTextContent('(cumplido)');
    expect(rule('Entre 8 y 72 caracteres')).toHaveTextContent('(cumplido)');
  });

  it('sigue llamando al onChange de quien lo usa', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordField label="Contraseña" onChange={onChange} />);

    await user.type(screen.getByLabelText('Contraseña'), 'ab');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('muestra el error del campo', () => {
    render(<PasswordField label="Contraseña actual" error="La contraseña no es correcta." />);
    const input = screen.getByLabelText('Contraseña actual');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('La contraseña no es correcta.');
  });
});
