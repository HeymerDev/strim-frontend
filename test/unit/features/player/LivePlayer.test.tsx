import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LivePlayer from '../../../../src/features/player/LivePlayer';

// hls.js falso: guarda las instancias para disparar sus eventos desde la prueba.
const hls = vi.hoisted(() => {
  type Listener = (event: string, data: { fatal?: boolean }) => void;

  class FakeHls {
    static Events = { ERROR: 'hlsError', MANIFEST_PARSED: 'hlsManifestParsed' } as const;
    static supported = true;
    static instances: FakeHls[] = [];
    static isSupported() {
      return FakeHls.supported;
    }

    config: unknown;
    listeners = new Map<string, Listener>();
    liveSyncPosition: number | null = null;
    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();

    constructor(config: unknown) {
      this.config = config;
      FakeHls.instances.push(this);
    }

    on(event: string, listener: Listener) {
      this.listeners.set(event, listener);
    }

    /** Dispara un evento de hls.js como lo haría la librería. */
    trigger(event: string, data: { fatal?: boolean } = {}) {
      this.listeners.get(event)?.(event, data);
    }
  }

  return FakeHls;
});

vi.mock('hls.js', () => ({ default: hls }));

const SRC = 'http://media.test/ana/index.m3u8';

function video() {
  return document.querySelector('video')!;
}

/** Espera a que el reproductor cree su instancia de hls.js número `n` (1, 2…). */
async function instance(n = 1) {
  await waitFor(() => expect(hls.instances).toHaveLength(n));
  return hls.instances[n - 1];
}

/** Manifiesto listo, autoplay y el video empieza a reproducirse. */
async function startPlaying(n = 1) {
  const current = await instance(n);
  await act(async () => current.trigger(hls.Events.MANIFEST_PARSED));
  fireEvent.playing(video());
  return current;
}

