/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Dígitos del código de Supabase (6 a 10). Por defecto, 8. */
  readonly VITE_OTP_LENGTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
