# Phase 1: Data Integration & Backend

## Overview

This phase focuses on eliminating hardcoded data from the landing page by creating comprehensive API endpoints and integrating real data sources. This is the foundation for all subsequent improvements.

## Goals

1. Replace all hardcoded data with API-driven content
2. Create robust data models for new content types
3. Implement caching for performance
4. Set up data validation and error handling
5. Prepare infrastructure for real-time updates

---

## Current State Analysis

### Existing API Endpoints (Working)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/homepage/wallet-shocks` | Price shock cards | ✅ Working |
| `GET /api/homepage/cost-drivers` | Cost driver percentages | ✅ Working |
| `GET /api/homepage/stats` | Summary statistics | ✅ Working |
| `GET /api/homepage/available-states` | States with data | ✅ Exists but unused |
| `POST /api/homepage/wallet-shocks/:id/react` | Add reactions | ✅ Working |
| `GET /api/homepage/download/report` | PDF generation | ✅ Working |
| `GET /api/homepage/download/csv` | CSV export | ✅ Working |

### Hardcoded Data Inventory

| Location | Variable | Data Type | Lines |
|----------|----------|-----------|-------|
| Home.jsx | `quickQuestions` | Array[3] | 34-38 |
| Home.jsx | `states` | Array[6] | 40 |
| Home.jsx | `allStates` | Array[51] | 42-51 |
| Home.jsx | `fallbackCostDrivers` | Array[6] | 273-280 |
| Home.jsx | `comparisonData` | Array[4] | 282-307 |
| Home.jsx | `topShocksNearYou` | Array[5] | 309-315 |
| Home.jsx | `socialPosts` | Array[3] | 317-351 |
| Home.jsx | Stats JSX | Inline values | 578-667 |
| Home.jsx | Timeline dates | Inline values | 1013-1035 |
| Home.jsx | Product suggestions | Inline string | 1074 |
| Home.jsx | Map SVG data | Inline coordinates | 1097-1259 |
| Home.jsx | Impact modal | Inline values | 1486-1529 |

---

## Target State

### New API Endpoints Required

#### 1. State Comparison API
```
GET /api/homepage/state-comparison?state={state}
```

**Response:**
```json
{
  "success": true,
  "state": "California",
  "comparisons": [
    {
      "category": "Grocery basket",
      "stateValue": 412.00,
      "stateFormatted": "$412",
      "nationalValue": 395.00,
      "nationalFormatted": "$395",
      "percentDiff": 4.3,
      "percentFormatted": "+4.3%",
      "trend": "up",
      "lastUpdated": "2025-01-15T00:00:00Z"
    },
    {
      "category": "Fuel Price",
      "stateValue": 3.84,
      "stateFormatted": "$3.84",
      "nationalValue": 3.70,
      "nationalFormatted": "$3.70",
      "percentDiff": 3.8,
      "percentFormatted": "+3.8%",
      "trend": "up",
      "lastUpdated": "2025-01-15T00:00:00Z"
    }
  ],
  "dataSource": "BLS CPI",
  "asOfDate": "2025-01-15T00:00:00Z"
}
```

#### 2. Product Impact API
```
GET /api/homepage/product-impact?product={product}&startDate={date}&state={state}
```

**Response:**
```json
{
  "success": true,
  "product": "housing",
  "state": "California",
  "timeline": {
    "startDate": "2024-01-20",
    "endDate": "2024-09-20",
    "startPrice": 2.15,
    "endPrice": 3.89,
    "totalChange": 1.74,
    "percentChange": 80.9
  },
  "drivers": [
    {
      "type": "tariff",
      "title": "Tariffs on Building Materials",
      "description": "Import duties on steel, aluminum, lumber...",
      "components": [
        { "name": "Steel", "rate": "25%" },
        { "name": "Aluminum", "rate": "10%" },
        { "name": "Lumber duties", "rate": "-14.5%" }
      ],
      "source": "National Association of Home Builders",
      "sourceUrl": "https://nahb.org/..."
    }
  ],
  "lobbying": {
    "totalSpent": 2300000000,
    "totalFormatted": "$2.3B",
    "description": "Real estate lobbying in DC",
    "topSpenders": [
      { "name": "NAR", "amount": 84000000 }
    ]
  }
}
```

