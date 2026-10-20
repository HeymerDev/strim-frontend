// Store de avisos breves (diseño §9.8, RF-16.4). Se usa con `toast('Cambios guardados')`.

export type Toast = { id: number; message: string; tone: 'exito' | 'error' };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function toast(message: string, tone: Toast['tone'] = 'exito') {
  const item = { id: nextId++, message, tone };
  toasts = [...toasts, item].slice(-3);
  emit();
  window.setTimeout(() => dismissToast(item.id), 4000);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return toasts;
}
