# Phase 6: Content & Data Quality - Implementation Summary

**Date**: February 8, 2026
**Status**: 🟡 IN PROGRESS (70% complete - Stats & Cost Drivers still seeded)

---

## Overview

Phase 6 focuses on replacing seed/demo data with real, verified data from authoritative sources. The implementation took a different architectural approach than originally planned - using an MCP (Model Context Protocol) server as the data collection layer rather than direct Node.js collectors.

---

## Architecture: MCP-Based Data Pipeline

### Original Plan vs Actual Implementation

| Aspect | Original Plan | Actual Implementation |
|--------|---------------|----------------------|
| Data Collectors | Node.js services in `server/services/dataCollectors/` | MCP server with Python API clients |
| API Integration | Direct HTTP calls from Node server | Node server calls MCP tools via HTTP |
| Scheduling | Node-cron in Express server | Node-cron calls MCP tools |
| Caching | MongoDB with custom logic | MongoDB `StateDataCache` model with TTL |

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Government APIs                              │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   BLS    │   FRED   │   EIA    │   BEA    │   USDA   │   HUD    │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │          │
     v          v          v          v          v          v
┌─────────────────────────────────────────────────────────────────┐
│                 MCP Server (Railway)                             │
│  https://dekleptocracy-production.up.railway.app                 │
│  - Python API clients with error handling                        │
│  - /tools endpoint lists available tools                         │
│  - /execute endpoint runs tools                                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP
                                  v
┌─────────────────────────────────────────────────────────────────┐
│                 Node Server (Railway)                            │
│  https://node-server-production-7f39.up.railway.app              │
│  - stateDataScheduler.js (cron jobs)                             │
│  - mcpClient.js (MCP communication)                              │
│  - Calls MCP tools, caches results                               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  v
┌─────────────────────────────────────────────────────────────────┐
│                 MongoDB (Atlas)                                  │
│  - StateDataCache collection (real API data)                     │
│  - WalletShock collection (now real data from transformer)       │
│  - StatsSummary collection (still seeded - needs OpenSecrets)    │
│  - CostDriver collection (still seeded)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Completed Implementations

### 1. MCP Server API Integrations

**Deployed at**: `https://dekleptocracy-production.up.railway.app`

**Available Tools (9 APIs Active):**

| API | Tools | Data Provided |
|-----|-------|---------------|
| **BLS** | `get_bls_unemployment_by_state`, `get_bls_cpi_for_state`, `get_bls_wages_by_state` | Unemployment, CPI, wages |
| **FRED** | `get_fred_series`, `get_fred_state_gdp`, `get_fred_state_personal_income`, `get_fred_state_unemployment` | GDP, income, economic indicators |
| **EIA** | `get_electricity_prices_by_state`, `get_gasoline_prices_by_state`, `get_natural_gas_prices_by_state` | Energy prices |
| **BEA** | `get_bea_state_gdp`, `get_bea_state_personal_income` | State GDP, personal income |
| **USDA** | `get_usda_food_prices`, `get_usda_grocery_basket` | Food prices, grocery costs |
| **HUD** | `get_hud_fair_market_rent`, `get_hud_rent_history`, `get_hud_affordability_analysis` | Housing costs |

**Health Check**: `GET /health` shows 9/11 services active (Census and DataWeb inactive)

---

### 2. State Data Scheduler

**File**: `server/services/stateDataScheduler.js`

**Features:**
- Cron jobs for automated data refresh
- Daily full refresh at 2 AM EST
- Gas prices refresh every 6 hours
- Priority states processed first (CA, TX, FL, NY, etc.)
- Fallback support (e.g., FRED as backup for BLS)
- Rate limiting between API calls
- Error handling with retry logic

**Data Types Collected:**

| Type | MCP Tool | TTL | Fallback |
|------|----------|-----|----------|
| `unemployment` | `get_bls_unemployment_by_state` | 24h | `get_fred_state_unemployment` |
| `electricity_prices` | `get_electricity_prices_by_state` | 24h | None |
| `gas_prices` | `get_gasoline_prices_by_state` | 6h | None |
| `food_prices` | `get_usda_food_prices` | 24h | None |
| `grocery_basket` | `get_usda_grocery_basket` | 24h | None |
| `gdp` | `get_bea_state_gdp` | 168h | `get_fred_state_gdp` |
| `personal_income` | `get_bea_state_personal_income` | 168h | `get_fred_state_personal_income` |

---

### 3. State Data Cache

**File**: `server/models/StateDataCache.js`

**Features:**
- TTL-based cache expiration
- Upsert logic for data updates
- Error tracking per state/data type
- Cache health reporting
- Static methods: `getLatestData()`, `upsertData()`, `getCacheHealth()`

**Current Status (as of Feb 8, 2026):**
- **51 states** with data (all US states + DC)
- **357 total entries** (7 data types × 51 states)
- **100% freshness** (no stale data)
- **0 errors** in cache

---

### 4. Map Data Endpoint

**Endpoint**: `GET /api/homepage/map-data`

