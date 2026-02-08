# Dekleptocracy - Remaining Work

**Last Updated**: February 8, 2026

This document consolidates all remaining work needed before production launch.

---

## Completion Summary

| Area | Status | Notes |
|------|--------|-------|
| Backend APIs & Data | ✅ 100% | 11 government APIs integrated |
| Component Architecture | ✅ 100% | Modular, code-split |
| Performance | ✅ 100% | 79KB initial bundle, TBT reduced 82% |
| Accessibility/UX | ✅ 100% | Lighthouse 93/100 |
| SEO | ✅ 100% | Meta tags, sitemap, structured data |
| Real Data (Stats) | ✅ 100% | LDA/FEC APIs live |
| Real Data (Wallet Shocks) | ✅ 100% | EIA/USDA APIs live |
| Real Data (Cost Drivers) | ❌ 0% | Still seeded |
| Interactive Features | 🟡 60% | Core done, WebSocket pending |
| Analytics | ❌ 0% | Not started |
| Admin CMS | ❌ 0% | Not started |
| Testing | ❌ 0% | No test coverage |

---

## Priority 1: Production Blockers

### 1.1 Analytics Setup (Phase 8)

**Why**: Need metrics from day 1 to measure success.

**Tasks:**
- [ ] Install `react-ga4` package
- [ ] Create `Analytics.jsx` provider component
- [ ] Add to `App.jsx` wrapper
- [ ] Track page views automatically
- [ ] Add custom events:
  - [ ] State selection changes
  - [ ] Report generation
  - [ ] Chatbot interactions
  - [ ] Search queries
  - [ ] Social post clicks
- [ ] Create cookie consent banner (GDPR/CCPA)
- [ ] Add privacy policy disclosure for analytics
- [ ] Set up GA4 property (can use placeholder ID until domain ready)

**Files to create:**
```
client/src/components/Analytics/
├── AnalyticsProvider.jsx    # GA4 initialization
├── CookieConsent.jsx        # Consent banner
├── useAnalytics.js          # Custom hook for tracking
└── index.js
```

**Environment variables needed:**
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 1.2 Domain Configuration

**Why**: Required for production launch.

**Tasks:**
- [ ] Purchase/finalize domain name
- [ ] Update these files with production URL:
  - [ ] `client/src/components/common/SEO/index.jsx` - `BASE_URL`
  - [ ] `server/routes/seoRoutes.js` - `BASE_URL`
  - [ ] `client/index.html` - meta tags
  - [ ] `server/.env` - `FRONTEND_URL`
  - [ ] `server/index.js` - CORS origins
- [ ] Configure DNS (Vercel + Railway)
- [ ] Verify SSL certificates
- [ ] Submit sitemap to Google Search Console
- [ ] Test social sharing previews

**See**: `docs/PRODUCTION_CHECKLIST.md` for full checklist

---

## Priority 2: Data Completeness

### 2.1 Cost Drivers - Real Data

**Current State**: Hardcoded percentages with no real source
```
Tariffs: 35%
Labor: 21%
Fuels: 20%
Supply Chain: 17%
Other: 7%
```

**What's Needed:**
- [ ] Research authoritative data source for cost breakdown
  - Potential: BLS Producer Price Index (PPI)
  - Potential: Federal Reserve economic reports
  - Potential: Congressional Budget Office analyses
- [ ] Add API client to MCP server (if needed)
- [ ] Create `costDriverTransformer.js` in Node server
- [ ] Update `CostDriver` model with real data
- [ ] Add source attribution to UI

**Files to modify:**
```
mcp_server/apis/           # New API client if needed
server/services/costDriverTransformer.js  # New transformer
server/scripts/seedHomepageData.js        # Remove hardcoded values
```

**Difficulty**: Medium - requires research to find authoritative source

---

## Priority 3: Feature Completion

### 3.1 State Comparison Modal

**Current State**: UI exists but not functional

**Tasks:**
- [ ] Connect modal to real API data
- [ ] Implement comparison logic (state vs state, state vs national)
- [ ] Add charts/visualizations for comparison
- [ ] Save comparison history (optional)

**Files:**
```
client/src/components/modals/StateComparison.jsx
```

### 3.2 WebSocket Real-Time Updates (Optional)

**Current State**: Polling-based updates

