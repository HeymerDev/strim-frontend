import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../../src/components/Toaster';
import { dismissToast, getToasts } from '../../../../src/components/toast';
import { StatusPanel } from '../../../../src/features/studio/StatusPanel';
import * as api from '../../../../src/lib/api';
import { queryClient } from '../../../../src/lib/queries';
import { clearSession } from '../../../../src/lib/session';
import type { StreamDashboard } from '../../../../src/lib/types';
import { makeChannel, makeDashboard } from '../../../helpers/factories';
import { apiError } from '../../../helpers/http';
import { renderWithProviders } from '../../../helpers/render';

vi.mock('../../../../src/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/lib/api')>()),
  startStream: vi.fn(),
  stopStream: vi.fn(),
  updateTitle: vi.fn(),
  regenerateKey: vi.fn(),
  getChannel: vi.fn(),
}));

function renderPanel(stream: StreamDashboard) {
  return renderWithProviders(
    <>
      <StatusPanel stream={stream} username="ana" />
      <Toaster />
    </>,
    { route: '/dashboard', path: '/dashboard' },
  );
}

const titleInput = () => screen.getByRole('textbox', { name: 'Título del stream' });

describe('StatusPanel', () => {
  beforeEach(() => {
    // La vista previa pide el canal: sin URL de video muestra "Conectando…" sin cargar el reproductor.
    vi.mocked(api.getChannel).mockResolvedValue(makeChannel({ playbackUrl: null }));
  });

  afterEach(() => {
    for (const item of getToasts()) dismissToast(item.id);
    queryClient.clear();
    clearSession();
  });

  describe('los tres estados', () => {
    it('desconectado: "Desconectado", su explicación e "Iniciar stream"', () => {
      renderPanel(makeDashboard({ status: 'offline' }));

      expect(screen.getByRole('heading', { name: 'Desconectado' })).toBeInTheDocument();
      expect(screen.getByText('Pega los datos en OBS y pulsa Iniciar stream.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar stream' })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Finalizar stream' })).not.toBeInTheDocument();
    });

    it('esperando: "Esperando la señal de OBS" y "Finalizar stream"', () => {
      renderPanel(makeDashboard({ status: 'waiting' }));

      expect(screen.getByRole('heading', { name: 'Esperando la señal de OBS' })).toBeInTheDocument();
      expect(screen.getByText('En OBS, pulsa Iniciar transmisión. Tarda unos segundos en aparecer.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finalizar stream' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Iniciar stream' })).not.toBeInTheDocument();
    });

    it('en vivo: "En vivo", el tiempo en vivo y la vista previa', async () => {
      renderPanel(makeDashboard({ status: 'live', title: 'Mi stream', liveStartedAt: new Date(Date.now() - 2 * 60_000).toISOString() }));

      expect(screen.getByRole('heading', { name: /^En vivo/ })).toBeInTheDocument();
      expect(screen.getByText('Tu stream se está viendo en strim.')).toBeInTheDocument();
      expect(screen.getByText('En vivo desde hace 2 minutos')).toBeInTheDocument();
      await waitFor(() => expect(api.getChannel).toHaveBeenCalledWith('ana'));
      expect(screen.getByText('Conectando…')).toBeInTheDocument();
    });
  });

  describe('iniciar y finalizar', () => {
    it('"Iniciar stream" envía el título escrito, sin espacios de los extremos', async () => {
      vi.mocked(api.startStream).mockResolvedValue(makeDashboard({ status: 'waiting', title: 'Speedrun' }));
      const { user } = renderPanel(makeDashboard());

      await user.type(titleInput(), '  Speedrun  ');
      await user.click(screen.getByRole('button', { name: 'Iniciar stream' }));

      await waitFor(() => expect(api.startStream).toHaveBeenCalledExactlyOnceWith('Speedrun'));
    });

    it('si iniciar falla, avisa con el mensaje del backend', async () => {
      vi.mocked(api.startStream).mockRejectedValue(apiError('INTERNAL_ERROR', 'No pudimos iniciar el stream.', 500));
      const { user } = renderPanel(makeDashboard());

      await user.click(screen.getByRole('button', { name: 'Iniciar stream' }));

      expect(await screen.findByText('No pudimos iniciar el stream.')).toBeInTheDocument();
    });

    it('esperando la señal, "Finalizar stream" termina sin pedir confirmación', async () => {
      vi.mocked(api.stopStream).mockResolvedValue(makeDashboard({ status: 'offline' }));
      const { user } = renderPanel(makeDashboard({ status: 'waiting' }));

      await user.click(screen.getByRole('button', { name: 'Finalizar stream' }));

      await waitFor(() => expect(api.stopStream).toHaveBeenCalledOnce());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('en vivo, "Finalizar stream" pide confirmación antes de terminar', async () => {
      vi.mocked(api.stopStream).mockResolvedValue(makeDashboard({ status: 'offline' }));
      const { user } = renderPanel(makeDashboard({ status: 'live', liveStartedAt: new Date().toISOString() }));

      await user.click(screen.getByRole('button', { name: 'Finalizar stream' }));

      const dialog = screen.getByRole('dialog', { name: '¿Finalizar el stream?' });
      expect(dialog).toHaveAccessibleDescription('Tu canal dejará de estar en vivo y OBS se desconectará.');
      expect(api.stopStream).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Seguir en vivo' })).toHaveFocus();

      const confirm = screen.getAllByRole('button', { name: 'Finalizar stream' }).find((button) => dialog.contains(button))!;
      await user.click(confirm);

      await waitFor(() => expect(api.stopStream).toHaveBeenCalledOnce());
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('"Seguir en vivo" cierra la confirmación sin finalizar', async () => {
      const { user } = renderPanel(makeDashboard({ status: 'live', liveStartedAt: new Date().toISOString() }));

      await user.click(screen.getByRole('button', { name: 'Finalizar stream' }));
      await user.click(screen.getByRole('button', { name: 'Seguir en vivo' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(api.stopStream).not.toHaveBeenCalled();
    });
  });

  describe('título', () => {
    it('muestra el título guardado y el contador', () => {
      renderPanel(makeDashboard({ title: 'Hola' }));
      expect(titleInput()).toHaveValue('Hola');
      expect(screen.getByText('4 / 100')).toBeInTheDocument();
    });

    it('"Guardar título" solo se habilita con cambios reales', async () => {
      const { user } = renderPanel(makeDashboard({ title: 'Hola' }));
      const save = screen.getByRole('button', { name: 'Guardar título' });
      expect(save).toBeDisabled();

      await user.type(titleInput(), '  ');
      expect(save).toBeDisabled(); // Solo espacios: el título es el mismo.

      await user.type(titleInput(), 'mundo');
      expect(save).toBeEnabled();
    });

    it('guarda el título nuevo y avisa', async () => {
      vi.mocked(api.updateTitle).mockResolvedValue(makeDashboard({ title: 'Nuevo título' }));
      const { user } = renderPanel(makeDashboard({ title: '' }));

      await user.type(titleInput(), ' Nuevo título {Enter}');

      await waitFor(() => expect(api.updateTitle).toHaveBeenCalledExactlyOnceWith('Nuevo título'));
      expect(await screen.findByText('Título guardado')).toBeInTheDocument();
    });

    it('no deja pasar de 100 caracteres', () => {
      renderPanel(makeDashboard());
      expect(titleInput()).toHaveAttribute('maxlength', '100');
    });
  });
});
