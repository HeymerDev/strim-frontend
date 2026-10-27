import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveBadge } from '../../../src/components/LiveBadge';

describe('LiveBadge', () => {
  it('dice "En vivo" en texto y el nodo es decorativo', () => {
    const { container } = render(<LiveBadge />);
    expect(screen.getByText('En vivo')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
