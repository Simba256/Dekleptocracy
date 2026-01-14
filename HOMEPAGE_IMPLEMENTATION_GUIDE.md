# Homepage Backend Integration - Complete Implementation Guide

**Project**: Dekleptocracy Homepage Live Data Integration
**Started**: December 10, 2025
**Status**: 🟡 In Progress
**Estimated Completion**: 6-7 days

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Pre-Implementation Checklist](#pre-implementation-checklist)
4. [Implementation Phases](#implementation-phases)
5. [Progress Tracking](#progress-tracking)
6. [Testing Procedures](#testing-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Rollback Plan](#rollback-plan)

---

## 🎯 Overview

### Goal
Connect the homepage (`dekleptocracy-website/client/src/pages/Home.jsx`) to backend with live data for:
- ✅ Wallet Shocks (4 cards: groceries, fuel, utilities, tech)
- ✅ Cost Drivers (6 items with percentages)
- ✅ Stats Section (lobbying cases, consumer cost impact, contributions, tariff revenue)

### What We're Building
- **3 new MongoDB models** to store homepage data
- **2 new services** for data generation and scheduling
- **1 new API route file** with 6 endpoints
- **Frontend integration** to fetch and display live data
- **Automated data population** every 6 hours via cron job

### Key Decisions Made
- ✅ **Backend**: Express.js server (`dekleptocracy-website/server/`)
- ✅ **Database**: MongoDB Atlas (existing connection)
- ✅ **Data Source**: MCP Server APIs (BEA, Census, GNews, etc.)
- ✅ **Update Frequency**: Every 6 hours via cron
- ✅ **Authentication**: Personalized for logged-in users, public for anonymous
- ✅ **Scope**: Phase 1 only (core features)

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                │
│  Location: dekleptocracy-website/client/               │
│  File to Modify: src/pages/Home.jsx                     │
│  Changes: Replace hardcoded data with API calls         │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP Requests (GET /api/homepage/*)
                 ↓
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Express.js + Node.js)                         │
│  Location: dekleptocracy-website/server/               │
│  NEW FILES:                                              │
│    - models/WalletShock.js                              │
│    - models/CostDriver.js                               │
│    - models/StatsSummary.js                             │
│    - services/homepageDataGenerator.js                  │
│    - services/homepageDataScheduler.js                  │
│    - routes/homepageRoutes.js                           │
│  MODIFIED FILES:                                         │
│    - index.js (mount routes, start scheduler)           │
│    - models/User.js (add selectedState preference)      │
└────────────────┬────────────────────────────────────────┘
                 │ Stores/Retrieves Data
                 ↓
┌─────────────────────────────────────────────────────────┐
│  DATABASE (MongoDB Atlas - Cloud)                       │
│  NEW COLLECTIONS:                                        │
│    - walletshocks                                        │
│    - costdrivers                                         │
│    - statssummaries                                      │
│  EXISTING: users, articles (no changes)                 │
└─────────────────────────────────────────────────────────┘
                 ↑
                 │ Fetches Real Data (via HTTP)
┌─────────────────────────────────────────────────────────┐
│  MCP SERVER (Python + FastAPI)                          │
│  Location: mcp_server/http_server.py                    │
│  NO CHANGES - Just call existing tools                  │
│  Tools Used:                                             │
│    - get_trade_news                                      │
│    - get_census_trade_data                              │
│    - get_bea_data                                        │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Pre-Implementation Checklist

### Environment Setup
- [ ] **MongoDB Atlas** is accessible
  - Check: `MONGODB_URI` in `dekleptocracy-website/server/.env`
  - Test: Server starts without connection errors
- [ ] **MCP Server** is running
  - Location: `mcp_server/http_server.py`
  - Check: `http://localhost:8000/health` returns 200 OK
  - Variable: `MCP_SERVER_URL=http://localhost:8000` in backend `.env`
- [ ] **Backend server** runs successfully
  - Command: `cd dekleptocracy-website/server && npm run dev`
  - Port: 5000 (default)
- [ ] **Frontend** runs successfully
  - Command: `cd dekleptocracy-website/client && npm run dev`
  - Port: 5173 (default)
- [ ] **Git** is configured
  - Run: `git status` (should be on `main` branch)
  - Create feature branch: `git checkout -b feature/homepage-backend-integration`

### Required Environment Variables
**Backend** (`dekleptocracy-website/server/.env`):
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
MCP_SERVER_URL=http://localhost:8000
PORT=5000
```

**Frontend** (`dekleptocracy-website/client/.env` or `.env.local`):
```bash
VITE_API_URL=http://localhost:5000
```

### Backup Current State
```bash
# Create backup of current files we'll modify
cp dekleptocracy-website/server/index.js dekleptocracy-website/server/index.js.backup
cp dekleptocracy-website/server/models/User.js dekleptocracy-website/server/models/User.js.backup
cp dekleptocracy-website/client/src/pages/Home.jsx dekleptocracy-website/client/src/pages/Home.jsx.backup
```

---

## 🚀 Implementation Phases

### **PHASE 1A: Database Models** ⏱️ Day 1 (2-3 hours)

#### Files to Create:
1. `dekleptocracy-website/server/models/WalletShock.js`
2. `dekleptocracy-website/server/models/CostDriver.js`
3. `dekleptocracy-website/server/models/StatsSummary.js`

#### Steps:
1. ✅ Create `WalletShock.js` model with schema
   - Fields: category, icon, title, price, change, chartData, state, etc.
   - Indexes: `{state, category, status, dataDate: -1}`
   - Method: `addReaction(reactionType)`

2. ✅ Create `CostDriver.js` model with schema
   - Fields: label, percentage, color, type, state, timePeriod
   - Indexes: `{state, timePeriod, category, status}`

3. ✅ Create `StatsSummary.js` model with schema
   - Fields: statType, state, value, displayValue, change, chartData
   - Indexes: `{statType, state, status, dataDate: -1}`

#### Testing:
```bash
# Test import in Node REPL
cd dekleptocracy-website/server
node
> const WalletShock = require('./models/WalletShock.js');
> console.log(WalletShock.schema.paths);
```

#### Completion Criteria:
- [ ] All 3 model files created without syntax errors
- [ ] Models can be imported without errors
- [ ] Schemas include all required fields
- [ ] Indexes are properly defined

---

### **PHASE 1B: Data Population System** ⏱️ Day 2-3 (8-10 hours)

#### Files to Create:
1. `dekleptocracy-website/server/services/homepageDataGenerator.js` (~400 lines)
2. `dekleptocracy-website/server/services/homepageDataScheduler.js` (~100 lines)

#### Steps:

**Day 2: Core Generator Functions**

1. ✅ Create `homepageDataGenerator.js` skeleton
   - Import models: WalletShock, CostDriver, StatsSummary
   - Add MCP_SERVER_URL constant
   - Define STATES array

2. ✅ Implement helper functions:
   - `generateChartPath(dataPoints)` - SVG path generation
   - `fetchTradeNews(category, state)` - MCP tool call
   - `fetchCensusTradeData(htsCode)` - MCP tool call
   - `fetchBEAData(datasetName, parameters)` - MCP tool call

3. ✅ Implement `generateWalletShocks(statesToPopulate)`
   - Loop through states and categories
   - Fetch news via MCP
   - Generate 6-month chart data
   - Calculate price changes
   - Upsert to database

**Day 3: Remaining Generators and Scheduler**

4. ✅ Implement `generateCostDrivers(statesToPopulate)`
   - Generate 6 drivers per state/period
   - Apply state variations
   - Upsert to database

5. ✅ Implement `generateStatsSummary(statesToPopulate)`
   - Generate 4 stat types per state
   - Format display values (K, M, B)
   - Generate weekly chart data
   - Upsert to database

6. ✅ Implement `generateHomepageData(options)` orchestrator
   - Call all generator functions
   - Return results summary

7. ✅ Implement `removeDuplicateHomepageData()`
   - Use MongoDB aggregation to find duplicates

8. ✅ Create `homepageDataScheduler.js`
   - Implement `scheduleHomepageDataGeneration(hours)`
   - Implement `triggerHomepageDataGeneration(options)`
   - Implement `getHomepageSchedulerStatus()`

#### Testing:
```bash
# Manual test script
cd dekleptocracy-website/server
node -e "
const { generateHomepageData } = require('./services/homepageDataGenerator.js');
generateHomepageData({ states: ['California'] }).then(console.log);
"
```

#### Completion Criteria:
- [ ] `homepageDataGenerator.js` created with all functions
- [ ] `homepageDataScheduler.js` created with cron logic
- [ ] Manual test generates data successfully
- [ ] Data appears in MongoDB Atlas collections
- [ ] No errors in console logs
- [ ] MCP server calls work (check MCP logs)

---

### **PHASE 1C: API Routes** ⏱️ Day 4 (4-5 hours)

#### Files to Create:
1. `dekleptocracy-website/server/routes/homepageRoutes.js` (~300 lines)

#### Files to Modify:
1. `dekleptocracy-website/server/index.js` (add ~10 lines)

#### Steps:

1. ✅ Create `homepageRoutes.js` with Express router
   - Import models and services
   - Add JWT import for auth

2. ✅ Implement `optionalAuth` middleware
   - Extract user if token provided
   - Don't require authentication

3. ✅ Implement endpoints:
   - `GET /api/homepage/wallet-shocks` with state filtering
   - `GET /api/homepage/cost-drivers` with state/period filtering
   - `GET /api/homepage/stats` with state filtering
   - `POST /api/homepage/generate` (admin only)
   - `GET /api/homepage/scheduler/status`
   - `POST /api/homepage/wallet-shocks/:id/react`

4. ✅ Modify `index.js`:
   - Import homepageRoutes
   - Mount routes: `app.use('/api/homepage', homepageRoutes);`
   - Import and start scheduler
   - Add log statements

#### Testing:
```bash
# Start backend server
cd dekleptocracy-website/server
npm run dev

# In another terminal, test endpoints:
curl "http://localhost:5000/api/homepage/wallet-shocks?state=California"
curl "http://localhost:5000/api/homepage/cost-drivers?state=California&period=YoY"
curl "http://localhost:5000/api/homepage/stats?state=California"
curl "http://localhost:5000/api/homepage/scheduler/status"
```

#### Completion Criteria:
- [ ] `homepageRoutes.js` created with all endpoints
- [ ] Routes mounted in `index.js`
- [ ] Scheduler starts on server startup
- [ ] All curl commands return valid JSON
- [ ] No 500 errors in responses
- [ ] Authentication works for admin endpoints
- [ ] Server logs show scheduler started

---

### **PHASE 1D: Frontend Integration** ⏱️ Day 5 (5-6 hours)

#### Files to Modify:
1. `dekleptocracy-website/client/src/pages/Home.jsx` (~100 line changes)

#### Steps:

1. ✅ Add API_URL constant at top of file
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

2. ✅ Replace hardcoded data state variables:
   - Remove: `const walletShocks = [...]`
   - Remove: `const costDrivers = [...]`
   - Add: `const [walletShocks, setWalletShocks] = useState([]);`
   - Add: `const [costDrivers, setCostDrivers] = useState([]);`
   - Add: `const [stats, setStats] = useState({});`
   - Add: `const [loading, setLoading] = useState(true);`
   - Add: `const [error, setError] = useState(null);`

3. ✅ Add `useEffect` hook for data fetching
   - Dependency array: `[userSelectedState, timePeriod]`
   - Fetch wallet shocks, cost drivers, stats
   - Handle errors
   - Set loading states

4. ✅ Add loading UI (before main content)
   ```javascript
   if (loading) return <div>Loading...</div>;
   if (error) return <div>Error: {error}</div>;
   ```

5. ✅ Update Stats Section (lines ~351-406)
   - Replace hardcoded values with `stats.lobbying?.displayValue`
   - Repeat for all 4 stat types

6. ✅ Add reaction handler function
   - `handleReaction(shockId, reactionType)`
   - POST to `/api/homepage/wallet-shocks/:id/react`
   - Update local state

7. ✅ Update reaction buttons in wallet cards
   - Add `onClick` handlers
   - Use `shock._id` from API data

#### Testing:
```bash
# Start frontend
cd dekleptocracy-website/client
npm run dev

# Open browser to http://localhost:5173
# Test:
# 1. Homepage loads without errors
# 2. Data appears in cards (not empty)
# 3. State dropdown works and updates data
# 4. Time period buttons update cost drivers
# 5. Reaction emojis are clickable
# 6. Check browser Network tab for API calls
```

#### Completion Criteria:
- [ ] Homepage loads successfully
- [ ] No JavaScript errors in console
- [ ] API calls visible in Network tab
- [ ] Wallet shocks display (4 cards)
- [ ] Cost drivers display (6 items)
- [ ] Stats display (4 stats)
- [ ] Loading state shows briefly
- [ ] State switching triggers re-fetch
- [ ] Time period switching updates data
- [ ] UI matches original design
- [ ] Reactions increment on click

---

### **PHASE 1E: Authentication & Personalization** ⏱️ Day 6 (3-4 hours)

#### Files to Modify:
1. `dekleptocracy-website/server/models/User.js` (~5 line change)
2. `dekleptocracy-website/server/routes/userRoutes.js` (~20 line addition)
3. `dekleptocracy-website/server/routes/homepageRoutes.js` (enhance auth logic)
4. `dekleptocracy-website/client/src/pages/Home.jsx` (add auth header)

#### Steps:

1. ✅ Update `User.js` model:
   - Add `selectedState` to preferences schema
   - Add `defaultTimePeriod` to preferences schema

2. ✅ Add endpoint to `userRoutes.js`:
   - `PUT /api/user/preferences`
   - Save selectedState and timePeriod

3. ✅ Enhance `homepageRoutes.js`:
   - In `optionalAuth`, fetch user preferences if authenticated
   - Use user's selectedState as fallback

4. ✅ Update `Home.jsx`:
   - Check if user is authenticated (get token from localStorage)
   - If authenticated, send Authorization header in fetch requests
   - Save state selection to user preferences

#### Testing:
```bash
# Test as unauthenticated user:
# - Should see nationwide data by default
# - Dropdown selection should work

# Test as authenticated user:
# - Login to account
# - Select a state
# - Reload page - selected state should persist
# - Check API calls include Authorization header
```

#### Completion Criteria:
- [ ] User model has new preference fields
- [ ] Preferences endpoint works
- [ ] Authenticated users see personalized data
- [ ] Unauthenticated users see default data
- [ ] State preference persists across sessions
- [ ] No errors for missing auth

---

### **PHASE 1F: Production Readiness** ⏱️ Day 7 (4-5 hours)

#### Tasks:

1. ✅ **Error Handling Enhancement**
   - Add try-catch to all route handlers
   - Return proper error codes (404, 500, etc.)
   - Add error logging

2. ✅ **Rate Limiting** (optional for v1)
   - Install: `npm install express-rate-limit`
   - Add to homepage routes
   - Limit: 100 requests per 15 minutes per IP

3. ✅ **Database Query Optimization**
   - Run `.explain()` on queries
   - Ensure indexes are used
   - Add pagination if needed

4. ✅ **Caching Headers**
   - Add Cache-Control headers to API responses
   - Cache duration: 5 minutes for homepage data

5. ✅ **Documentation**
   - Document all API endpoints
   - Add JSDoc comments to functions
   - Update README with new features

6. ✅ **Testing with Real Data**
   - Trigger data generation for 10 states
   - Verify data quality
   - Check MCP server logs for errors

7. ✅ **Environment Check**
   - Verify all env variables are documented
   - Test with production-like settings

8. ✅ **Create Testing Script**
   - File: `server/scripts/testHomepageData.js`
   - Tests all generation functions

#### Testing:
```bash
# Run comprehensive tests
npm run dev # Backend
npm run dev # Frontend (separate terminal)

# Manual testing checklist:
# - [ ] All API endpoints return valid data
# - [ ] Scheduler runs without errors
# - [ ] Frontend displays data correctly
# - [ ] Auth works for both user types
# - [ ] Performance is acceptable (<2s load)
# - [ ] No memory leaks (check with long running)
```

#### Completion Criteria:
- [ ] All error cases handled gracefully
- [ ] Rate limiting configured
- [ ] Database indexes verified
- [ ] API responses cached
- [ ] Documentation complete
- [ ] Testing script works
- [ ] Performance acceptable
- [ ] Ready for staging deployment

---

## 📊 Progress Tracking

### Overall Progress
```
[▓▓▓▓▓░░░░░░░░░░░░░░░] 25% - Phase 1A Complete
```

### Phase Completion Status

| Phase | Name | Status | Duration | Completed |
|-------|------|--------|----------|-----------|
| 1A | Database Models | 🟡 In Progress | 2-3 hours | __ / __ / 2025 |
| 1B | Data Population | ⚪ Not Started | 8-10 hours | __ / __ / 2025 |
| 1C | API Routes | ⚪ Not Started | 4-5 hours | __ / __ / 2025 |
| 1D | Frontend Integration | ⚪ Not Started | 5-6 hours | __ / __ / 2025 |
| 1E | Auth & Personalization | ⚪ Not Started | 3-4 hours | __ / __ / 2025 |
| 1F | Production Readiness | ⚪ Not Started | 4-5 hours | __ / __ / 2025 |

**Legend**: 🟢 Complete | 🟡 In Progress | ⚪ Not Started | 🔴 Blocked

### Current Phase Checklist
**Phase 1A: Database Models**
- [ ] WalletShock.js created
- [ ] CostDriver.js created
- [ ] StatsSummary.js created
- [ ] Models tested via Node REPL
- [ ] No syntax errors

---

## 🧪 Testing Procedures

### Unit Testing
**Test each component in isolation:**

```bash
# Test Model Imports
cd dekleptocracy-website/server
node -e "console.log(require('./models/WalletShock.js'))"

# Test Data Generation
node scripts/testHomepageData.js

# Test API Endpoints
curl -X GET "http://localhost:5000/api/homepage/wallet-shocks?state=California"
```

### Integration Testing
**Test complete flow:**

1. **Data Generation → Database**
   ```bash
   # Trigger manual generation
   curl -X POST "http://localhost:5000/api/homepage/generate" \
     -H "Content-Type: application/json" \
     -d '{"states": ["California"]}'

   # Check MongoDB Atlas - verify data exists
   ```

2. **Database → API → Frontend**
   - Open http://localhost:5173
   - Check Network tab for API calls
   - Verify data displays correctly

3. **State Switching**
   - Select different state in dropdown
   - Verify API call with new state parameter
   - Verify data updates

### End-to-End Testing Checklist

- [ ] **Homepage loads** without errors
- [ ] **Wallet shocks** display 4 cards with real data
- [ ] **Cost drivers** display 6 items with percentages
- [ ] **Stats section** displays 4 statistics with values
- [ ] **State dropdown** changes data when selected
- [ ] **Time period buttons** update cost drivers
- [ ] **Reaction emojis** increment when clicked
- [ ] **Loading state** shows during data fetch
- [ ] **Error state** shows on API failure
- [ ] **Authenticated users** see personalized data
- [ ] **Unauthenticated users** see default data
- [ ] **Scheduler runs** every 6 hours (check logs)
- [ ] **MCP server integration** works (no 500 errors)
- [ ] **Database** stores data correctly (check Atlas)

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### Issue 1: "Cannot connect to MongoDB"
**Symptoms**: Server crashes on startup with connection error
**Solutions**:
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
- Test connection: `mongosh "your-connection-string"`

#### Issue 2: "MCP Server not responding"
**Symptoms**: Data generation fails, 500 errors from homepage API
**Solutions**:
- Check MCP server is running: `curl http://localhost:8000/health`
- Start MCP server: `cd mcp_server && python http_server.py`
- Verify `MCP_SERVER_URL` in backend `.env`

#### Issue 3: "No data displayed on homepage"
**Symptoms**: Homepage loads but cards are empty
**Solutions**:
- Check browser console for errors
- Check Network tab - are API calls succeeding?
- Verify data exists in database (MongoDB Atlas)
- Manually trigger generation: `curl -X POST http://localhost:5000/api/homepage/generate`

#### Issue 4: "Cron job not running"
**Symptoms**: Data never updates automatically
**Solutions**:
- Check server logs for scheduler messages
- Verify scheduler started: `curl http://localhost:5000/api/homepage/scheduler/status`
- Check cron expression syntax in `homepageDataScheduler.js`

#### Issue 5: "Frontend shows old hardcoded data"
**Symptoms**: Homepage shows static data, not API data
**Solutions**:
- Clear browser cache and reload
- Check if `useEffect` is fetching data (add console.log)
- Verify API_URL is correct in frontend
- Check if state variables were properly replaced

#### Issue 6: "Authentication not working"
**Symptoms**: Logged-in users don't see personalized data
**Solutions**:
- Check localStorage for auth token: `localStorage.getItem('authToken')`
- Verify Authorization header in Network tab
- Check backend `optionalAuth` middleware logs
- Verify User model has `selectedState` field

---

## 🔄 Rollback Plan

### If Things Go Wrong

#### Quick Rollback (restore backups)
```bash
# Restore backed up files
cp dekleptocracy-website/server/index.js.backup dekleptocracy-website/server/index.js
cp dekleptocracy-website/server/models/User.js.backup dekleptocracy-website/server/models/User.js
cp dekleptocracy-website/client/src/pages/Home.jsx.backup dekleptocracy-website/client/src/pages/Home.jsx

# Delete new files
rm dekleptocracy-website/server/models/WalletShock.js
rm dekleptocracy-website/server/models/CostDriver.js
rm dekleptocracy-website/server/models/StatsSummary.js
rm dekleptocracy-website/server/services/homepageDataGenerator.js
rm dekleptocracy-website/server/services/homepageDataScheduler.js
rm dekleptocracy-website/server/routes/homepageRoutes.js

# Restart servers
npm run dev
```

#### Git Rollback
```bash
# If on feature branch
git checkout main
git branch -D feature/homepage-backend-integration

# If committed to main
git log --oneline  # Find last good commit
git revert <commit-hash>
```

#### Database Cleanup
```bash
# If you need to remove test data
# Connect to MongoDB Atlas and run:
db.walletshocks.deleteMany({})
db.costdrivers.deleteMany({})
db.statssummaries.deleteMany({})
```

---

## 📝 Daily Log

### Day 1: __/__/2025
**Goal**: Complete Phase 1A (Database Models)
**Status**:
**Blockers**:
**Notes**:

---

### Day 2: __/__/2025
**Goal**: Start Phase 1B (Data Generation)
**Status**:
**Blockers**:
**Notes**:

---

### Day 3: __/__/2025
**Goal**: Complete Phase 1B (Data Generation)
**Status**:
**Blockers**:
**Notes**:

---

### Day 4: __/__/2025
**Goal**: Complete Phase 1C (API Routes)
**Status**:
**Blockers**:
**Notes**:

---

### Day 5: __/__/2025
**Goal**: Complete Phase 1D (Frontend Integration)
**Status**:
**Blockers**:
**Notes**:

---

### Day 6: __/__/2025
**Goal**: Complete Phase 1E (Auth & Personalization)
**Status**:
**Blockers**:
**Notes**:

---

### Day 7: __/__/2025
**Goal**: Complete Phase 1F (Production Readiness)
**Status**:
**Blockers**:
**Notes**:

---

## 📚 Reference Links

### Documentation
- [Mongoose Schemas](https://mongoosejs.com/docs/guide.html)
- [Express Routing](https://expressjs.com/en/guide/routing.html)
- [React useEffect](https://react.dev/reference/react/useEffect)
- [Cron Expressions](https://crontab.guru/)

### Project Files
- Plan: `/home/basim/.claude/plans/eager-juggling-wind.md`
- Backend: `dekleptocracy-website/server/`
- Frontend: `dekleptocracy-website/client/`
- MCP Server: `mcp_server/http_server.py`

### Helpful Commands
```bash
# Start backend
cd dekleptocracy-website/server && npm run dev

# Start frontend
cd dekleptocracy-website/client && npm run dev

# Start MCP server
cd mcp_server && python http_server.py

# Test API endpoint
curl "http://localhost:5000/api/homepage/wallet-shocks?state=California"

# Check MongoDB
mongosh "your-connection-string"

# View logs
tail -f dekleptocracy-website/server/logs/server.log
```

---

## ✅ Final Checklist (Before Deployment)

### Code Quality
- [ ] All files have proper comments
- [ ] No console.log statements in production code
- [ ] Error handling in all async functions
- [ ] Input validation on all endpoints

### Testing
- [ ] All unit tests pass
- [ ] Integration tests complete
- [ ] Manual testing checklist complete
- [ ] Cross-browser testing done

### Documentation
- [ ] API endpoints documented
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment guide updated

### Performance
- [ ] Database indexes verified
- [ ] API response times < 500ms
- [ ] Frontend load time < 2s
- [ ] No memory leaks

### Security
- [ ] No hardcoded secrets
- [ ] Environment variables used
- [ ] Input sanitization implemented
- [ ] Rate limiting configured

### Deployment
- [ ] Environment variables set in production
- [ ] MongoDB Atlas accessible from production
- [ ] MCP server accessible (if separate)
- [ ] Cron job scheduled correctly
- [ ] Monitoring configured

---

**Last Updated**: December 10, 2025
**Status**: 🟡 Phase 1A In Progress
**Next Milestone**: Complete Phase 1A by end of Day 1
