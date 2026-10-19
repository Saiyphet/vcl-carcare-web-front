import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = (env.VITE_API_URL || 'http://localhost:4000').replace(/\/health$/i, '').replace(/\/+$/, '');
  const proxy = {
    '/api': { target, changeOrigin: true, timeout: 0, proxyTimeout: 0 },
    '/uploads': { target, changeOrigin: true, timeout: 0, proxyTimeout: 0 },
  };
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      proxy,
    },
    preview: {
      port: 4173,
      host: true,
      allowedHosts: true,
      proxy,
    },
  };
});
