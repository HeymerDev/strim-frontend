import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { ObsGuide, ObsPanel } from '../../../../src/features/studio/ObsPanel';
import * as api from '../../../../src/lib/api';
import { queryClient, queryKeys } from '../../../../src/lib/queries';
import { clearSession } from '../../../../src/lib/session';
import type { StreamDashboard } from '../../../../src/lib/types';
import { makeDashboard } from '../../../helpers/factories';
import { apiError } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  regenerateKey: vi.fn(),
}));

function renderPanel(stream: StreamDashboard) {
  return renderWithProviders(
    <>
      <ObsPanel stream={stream} />
      <Toaster />
    </>,
    { route: '/dashboard', path: '/dashboard' },
  );
}

describe('ObsPanel', () => {
  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    queryClient.clear();
    clearSession();
  });

  it('muestra el servidor y la clave oculta', () => {
    renderPanel(makeDashboard());

    expect(screen.getByRole('region', { name: 'Conectar OBS' })).toBeInTheDocument();
    expect(screen.getByText('rtmp://media.test:1935')).toBeInTheDocument();
    expect(screen.queryByText('ana?key=clave-secreta')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar' })).toBeInTheDocument();
  });

  it('desconectado, "Regenerar clave" está habilitado y sin explicación', () => {
    renderPanel(makeDashboard({ status: 'offline' }));
    const button = screen.getByRole('button', { name: 'Regenerar clave' });

    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('Finaliza el stream para regenerar la clave.')).not.toBeInTheDocument();
  });

  it.each(['waiting', 'live'] as const)('en estado %s, "Regenerar clave" está deshabilitado y explica por qué', (status) => {
    renderPanel(makeDashboard({ status }));
    const button = screen.getByRole('button', { name: 'Regenerar clave' });

    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Finaliza el stream para regenerar la clave.');
  });

  it('pide confirmación; "Cancelar" cierra sin regenerar', async () => {
    const { user } = renderPanel(makeDashboard());

    await user.click(screen.getByRole('button', { name: 'Regenerar clave' }));

    const dialog = screen.getByRole('dialog', { name: '¿Regenerar la clave?' });
    expect(dialog).toHaveAccessibleDescription('La clave actual dejará de funcionar. Tendrás que pegar la nueva en OBS.');
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.regenerateKey).not.toHaveBeenCalled();
  });

  it('al confirmar regenera la clave, la guarda en la caché, avisa y cierra', async () => {
    const updated = makeDashboard({ obs: { server: 'rtmp://media.test:1935', streamKey: 'ana?key=nueva' } });
    vi.mocked(api.regenerateKey).mockResolvedValue(updated);
    const { user } = renderPanel(makeDashboard());

    await user.click(screen.getByRole('button', { name: 'Regenerar clave' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Regenerar clave' }));

    await waitFor(() => expect(api.regenerateKey).toHaveBeenCalledOnce());
    expect(await screen.findByText('Clave regenerada. Pégala en OBS.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(queryClient.getQueryData(queryKeys.stream)).toEqual(updated);
  });

  it('si falla, avisa con el mensaje del backend y cierra', async () => {
    vi.mocked(api.regenerateKey).mockRejectedValue(apiError('CHANNEL_LIVE', 'No puedes regenerar la clave en vivo.', 409));
    const { user } = renderPanel(makeDashboard());

    await user.click(screen.getByRole('button', { name: 'Regenerar clave' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Regenerar clave' }));

    expect(await screen.findByText('No puedes regenerar la clave en vivo.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('ObsGuide', () => {
  it('es una lista numerada de cuatro pasos', () => {
    render(<ObsGuide />);

    expect(screen.getByRole('region', { name: 'Cómo conectar OBS' })).toBeInTheDocument();
    const steps = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[2]).toHaveTextContent('Aquí, pulsa Iniciar stream.');
  });
});
