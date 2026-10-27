import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../../src/components/Modal';

function WithOpener({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        title="¿Regenerar la clave?"
        description="La clave actual dejará de funcionar."
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="button">Confirmar</button>
          </>
        }
      >
        <p>Contenido del modal</p>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('cerrado no se ve', () => {
    render(<Modal open={false} onClose={() => {}} title="¿Borrar?" />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toHaveAttribute('open');
    expect(dialog).not.toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('al abrir se ve con su título y descripción, y enfoca el elemento con data-autofocus', async () => {
    const user = userEvent.setup();
    render(<WithOpener onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    const dialog = screen.getByRole('dialog', { name: '¿Regenerar la clave?' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleDescription('La clave actual dejará de funcionar.');
    expect(screen.getByText('Contenido del modal')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('Escape cierra, llama a onClose y devuelve el foco al botón que lo abrió', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WithOpener onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Abrir' });

    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('cerrar desde afuera (open=false) también avisa con onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WithOpener onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
  });

  it('sin descripción no pone aria-describedby', () => {
    render(<Modal open onClose={() => {}} title="Cambiar contraseña" />);
    expect(screen.getByRole('dialog', { name: 'Cambiar contraseña' })).not.toHaveAttribute('aria-describedby');
  });
});
