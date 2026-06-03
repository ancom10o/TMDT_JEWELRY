import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://tmdt-jewelry.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/images': {
        target: 'https://tmdt-jewelry.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
