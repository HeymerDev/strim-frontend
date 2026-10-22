import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type Hls from 'hls.js';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { IconButton } from '../../components/IconButton';
import { cx } from '../../components/cx';
import { Connecting } from '../channel/VideoFrame';
import { readPrefs, writePrefs } from './playerPrefs';

type LivePlayerProps = {
  /** URL HLS (`playbackUrl` del canal). */
  src: string;
  /** Vista previa del estudio: sin controles, siempre en silencio (RF-12.10). */
  preview?: boolean;
  /** Nombre accesible, por ejemplo "Stream de Ana Torres". */
  label?: string;
};

type Phase = 'connecting' | 'playing' | 'blocked';

/** Reintentos a los 2 y 4 s, y luego cada 8 s (diseño §7, RF-09.5). */
const RETRY_DELAYS = [2000, 4000];
const RETRY_EVERY = 8000;
const CONTROLS_IDLE_MS = 2500;

/**
 * Reproductor HLS (diseño §7, RF-09). hls.js se importa aquí de forma dinámica: solo se descarga
 * en las páginas con video (RNF-08). Si el navegador no lo soporta, usa el HLS nativo (iOS).
 */
export default function LivePlayer({ src, preview = false, label = 'Stream en vivo' }: LivePlayerProps) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(() => readPrefs().volume);
  const [fullscreen, setFullscreen] = useState(false);
  const [active, setActive] = useState(false);
  const idleTimer = useRef<number>(undefined);

  // Fuente, autoplay y reintentos.
  useEffect(() => {
    const el = video.current!;
    let disposed = false;
    let attempt = 0;
    let retryTimer: number | undefined;

    el.volume = readPrefs().volume;

    // RF-09.2: en silencio, salvo que el usuario haya quitado el silencio antes (RF-09.4).
    const autoplay = async () => {
      el.muted = preview || readPrefs().muted;
      try {
        await el.play();
      } catch {
        if (!el.muted) {
          el.muted = true; // El navegador bloqueó el sonido: se vuelve al silencio.
          try {
            await el.play();
          } catch {
            if (!disposed) setPhase('blocked');
          }
        } else if (!disposed) {
          setPhase('blocked'); // Ni siquiera en silencio (ahorro de batería): botón de play.
        }
      }
      if (!disposed) setMuted(el.muted);
    };

    const retry = () => {
      if (disposed) return;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      el.removeAttribute('src');
      el.load();
      setPhase('connecting');
      const delay = RETRY_DELAYS[attempt] ?? RETRY_EVERY;
      attempt += 1;
      retryTimer = window.setTimeout(() => void start(), delay);
    };

    const start = async () => {
      const { default: HlsClass } = await import('hls.js');
      if (disposed) return;
      if (HlsClass.isSupported()) {
        const hls = new HlsClass({ lowLatencyMode: true, backBufferLength: 30 });
        hlsRef.current = hls;
        hls.on(HlsClass.Events.ERROR, (_event, data) => {
          if (data.fatal) retry(); // Por ejemplo, el 404 de MediaMTX mientras la señal no está lista.
        });
        hls.on(HlsClass.Events.MANIFEST_PARSED, () => void autoplay());
        hls.loadSource(src);
        hls.attachMedia(el);
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = src;
        el.addEventListener('loadedmetadata', () => void autoplay(), { once: true });
      }
    };

    const onPlaying = () => {
      attempt = 0;
      setPhase('playing');
    };
    const onNativeError = () => {
      if (!hlsRef.current) retry();
    };
    el.addEventListener('playing', onPlaying);
    el.addEventListener('error', onNativeError);
    void start();

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('error', onNativeError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      el.removeAttribute('src');
      el.load();
    };
  }, [src, preview]);

  // Estado de pausa, sonido y pantalla completa, tal como lo ve el navegador.
  useEffect(() => {
    const el = video.current!;
    const sync = () => {
      setPaused(el.paused);
      setMuted(el.muted);
      setVolume(el.volume);
    };
    const onFullscreen = () => setFullscreen(document.fullscreenElement === root.current);
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    el.addEventListener('volumechange', sync);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      el.removeEventListener('play', sync);
      el.removeEventListener('pause', sync);
      el.removeEventListener('volumechange', sync);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.clearTimeout(idleTimer.current);
    };
  }, []);

  const togglePlay = () => {
    const el = video.current!;
    if (el.paused) {
      // Es en vivo: al reanudar se vuelve al directo.
      const live = hlsRef.current?.liveSyncPosition;
      if (live) el.currentTime = live;
      void el.play();
    } else {
      el.pause();
    }
  };

  const toggleMute = () => {
    const el = video.current!;
    el.muted = !el.muted;
    if (!el.muted && el.volume === 0) el.volume = 0.5;
    writePrefs({ volume: el.volume, muted: el.muted });
  };

  const changeVolume = (value: number) => {
    const el = video.current!;
    el.volume = value;
    el.muted = value === 0;
    writePrefs({ volume: value, muted: el.muted });
  };

  const toggleFullscreen = () => {
    const el = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (root.current?.requestFullscreen) void root.current.requestFullscreen();
    else el?.webkitEnterFullscreen?.(); // iOS solo deja poner el <video> en pantalla completa.
  };

  // Atajos con el reproductor enfocado (RF-09.3): espacio o k, m y f.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (preview || (event.target as HTMLElement).tagName === 'INPUT') return;
    const key = event.key.toLowerCase();
    if ((key === ' ' && event.target === root.current) || key === 'k') togglePlay();
    else if (key === 'm') toggleMute();
    else if (key === 'f') toggleFullscreen();
    else return;
    event.preventDefault();
  };

  // En pantallas táctiles los controles aparecen al tocar y se van solos.
  const wake = () => {
    setActive(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setActive(false), CONTROLS_IDLE_MS);
  };

  const controlsVisible = paused || active;

  return (
    <div
      ref={root}
      role="region"
      aria-label={label}
      tabIndex={preview ? undefined : 0}
      onKeyDown={onKeyDown}
      onPointerMove={preview ? undefined : wake}
      onPointerDown={preview ? undefined : wake}
      className="group/player relative h-full w-full bg-pantalla outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-senal"
    >
      <video ref={video} playsInline muted className="h-full w-full object-contain" />

      {phase === 'connecting' && (
        <div className="absolute inset-0">
          <Connecting />
        </div>
      )}

      {phase === 'blocked' && (
        <button
          type="button"
          onClick={() => {
            setPhase('connecting');
            togglePlay();
          }}
          className="absolute top-1/2 left-1/2 inline-flex size-16 -translate-1/2 items-center justify-center rounded-full bg-senal text-noche transition-colors duration-150 hover:bg-senal-fuerte"
          aria-label="Reproducir"
        >
          <Play size={28} aria-hidden="true" className="translate-x-0.5" />
        </button>
      )}

      {!preview && phase === 'playing' && muted && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-3 left-3 inline-flex h-9 items-center gap-2 rounded-full bg-[rgb(18_16_31/0.82)] px-4 text-sm font-semibold text-texto transition-colors duration-150 hover:bg-relieve"
        >
          <VolumeX size={16} aria-hidden="true" />
          Activar sonido
        </button>
      )}

      {!preview && phase === 'playing' && (
        <div
          className={cx(
            'absolute inset-x-3 bottom-3 flex items-center gap-1 rounded-full bg-[rgb(18_16_31/0.82)] p-1 transition-opacity duration-150',
            controlsVisible ? 'opacity-100' : 'opacity-0 group-hover/player:opacity-100 group-focus-within/player:opacity-100',
          )}
        >
          <IconButton
            label={paused ? 'Reproducir' : 'Pausar'}
            icon={paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
            onClick={togglePlay}
            className="text-texto"
          />
          <IconButton
            label={muted ? 'Activar sonido' : 'Silenciar'}
            icon={muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            onClick={toggleMute}
            className="text-texto"
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label="Volumen"
            className="h-11 w-24 cursor-pointer accent-senal max-sm:hidden"
          />
          <span className="flex-1" />
          <IconButton
            label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            icon={fullscreen ? <Minimize size={18} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}
            onClick={toggleFullscreen}
            className="text-texto"
          />
        </div>
      )}
    </div>
  );
}
