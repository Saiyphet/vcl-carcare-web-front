# VCL CarCare — staff web app

Shop management for VCL CarCare (car wash & detailing, multiple branches): receive cars, payment, counter sales (POS), stock, reports and payroll. UI in Lao, mobile-first, installable (PWA).

Built with Vite + React + TypeScript. Talks to the VCL CarCare API (NestJS) — see `src/lib/api.ts`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

The API must run on `http://localhost:4000`. With `VITE_API_URL` empty, the dev server proxies `/api` and `/uploads` to it (`vite.config.js`), so phones on the same Wi-Fi work too.

## Environment

| Variable | Value |
|---|---|
| `VITE_API_URL` | Empty for local dev. On Vercel: the public HTTPS URL of the API, e.g. `https://api.example.com` |

The API must also list the web app's domain in its `CORS_ORIGINS`.

## Deploy (Vercel)

`vercel.json` sets the build (`npm run build` → `dist`) and the single-page-app fallback. Set `VITE_API_URL` in the Vercel project settings before deploying.
