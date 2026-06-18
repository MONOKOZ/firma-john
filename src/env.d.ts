/// <reference path="../.astro/types.d.ts" />

// Cloudflare-Runtime-Env (Astro v6 + @astrojs/cloudflare): `import { env } from "cloudflare:workers"`.
// Minimale Deklaration für tsc (Werte sind Env-Strings/Secrets bzw. Bindings).
declare module "cloudflare:workers" {
  export const env: Record<string, any>;
}
