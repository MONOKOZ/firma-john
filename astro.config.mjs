import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// output bleibt 'static' (Default): Seiten werden vorgebaut, AUSSER sie setzen
// `export const prerender = false` (z. B. index.astro = SSR/Live-Read am Edge).
export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '.',
      },
    },
  },
});