#### 3. Social Posts API
```
GET /api/homepage/social-posts?limit={limit}&featured={boolean}
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "_id": "...",
      "username": "@janedoe",
      "platform": "twitter",
      "platformDisplay": "X Twitter",
      "verified": false,
      "text": "$6.12/gal in LA today...",
      "image": "/uploads/social/post-123.jpg",
      "engagement": {
        "comments": 250,
        "retweets": 8700,
        "retweetsFormatted": "8.7k",
        "likes": 134600,
        "likesFormatted": "134.6k"
      },
      "createdAt": "2025-01-15T10:00:00Z",
      "timeAgo": "2h ago",
      "featured": true,
      "approved": true
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 3,
    "hasMore": true
  }
}
```

#### 4. Map Data API
```
GET /api/homepage/map-data?metric={metric}
```

**Response:**
```json
{
  "success": true,
  "metric": "price-surge",
  "regions": [
    {
      "stateCode": "CA",
      "stateName": "California",
      "intensity": 0.85,
      "color": "#b91c1c",
      "coordinates": { "cx": 85, "cy": 285, "rx": 75, "ry": 90 },
      "tooltip": {
        "icon": "🥚",
        "text": "Eggs +15%",
        "fullText": "Eggs +15% in CA"
      }
    }
  ],
  "legend": {
    "high": { "color": "#b91c1c", "label": "High Impact (>10%)" },
    "medium": { "color": "#f97316", "label": "Medium Impact (5-10%)" },
    "low": { "color": "#fbbf24", "label": "Low Impact (<5%)" }
  },
  "lastUpdated": "2025-01-15T00:00:00Z"
}
```

#### 5. Nearby Shocks API
```
GET /api/homepage/nearby-shocks?state={state}&limit={limit}
```

**Response:**
```json
{
  "success": true,
  "state": "California",
  "shocks": [
    {
      "item": "Milk",
      "change": "+10%",
      "displayText": "Milk +10%",
      "location": "Los Angeles, CA",
      "icon": "🥛",
      "bgColor": "#fef3c7",
      "category": "dairy"
    }
  ]
}
```

#### 6. Quick Questions API
```
GET /api/homepage/quick-questions?state={state}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "grocery-tax",
      "text": "How does the new tax hit my grocery bill in California?",
      "icon": "shopping-bag",
      "category": "taxes"
    }
  ],
  "personalized": true
}
```

#### 7. Featured States API
```
GET /api/homepage/featured-states
```

**Response:**
```json
{
  "success": true,
  "states": [
    { "code": "CA", "name": "California", "displayName": "CALIFORNIA" },
    { "code": "TX", "name": "Texas", "displayName": "TEXAS" }
  ],
  "reason": "highest-impact"
}
```

#### 8. Timeline Config API
```
GET /api/homepage/timeline-config
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "minDate": "2024-07-01",
    "maxDate": "2025-10-01",
    "defaultDate": "2025-01-20",
    "milestones": [
      {
        "date": "2024-07-01",
        "label": "Before Policy",
        "position": 0
      },
      {
        "date": "2025-01-20",
        "label": "Inauguration Day",
        "position": 50,
        "highlighted": true
      }
    ]
  }
}
```

#### 9. Trending Products API
```
GET /api/homepage/trending-products?limit={limit}
```

**Response:**
```json
{
  "success": true,
  "products": [
    { "name": "eggs", "searchCount": 15420, "trending": true },
    { "name": "housing", "searchCount": 12300, "trending": true },
    { "name": "gasoline", "searchCount": 9800, "trending": false }
  ]
}
```

---

## Database Models

### 1. StateComparison Model

```javascript
// server/models/StateComparison.js
import mongoose from 'mongoose';

const stateComparisonSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['grocery', 'fuel', 'electricity', 'books', 'housing', 'healthcare']
  },
  stateValue: {
    type: Number,
    required: true
  },
  nationalValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'USD'
  },
  displayFormat: {
    type: String,
    enum: ['currency', 'percentage', 'number'],
    default: 'currency'
  },
  dataDate: {
    type: Date,
    required: true
  },
  dataSource: {
    type: String,
    required: true
  },
  sourceUrl: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for percent difference
stateComparisonSchema.virtual('percentDiff').get(function() {
  return ((this.stateValue - this.nationalValue) / this.nationalValue * 100).toFixed(1);
});

// Compound index for efficient queries
stateComparisonSchema.index({ state: 1, category: 1, dataDate: -1 });

export default mongoose.model('StateComparison', stateComparisonSchema);
```

