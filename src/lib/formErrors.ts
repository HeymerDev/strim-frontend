// Errores de la API en formularios (diseño §5.4).
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';
import type { ErrorCode } from './types';

/** Código del backend → campo del formulario. */
const FIELD_BY_CODE: Partial<Record<ErrorCode, string>> = {
  EMAIL_TAKEN: 'email',
  USERNAME_TAKEN: 'username',
  INVALID_OTP: 'otp',
  INVALID_CURRENT_PASSWORD: 'currentPassword',
  SAME_PASSWORD: 'newPassword',
  CHANNEL_LIVE: 'username',
};

/**
 * Pone el error de la API en su campo cuando existe en el formulario.
 * Devuelve el mensaje general cuando no corresponde a ningún campo (va arriba del botón, con role="alert").
 * `rename` cambia el campo por defecto: por ejemplo, al borrar la cuenta la contraseña se llama `password`.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  rename: Partial<Record<string, Path<T>>> = {},
): string | null {
  if (!(error instanceof ApiError)) return 'Algo salió mal.';

  if (error.code === 'VALIDATION_ERROR' && error.details) {
    let placed = false;
    for (const [field, message] of Object.entries(error.details)) {
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: 'server', message });
        placed = true;
      }
    }
    if (placed) return null;
  }

  const defaultField = FIELD_BY_CODE[error.code as ErrorCode];
  const field = defaultField ? (rename[defaultField] ?? (defaultField as Path<T>)) : undefined;
  if (field && fields.includes(field)) {
    setError(field, { type: 'server', message: error.message }, { shouldFocus: true });
    return null;
  }
  return error.message;
}
