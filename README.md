# THIKANO

THIKANO is a student accommodation marketplace for finding rooms, PGs, hostels, and flats in Jabalpur. It includes a React/Vite frontend, an Express API for local preview mode, and optional Supabase authentication, database, and storage integration.

## Requirements

- Node.js 22.18 or newer
- Bun 1.4 or newer (recommended; the repository includes `bun.lock`)

## Run locally

From the project directory:

```sh
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The default local preview works without API keys and stores preview accounts and changes in `data/preview-db.json`. That file is generated locally and is intentionally excluded from Git.

You can use npm instead:

```sh
npm install
npm run dev
```

## Optional services

Copy `.env.example` to `.env.local` and add credentials only for the services you want to enable:

- **Supabase:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Apply the SQL files in `supabase/migrations/` in order, then optionally run `supabase/seed_demo.sql`.
- **Google Maps:** Set `VITE_GOOGLE_MAPS_API_KEY` and enable the required Maps APIs in Google Cloud.

Never commit `.env.local`, service-role keys, or other credentials. The Supabase anon key and browser Maps key are exposed to the client; configure their access policies and API-key restrictions in their respective dashboards.

## Check and build

```sh
bun run lint
bun run build
bun run clean
```

`npm run lint` performs the TypeScript check. `npm run build` creates the production frontend in `dist/`.

## Run the production server locally

Build first, then run:

```sh
npm run build
npm start
```

The Express server serves the built frontend and API on port `3000` (or `PORT` if set). The server uses Node.js built-in TypeScript type stripping, so production Node.js must be 22.18 or newer.

## Deployment note

The Express API and its JSON preview database require a Node.js server with writable local storage. `vercel.json` provides a frontend SPA rewrite only; it does not deploy the Express API. For a Vercel frontend deployment, configure Supabase and use a hosted API or add Vercel Functions before relying on server-backed preview features.

## GitHub

The included GitHub Actions workflow runs the TypeScript check and production build on pushes and pull requests. Before publishing, verify that `.env.local` and `data/preview-db.json` remain untracked and add your GitHub repository as the Git remote.
