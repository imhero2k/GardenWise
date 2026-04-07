# GardenWise

**Grow Smart. Garden Responsibly.** — React + Vite app for plant search, local area, weather, and GitHub Pages hosting.

## GitHub Pages (important)

The live app is the **built** output in `dist/` (JS/CSS bundles), not the repo’s dev `index.html`.

If **Pages → Build and deployment** is set to **Deploy from a branch**, GitHub serves the repo root — including `index.html` that points at `/src/main.tsx`. That file is for local dev only, so **[the site will look blank or broken](https://imhero2k.github.io/GardenWise/)**.

**Fix:**

1. Repo **Settings → Pages**
2. **Build and deployment → Source:** choose **GitHub Actions** (not “Deploy from a branch”).
3. Let the workflow **Deploy GardenWise (Vite) → GitHub Pages** run on `main` (it runs `npm run build` and uploads `dist/`).

Optional: remove any old workflow that uses `jekyll-build-pages` so only the Vite workflow deploys.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_MAPS_API_KEY` if you want Google Weather (otherwise Open-Meteo is used).

## Scripts

| Script        | Purpose                          |
| ------------- | -------------------------------- |
| `npm run dev` | Dev server                       |
| `npm run build` | Production build + `404.html` for SPA |
| `npm run typecheck` | TypeScript check only      |
| `npm run lint`    | ESLint                     |
