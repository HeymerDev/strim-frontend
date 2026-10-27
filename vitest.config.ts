// Configuración de las pruebas unitarias: hereda la de Vite (plugins y alias) y suma el bloque `test`.
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['test/**/*.test.{ts,tsx}'],
      setupFiles: ['test/setup.ts'],
      // Margen para cuando toda la batería corre en paralelo.
      testTimeout: 15000,
      // Cada prueba empieza con los mocks en su implementación original y sin llamadas registradas.
      restoreMocks: true,
      mockReset: true,
      unstubGlobals: true,
      // `src/lib/api.ts` lee VITE_API_URL al importarse y `src/lib/validation.ts` lee VITE_OTP_LENGTH.
      env: { VITE_API_URL: 'http://api.test', VITE_OTP_LENGTH: '8' },
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/main.tsx', 'src/pages/DevUiPage.tsx', 'src/vite-env.d.ts'],
      },
    },
  }),
);
