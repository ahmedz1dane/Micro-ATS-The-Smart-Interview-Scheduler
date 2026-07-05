import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api/* to the Express backend so the frontend can use
// same-origin relative URLs (no CORS juggling during development).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
