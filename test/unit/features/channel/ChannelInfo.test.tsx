import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChannelInfo } from '../../../../src/features/channel/ChannelInfo';
import { clearSession } from '../../../../src/lib/session';
import type { PublicChannel } from '../../../../src/lib/types';
import { makeChannel } from '../../../helpers/factories';
import { renderWithProviders } from '../../../helpers/render';

function renderInfo(channel: PublicChannel, isOwner = false) {
  return renderWithProviders(<ChannelInfo channel={channel} isOwner={isOwner} />, { route: '/ana', path: '/:username' });
}

describe('ChannelInfo', () => {
  afterEach(() => {
    clearSession();
  });

  it('muestra el nombre como título, el @username, el título del stream y la bio', () => {
    renderInfo(makeChannel());

    expect(screen.getByRole('region', { name: 'Sobre el canal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Ana Torres' })).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('Speedrun de domingo')).toBeInTheDocument();
    expect(screen.getByText('Juego y converso.')).toBeInTheDocument();
  });

  it('en vivo muestra "En vivo", los espectadores y el tiempo en vivo', () => {
    renderInfo(makeChannel({ viewers: 3 }));

    expect(screen.getAllByText('En vivo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3 espectadores').length).toBeGreaterThan(0);
    expect(screen.getByText(/^En vivo desde hace/)).toBeInTheDocument();
  });

  it('desconectado no muestra datos de en vivo', () => {
    renderInfo(makeChannel({ isLive: false, liveStartedAt: null, playbackUrl: null }));

    expect(screen.queryByText('En vivo')).not.toBeInTheDocument();
    expect(screen.queryByText(/espectador/)).not.toBeInTheDocument();
  });

  it('"Ir al estudio" solo aparece para el dueño', () => {
    const { unmount } = renderInfo(makeChannel(), false);
    expect(screen.queryByRole('link', { name: 'Ir al estudio' })).not.toBeInTheDocument();
    unmount();

    renderInfo(makeChannel(), true);
    const links = screen.getAllByRole('link', { name: 'Ir al estudio' });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('en móvil, el botón abre y cierra los detalles (aria-expanded)', async () => {
    const { user } = renderInfo(makeChannel());
    const toggle = screen.getByRole('button', { name: 'Ver detalles del canal' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const details = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(details).toHaveTextContent('Juego y converso.');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Ocultar detalles del canal');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Ver detalles del canal');
  });
});
