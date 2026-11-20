import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure static build: everything ends up in dist/ and can be served by any
// static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages).
// `base: './'` keeps asset URLs relative so the app also works from a sub-path
// such as https://<user>.github.io/hadsi-sketch/.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
  server: { host: true },
  preview: { host: true },
});
