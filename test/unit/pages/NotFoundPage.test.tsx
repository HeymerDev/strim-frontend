import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { clearSession } from '../../../src/lib/session';
import NotFoundPage from '../../../src/pages/NotFoundPage';
import { renderWithProviders } from '../../helpers/render';

describe('NotFoundPage', () => {
  afterEach(() => {
    clearSession();
  });

  it('página: "Esta página no existe" con el enlace al inicio', () => {
    renderWithProviders(<NotFoundPage />, { route: '/algo/que/no/existe', path: '*' });

    expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeInTheDocument();
    expect(screen.getByText('Revisa la dirección o vuelve al inicio.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Esta página no existe | strim');
  });

  it('canal: "Este canal no existe" con su explicación', () => {
    renderWithProviders(<NotFoundPage channel />, { route: '/nadie', path: '/:username' });

    expect(screen.getByRole('heading', { level: 1, name: 'Este canal no existe' })).toBeInTheDocument();
    expect(screen.getByText('Revisa el nombre del canal o vuelve al inicio para ver quién está en vivo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Este canal no existe | strim');
  });
});
