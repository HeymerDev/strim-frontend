import { useEffect, useId, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Botones al pie, de izquierda a derecha: el cancelar primero. */
  actions?: ReactNode;
};

/**
 * <dialog> nativo con showModal() (diseño §2): atrapa el foco, cierra con Escape y devuelve
 * el foco al botón que lo abrió. El foco inicial va al elemento con `data-autofocus`.
 */
export function Modal({ open, onClose, title, description, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => {
        opener.current?.focus();
        onClose();
      }}
      className="modal m-auto w-[min(28rem,calc(100%-2rem))] rounded-panel border border-linea bg-panel p-6 text-texto"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      {description && (
        <div id={descriptionId} className="mt-2 text-base text-texto-suave">
          {description}
        </div>
      )}
      {children && <div className="mt-5">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>}
    </dialog>
  );
}
