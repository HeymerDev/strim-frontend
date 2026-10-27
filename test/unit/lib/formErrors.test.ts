import type { UseFormSetError } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { applyApiError } from '../../../src/lib/formErrors';
import { apiError } from '../../helpers/http';

type Account = { email: string; username: string; password: string };
type Delete = { password: string };

describe('applyApiError', () => {
  it('pone EMAIL_TAKEN en el campo `email` y enfoca el campo', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    const result = applyApiError<Account>(apiError('EMAIL_TAKEN', 'Ese correo ya tiene cuenta.', 409), setError, ['email', 'username', 'password']);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledExactlyOnceWith('email', { type: 'server', message: 'Ese correo ya tiene cuenta.' }, { shouldFocus: true });
  });

  it('pone USERNAME_TAKEN en `username`', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    applyApiError<Account>(apiError('USERNAME_TAKEN', 'Ese nombre ya está en uso.', 409), setError, ['email', 'username', 'password']);
    expect(setError).toHaveBeenCalledWith('username', { type: 'server', message: 'Ese nombre ya está en uso.' }, { shouldFocus: true });
  });

  it('con `rename` lleva INVALID_CURRENT_PASSWORD al campo `password`', () => {
    const setError = vi.fn<UseFormSetError<Delete>>();
    const result = applyApiError<Delete>(apiError('INVALID_CURRENT_PASSWORD', 'La contraseña no es correcta.'), setError, ['password'], {
      currentPassword: 'password',
    });

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith('password', { type: 'server', message: 'La contraseña no es correcta.' }, { shouldFocus: true });
  });

  it('sin `rename`, si el campo no existe en el formulario devuelve el mensaje general', () => {
    const setError = vi.fn<UseFormSetError<Delete>>();
    const result = applyApiError<Delete>(apiError('INVALID_CURRENT_PASSWORD', 'La contraseña no es correcta.'), setError, ['password']);

    expect(result).toBe('La contraseña no es correcta.');
    expect(setError).not.toHaveBeenCalled();
  });

  it('reparte VALIDATION_ERROR por campo con `details` e ignora los que no existen', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    const error = apiError('VALIDATION_ERROR', 'Datos inválidos.', 400, { email: 'Correo inválido.', otro: 'No aplica.' });
    const result = applyApiError<Account>(error, setError, ['email', 'username', 'password']);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledExactlyOnceWith('email', { type: 'server', message: 'Correo inválido.' });
  });

  it('VALIDATION_ERROR sin campos conocidos devuelve el mensaje general', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    const error = apiError('VALIDATION_ERROR', 'Datos inválidos.', 400, { otro: 'No aplica.' });

    expect(applyApiError<Account>(error, setError, ['email'])).toBe('Datos inválidos.');
    expect(setError).not.toHaveBeenCalled();
  });

  it('un código sin campo (INVALID_CREDENTIALS) devuelve el mensaje general', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    const result = applyApiError<Account>(apiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401), setError, ['email', 'password']);

    expect(result).toBe('Correo o contraseña incorrectos.');
    expect(setError).not.toHaveBeenCalled();
  });

  it('un error que no es ApiError da "Algo salió mal."', () => {
    const setError = vi.fn<UseFormSetError<Account>>();
    expect(applyApiError<Account>(new Error('boom'), setError, ['email'])).toBe('Algo salió mal.');
    expect(applyApiError<Account>('texto', setError, ['email'])).toBe('Algo salió mal.');
    expect(setError).not.toHaveBeenCalled();
  });
});
