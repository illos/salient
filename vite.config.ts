import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5180, strictPort: true,
      proxy: {
        '/convex-api': { target: env.VITE_CONVEX_URL || 'http://127.0.0.1:3210', ws: true, rewrite: p => p.replace(/^\/convex-api/, '') },
        '/api/auth': { target: env.VITE_CONVEX_SITE_URL || 'http://127.0.0.1:3211', changeOrigin: true },
      },
    },
  };
});
