# College Basketball Watch Buddy — Claude Code Context

## ⚡ Standing Instructions for Claude

1. **Always update this file** at the end of any session where features were completed,
   bugs were fixed, or architecture changed. Update "Current State" and "Recent Changes",
   then commit the updated CLAUDE.md alongside the other changes in the same push.

2. **Always follow TDD for new features:**
   - Write tests that FAIL first (red phase) — covering all specified requirements
   - Implement the feature until all tests PASS (green phase)
   - Run `npm run test:run` to confirm before committing
   - Every commit must include both the tests and the implementation
   - Test files go in a `__tests__/` folder adjacent to the component being tested

---

## Project Overview

College Basketball Watch Buddy (CBWB) is a real-time watchability scoring app for
college basketball games. It tells users which games are worth switching to based on a
proprietary "Watch Score" (0–100) computed from live game factors. Live games are ranked
by excitement at the top; scheduled games show pregame context and predictions.

**Live URL:** cbwb.vercel.app
**Repo:** github.com/jdm5798/cbwb

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server + Client components) |
| UI | React 19, TypeScript 5.7 (strict), Tailwind CSS v3 |
| Data fetching | SWR 2.3 (30s polling for live updates) |
| ORM | Prisma 6 → PostgreSQL |
| DB (local) | Docker → Postgres 16 (`docker compose up -d`) |
| DB (production) | Neon PostgreSQL |
| Hosting | Vercel (auto-deploys from GitHub `main`) |
| Testing | Vitest + React Testing Library + jest-dom + jsdom |
| AI | Anthropic SDK (Claude — future live summaries) |
| Utilities | clsx, tailwind-merge, cheerio (HTML/XML parsing) |

---

## Architecture & Data Flow

```
ESPN API
  ↓  EspnProvider.fetchGames()          src/lib/providers/espn/EspnProvider.ts
  ↓  upsertGames()                      src/lib/db/games.ts
BartTorvik / Haslametrics APIs
  ↓  fetchBartTorvik() / fetchHaslametrics()
  ↓  normalizeBartTorvik() / normalizeHaslametrics()
  ↓  findBestMatch() → upsertAdvancedStats()   POST /api/admin/ingest/advanced-stats
PostgreSQL (Neon / Docker)
  ↓  getGamesForDate()                  src/lib/db/games.ts
  ↓  computeWatchScore()                src/lib/watchscore/calculator.ts
  ↓  batch prefetch AdvancedStatsTeam   prisma.advancedStatsTeam.findMany()
  ↓  enrichWithStats()                  src/app/api/watchscore/route.ts
  ↓  GET /api/watchscore
  ↓  useWatchScore() SWR hook           src/hooks/useWatchScore.ts
React components                        src/components/now/
```

Data refreshes every 30 seconds for live games. ESPN is polled server-side;
if DB data is <35s old, it is served directly without re-fetching ESPN.

---

## Key File Map

### Types
- `src/types/game.ts` — `GameWithState`, `GameStatus`, `CanonicalGame`, `CanonicalTeam`
- `src/types/watchscore.ts` — `WatchScoreResult`, `WatchScoreInput`, `FactorScores`

### Data Layer
- `src/lib/db/games.ts` — `getGamesForDate()`, `upsertGames()`, `getGameById()`
- `src/lib/db/prisma.ts` — Prisma client singleton
- `prisma/schema.prisma` — full data model (Team, Game, LiveGameState, WatchScoreSnapshot, AdvancedStatsTeam)

### ESPN Integration
- `src/lib/providers/espn/EspnProvider.ts` — implements IDataProvider
- `src/lib/providers/espn/espnClient.ts` — `fetchEspnScoreboard()`, `fetchEspnGameSummary()`
- `src/lib/providers/espn/espnNormalizer.ts` — ESPN JSON → canonical types

### WatchScore Engine
- `src/lib/watchscore/calculator.ts` — `computeWatchScore(input)` pure function
- `src/lib/watchscore/factors/` — closeness, timeRemaining, leadChanges, upsetLikelihood, rankedStakes, tourneyImplications
- `config/watchscore.json` — factor weights and thresholds (editable via /admin)

