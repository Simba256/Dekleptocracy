# Project Tracker

> Last updated: 2026-03-18

## Project Summary
Dekleptocracy — a web app exposing how federal policies impact household costs, with AI chatbot, state reports, and data visualizations.

## Current Status
**Status**: Active

## In Progress
- [ ] Phase 2: Testing & Reliability (from IMPROVEMENT_ROADMAP.md)

## Recently Completed
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
- [ ] Phase 2: Testing & Reliability — unit tests, integration tests, error boundaries
- [ ] Phase 3: Performance — bundle splitting, caching, lazy loading
- [ ] Phase 4: Developer Experience — linting, CI/CD, documentation
- [ ] Rotate GNEWS_API_KEY and GEMINI_API_KEY (exposed in git history) — critical post-merge action

## Blockers
- None

## Key Decisions
- (2026-03-18) Short-lived access tokens (15m) + long-lived refresh tokens (30d) with server-side revocation via tokenVersion — balances security with UX
- (2026-03-18) Backward compat: existing 30d tokens (no `type` claim) accepted as valid access tokens until natural expiry — no forced logouts
- (2026-03-18) JWT_SECRET is now required at startup (process.exit(1)) — no more insecure fallback

## Notes
- Deployed: Frontend on Vercel, Express backend on Railway, MCP server separate
- Railway backend URL: `node-server-production-7f39.up.railway.app`
- API keys in gnews/ are in git history — must be rotated
