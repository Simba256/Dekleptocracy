# Project Tracker

> Last updated: 2026-03-21

## Project Summary
Dekleptocracy — a web app exposing how federal policies impact household costs, with AI chatbot, state reports, and data visualizations.

## Current Status
**Status**: Active

## In Progress
- [ ] Verify Phase 3 tests pass in CI (local env lacks mongodb-memory-server binary)

## Recently Completed
- [x] Phase 3: Performance & Caching — full implementation (2026-03-21)
  - Fixed Vite config bug (misplaced `optimizeDeps` in `build.rollupOptions`)
  - Added `charts` manual chunk separating d3/map libs (~160KB) for lazy loading
  - N+1 fix on `/api/homepage/map-data`: single aggregation via `getAllMapData()` replaces 300+ queries
  - Parallelized `getAllStateData()` with `Promise.all()` (7x latency reduction)
  - In-memory TTL cache (`server/utils/memoryCache.js`) with 200-entry max + oldest eviction
  - Cached 7 endpoints (map-data 10m, /all 5m, reports 15m, static endpoints 30m)
  - HTTP Cache-Control headers on all cached endpoints
  - `maxAge: '1d'` on `/uploads` static serving
  - Cache invalidation in scheduler after data refresh
  - LazySection component with IntersectionObserver for PriceMapSection
  - Tests for memoryCache (set/get, TTL, eviction, clear) + map-data + Cache-Control headers
- [x] Phase 2: Backend Reliability — full implementation (2026-03-20)
  - Refactored server/index.js → app.js + index.js (supertest-compatible)
  - Vitest + mongodb-memory-server + supertest test infrastructure
  - 6 test suites / 74 test cases across all route files (auth, articles, user, seo, reports, homepage)
  - Zod request validation on auth, articles, user, and reports routes
  - Validation middleware (server/middleware/validate.js)
  - Rate limiter disabled in test env to prevent flaky tests
  - Sentry integration stub ready (server/utils/sentry.js + .env.example)
- [x] Phase 1: Security Hardening — all 5 tasks complete, deployed and verified on Railway (2026-03-18)
  - Removed hardcoded API keys from gnews/server.py
  - JWT_SECRET fail-hard on missing env var
  - Shared verifyToken middleware + .env.example files
  - Console calls guarded behind import.meta.env.DEV
  - Refresh token strategy (15m access + 30d refresh + revocation)
- [x] Production cleanup — constants, console removal, a11y (2026-03-18)
- [x] Voice input support for chatbot (2026-03-18)
- [x] Multi-phase improvement roadmap documented (2026-03-18)

## Upcoming / Planned
- [ ] Phase 4: Developer Experience — linting, CI/CD, documentation
- [ ] Install @sentry/node + @sentry/react and activate with real DSN
- [ ] Rotate GNEWS_API_KEY and GEMINI_API_KEY (exposed in git history) — critical post-merge action

## Blockers
- None

## Key Decisions
- (2026-03-21) In-memory cache over Redis — single-process app on Railway, no external dependency needed; cache.clear() on scheduler refresh is sufficient invalidation
- (2026-03-20) Vitest over Jest — client already uses Vitest, ESM works out of the box
- (2026-03-20) mongodb-memory-server for isolated in-memory DB per test run
- (2026-03-20) Zod v4 for request validation — additive middleware, no behavior changes for valid requests
- (2026-03-20) Sentry installed as stub (no SDK dep) — activate when DSN is available
- (2026-03-18) Short-lived access tokens (15m) + long-lived refresh tokens (30d) with server-side revocation via tokenVersion — balances security with UX
- (2026-03-18) Backward compat: existing 30d tokens (no `type` claim) accepted as valid access tokens until natural expiry — no forced logouts
- (2026-03-18) JWT_SECRET is now required at startup (process.exit(1)) — no more insecure fallback

## Notes
- Deployed: Frontend on Vercel, Express backend on Railway, MCP server separate
- Railway backend URL: `node-server-production-7f39.up.railway.app`
- API keys in gnews/ are in git history — must be rotated
- Tests require network on first run (mongodb-memory-server downloads ~100MB binary)
