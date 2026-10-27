import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../../../src/components/Button';

describe('Button', () => {
  it('es type="button" por defecto y responde al clic', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respeta type="submit"', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit');
  });

  it('cargando: conserva el texto, queda deshabilitado y con aria-busy', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Iniciar stream
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Iniciar stream' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('cargando reemplaza el ícono por el spinner', () => {
    render(
      <Button loading icon={<span>ícono</span>}>
        Subir
      </Button>,
    );
    expect(screen.queryByText('ícono')).not.toBeInTheDocument();
  });

  it('muestra el ícono cuando no está cargando', () => {
    render(<Button icon={<span>ícono</span>}>Subir</Button>);
    expect(screen.getByText('ícono')).toBeInTheDocument();
  });

  it('deshabilitado no llama a onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Regenerar clave
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Regenerar clave' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Regenerar clave' })).not.toHaveAttribute('aria-busy');
  });
});
