# 🤽 Water Polo Scoring Sheet

A courtside-ready, installable web app for scoring water polo games: game clock, shot
clock, score, assists, shots, ejections (exclusions), penalties, extra-man stats, and
more — built to run great on a phone or tablet at poolside, online or off.

## Features

- **Game clock** — countdown per period, configurable length/period count, ±1s corrections, start/pause.
- **Shot clock** — 30s (or configurable) countdown with quick 30/20/reset buttons and independent start/pause.
- **Score & period tracking** with FINA-style period navigation.
- **Goals & assists** — tap a player, tap Goal, pick the assisting teammate (or none) in one flow.
- **Shot outcomes** — saved / missed / blocked / off-post, per player and team, with shooting % in stats.
- **Exclusions (ejections)** — 20s countdown chips per excluded player, optional "drawn by" opponent tagging, whistle alert on expiry, tap-to-return.
- **Penalties** — 5m penalty shot make/miss tracking.
- **Extra-man (power play) stats** — auto-suggested man-up flag on goals scored while an opponent is excluded; EMO/EM-goal team totals.
- **Other stats** — steals, turnovers, sprint (center draw) wins, goalie saves (auto-credited from opponent saved shots).
- **Timeouts** — per-team timeout tracking with a configurable allowance.
- **Undo** — step back through the last ~40 scoring actions.
- **Play-by-play log** — full event timeline, deletable entries.
- **Stats tables** — full per-player/team box score.
- **Export** — stats CSV, play-by-play CSV, and a plain-text game sheet.
- **Multiple games** — saved locally, resume any in-progress or past game.
- **Audio + vibration alerts** — shot-clock buzzer/warning beeps, period-end buzzer, exclusion-expiry whistle (toggleable).
- **Installable PWA** — add to home screen, works fully offline once loaded (all data is stored locally in the browser — no backend required).
- **Dark, high-contrast UI** tuned for outdoor/poolside screen glare.

All game data is stored in the browser's `localStorage`. There is no backend/database —
each device keeps its own games. Use the CSV/text export buttons to save or share a
finished game sheet.

## Local development

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Deploying

This is a static site (Vite build output in `dist/`) — it can be deployed to any static
host. Pick whichever of your three targets is easiest:

### Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, select this repo.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. SPA routing is already handled via `public/_redirects` (`/* /index.html 200`).

Or via CLI:

```bash
npm run build
npx wrangler pages deploy dist --project-name waterpolo-scoresheet
```

### Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new), **or** run:

```bash
npm i -g vercel
vercel --prod
```

Vercel auto-detects the Vite framework; `vercel.json` in this repo pins the build
command/output directory and adds the SPA rewrite fallback.

### AWS

**Option A — AWS Amplify Hosting (simplest):**

1. In the Amplify console, **New app → Host web app**, connect this repo.
2. Amplify picks up `amplify.yml` in this repo automatically (build command `npm run build`, output `dist`).
3. Deploy.

**Option B — S3 + CloudFront (more control):**

```bash
npm run build
aws s3 sync dist/ s3://YOUR_BUCKET_NAME --delete
```

- Enable S3 static website hosting, or (recommended) put a CloudFront distribution in
  front of the bucket with the S3 bucket as an Origin Access Control origin.
- Set the CloudFront **error response**: for HTTP error code `403` and `404`, respond
  with `/index.html`, HTTP response code `200` — this makes client-side routing work.

## Project structure

```
src/
  types.ts               game/domain data model
  store/gameStore.ts     Zustand store: game state, actions, undo, localStorage persistence
  hooks/useClockTick.ts  drift-corrected clock/shot-clock ticking + alert sounds
  utils/stats.ts         derived per-player/team stat computation
  utils/csvExport.ts     CSV / text game-sheet export
  utils/sound.ts         WebAudio buzzer/whistle beeps (no external audio files)
  components/            Scoreboard, TeamPanel, ExclusionBar, EventLog, StatsTable,
                          GameSetup, GameList
```

## Notes on rules modeled

- Exclusions run 20s of game time by default (configurable) and pause when the game
  clock is paused, matching real exclusion behavior.
- "Man-up" is suggested automatically (any active opponent exclusion) when logging a
  goal, but is a checkbox you can override — matches how offsetting exclusions or
  simultaneous fouls are handled in practice.
- Saves are attributed to the fielded goalie (flagged at roster setup) automatically
  whenever the opposing team logs a "saved" shot.
