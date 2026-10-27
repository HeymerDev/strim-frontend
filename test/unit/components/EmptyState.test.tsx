import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '../../../src/components/EmptyState';

describe('EmptyState', () => {
  it('por defecto el título es un h2, con texto y acción', () => {
    render(<EmptyState title="Nadie está en vivo ahora" text="Cuando alguien empiece, aparece aquí." action={<button type="button">Transmite tú</button>} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Nadie está en vivo ahora' })).toBeInTheDocument();
    expect(screen.getByText('Cuando alguien empiece, aparece aquí.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transmite tú' })).toBeInTheDocument();
  });

  it('puede usar un h1 en páginas completas', () => {
    render(<EmptyState as="h1" title="Esta página no existe" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeInTheDocument();
  });

  it('sin texto ni acción solo muestra el título', () => {
    const { container } = render(<EmptyState title="Vacío" />);
    expect(container.querySelector('p')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