### Advanced Stats Pipeline (Phase 2A/2B)
- `src/types/advancedStats.ts` — `BartTorvikTeamStats`, `HaslametricsTeamStats` types + Zod schemas
- `src/lib/providers/barttorvik/` — `barttorvikClient.ts` (Cloudflare fallback), `barttorvikNormalizer.ts` (positional arrays)
- `src/lib/providers/haslametrics/` — `haslametricsClient.ts` (Brotli XML), `haslametricsNormalizer.ts`
- `src/lib/reconciliation/teamMatcher.ts` — `normalizeTeamName`, `matchScore`, `findBestMatch` (Levenshtein + prefix boost)
- `src/lib/db/advancedStats.ts` — `upsertAdvancedStats`, `getAdvancedStatsForTeam`
- `src/lib/db/teamNameMapping.ts` — `getUnconfirmedMappings`, `confirmMapping`, `overrideMapping`
- `src/lib/watchscore/projectScore.ts` — `computeProjectedScores` (KenPom formula), `computeThrillScore`

### API Routes
- `src/app/api/watchscore/route.ts` — main endpoint; batch prefetches AdvancedStatsTeam + enriches all games
- `src/app/api/games/route.ts` — raw game list
- `src/app/api/games/[id]/route.ts` — single game
- `src/app/api/admin/ingest/route.ts` — manual ESPN ingest trigger
- `src/app/api/admin/ingest/advanced-stats/route.ts` — BartTorvik + Haslametrics ingest with AgentRun tracking

### Pages & Components
- `src/app/now/page.tsx` — main watchboard
- `src/app/admin/page.tsx` — data status + weight tuning
- `src/components/now/GameCard.tsx` — game list item (logos, rankings, records, pregame/live split); TV badge + thrill score in bottom-right of status section
- `src/components/now/HeroCard.tsx` — featured top game
- `src/components/now/GameDrawer.tsx` — detail slide-out panel
- `src/components/now/GameList.tsx` — groups cards by status
- `src/components/shared/ScoreBadge.tsx` — circular watch score badge
- `src/components/shared/FactorChip.tsx` — factor contribution chip
- `src/hooks/useWatchScore.ts` — SWR polling hook

### Tests
- `vitest.config.ts` — jsdom environment, React plugin, `@/*` path alias
- `src/test/setup.ts` — jest-dom matchers
- `src/components/now/__tests__/GameCard.test.tsx` — 24 tests
- `src/lib/providers/barttorvik/__tests__/barttorvikNormalizer.test.ts` — 11 tests
- `src/lib/providers/haslametrics/__tests__/haslametricsNormalizer.test.ts` — 15 tests
- `src/lib/reconciliation/__tests__/teamMatcher.test.ts` — 25 tests (includes prefix boost)
- `src/lib/watchscore/__tests__/projectScore.test.ts` — 12 tests
- **Total: 87 tests, all passing**

### data-testid Reference (GameCard)
| testid | element |
|---|---|
| `live-score` | away–home score display (live games) |
| `live-period` | period label + clock |
| `pregame-time` | formatted start time |
| `pregame-prediction` | predicted score display |
| `thrill-score` | pregame thrill score number |

---

## Current State

### What's Live & Working
- ESPN data ingestion (games, live scores, TV network, rankings, odds/spread)
- WatchScore algorithm with 6 factors (weights in `config/watchscore.json`)
- Game card redesign: team logos, national rankings, real W-L records, TV badge,
  pregame vs live conditional sections
- Admin page: data status, weight editor, ESPN ingest, advanced stats ingest button
- Vitest test suite: **87 tests passing** (5 test files)
- Vercel production deployment with Neon PostgreSQL
- **Phase 2A — Advanced Stats Ingestion Pipeline:**
  - BartTorvik: `barttorvik.com/{YYYY}_team_results.json` (positional array, 64% match rate)
    with Cloudflare detection + cbbdata API fallback (`CBBDATA_API_KEY` env var)
  - Haslametrics: `haslametrics.com/ratings.xml` (Brotli-compressed XML, 60% match rate)
  - Team reconciliation: Levenshtein + prefix boost fuzzy matching (0.80 threshold, 0.95 auto-confirm)
    `TeamNameMapping` table persists mappings; unmatched flagged for admin review
  - `POST /api/admin/ingest/advanced-stats` with AgentRun lifecycle tracking
