import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (normalized.includes('jspdf') || normalized.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (normalized.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (normalized.includes('react') || normalized.includes('react-dom') || normalized.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (normalized.includes('axios')) {
              return 'vendor-axios';
            }
          }
        },
      },
    },
  },
});
