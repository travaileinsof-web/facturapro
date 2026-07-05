import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

const copyBackendPlugin = () => ({
  name: 'copy-backend',
  closeBundle() {
    const srcDir = path.resolve(__dirname, 'backend');
    const destDir = path.resolve(__dirname, 'dist', 'backend');
    if (fs.existsSync(srcDir)) {
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log('Backend directory copied to dist/backend');
    }
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), copyBackendPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 3003,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => {
            const cleanPath = path.split('?')[0];
            const endpoint = cleanPath.replace(/^\/api\//, '').replace(/^\/api$/, '');
            const qs = path.includes('?') ? path.substring(path.indexOf('?') + 1) : '';
            const qsPart = qs ? '&' + qs : '';
            return '/api.php?endpoint=' + endpoint + qsPart;
          }
        },
        '/backend/uploads': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend\/uploads/, '/uploads')
        }
      }
    },
  };
});
