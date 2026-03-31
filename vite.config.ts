import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/dmsGIS/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sidebarPrototype: resolve(__dirname, 'sidebar-prototype.html'),
      },
    },
  },
});
