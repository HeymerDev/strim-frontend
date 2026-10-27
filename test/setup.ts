// Preparación común de las pruebas: matchers de jest-dom, limpieza entre pruebas y lo que jsdom no trae.
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// findBy… y waitFor esperan hasta 5 s: con toda la batería en paralelo, 1 s se queda corto.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// ─── <dialog> ─────────────────────────────────────────────────────────────
// jsdom no implementa showModal() ni close(). `Modal` usa el <dialog> nativo: se imita lo justo
// (atributo `open`, Escape → `cancel` → `close`).
const escapeHandlers = new WeakMap<HTMLDialogElement, (event: KeyboardEvent) => void>();

Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    if (this.hasAttribute('open')) return;
    this.setAttribute('open', '');
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const cancel = new Event('cancel', { cancelable: true });
      this.dispatchEvent(cancel);
      if (!cancel.defaultPrevented) this.close();
    };
    escapeHandlers.set(this, onKey);
    this.addEventListener('keydown', onKey);
  },
});

Object.defineProperty(HTMLDialogElement.prototype, 'show', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
});

Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    if (returnValue !== undefined) this.returnValue = returnValue;
    const onKey = escapeHandlers.get(this);
    if (onKey) this.removeEventListener('keydown', onKey);
    escapeHandlers.delete(this);
    this.dispatchEvent(new Event('close'));
  },
});

// ─── matchMedia (ChatPanel: prefers-reduced-motion) ──────────────────────────
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ─── scrollTo en elementos (ChatPanel) ───────────────────────────────────────
Object.defineProperty(Element.prototype, 'scrollTo', {
  configurable: true,
  writable: true,
  value: () => {},
});

// ─── URL de objetos (AvatarPicker) ────────────────────────────────────────────
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: () => 'blob:http://localhost/vista-previa',
});
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: () => {},
});

// ─── <video> (reproductor) ────────────────────────────────────────────────────
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  writable: true,
  value: () => {},
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  writable: true,
  value: () => {},
});

// ─── Portapapeles (CopyField) ─────────────────────────────────────────────────
// `userEvent.setup()` lo reemplaza por el suyo; este cubre las pruebas que no usan user-event.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') },
  });
}
