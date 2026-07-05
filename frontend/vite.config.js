import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api/* to the Express backend so the frontend can use
// same-origin relative URLs (no CORS juggling during development). The backend
// port can be overridden via BACKEND_PORT so run.sh can move it if 4000 is busy.
const backendPort = process.env.BACKEND_PORT || 4000;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
