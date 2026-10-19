import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, any request to /api is forwarded to the Express server.
// That keeps cookies and CORS simple (the browser only talks to one origin).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
