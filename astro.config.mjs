import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// output bleibt 'static' (Default): Seiten werden vorgebaut, AUSSER sie setzen
// `export const prerender = false` (z. B. index.astro = SSR/Live-Read am Edge).
export default defineConfig({
  // imageService 'compile' vermeidet das Cloudflare-IMAGES-Runtime-Binding (nutzen wir nicht).
  adapter: cloudflare({ imageService: 'compile' }),
  // Eigener (ungenutzter) Session-Treiber → Adapter erzeugt KEIN Cloudflare-KV-SESSION-Binding.
  // Auth (M3) wird ein signiertes Cookie, kein KV-Session-Store. KV ggf. später bewusst nachrüsten.
  session: { driver: 'memory' },
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
