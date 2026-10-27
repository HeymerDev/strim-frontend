import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChannelCard } from '../../../src/components/ChannelCard';
import { makeChannel } from '../../helpers/factories';
import { renderWithProviders } from '../../helpers/render';

const STARTED = '2026-01-01T20:00:00.000Z';
const NOW = new Date(STARTED).getTime() + 65_000;

describe('ChannelCard', () => {
  it('toda la tarjeta es un enlace al canal', () => {
    renderWithProviders(<ChannelCard channel={makeChannel({ liveStartedAt: STARTED })} now={NOW} />);
    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', '/ana');
    expect(link).toHaveTextContent('Ana Torres');
    expect(link).toHaveTextContent('Speedrun de domingo');
  });

  it('muestra "En vivo", los espectadores y el tiempo en vivo con su texto accesible', () => {
    renderWithProviders(<ChannelCard channel={makeChannel({ viewers: 1, liveStartedAt: STARTED })} now={NOW} />);

    expect(screen.getByText('En vivo')).toBeInTheDocument();
    expect(screen.getByText('1 espectador')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('En vivo desde hace 1 minuto')).toBeInTheDocument();
  });

  it('sin título dice "Sin título"', () => {
    renderWithProviders(<ChannelCard channel={makeChannel({ title: '' })} now={NOW} />);
    expect(screen.getByText('Sin título')).toBeInTheDocument();
  });

  it('sin hora de inicio no muestra el tiempo en vivo', () => {
    renderWithProviders(<ChannelCard channel={makeChannel({ liveStartedAt: null })} now={NOW} />);
    expect(screen.queryByText(/En vivo desde hace/)).not.toBeInTheDocument();
  });
});
