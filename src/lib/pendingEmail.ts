// Correo pendiente de verificar y hora del último código enviado (diseño §4).
// Viven en sessionStorage para sobrevivir a una recarga de /verify, no a una pestaña nueva (RF-04.5).

const EMAIL_KEY = 'strim.pendingEmail';
const SENT_AT_KEY = 'strim.otpSentAt';

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Almacenamiento bloqueado: /verify depende del estado de la navegación.
  }
}

export function getPendingEmail() {
  return read(EMAIL_KEY);
}

/** Guarda el correo y marca que se acaba de enviar un código. */
export function setPendingEmail(email: string) {
  write(EMAIL_KEY, email);
  markCodeSent();
}

export function clearPendingEmail() {
  write(EMAIL_KEY, null);
  write(SENT_AT_KEY, null);
}

export function markCodeSent() {
  write(SENT_AT_KEY, String(Date.now()));
}

export function codeSentAt(): number | null {
  const value = Number(read(SENT_AT_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}
