# College Basketball Watch Buddy — Setup Guide

## ⚠️ Important: Move Project Out of OneDrive

This project is currently in an OneDrive-synced folder. OneDrive tries to sync `node_modules`
(636MB+), which makes npm commands very slow and wastes disk space.

**Project has been moved to:**
```bash
cd ~/JulianVSProjects/cbwb
```

Originally moved from `~/Library/CloudStorage/OneDrive-Accenture/Documents/College Basketball Watch Buddy`.

---

## Prerequisites

1. **Node.js** (v20+) — installed via Homebrew: `brew install node`
2. **Docker Desktop** — download from https://www.docker.com/products/docker-desktop/
   - After installing, open Docker Desktop and let it start
3. **Anthropic API key** — needed for Phase 2 agent ingestion (not required for MVP)

---

## First-Time Setup

### 1. Navigate to the project directory and install dependencies
```bash
cd ~/JulianVSProjects/cbwb
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local — add your ANTHROPIC_API_KEY when you have one
```

### 3. Start local Postgres
```bash
docker compose up -d
```
- Postgres will be available at `localhost:5432`
- pgAdmin (DB browser) will be available at http://localhost:5050
  - Email: `admin@local.dev` / Password: `admin`
  - Add server: host `postgres`, user `watchbuddy`, password `watchbuddy_dev`

### 4. Run database migrations
```bash
npm run db:migrate
# When prompted for migration name, type: init
```

### 5. Seed teams (optional but recommended)
```bash
npm run db:seed
```
Seeds ~70 major NCAAB teams with ESPN IDs and aliases.

### 6. Start the dev server
```bash
npm run dev
```
Open http://localhost:3000 → redirects to `/now`

---

## Daily Usage

```bash
# Start Postgres (if not already running)
docker compose up -d

# Start dev server
npm run dev
```

The app polls ESPN every 30 seconds automatically once loaded.

**Manual data refresh** (if ESPN data looks stale):
- Go to http://localhost:3000/admin
- Click **"↻ Fetch ESPN Now"**

---

## Verifying It Works

1. Open http://localhost:3000/now
2. You should see today's NCAAB schedule loaded from ESPN
3. Live games will appear at the top ranked by Watch Score
4. Click any game to see the detail drawer with score breakdown
5. Open http://localhost:3000/admin to see data status and tune weights

---

## Future: Deploying to Vercel + Cloud DB

When ready to move to Vercel:

1. Create a Neon Postgres database at https://neon.tech (free tier available)
2. Update `.env.local` (or Vercel env vars):
   ```
   DATABASE_URL="postgresql://...pooler.neon.tech/watchbuddy?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://...ep-xxx.neon.tech/watchbuddy"
   ```
3. Uncomment `directUrl` in `prisma/schema.prisma`
4. Deploy: `vercel deploy`
5. Run migrations on cloud DB: `npx prisma migrate deploy`

---

## Disk Space Note

Your main drive is currently ~98% full (~2.8GB free). After moving the project out of OneDrive
and installing node_modules locally, monitor disk usage. The `node_modules` directory is ~636MB.

Consider:
- Using `npm ci --omit=dev` in production to reduce install size
- Running `docker system prune` periodically to free Docker image cache

---

## Project Structure

```
config/watchscore.json     ← Watch Score weights (edit via Admin page)
docker-compose.yml         ← Local Postgres + pgAdmin
prisma/schema.prisma       ← Full data model
src/app/now/               ← Live watchboard (MVP)
src/app/admin/             ← Admin: data status + weight tuning
src/lib/providers/espn/    ← ESPN data integration
src/lib/watchscore/        ← Scoring engine + factor modules
src/lib/db/                ← Prisma client + DB helpers
```