- **Phase 2B — Stats Wired into Game Cards:**
  - `homeTeamRecord`/`awayTeamRecord`: real W-L from BartTorvik (null = graceful hide)
  - `pregamePrediction.homeScore/awayScore`: KenPom formula — `adjO × (adjD/102) × avgTempo/100`
  - `pregamePrediction.thrillScore`: `60% closeness + 40% barthag quality` (0–100)
  - Batch prefetch: one `AdvancedStatsTeam.findMany()` per API call (not 72 sequential lookups)

### Remaining Placeholder Data

| Field | Current value | Real source (future phase) |
|---|---|---|
| `pregamePrediction.whyItMatters` | `watchScore.explanation` | Claude API pregame summary |
| `liveContext.whyItMatters` | `watchScore.explanation` | Claude API live summary |

---

## Coding Conventions

- **Styling:** Tailwind CSS only — no CSS modules, no styled-components, no inline styles
- **Conditional classes:** always use `clsx()`
- **TypeScript:** strict mode — no `any`, no `@ts-ignore`
- **Components:** functional only; `"use client"` only when needed (hooks, event handlers)
- **Component size:** keep focused; extract sub-components when a block is reused elsewhere
- **Tests:** add `data-testid` to any element that needs to be targeted in tests
- **Dark theme palette:** zinc-950/900/800 base, orange-400/500 accent, green-400 for live indicators

---

## Running Locally

```bash
# Start local Postgres (first time or after machine restart)
docker compose up -d

# Start dev server
npm run dev
# → http://localhost:3000 (redirects to /now)

# Run tests
npm run test         # watch mode
npm run test:run     # single run, exits with pass/fail

# DB tools
npm run db:studio    # Prisma Studio GUI at localhost:5555
npm run db:migrate   # create + apply new migration (prompts for name)
npm run db:seed      # seed ~70 major NCAAB teams
```

---

## Deployment Workflow

```
git add <files>
git commit -m "description"
git push origin main
  → Vercel auto-builds (~1 min)
  → prisma migrate deploy runs automatically on build
  → live at cbwb.vercel.app
```

**Vercel GitHub auto-deploy setup (one-time, in browser):**
vercel.com → cbwb project → Settings → Git → Connect `jdm5798/cbwb` → branch: `main`

**Production env vars (already set on Vercel):**
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string

---

## What's Next / Known Gaps

- [ ] Connect Vercel GitHub integration for true auto-deploy (Vercel dashboard — not yet done)
- [ ] Claude API integration for live and pregame "why it matters" summaries (Phase 2C)
- [ ] Expand team name matching for low-major programs (259 BT / 234 Hasl unmatched — low-major schools with no DB entry)
- [ ] Tournament bubble tracking / conference standings
- [ ] Push or in-app notifications for high watch-score games
- [ ] HeroCard and GameDrawer deeper redesign (baseline done, future iterations planned)

---

## Recent Changes

| Date | Description |
|---|---|
| 2026-02-26 | Phase 2B: Wire advanced stats into game cards — real W-L records, KenPom projected scores, thrill score formula; 87 tests |
| 2026-02-26 | Fix team name matching: prefix boost (≥2-word guard) + VCU/Miami FL/OH aliases; BT 29%→64%, Hasl 36%→60% |
| 2026-02-26 | Phase 2A: BartTorvik + Haslametrics ingestion pipeline; TeamNameMapping model; admin UI button |
| 2026-02-25 | GameCard: "Thrill Score" label added below ScoreBadge; TV badge + thrill moved to bottom-right |
| 2026-02-25 | Game card redesign: logos, records, rankings, pregame/live split sections; 24 GameCard tests |
| 2026-02-25 | Deployed to Vercel + Neon PostgreSQL; CLAUDE.md created |
