# Project Tracker

> Last updated: 2026-03-21

## Project Summary
Dekleptocracy — a web app exposing how federal policies impact household costs, with AI chatbot, state reports, and data visualizations.

## Current Status
**Status**: Active

## In Progress
- None

## Recently Completed
- [x] Phase 4: ESLint server + CI expansion (2026-03-21)
  - Server ESLint flat config with Node.js globals, Express arg patterns, vitest test globals
  - Fixed 40 server + 50 client lint violations (unused vars, missing globals, catch errors)
  - CI expanded from server-tests-only to 3 parallel jobs: lint, build-client, test
- [x] Chatbot visual redesign — CSS rewrite (1805→~600 lines), JSX restructure (2026-03-21)
  - 768px centered message column matching modern chat UIs
  - Removed header (navbar sufficient), location badge only when set
  - Welcome state with pill buttons replacing emoji card grid
  - Icon-only actions, coral text follow-ups, 240px clean sidebar
  - Removed 30+ `--chatbot-*` custom properties, using global tokens directly
- [x] Phase 3 CI verified — all tests pass in GitHub Actions (2026-03-21)
- [x] Phase 3: Performance & Caching (2026-03-21)
  - N+1 fix on map-data, parallelized state data, in-memory TTL cache, lazy loading
- [x] Phase 2: Backend Reliability (2026-03-20)
  - 6 test suites / 74 tests, Zod validation, Sentry stub
- [x] CI: GitHub Actions workflow for server tests (2026-03-20)
- [x] Phase 1: Security Hardening (2026-03-18)
  - API key cleanup, JWT fail-hard, refresh tokens, console guards
- [x] Production cleanup — constants, console removal, a11y (2026-03-18)
- [x] Voice input support for chatbot (2026-03-18)
- [x] Remove unimplemented Compare States feature (2026-03-18)
- [x] Bundle TopoJSON locally to fix map CSP error (2026-03-18)
- [x] Phase 9: Monitoring & analytics implementation (2026-03-07)
- [x] Phase 8: Documentation (2026-03-07)
- [x] Phase 7: Testing infrastructure (2026-03-07)
- [x] Phase 6: Security hardening — earlier round (2026-03-07)
- [x] Phase 5: Accessibility compliance (2026-03-07)
- [x] Phase 4: Performance optimization — Lighthouse 95/100 a11y (2026-03-07)
- [x] Design tokens refactor — replace hardcoded colors (2026-03-07)

## Upcoming / Planned
- [ ] Developer Experience remaining — Prettier, pre-commit hooks
- [ ] Install @sentry/node + @sentry/react and activate with real DSN
- [ ] Rotate GNEWS_API_KEY and GEMINI_API_KEY (exposed in git history) — critical

## Blockers
- None

## Key Decisions
- (2026-03-21) In-memory cache over Redis — single-process app on Railway, no external dependency needed
- (2026-03-20) Vitest over Jest — client already uses Vitest, ESM works out of the box
- (2026-03-20) mongodb-memory-server for isolated in-memory DB per test run
- (2026-03-20) Zod v4 for request validation — additive middleware, no behavior changes for valid requests
- (2026-03-18) Short-lived access tokens (15m) + long-lived refresh tokens (30d) with server-side revocation
- (2026-03-18) JWT_SECRET required at startup (process.exit(1)) — no insecure fallback

## Notes
- Deployed: Frontend on Vercel, Express backend on Railway, MCP server separate
- Railway backend URL: `node-server-production-7f39.up.railway.app`
- API keys in gnews/ are in git history — must be rotated
- Tests require network on first run (mongodb-memory-server downloads ~100MB binary)
- Earlier Phases 4-9 (Feb-Mar) were a different numbering — performance, a11y, security, testing, docs, monitoring
- Our recent Phases 1-3 focused on security hardening, backend reliability, and caching
