import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Stat } from '../../../src/components/Stat';

describe('Stat', () => {
  it('muestra el número oculto a lectores y el texto completo solo para ellos', () => {
    const { container } = render(<Stat icon={Users} value="1,2 mil" label="1200 espectadores" />);

    expect(screen.getByText('1,2 mil')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('1200 espectadores')).toHaveClass('sr-only');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('el texto completo también va en el title', () => {
    render(<Stat icon={Users} value="124" label="124 espectadores" />);
    expect(screen.getByTitle('124 espectadores')).toBeInTheDocument();
  });
});
