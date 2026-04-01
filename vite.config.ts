import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/dmsGIS/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/ol/')) {
            return 'ol-vendor';
          }

          if (id.includes('@turf/')) {
            return 'turf-vendor';
          }

          if (id.includes('@dnd-kit/')) {
            return 'dragdrop-vendor';
          }

          if (id.includes('@radix-ui/')) {
            return 'radix-vendor';
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/zod/')) {
            return 'zod-vendor';
          }

          if (id.includes('/zustand/')) {
            return 'zustand-vendor';
          }

          return 'vendor';
        },
      },
      input: {
        main: resolve(__dirname, 'index.html'),
        sidebarPrototype: resolve(__dirname, 'sidebar-prototype.html'),
      },
    },
  },
});
