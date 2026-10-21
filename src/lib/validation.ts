// Esquemas zod con las mismas reglas del backend (diseño §8, backend/src/validators/).
import { z } from 'zod';

z.config(z.locales.es());

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// Copiada de backend/src/utils/usernames.ts: chocan con rutas del frontend o de la API.
const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'internal',
  'live',
  'login',
  'logout',
  'me',
  'register',
  'reset',
  'settings',
  'signup',
  'stream',
  'strim',
  'support',
  'verify',
]);

export const emailSchema = z.string().trim().toLowerCase().min(1, 'Escribe tu correo.').pipe(z.email('Correo inválido.'));

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, 'De 3 a 20 caracteres: letras, números o guion bajo.')
  .refine((username) => !RESERVED_USERNAMES.has(username), 'Ese nombre de usuario no está disponible.');

/** Reglas de la contraseña nueva (RNF-04). `PasswordField` las muestra marcadas. */
export const passwordRules = [
  { text: 'Entre 8 y 72 caracteres', test: (v: string) => v.length >= 8 && v.length <= 72 },
  { text: 'Al menos una letra', test: (v: string) => /\p{L}/u.test(v) },
  { text: 'Al menos un número', test: (v: string) => /\d/.test(v) },
];

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña puede tener como máximo 72 caracteres.')
  .regex(/\p{L}/u, 'La contraseña debe tener al menos una letra.')
  .regex(/\d/, 'La contraseña debe tener al menos un número.');

/** Para una contraseña existente (login, actual, borrar la cuenta): solo que no esté vacía. */
export const currentPasswordSchema = z.string().min(1, 'Escribe tu contraseña.').max(72);

/**
 * Largo del código que manda Supabase ("Email OTP Length", de 6 a 10). El backend acepta cualquiera de
 * esos largos; el frontend necesita saber cuál es para dibujar las casillas y enviar al completarlas.
 */
export const OTP_LENGTH = parseOtpLength(import.meta.env.VITE_OTP_LENGTH);

function parseOtpLength(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 6 && n <= 10 ? n : 8;
}

export const OTP_INCOMPLETE = `Escribe los ${OTP_LENGTH} dígitos del código.`;

export const otpSchema = z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), OTP_INCOMPLETE);

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre visible no puede estar vacío.')
  .max(30, 'El nombre visible puede tener como máximo 30 caracteres.');

export const bioSchema = z.string().trim().max(200, 'La bio puede tener como máximo 200 caracteres.');

export const titleSchema = z.string().trim().max(100, 'El título puede tener como máximo 100 caracteres.');

export const chatMessageSchema = z
  .string()
  .trim()
  .min(1, 'El mensaje no puede estar vacío.')
  .max(300, 'El mensaje puede tener como máximo 300 caracteres.');

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const avatarFileSchema = z
  .instanceof(File)
  .refine(
    (file) => AVATAR_TYPES.includes(file.type) && file.size <= AVATAR_MAX_BYTES,
    'Elige una imagen JPG, PNG o WebP de hasta 2 MB.',
  );
