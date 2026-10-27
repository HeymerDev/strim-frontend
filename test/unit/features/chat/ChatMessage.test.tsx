import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatMessageItem } from '../../../../src/features/chat/ChatMessage';
import { makeMessage } from '../../../helpers/factories';

function renderMessage(...args: Parameters<typeof makeMessage>) {
  const message = makeMessage(...args);
  return { message, ...render(<ul><ChatMessageItem message={message} isStreamer={false} /></ul>) };
}

describe('ChatMessageItem', () => {
  it('muestra el nombre del autor y el texto', () => {
    renderMessage({ content: 'hola a todos', author: { username: 'luis', displayName: 'Luis' } });
    const item = screen.getByRole('listitem');

    expect(item).toHaveTextContent('Luis: hola a todos');
    expect(screen.getByText('Luis')).toHaveAttribute('title', '@luis');
  });

  it('el texto es texto plano: un <b> se ve tal cual y no se interpreta', () => {
    const { container } = renderMessage({ content: '<b>hola</b><img src=x onerror=alert(1)>' });

    expect(screen.getByText('<b>hola</b><img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('la hora va en un <time> con la fecha completa', () => {
    const { container, message } = renderMessage();
    const time = container.querySelector('time')!;

    expect(time).toHaveAttribute('datetime', message.createdAt);
    expect(time.textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it('marca los mensajes del dueño del canal con "Streamer"', () => {
    const message = makeMessage({ author: { username: 'ana', displayName: 'Ana Torres' } });
    render(
      <ul>
        <ChatMessageItem message={message} isStreamer />
      </ul>,
    );
    expect(screen.getByText('Streamer')).toBeInTheDocument();
  });

  it('sin ser el dueño no muestra la insignia', () => {
    renderMessage();
    expect(screen.queryByText('Streamer')).not.toBeInTheDocument();
  });
});