**Features:**
- Returns all 51 states with calculated metrics
- Uses real data from `StateDataCache`
- Calculates: `priceImpact`, `costOfLiving`, `tariffRevenue`
- Includes raw metrics for tooltips (gas, electricity, food, GDP, etc.)
- `hasRealData` flag indicates data source

**Sample Response:**
```json
{
  "name": "California",
  "priceImpact": 1.6,
  "costOfLiving": 124.5,
  "tariffRevenue": 2847000000,
  "hasRealData": true,
  "metrics": {
    "gasPrices": { "value": 3.83, "displayValue": "$3.83/gal" },
    "electricityPrices": { "value": 31.91, "displayValue": "31.91¢/kWh" },
    "foodPrices": { "value": 172, "displayValue": "$172/month" }
  }
}
```

---

### 5. State Reports Endpoint

**Endpoint**: `GET /api/reports/state?state=California`

**Features:**
- Comprehensive state economic report
- Uses only real data (returns 503 if no data available)
- Sources cited: BLS, EIA, USDA
- Includes: unemployment, energy prices, food costs, GDP, income
- AI-generated insights per category

---

## Recently Completed

### Wallet Shock Transformer (Feb 8, 2026)

**Files Created:**
- `server/services/walletShockTransformer.js`

**Features:**
- Transforms `StateDataCache` → `WalletShock` entries
- Maps data types to categories:
  - `gas_prices` → `fuel`
  - `electricity_prices` → `utilities`
  - `food_prices` → `groceries`
- Generates compelling titles based on change direction/magnitude
- Creates SVG chart paths from time series data
- Preserves reaction counts during updates
- Proper source attribution (EIA, USDA, BLS)

**Integration:**
- `stateDataScheduler.js` now calls transformer after data refresh
- Daily refresh at 2 AM EST triggers full transformation
- Gas price refresh (every 6 hours) updates fuel wallet shocks
- Manual trigger via `POST /api/reports/wallet-shocks/transform`
- Status check via `GET /api/reports/wallet-shocks/status`

---

## Pending Implementations

### 1. Stats Section (Still Seeded)

**Status**: ⚠️ Using Fake/Seeded Data

**Current Seeded Values:**
| Stat | Seeded Value | Claimed Source | Actual Source |
|------|--------------|----------------|---------------|
| Lobbying | $45,000 | "Federal Trade Commission" | ❌ Fake - FTC doesn't provide this |
| Consumer Cost | $5,890 | Not specified | ❌ Hardcoded seed data |
| Contributions | $1.9M | Not specified | ❌ Hardcoded seed data |
| Tariff Revenue | $1.2B | Not specified | ❌ Hardcoded seed data |

**What's Needed to Fix:**
- **OpenSecrets API** for lobbying and campaign contributions data
- Register for OpenSecrets API key at opensecrets.org
- Add MCP tools: `get_lobbying_by_industry`, `get_campaign_contributions`
- Create `statsTransformer.js` (similar to walletShockTransformer)
- Replace StatsSummary seeded data with real API data

**API Endpoint Affected:** `GET /api/homepage/stats`

---

### 2. Cost Drivers (Still Seeded)

**Status**: ⚠️ Using Fake/Seeded Data

**Current Seeded Values:**
| Driver | Seeded % | Source |
|--------|----------|--------|
| Tariffs | 35% | ❌ Hardcoded |
| Labor | 21% | ❌ Hardcoded |
| Fuels | 20% | ❌ Hardcoded |
| Supply Chain | 17% | ❌ Hardcoded |
| Other | 7% | ❌ Hardcoded |

**What's Needed to Fix:**
- Research authoritative sources for cost driver breakdown
- Potential sources: BLS Producer Price Index, Federal Reserve reports
- Create cost driver data collection in MCP server
- Create `costDriverTransformer.js`

**API Endpoint Affected:** `GET /api/homepage/cost-drivers`

---

### 3. OpenSecrets Integration (Recommended for Stats)

**Status**: Not Implemented

**What's Needed:**
- Add OpenSecrets API client to MCP server
- Register for OpenSecrets API key
- Create tools: `get_lobbying_by_industry`, `get_campaign_contributions`
- Add to scheduler data types
- Update stats display with real lobbying data

**Note**: This is the primary solution for fixing the Stats section's fake data.

---

### 5. DataSource Model

**Status**: Not Implemented (Optional)

**What's Needed:**
- Create `DataSource` model for attribution tracking
- Fields: name, url, updateFrequency, lastFetched, reliability
- Link data entries to their sources
- Display source attribution in UI

---

### 6. Data Quality Checker

**Status**: Not Implemented

**What's Needed:**
- Validation service for incoming data
- Anomaly detection (3+ std deviations from mean)
- Freshness monitoring
- Alert system for stale/invalid data
- Quality dashboard

---

## Files Summary