**Tasks:**
- [ ] Set up Socket.io on Node server
- [ ] Create WebSocket connection manager on client
- [ ] Implement real-time price update events
- [ ] Add connection status indicator
- [ ] Handle reconnection logic

**Complexity**: High - requires infrastructure changes

**Recommendation**: Defer unless real-time is critical requirement

---

## Priority 4: Quality & Safety

### 4.1 Testing

**Current State**: 0% test coverage

**Recommended Approach:**
1. Start with critical API endpoint tests
2. Add component tests for key interactions
3. E2E tests for main user flows

**Tasks:**
- [ ] Set up Vitest for unit tests
- [ ] Set up Playwright/Cypress for E2E
- [ ] Write tests for:
  - [ ] Homepage API (`/api/homepage/all`)
  - [ ] Stats transformation
  - [ ] State report generation
  - [ ] Chatbot responses
- [ ] Add to CI/CD pipeline

**Target**: 60-80% coverage on critical paths

### 4.2 Security Hardening

**Tasks:**
- [ ] Audit rate limiting on all endpoints
- [ ] Review and tighten CORS configuration
- [ ] Add input validation on all user inputs
- [ ] Verify Helmet.js security headers
- [ ] Check for SQL injection (MongoDB) / XSS vulnerabilities
- [ ] API key exposure audit
- [ ] Add request logging for security monitoring

---

## Priority 5: Future Enhancements (Post-Launch)

### 5.1 Admin CMS (Phase 9)

**Purpose**: Allow non-technical team to update content

**Would Include:**
- Dashboard for content management
- Social post moderation
- Data refresh controls
- User feedback management
- A/B testing interface

**Recommendation**: Build after launch based on operational needs

### 5.2 Additional Features

- [ ] User accounts / personalization
- [ ] Email newsletter integration
- [ ] PDF report generation
- [ ] Data export functionality
- [ ] Mobile app (React Native)

---

## Quick Reference: Current Architecture

### Services (All Deployed)
| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://dekleptocracy.vercel.app | ✅ Live |
| Node Server | https://node-server-production-7f39.up.railway.app | ✅ Live |
| MCP Server | https://dekleptocracy-production.up.railway.app | ✅ Live |

### Data Sources (11 APIs)
| API | Data | Status |
|-----|------|--------|
| BLS | Unemployment, CPI, Wages | ✅ Active |
| FRED | GDP, Personal Income | ✅ Active |
| EIA | Gas, Electricity Prices | ✅ Active |
| BEA | State GDP, Income | ✅ Active |
| USDA | Food Prices | ✅ Active |
| HUD | Housing/Rent | ✅ Active |
| LDA | Lobbying Data | ✅ Active |
| FEC | Campaign Finance | ✅ Active |
| Census | Trade Data | ❌ Inactive |
| DataWeb | USITC Data | ❌ Inactive |
| Gemini | AI Text Generation | ✅ Active |

### Key Files
```
dekleptocracy-website/
├── client/src/
│   ├── pages/Home/           # Homepage sections
│   ├── components/common/SEO/ # SEO component
│   └── context/HomepageContext.jsx
├── server/
│   ├── services/
│   │   ├── statsTransformer.js      # LDA/FEC → Stats
│   │   ├── walletShockTransformer.js # EIA/USDA → Wallet Shocks
│   │   └── stateDataScheduler.js    # Cron jobs
│   └── routes/
│       ├── homepageRoutes.js
│       └── reportRoutes.js
└── docs/
    ├── PRODUCTION_CHECKLIST.md
    └── improvement-plans/

mcp_server/
├── apis/                    # 11 API clients
├── http_server.py          # 52 tools available
└── config.py
```

---

## Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Analytics Setup | 4-6 hours | P1 |
| Domain Config | 2-3 hours | P1 |
| Cost Drivers Research | 2-4 hours | P2 |
| Cost Drivers Implementation | 4-6 hours | P2 |
| State Comparison Modal | 4-6 hours | P3 |
| Basic Test Coverage | 8-12 hours | P3 |
| Security Audit | 4-6 hours | P3 |
| WebSocket (Optional) | 12-16 hours | P4 |

**Total to Production-Ready**: ~20-30 hours (excluding WebSocket and full test coverage)

---

## Next Action

Start with **Analytics Setup** - it's high value, medium effort, and doesn't require the production domain to be ready.