describe('LivePlayer', () => {
  beforeEach(() => {
    hls.instances = [];
    hls.supported = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('es una región con nombre, enfocable, que empieza "Conectando…"', () => {
    render(<LivePlayer src={SRC} label="Stream de Ana Torres" />);

    const region = screen.getByRole('region', { name: 'Stream de Ana Torres' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Conectando…')).toBeInTheDocument();
  });

  it('carga la fuente HLS con hls.js y la conecta al <video>', async () => {
    render(<LivePlayer src={SRC} />);
    const current = await instance();

    expect(current.config).toEqual({ lowLatencyMode: true, backBufferLength: 30 });
    expect(current.loadSource).toHaveBeenCalledWith(SRC);
    expect(current.attachMedia).toHaveBeenCalledWith(video());
  });

  it('arranca en silencio con el botón "Activar sonido"', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
    render(<LivePlayer src={SRC} />);

    await startPlaying();

    expect(play).toHaveBeenCalled();
    expect(video().muted).toBe(true);
    expect(screen.queryByText('Conectando…')).not.toBeInTheDocument();
    // El botón grande de arriba y el de la barra de controles.
    expect(screen.getAllByRole('button', { name: 'Activar sonido' })).toHaveLength(2);
    expect(screen.getByRole('slider', { name: 'Volumen' })).toHaveValue('0');
  });

  it('"Activar sonido" quita el silencio y lo guarda en `strim.player`', async () => {
    const user = userEvent.setup();
    render(<LivePlayer src={SRC} />);
    await startPlaying();

    await user.click(screen.getAllByRole('button', { name: 'Activar sonido' })[0]);

    expect(video().muted).toBe(false);
    expect(JSON.parse(localStorage.getItem('strim.player')!)).toEqual({ volume: 1, muted: false });
    expect(await screen.findByRole('button', { name: 'Silenciar' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: 'Activar sonido' })).toHaveLength(0);
  });

  it('respeta las preferencias guardadas: sin silencio y con su volumen', async () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 0.4, muted: false }));
    render(<LivePlayer src={SRC} />);

    await startPlaying();

    expect(video().muted).toBe(false);
    expect(video().volume).toBe(0.4);
    expect(await screen.findByRole('button', { name: 'Silenciar' })).toBeInTheDocument();
    expect(Number((screen.getByRole('slider', { name: 'Volumen' }) as HTMLInputElement).value)).toBeCloseTo(0.4);
  });

  it('el control de volumen guarda el valor; en 0 queda en silencio', async () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 1, muted: false }));
    render(<LivePlayer src={SRC} />);
    await startPlaying();
    const slider = await screen.findByRole('slider', { name: 'Volumen' });

    // user-event no mueve controles range: se cambia el valor como lo haría el navegador.
    fireEvent.change(slider, { target: { value: '0.5' } });
    const prefs = JSON.parse(localStorage.getItem('strim.player')!) as { volume: number; muted: boolean };
    expect(prefs.volume).toBeCloseTo(0.5);
    expect(prefs.muted).toBe(false);

    fireEvent.change(slider, { target: { value: '0' } });
    expect(JSON.parse(localStorage.getItem('strim.player')!)).toEqual({ volume: 0, muted: true });
    expect(video().muted).toBe(true);
  });

  it('si el navegador bloquea el sonido, vuelve al silencio', async () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 1, muted: false }));
    vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new DOMException('No se permite', 'NotAllowedError'))
      .mockResolvedValue(undefined);
    render(<LivePlayer src={SRC} />);

    await startPlaying();

    expect(await screen.findAllByRole('button', { name: 'Activar sonido' })).toHaveLength(2);
    expect(video().muted).toBe(true);
  });

  it('si no puede reproducir ni en silencio, muestra "Reproducir"', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('Ahorro de batería', 'NotAllowedError'));
    render(<LivePlayer src={SRC} />);
    const current = await instance();

    await act(async () => current.trigger(hls.Events.MANIFEST_PARSED));

    expect(await screen.findByRole('button', { name: 'Reproducir' })).toBeInTheDocument();
    expect(screen.queryByText('Conectando…')).not.toBeInTheDocument();
  });

  it('tras un error fatal vuelve a "Conectando…" y reintenta a los 2 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<LivePlayer src={SRC} />);
    const first = await startPlaying();
    expect(screen.queryByText('Conectando…')).not.toBeInTheDocument();

    act(() => first.trigger(hls.Events.ERROR, { fatal: true }));

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(screen.getByText('Conectando…')).toBeInTheDocument();
    expect(hls.instances).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    const second = await instance(2);
    expect(second.loadSource).toHaveBeenCalledWith(SRC);
  });

  it('los errores que no son fatales no reinician nada', async () => {
    render(<LivePlayer src={SRC} />);
    const current = await startPlaying();

    act(() => current.trigger(hls.Events.ERROR, { fatal: false }));

    expect(current.destroy).not.toHaveBeenCalled();
    expect(screen.queryByText('Conectando…')).not.toBeInTheDocument();
  });

  it('al desmontar destruye hls.js', async () => {
    const { unmount } = render(<LivePlayer src={SRC} />);
    const current = await instance();

    unmount();

    expect(current.destroy).toHaveBeenCalledOnce();
  });

  it('la tecla "m" con el reproductor enfocado quita el silencio', async () => {
    const user = userEvent.setup();
    render(<LivePlayer src={SRC} label="Stream de Ana Torres" />);
    await startPlaying();

    screen.getByRole('region', { name: 'Stream de Ana Torres' }).focus();
    await user.keyboard('m');

    expect(video().muted).toBe(false);
    expect(JSON.parse(localStorage.getItem('strim.player')!)).toMatchObject({ muted: false });
  });

  it('la vista previa del estudio no tiene controles ni se enfoca, y siempre va en silencio', async () => {
    localStorage.setItem('strim.player', JSON.stringify({ volume: 1, muted: false }));
    render(<LivePlayer src={SRC} preview label="Vista previa de tu stream" />);

    await startPlaying();

    expect(screen.getByRole('region', { name: 'Vista previa de tu stream' })).not.toHaveAttribute('tabindex');
    expect(video().muted).toBe(true);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
