import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Same-origin from the browser's point of view, so the session
      // cookie just works — no CORS configuration needed. Caddy does the
      // same /api proxying in production, so this mirrors the real setup.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
