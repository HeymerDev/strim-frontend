import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../src/lib/api';
import { clearSession } from '../../../src/lib/session';
import type { PublicChannel } from '../../../src/lib/types';
import HomePage from '../../../src/pages/HomePage';
import { makeChannel } from '../../helpers/factories';
import { apiError, deferred } from '../../helpers/http';
import { renderWithProviders } from '../../helpers/render';

vi.mock('../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/lib/api')>()),
  getLiveChannels: vi.fn(),
}));

function renderHome() {
  return renderWithProviders(<HomePage />);
}

describe('HomePage', () => {
  afterEach(() => {
    clearSession();
  });

  it('mientras carga muestra el esqueleto con su estado', () => {
    vi.mocked(api.getLiveChannels).mockReturnValue(deferred<PublicChannel[]>().promise);
    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: 'En vivo ahora' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Cargando canales en vivo' })).toBeInTheDocument();
    expect(document.title).toBe('strim');
  });

  it('sin canales en vivo invita a transmitir', async () => {
    vi.mocked(api.getLiveChannels).mockResolvedValue([]);
    renderHome();

    expect(await screen.findByRole('heading', { name: 'Nadie está en vivo ahora' })).toBeInTheDocument();
    expect(screen.getByText('Cuando alguien empiece a transmitir, aparece aquí.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Transmite tú' })).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByText(/canales?$/)).not.toBeInTheDocument();
  });

  it('si falla muestra el error con "Reintentar", que vuelve a pedir la lista', async () => {
    vi.mocked(api.getLiveChannels)
      .mockRejectedValueOnce(apiError('INTERNAL_ERROR', 'El servidor no responde.', 500))
      .mockResolvedValueOnce([makeChannel()]);
    const { user } = renderHome();

    expect(await screen.findByRole('heading', { name: 'No pudimos cargar los canales.' })).toBeInTheDocument();
    expect(screen.getByText('El servidor no responde.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: /Ana Torres/ })).toHaveAttribute('href', '/ana');
    expect(api.getLiveChannels).toHaveBeenCalledTimes(2);
  });

  it('un error que no es de la API dice "Algo salió mal."', async () => {
    vi.mocked(api.getLiveChannels).mockRejectedValue(new Error('boom'));
    renderHome();

    expect(await screen.findByText('Algo salió mal.')).toBeInTheDocument();
  });

  it('lista los canales en vivo con su cantidad', async () => {
    vi.mocked(api.getLiveChannels).mockResolvedValue([
      makeChannel(),
      makeChannel({ username: 'luis', displayName: 'Luis Pérez', title: 'Charla' }),
    ]);
    renderHome();

    const list = await screen.findByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/ana');
    expect(links[1]).toHaveAttribute('href', '/luis');
    expect(links[1]).toHaveTextContent('Charla');
    expect(screen.getByText('2 canales')).toBeInTheDocument();
  });

  it('con un solo canal dice "1 canal"', async () => {
    vi.mocked(api.getLiveChannels).mockResolvedValue([makeChannel()]);
    renderHome();

    expect(await screen.findByText('1 canal')).toBeInTheDocument();
  });
});
