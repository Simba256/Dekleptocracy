# Project Tracker

> Last updated: 2026-03-20

## Project Summary
Dekleptocracy — a web app exposing how federal policies impact household costs, with AI chatbot, state reports, and data visualizations.

## Current Status
**Status**: Active

## In Progress
- [ ] Verify Phase 2 tests pass on Railway (mongodb-memory-server needs first-run binary download)

## Recently Completed
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
- [ ] Phase 3: Performance — bundle splitting, caching, lazy loading
- [ ] Phase 4: Developer Experience — linting, CI/CD, documentation
- [ ] Install @sentry/node + @sentry/react and activate with real DSN
- [ ] Rotate GNEWS_API_KEY and GEMINI_API_KEY (exposed in git history) — critical post-merge action

## Blockers
- None

## Key Decisions
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
