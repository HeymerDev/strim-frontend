// Respuestas HTTP falsas, errores de la API y promesas controladas por la prueba.
import { ApiError } from '../../src/lib/api';
import type { ErrorCode } from '../../src/lib/types';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function errorResponse(status: number, code: ErrorCode, message: string, details?: Record<string, string>): Response {
  return jsonResponse({ error: { code, message, details } }, status);
}

export function apiError(code: ErrorCode | 'NETWORK_ERROR', message: string, status = 400, details?: Record<string, string>) {
  return new ApiError(status, code, message, details);
}

/** Promesa que la prueba resuelve o rechaza cuando quiere. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
