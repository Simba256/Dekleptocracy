# Improvement Roadmap

Comprehensive tracking document for all identified improvements, organized into progressive phases that respect dependencies.

> **Replaces** `PRODUCTION_ROADMAP.md` as the forward-looking improvement tracker.

---

## Phase 1: Security Hardening (CRITICAL)

**Why first:** Active vulnerabilities. Hardcoded keys and weak JWT fallback are exploitable now.

| Status | Task | Files | Description |
|--------|------|-------|-------------|
| [ ] | Move hardcoded API keys to env vars | `gnews/server.py` | GNews + Gemini keys are in source code |
| [ ] | Fail hard on missing JWT_SECRET | `server/routes/authRoutes.js` | Remove weak default fallback |
| [ ] | Implement refresh token strategy | `server/routes/authRoutes.js`, `server/models/User.js`, `client/src/utils/auth.js` | Short-lived access + refresh tokens |
| [ ] | Audit .env exposure | `server/.env`, `.gitignore` | Ensure no secrets in git history |
| [ ] | Guard remaining console.error calls | 5+ frontend files | Wrap in `import.meta.env.DEV` checks |

**Success criteria:** No secrets in source code, JWT fails closed, console output silent in production.

---

## Phase 2: Backend Reliability

**Why second:** Zero backend test coverage means any deploy can break production.

| Status | Task | Files | Description |
|--------|------|-------|-------------|
| [ ] | Set up Jest test framework | `server/package.json`, `server/jest.config.js` | Test runner + MongoDB memory server |
| [ ] | Auth route tests | `server/__tests__/auth.test.js` | Signup, login, Google OAuth, token verify |
| [ ] | Article route tests | `server/__tests__/articles.test.js` | CRUD, pagination, filtering |
| [ ] | Report route tests | `server/__tests__/reports.test.js` | State data, cache, scheduler |
| [ ] | Add request validation (Zod) | `server/routes/*.js`, `server/middleware/validate.js` | Schema validation on all endpoints |
| [ ] | Integrate Sentry error tracking | `server/index.js`, `client/src/main.jsx` | Production error visibility |

**Success criteria:** 80%+ backend route coverage, all inputs validated, errors tracked in production.

---

## Phase 3: Performance & Caching

**Why third:** Biggest user-facing impact. Every request currently hits MongoDB directly.

| Status | Task | Files | Description |
|--------|------|-------|-------------|
| [ ] | Add Redis caching layer | `server/utils/cache.js`, `server/index.js` | In-memory cache for hot data |
| [ ] | Cache homepage aggregated data | `server/routes/homepageRoutes.js` | 5-min TTL, invalidate on data change |
| [ ] | Cache state report data | `server/routes/reportRoutes.js` | TTL-based, stale-while-revalidate |
| [ ] | Fix Vite config bug | `client/vite.config.js` | `optimizeDeps` in wrong location, being ignored |
| [ ] | Dynamic import heavy deps in pages | `client/src/pages/StateReport.jsx` | html2canvas + jspdf loaded on demand |

**Success criteria:** Homepage loads <500ms (cached), report pages <1s, no unnecessary full-bundle imports.

---

## Phase 4: Frontend Architecture

**Why fourth:** Maintainability. Large components slow down development velocity.

| Status | Task | Files | Description |
|--------|------|-------|-------------|
| [ ] | Break up Chatbot.jsx (1,159 lines) | `client/src/pages/Chatbot.jsx` → extract `ChatSidebar`, `ChatMessages`, `ChatInput` | Separate concerns |
| [ ] | Break up StateReport.jsx (915 lines) | `client/src/pages/StateReport.jsx` → extract sections + PDF logic | Separate concerns |
| [ ] | Remove duplicate auth functions | `client/src/utils/auth.js` | `clearAuth()` duplicates `logout()` |
| [ ] | Remove redundant useHomepageData hook | `client/src/hooks/useHomepageData.js` | Duplicates HomepageContext logic |
| [ ] | Add page-level integration tests | `client/src/__tests__/` | Test critical user flows |

**Success criteria:** No component >400 lines, no duplicate utilities, critical flows tested.

---

## Phase 5: Infrastructure & DevOps

**Why fifth:** Deploy confidence. Currently no automated checks before production.

| Status | Task | Files | Description |
|--------|------|-------|-------------|
| [ ] | Dockerize Node.js server | `server/Dockerfile`, `docker-compose.yml` | Consistent environments |
| [ ] | CI/CD pipeline | `.github/workflows/ci.yml` | Lint → test → build → deploy |
| [ ] | API documentation (Swagger/OpenAPI) | `server/docs/`, `server/swagger.js` | Auto-generated from routes |
| [ ] | Health check endpoints | `server/routes/healthRoutes.js` | DB, Redis, MCP server status |
| [ ] | Database migration tooling | `server/migrations/` | Safe schema evolution |

**Success criteria:** One-command deploy, automated test gates, documented API, observable health.

---

## Phase 6: Future Scale (Nice-to-Have)

**Why last:** Aspirational investments for long-term growth.

| Status | Task | Description |
|--------|------|-------------|
| [ ] | TypeScript migration (frontend) | Compile-time safety, better DX |
| [ ] | WebSocket/SSE streaming for chatbot | Real-time response streaming |
| [ ] | Rate limiting per user (not just IP) | Authenticated rate limits |
| [ ] | CDN for static assets | Reduce server load |
| [ ] | Monitoring dashboard | Grafana/Datadog for system health |

**Success criteria:** Type-safe frontend, streaming UX, per-user limits, CDN-backed assets.

---

## Notes

- **Phases 1–4** are high-value and should be prioritized
- **Phases 5–6** are when-ready improvements
- Each phase is designed to be completable independently — no half-done phases
- Check off tasks as they are completed and note the date
