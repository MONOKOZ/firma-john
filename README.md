# firma-john

Statische **Astro**-Website (SSG) mit **Google Sheets als CMS**. React (React 19) wird nur auf `/admin` geladen (`client:only`); die Startseite verschickt kein React. Styling via Tailwind 4, Auth/Storage via Firebase.

> Diese Codebasis wird zu einem deploy-neutralen Master-CMS umgebaut (Cloudflare-Standard, Vercel-Premium-Opt-in). Architektur & Milestones siehe Handoff-Dokument `KONZEPT_v2-Architektur_Claude-Code-Handoff.md`.

## Lokal starten

**Voraussetzung:** Node.js

```bash
npm install
npm run dev      # http://localhost:3000
```

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Dev-Server (Port 3000) |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal vorschauen |
| `npm run lint` | `tsc --noEmit` (Typprüfung) |
| `npm run clean` | `dist/` + `.astro/` löschen |

## Environment

Siehe `.env.example`. Secrets (Service Account, Deploy-Hook, Firebase-Admin) gehören in die Plattform-Env (Cloudflare/Vercel) — **nie ins Repo**.
