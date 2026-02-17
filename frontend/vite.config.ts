import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Base configuration for both environments
  const config: UserConfig = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      postcss: './postcss.config.cjs',
    },
    server: {
      // These settings are for your EC2 instance to work behind Nginx
      host: '0.0.0.0',
      allowedHosts: ['hdc.angelfhr.com'],
      hmr: true,
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx'],
      },
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };

  // Add the proxy ONLY for local development
  if (mode === 'development' && config.server) {
    config.server.proxy = {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    };
  }

  return config;
});