### 2. SocialPost Model

```javascript
// server/models/SocialPost.js
import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['twitter', 'threads', 'facebook', 'instagram', 'tiktok']
  },
  externalId: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: String,
  verified: {
    type: Boolean,
    default: false
  },
  avatarUrl: String,
  text: {
    type: String,
    required: true,
    maxLength: 1000
  },
  images: [{
    url: String,
    alt: String
  }],
  engagement: {
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  originalUrl: String,
  postedAt: {
    type: Date,
    required: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  approved: {
    type: Boolean,
    default: false,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  tags: [String],
  relatedState: String,
  relatedCategory: String
}, {
  timestamps: true
});

// Index for fetching featured, approved posts
socialPostSchema.index({ featured: 1, approved: 1, postedAt: -1 });

// Virtual for time ago
socialPostSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.postedAt) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit.charAt(0)} ago`;
    }
  }
  return 'just now';
});

export default mongoose.model('SocialPost', socialPostSchema);
```

### 3. ProductImpact Model

```javascript
// server/models/ProductImpact.js
import mongoose from 'mongoose';

const priceDriverSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tariff', 'tax', 'regulation', 'supply-chain', 'labor', 'weather', 'currency'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  components: [{
    name: String,
    rate: String,
    value: Number
  }],
  impactPercent: Number,
  source: String,
  sourceUrl: String
});

const lobbyingInfoSchema = new mongoose.Schema({
  totalSpent: Number,
  industry: String,
  description: String,
  topSpenders: [{
    name: String,
    amount: Number
  }],
  dataSource: String
});

const productImpactSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true,
    index: true
  },
  productCategory: {
    type: String,
    enum: ['food', 'energy', 'housing', 'transportation', 'healthcare', 'education', 'consumer-goods']
  },
  state: {
    type: String,
    required: true,
    index: true
  },
  priceHistory: [{
    date: Date,
    price: Number,
    source: String
  }],
  drivers: [priceDriverSchema],
  lobbying: lobbyingInfoSchema,
  dataDate: Date,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }
}, {
  timestamps: true
});

// Compound index
productImpactSchema.index({ product: 1, state: 1, 'priceHistory.date': -1 });

export default mongoose.model('ProductImpact', productImpactSchema);
```

### 4. MapRegion Model

```javascript
// server/models/MapRegion.js
import mongoose from 'mongoose';

const tooltipSchema = new mongoose.Schema({
  icon: String,
  text: String,
  category: String,
  value: Number,
  trend: {
    type: String,
    enum: ['up', 'down', 'stable']
  }
});

const mapRegionSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minLength: 2,
    maxLength: 2
  },
  stateName: {
    type: String,
    required: true
  },
  coordinates: {
    cx: Number,
    cy: Number,
    rx: Number,
    ry: Number,
    rotation: { type: Number, default: 0 }
  },
  metrics: {
    priceImpact: {
      intensity: { type: Number, min: 0, max: 1 },
      color: String,
      tooltips: [tooltipSchema]
    },
    lobbyingImpact: {
      intensity: { type: Number, min: 0, max: 1 },
      color: String,
      tooltips: [tooltipSchema]
    }
  },
  lastUpdated: Date
}, {
  timestamps: true
});

export default mongoose.model('MapRegion', mapRegionSchema);
```

### 5. QuickQuestion Model

```javascript
// server/models/QuickQuestion.js
import mongoose from 'mongoose';

const quickQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  textTemplate: {
    type: String,
    // e.g., "How does the new tax hit my grocery bill in {state}?"
  },
  icon: {
    type: String,
    enum: ['shopping-bag', 'credit-card', 'globe', 'gas-pump', 'home', 'book'],
    default: 'shopping-bag'
  },
  category: {
    type: String,
    enum: ['taxes', 'prices', 'comparisons', 'policy', 'general']
  },
  states: [{
    type: String
    // Empty array = all states
  }],
  priority: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  clickCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

quickQuestionSchema.index({ active: 1, priority: -1 });

export default mongoose.model('QuickQuestion', quickQuestionSchema);
```

### 6. TimelineConfig Model

```javascript
// server/models/TimelineConfig.js
import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  highlighted: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    min: 0,
    max: 100
  }
});

const timelineConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'default'
  },
  minDate: {
    type: Date,
    required: true
  },
  maxDate: {
    type: Date,
    required: true
  },
  defaultDate: Date,
  milestones: [milestoneSchema],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('TimelineConfig', timelineConfigSchema);
```

---

## Implementation Steps

### Step 1: Create Database Models (Day 1)

- [ ] Create `StateComparison.js` model
- [ ] Create `SocialPost.js` model
- [ ] Create `ProductImpact.js` model
- [ ] Create `MapRegion.js` model
- [ ] Create `QuickQuestion.js` model
- [ ] Create `TimelineConfig.js` model
- [ ] Add indexes for performance
- [ ] Test model validations

### Step 2: Implement API Routes (Day 2-3)

- [ ] Add `/api/homepage/state-comparison` endpoint
- [ ] Add `/api/homepage/product-impact` endpoint
- [ ] Add `/api/homepage/social-posts` endpoint
- [ ] Add `/api/homepage/map-data` endpoint
- [ ] Add `/api/homepage/nearby-shocks` endpoint
- [ ] Add `/api/homepage/quick-questions` endpoint
- [ ] Add `/api/homepage/featured-states` endpoint
- [ ] Add `/api/homepage/timeline-config` endpoint
- [ ] Add `/api/homepage/trending-products` endpoint

### Step 3: Create Seed Data (Day 3-4)

- [ ] Create seed script for state comparisons
- [ ] Create seed script for social posts
- [ ] Create seed script for product impacts
- [ ] Create seed script for map regions
- [ ] Create seed script for quick questions
- [ ] Create seed script for timeline config
- [ ] Add seed command to package.json

### Step 4: Add Caching Layer (Day 4)

- [ ] Install Redis or use in-memory cache
- [ ] Cache state comparison data (TTL: 1 hour)
- [ ] Cache map data (TTL: 30 minutes)
- [ ] Cache timeline config (TTL: 24 hours)
- [ ] Add cache invalidation on data updates

### Step 5: Update Frontend Integration (Day 5)

- [ ] Create API client functions for new endpoints
- [ ] Update Home.jsx to fetch from new APIs
- [ ] Implement fallback to hardcoded data on error
- [ ] Add loading states for each section
- [ ] Test with network throttling

### Step 6: Fix Stats Section (Day 5)

- [ ] Update Stats JSX to use `stats` state
- [ ] Map API response to display format
- [ ] Add number formatting utilities
- [ ] Handle missing data gracefully

### Step 7: Error Handling & Validation (Day 6)

- [ ] Add request validation middleware
- [ ] Implement consistent error responses
- [ ] Add rate limiting per endpoint
- [ ] Log errors with context
- [ ] Create error recovery strategies

### Step 8: Testing (Day 6-7)

- [ ] Unit tests for models
- [ ] Integration tests for APIs
- [ ] Load testing for concurrent requests
- [ ] Test fallback scenarios
- [ ] Test cache behavior

---

## API Client Code

```javascript
// client/src/api/homepage.js

import { API_URL } from '../utils/apiUrl';

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const homepageApi = {
  // Existing endpoints
  getWalletShocks: (state, limit = 4) =>
    fetchWithAuth(`/api/homepage/wallet-shocks?state=${state}&limit=${limit}`),

  getCostDrivers: (state, period = 'YoY') =>
    fetchWithAuth(`/api/homepage/cost-drivers?state=${state}&period=${period}`),

  getStats: (state) =>
    fetchWithAuth(`/api/homepage/stats?state=${state}`),

  // New endpoints
  getStateComparison: (state) =>
    fetchWithAuth(`/api/homepage/state-comparison?state=${state}`),

  getProductImpact: (product, startDate, state) =>
    fetchWithAuth(`/api/homepage/product-impact?product=${encodeURIComponent(product)}&startDate=${startDate}&state=${state}`),

  getSocialPosts: (limit = 3, featured = true) =>
    fetchWithAuth(`/api/homepage/social-posts?limit=${limit}&featured=${featured}`),

  getMapData: (metric = 'price-surge') =>
    fetchWithAuth(`/api/homepage/map-data?metric=${metric}`),

  getNearbyShocks: (state, limit = 5) =>
    fetchWithAuth(`/api/homepage/nearby-shocks?state=${state}&limit=${limit}`),

  getQuickQuestions: (state) =>
    fetchWithAuth(`/api/homepage/quick-questions?state=${state}`),

  getFeaturedStates: () =>
    fetchWithAuth('/api/homepage/featured-states'),

  getTimelineConfig: () =>
    fetchWithAuth('/api/homepage/timeline-config'),

  getTrendingProducts: (limit = 5) =>
    fetchWithAuth(`/api/homepage/trending-products?limit=${limit}`),

  // Aggregated endpoint for initial load
  getHomepageData: (state, period = 'YoY') =>
    fetchWithAuth(`/api/homepage/all?state=${state}&period=${period}`)
};
```

---

## Caching Strategy

```javascript
// server/middleware/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60
});

