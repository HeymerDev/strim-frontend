import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '../../../src/components/Avatar';

describe('Avatar', () => {
  it('sin foto muestra las iniciales (decorativas si no hay alt)', () => {
    render(<Avatar src={null} name="Ana Torres" username="ana" />);
    const initials = screen.getByText('AT');
    expect(initials).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('con alt, las iniciales no se ocultan a los lectores de pantalla', () => {
    render(<Avatar src={null} name="ana" username="ana" alt="Tu foto de perfil" />);
    expect(screen.getByText('AN')).not.toHaveAttribute('aria-hidden');
  });

  it('con foto muestra la imagen con su texto alternativo y tamaño', () => {
    render(<Avatar src="https://cdn.test/ana.png" name="Ana Torres" username="ana" alt="Foto de Ana" size={64} />);
    const img = screen.getByRole('img', { name: 'Foto de Ana' });

    expect(img).toHaveAttribute('src', 'https://cdn.test/ana.png');
    expect(img).toHaveAttribute('width', '64');
    expect(screen.queryByText('AT')).not.toBeInTheDocument();
  });

  it('si la imagen falla vuelve a las iniciales', () => {
    render(<Avatar src="https://cdn.test/rota.png" name="Ana Torres" username="ana" alt="Foto de Ana" />);

    // user-event no puede hacer fallar la carga de una imagen.
    fireEvent.error(screen.getByRole('img', { name: 'Foto de Ana' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  it('si llega otra foto después del error, la intenta mostrar', () => {
    const { rerender } = render(<Avatar src="https://cdn.test/rota.png" name="Ana Torres" username="ana" alt="Foto" />);
    fireEvent.error(screen.getByRole('img', { name: 'Foto' }));

    rerender(<Avatar src="https://cdn.test/nueva.png" name="Ana Torres" username="ana" alt="Foto" />);
    expect(screen.getByRole('img', { name: 'Foto' })).toHaveAttribute('src', 'https://cdn.test/nueva.png');
  });
});
