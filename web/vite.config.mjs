import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: '../dist/web', // <--- Change this to output to dist/web
    emptyOutDir: true,     // <--- Clear old files before building
    target: 'esnext',
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