const cacheConfig = {
  'state-comparison': 3600,    // 1 hour
  'map-data': 1800,            // 30 minutes
  'timeline-config': 86400,    // 24 hours
  'featured-states': 3600,     // 1 hour
  'quick-questions': 3600,     // 1 hour
  'social-posts': 300,         // 5 minutes
  'trending-products': 900,    // 15 minutes
  'wallet-shocks': 300,        // 5 minutes
  'cost-drivers': 600,         // 10 minutes
  'stats': 600                 // 10 minutes
};

export const cacheMiddleware = (keyPrefix) => {
  return (req, res, next) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      // Only cache successful responses
      if (data.success !== false) {
        cache.set(cacheKey, data, cacheConfig[keyPrefix] || 300);
      }
      return originalJson(data);
    };

    next();
  };
};

export const invalidateCache = (keyPrefix) => {
  const keys = cache.keys().filter(k => k.startsWith(keyPrefix));
  keys.forEach(k => cache.del(k));
};
```

---

## Testing Strategy

### Unit Tests

```javascript
// server/tests/models/StateComparison.test.js
import StateComparison from '../../models/StateComparison.js';

describe('StateComparison Model', () => {
  it('should calculate percentDiff correctly', () => {
    const comparison = new StateComparison({
      state: 'California',
      category: 'grocery',
      stateValue: 412,
      nationalValue: 395,
      dataDate: new Date(),
      dataSource: 'BLS'
    });

    expect(comparison.percentDiff).toBe('4.3');
  });

  it('should require state field', async () => {
    const comparison = new StateComparison({
      category: 'grocery',
      stateValue: 412,
      nationalValue: 395
    });

    await expect(comparison.validate()).rejects.toThrow();
  });
});
```

### Integration Tests

```javascript
// server/tests/routes/homepage.test.js
import request from 'supertest';
import app from '../../app.js';

describe('Homepage API', () => {
  describe('GET /api/homepage/state-comparison', () => {
    it('should return comparison data for valid state', async () => {
      const res = await request(app)
        .get('/api/homepage/state-comparison?state=California')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.comparisons).toBeInstanceOf(Array);
    });

    it('should use nationwide as default', async () => {
      const res = await request(app)
        .get('/api/homepage/state-comparison')
        .expect(200);

      expect(res.body.state).toBe('nationwide');
    });
  });
});
```

---

## Rollback Plan

1. Keep hardcoded fallback data in place
2. Use feature flags for new API integrations
3. Monitor error rates after deployment
4. If error rate > 5%, revert to hardcoded data
5. Keep old code paths for 2 weeks after migration

```javascript
// Feature flag implementation
const USE_NEW_API = process.env.USE_NEW_HOMEPAGE_API === 'true';

const getComparisonData = async (state) => {
  if (!USE_NEW_API) {
    return fallbackComparisonData;
  }

  try {
    const data = await homepageApi.getStateComparison(state);
    return data.comparisons;
  } catch (error) {
    console.error('API failed, using fallback:', error);
    return fallbackComparisonData;
  }
};
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API endpoints implemented | 9 new |
| Hardcoded data removed | 100% |
| API response time p95 | < 200ms |
| Cache hit rate | > 80% |
| Error rate | < 1% |
| Test coverage | > 80% |

---

## Next Steps

After completing Phase 1:
1. Proceed to Phase 2 (Component Architecture) to refactor the monolithic Home.jsx
2. The new API structure will enable better component separation
3. Each component can manage its own data fetching
