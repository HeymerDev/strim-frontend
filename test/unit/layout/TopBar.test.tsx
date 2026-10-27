import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TopBar } from '../../../src/layout/TopBar';
import { clearSession, updateUser } from '../../../src/lib/session';
import { makeMe, makeSession } from '../../helpers/factories';
import { renderWithProviders } from '../../helpers/render';

describe('TopBar', () => {
  afterEach(() => {
    clearSession();
  });

  it('el logo lleva al inicio', () => {
    renderWithProviders(<TopBar />);
    expect(screen.getByRole('link', { name: 'strim, inicio' })).toHaveAttribute('href', '/');
  });

  it('sin sesión: "Iniciar sesión", "Crear cuenta" y "Transmitir"', () => {
    renderWithProviders(<TopBar />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    expect(nav).toContainElement(screen.getByRole('link', { name: /Iniciar sesión/ }));
    expect(screen.getByRole('link', { name: /Iniciar sesión/ })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Transmitir' })).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('button', { name: /Menú de/ })).not.toBeInTheDocument();
  });

  it('con sesión: el menú del usuario en lugar de los enlaces de cuenta', () => {
    renderWithProviders(<TopBar />, { session: true });

    expect(screen.getByRole('button', { name: 'Menú de Ana Torres' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Iniciar sesión/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Transmitir' })).toHaveAttribute('href', '/dashboard');
  });

  it('en vivo: "En vivo: ir al estudio"', () => {
    const user = makeMe({ channel: { status: 'live', liveStartedAt: '2026-01-01T20:00:00.000Z' } });
    renderWithProviders(<TopBar />, { session: makeSession({ user }) });

    const link = screen.getByRole('link', { name: 'En vivo: ir al estudio' });
    expect(link).toHaveAttribute('href', '/dashboard');
    expect(link).toHaveTextContent('En vivo');
    expect(screen.queryByRole('link', { name: 'Transmitir' })).not.toBeInTheDocument();
  });

  it('se actualiza cuando cambia el estado del canal en la sesión', () => {
    renderWithProviders(<TopBar />, { session: true });
    expect(screen.getByRole('link', { name: 'Transmitir' })).toBeInTheDocument();

    act(() => updateUser((me) => ({ ...me, channel: { ...me.channel, status: 'live' } })));

    expect(screen.getByRole('link', { name: 'En vivo: ir al estudio' })).toBeInTheDocument();
  });
});
