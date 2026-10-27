import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';
import {
  avatarFileSchema,
  bioSchema,
  chatMessageSchema,
  currentPasswordSchema,
  displayNameSchema,
  emailSchema,
  OTP_INCOMPLETE,
  OTP_LENGTH,
  otpSchema,
  passwordRules,
  passwordSchema,
  titleSchema,
  USERNAME_PATTERN,
  usernameSchema,
} from '../../../src/lib/validation';

/** Primer mensaje de error de zod, o `null` si el valor es válido. */
function firstError(schema: ZodType, value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}

describe('usernameSchema', () => {
  it('pasa a minúsculas y quita los espacios', () => {
    expect(usernameSchema.parse('  Ana_01 ')).toBe('ana_01');
  });

  it('exige de 3 a 20 letras, números o guion bajo', () => {
    const message = 'De 3 a 20 caracteres: letras, números o guion bajo.';
    expect(firstError(usernameSchema, 'ab')).toBe(message);
    expect(firstError(usernameSchema, 'ana-torres')).toBe(message);
    expect(firstError(usernameSchema, 'ana torres')).toBe(message);
    expect(firstError(usernameSchema, 'a'.repeat(21))).toBe(message);
    expect(firstError(usernameSchema, 'a'.repeat(20))).toBeNull();
  });

  it('rechaza los nombres reservados, también en mayúsculas', () => {
    const message = 'Ese nombre de usuario no está disponible.';
    expect(firstError(usernameSchema, 'admin')).toBe(message);
    expect(firstError(usernameSchema, 'Dashboard')).toBe(message);
    expect(firstError(usernameSchema, 'login')).toBe(message);
  });

  it('el patrón exportado coincide con el del backend', () => {
    expect(USERNAME_PATTERN.test('ana_01')).toBe(true);
    expect(USERNAME_PATTERN.test('Ana')).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('acepta una contraseña con letras y números de 8 a 72 caracteres', () => {
    expect(firstError(passwordSchema, 'abc12345')).toBeNull();
    expect(firstError(passwordSchema, 'ñandú123')).toBeNull();
  });

  it('explica cada regla que falta', () => {
    expect(firstError(passwordSchema, 'a1')).toBe('La contraseña debe tener al menos 8 caracteres.');
    expect(firstError(passwordSchema, `a1${'x'.repeat(71)}`)).toBe('La contraseña puede tener como máximo 72 caracteres.');
    expect(firstError(passwordSchema, '12345678')).toBe('La contraseña debe tener al menos una letra.');
    expect(firstError(passwordSchema, 'abcdefgh')).toBe('La contraseña debe tener al menos un número.');
  });
});

describe('passwordRules', () => {
  const check = (value: string) => passwordRules.map((rule) => rule.test(value));

  it('tiene las tres reglas con su texto', () => {
    expect(passwordRules.map((rule) => rule.text)).toEqual(['Entre 8 y 72 caracteres', 'Al menos una letra', 'Al menos un número']);
  });

  it('marca cada regla por separado', () => {
    expect(check('')).toEqual([false, false, false]);
    expect(check('abc')).toEqual([false, true, false]);
    expect(check('12345678')).toEqual([true, false, true]);
    expect(check('ñandú123')).toEqual([true, true, true]);
    expect(check(`a1${'x'.repeat(71)}`)).toEqual([false, true, true]);
  });
});

describe('currentPasswordSchema', () => {
  it('solo pide que no esté vacía', () => {
    expect(firstError(currentPasswordSchema, '')).toBe('Escribe tu contraseña.');
    expect(firstError(currentPasswordSchema, 'x')).toBeNull();
  });
});

describe('otpSchema', () => {
  it('usa el largo de VITE_OTP_LENGTH (8 en las pruebas)', () => {
    expect(OTP_LENGTH).toBe(8);
    expect(OTP_INCOMPLETE).toBe('Escribe los 8 dígitos del código.');
  });

  it('acepta exactamente OTP_LENGTH dígitos', () => {
    expect(firstError(otpSchema, '12345678')).toBeNull();
    expect(firstError(otpSchema, '1234567')).toBe(OTP_INCOMPLETE);
    expect(firstError(otpSchema, '123456789')).toBe(OTP_INCOMPLETE);
    expect(firstError(otpSchema, '1234567a')).toBe(OTP_INCOMPLETE);
  });
});

describe('emailSchema', () => {
  it('quita espacios y pasa a minúsculas', () => {
    expect(emailSchema.parse('  Ana@Mail.COM ')).toBe('ana@mail.com');
  });

  it('pide el correo si está vacío y avisa si no es válido', () => {
    expect(firstError(emailSchema, '')).toBe('Escribe tu correo.');
    expect(firstError(emailSchema, '   ')).toBe('Escribe tu correo.');
    expect(firstError(emailSchema, 'ana@')).toBe('Correo inválido.');
  });
});

describe('displayNameSchema y bioSchema', () => {
  it('el nombre visible no puede quedar vacío ni pasar de 30', () => {
    expect(firstError(displayNameSchema, '   ')).toBe('El nombre visible no puede estar vacío.');
    expect(firstError(displayNameSchema, 'x'.repeat(31))).toBe('El nombre visible puede tener como máximo 30 caracteres.');
    expect(displayNameSchema.parse(' Ana ')).toBe('Ana');
  });

  it('la bio admite vacío y hasta 200 caracteres', () => {
    expect(firstError(bioSchema, '')).toBeNull();
    expect(firstError(bioSchema, 'x'.repeat(201))).toBe('La bio puede tener como máximo 200 caracteres.');
  });
});

describe('titleSchema', () => {
  it('admite hasta 100 caracteres, contados sin los espacios de los extremos', () => {
    expect(firstError(titleSchema, 'x'.repeat(100))).toBeNull();
    expect(firstError(titleSchema, `  ${'x'.repeat(100)}  `)).toBeNull();
    expect(firstError(titleSchema, 'x'.repeat(101))).toBe('El título puede tener como máximo 100 caracteres.');
  });
});

describe('chatMessageSchema', () => {
  it('quita los espacios de los extremos', () => {
    expect(chatMessageSchema.parse('  hola  ')).toBe('hola');
  });

  it('rechaza un mensaje vacío o solo con espacios', () => {
    expect(firstError(chatMessageSchema, '')).toBe('El mensaje no puede estar vacío.');
    expect(firstError(chatMessageSchema, '    ')).toBe('El mensaje no puede estar vacío.');
  });

  it('admite hasta 300 caracteres', () => {
    expect(firstError(chatMessageSchema, 'x'.repeat(300))).toBeNull();
    expect(firstError(chatMessageSchema, 'x'.repeat(301))).toBe('El mensaje puede tener como máximo 300 caracteres.');
  });
});

describe('avatarFileSchema', () => {
  const MESSAGE = 'Elige una imagen JPG, PNG o WebP de hasta 2 MB.';
  const file = (size: number, type: string) => new File([new Uint8Array(size)], 'foto', { type });

  it('acepta JPG, PNG y WebP', () => {
    expect(firstError(avatarFileSchema, file(10, 'image/jpeg'))).toBeNull();
    expect(firstError(avatarFileSchema, file(10, 'image/png'))).toBeNull();
    expect(firstError(avatarFileSchema, file(10, 'image/webp'))).toBeNull();
  });

  it('rechaza otros tipos', () => {
    expect(firstError(avatarFileSchema, file(10, 'image/gif'))).toBe(MESSAGE);
    expect(firstError(avatarFileSchema, file(10, 'application/pdf'))).toBe(MESSAGE);
  });

  it('admite justo 2 MB y rechaza un byte más', () => {
    expect(firstError(avatarFileSchema, file(2 * 1024 * 1024, 'image/png'))).toBeNull();
    expect(firstError(avatarFileSchema, file(2 * 1024 * 1024 + 1, 'image/png'))).toBe(MESSAGE);
  });
});