### Server Files (Implemented):
```
server/
├── services/
│   ├── stateDataScheduler.js      # Cron jobs for data refresh + transformation
│   ├── walletShockTransformer.js  # StateDataCache → WalletShock (NEW)
│   ├── mcpClient.js               # MCP server communication
│   ├── stateReportGenerator.js    # State report generation
│   └── homepageDataGenerator.js   # LLM-based generation (legacy, being replaced)
├── models/
│   ├── StateDataCache.js          # Real API data cache
│   ├── WalletShock.js             # Homepage cards (now from real data)
│   └── StatsSummary.js            # Stats display (seeded)
└── routes/
    ├── homepageRoutes.js          # Homepage API endpoints
    └── reportRoutes.js            # State report + transformation endpoints
```

### Not Implemented:
```
server/
├── services/
│   └── dataQualityChecker.js      # Validation & anomaly detection
└── models/
    └── DataSource.js              # Source attribution
```

---

## API Documentation

**API Keys Setup**: See `docs/API_KEYS_SETUP.md`

**Required Environment Variables (MCP Server):**
```
BLS_API_KEY=xxx
FRED_API_KEY=xxx
EIA_API_KEY=xxx
HUD_API_TOKEN=xxx
USDA_API_KEY=xxx (optional)
```

**Endpoints:**

| Endpoint | Purpose | Uses Real Data? |
|----------|---------|-----------------|
| `GET /api/homepage/map-data` | Map visualization | ✅ Yes (EIA, USDA, BLS) |
| `GET /api/reports/state` | State economic report | ✅ Yes (EIA, USDA, BLS) |
| `GET /api/reports/cache/health` | Cache status | ✅ Yes |
| `GET /api/homepage/wallet-shocks` | Wallet shock cards | ✅ Yes (EIA, USDA) |
| `GET /api/homepage/all` | Homepage data | 🟡 Partial |
| `GET /api/homepage/stats` | Stats section | 🔲 No (seeded) |
| `GET /api/homepage/cost-drivers` | Cost drivers | 🔲 No (seeded) |

---

## Remaining Tasks

### ✅ Completed:
- [x] Create `walletShockTransformer.js` to connect real data to homepage
- [x] Update scheduler to run transformer after data refresh
- [x] Replace seeded wallet shocks with real API data
- [x] Run initial transformation to populate all states (Feb 8, 2026)

### ⚠️ Known Issues (Seeded Data Still In Use):
- [ ] **Stats Section** - Shows fake data with incorrect source attribution ("Federal Trade Commission")
- [ ] **Cost Drivers** - Shows hardcoded percentages with no real data source

### Medium Priority (To Fix Seeded Data):
- [ ] Register for OpenSecrets API key
- [ ] Add OpenSecrets API client to MCP server
- [ ] Create `statsTransformer.js` for Stats section
- [ ] Research authoritative sources for cost driver data
- [ ] Create `costDriverTransformer.js`

### Low Priority (Optional Enhancements):
- [ ] Create `DataSource` model for attribution tracking
- [ ] Implement `dataQualityChecker.js`
- [ ] Add anomaly detection
- [ ] Build quality monitoring dashboard

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Data sources integrated | 5+ | 6 (BLS, FRED, EIA, BEA, USDA, HUD) | ✅ |
| Data freshness | < 24 hours | 100% fresh | ✅ |
| States with data | 50 | 52 (50 states + DC + nationwide) | ✅ |
| Homepage uses real data | 100% | ~70% (map + wallet shocks only) | 🟡 |
| Stats section real data | 100% | 0% (all seeded) | 🔲 |
| Cost drivers real data | 100% | 0% (all seeded) | 🔲 |
| Source attribution | 100% | Partial (wallet shocks only) | 🟡 |
| Anomaly detection | Active | None | 🔲 |

### Wallet Shock Coverage (Feb 8, 2026)

| Category | States | Data Source |
|----------|--------|-------------|
| Fuel (gas prices) | 52 | U.S. Energy Information Administration |
| Utilities (electricity) | 52 | U.S. Energy Information Administration |
| Groceries (food costs) | 52 | USDA Economic Research Service |

---

## Next Steps

1. ~~**Immediate**: Trigger initial transformation to populate wallet shocks for all states~~ DONE
2. **Decision Point**: Fix Stats/Cost Drivers seeded data OR proceed to Phase 7?
   - If fixing: Register OpenSecrets API, create transformers
   - If proceeding: Accept that Stats/Cost Drivers show demo data for now
3. **Medium-term**: Implement DataSource model and quality checker (optional)
4. **Ready for**: Phase 7 (SEO & Discoverability)

---

**Phase 6 Progress**: 70% Complete (revised from 90%)

**Key Achievements:**
- ✅ Real government data (EIA, USDA) powers wallet shocks for all 52 states
- ✅ Map data uses real cached government API data
- ✅ State reports use real data with proper source attribution

**Still Using Seeded/Fake Data:**
- 🔲 Stats Section (lobbying, consumer cost, contributions, tariff revenue) - claims "Federal Trade Commission" source (fake)
- 🔲 Cost Drivers (tariffs 35%, labor 21%, etc.) - hardcoded demo values

**To Achieve 100%:**
- Add OpenSecrets API for lobbying/contributions data
- Research and integrate cost driver data sources
- Create transformers for Stats and Cost Drivers
