# VCL CarCare — staff web app

Shop management for VCL CarCare (car wash & detailing, multiple branches): receive cars, payment, counter sales (POS), stock, reports and payroll. UI in Lao, mobile-first, installable (PWA).

Built with Vite + React + TypeScript. Talks to the VCL CarCare API (NestJS) — see `src/lib/api.ts`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## API

Production API (Render + Supabase): `https://vcl-carcare-api.onrender.com`

- Health check: `https://vcl-carcare-api.onrender.com/health`
- App requests go to `/api/v1` on that origin. Do **not** put `/health` in `VITE_API_URL`.

For a local NestJS API, leave `VITE_API_URL` empty so the Vite server proxies `/api` and `/uploads` to `http://localhost:4000` (`vite.config.js`). That also works on phones on the same Wi-Fi.

## Environment

| Variable | Value |
|---|---|
| `VITE_API_URL` | Empty for a local API. Cloud / Vercel: `https://vcl-carcare-api.onrender.com` |

The API must also list the web app's domain in its `CORS_ORIGINS` (localhost + the Vercel URL).

## Deploy (Vercel)

`vercel.json` sets the build (`npm run build` → `dist`) and the single-page-app fallback.

In the Vercel project:

1. Settings → Environment Variables
2. Add `VITE_API_URL` = `https://vcl-carcare-api.onrender.com` (Production, Preview, Development)
3. Redeploy so the build picks up the variable

On Render, add the Vercel domain (and `http://localhost:5173`) to `CORS_ORIGINS`.
