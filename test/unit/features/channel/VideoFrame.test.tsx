import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VideoFrame } from '../../../../src/features/channel/VideoFrame';
import { makeChannel } from '../../../helpers/factories';

describe('VideoFrame', () => {
  it('desconectado: avatar, "<nombre> no está en vivo" y que el chat sigue abierto', () => {
    render(<VideoFrame channel={makeChannel({ isLive: false, playbackUrl: null })} deleted={false} />);

    expect(screen.getByText('Ana Torres no está en vivo')).toBeInTheDocument();
    expect(screen.getByText('El chat sigue abierto.')).toBeInTheDocument();
    expect(screen.getAllByText('AT').length).toBeGreaterThan(0);
  });

  it('en vivo muestra el reproductor que recibe', () => {
    render(<VideoFrame channel={makeChannel({ isLive: true })} deleted={false} player={<p>Reproductor falso</p>} />);

    expect(screen.getByText('Reproductor falso')).toBeInTheDocument();
    expect(screen.queryByText(/no está en vivo/)).not.toBeInTheDocument();
  });

  it('en vivo sin reproductor muestra "Conectando…"', () => {
    render(<VideoFrame channel={makeChannel({ isLive: true })} deleted={false} />);
    expect(screen.getByText('Conectando…')).toBeInTheDocument();
  });

  it('borrado: "Este canal ya no existe", aunque estuviera en vivo', () => {
    render(<VideoFrame channel={makeChannel({ isLive: true })} deleted player={<p>Reproductor falso</p>} />);

    expect(screen.getByText('Este canal ya no existe')).toBeInTheDocument();
    expect(screen.queryByText('Reproductor falso')).not.toBeInTheDocument();
  });

  it('al terminar el stream pasa de reproductor a desconectado', () => {
    const { rerender } = render(<VideoFrame channel={makeChannel({ isLive: true })} deleted={false} player={<p>Reproductor falso</p>} />);

    rerender(<VideoFrame channel={makeChannel({ isLive: false, playbackUrl: null })} deleted={false} player={null} />);

    expect(screen.queryByText('Reproductor falso')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Torres no está en vivo')).toBeInTheDocument();
  });
});
