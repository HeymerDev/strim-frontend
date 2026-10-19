import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El CORS del backend solo acepta este origen: si el puerto está ocupado, falla en vez de cambiarlo.
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
