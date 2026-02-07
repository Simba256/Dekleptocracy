# Phase 6: Content & Data Quality

## Overview

This phase focuses on replacing seed/demo data with real, verified data from authoritative sources. This includes setting up data pipelines, ensuring data accuracy, and implementing proper source attribution.

## Goals

1. Integrate real data sources (BLS, FRED, OpenSecrets)
2. Set up automated data pipelines
3. Implement data validation and quality checks
4. Add proper source attribution
5. Create historical data archives
6. Establish data freshness standards

---

## Data Sources Inventory

### Primary Data Sources

| Source | Data Type | Update Frequency | API Available |
|--------|-----------|------------------|---------------|
| **BLS (Bureau of Labor Statistics)** | CPI, Consumer prices | Monthly | Yes (free) |
| **FRED (Federal Reserve)** | Economic indicators | Varies | Yes (free) |
| **OpenSecrets** | Lobbying, campaign finance | Quarterly | Yes (API key) |
| **USDA** | Food prices | Monthly | Yes (free) |
| **EIA** | Energy prices | Weekly/Monthly | Yes (free) |
| **Census Bureau** | Demographics, housing | Annually | Yes (free) |
| **Tariff data (USITC)** | Import tariffs | Varies | Limited |

### Secondary Data Sources

| Source | Data Type | Notes |
|--------|-----------|-------|
| **State government sites** | State-specific data | Manual or scraping |
| **News APIs** | Related articles | For context |
| **Social media APIs** | User posts | Curated selection |

---

## Data Pipeline Architecture

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                              │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   BLS    │   FRED   │ OpenSec  │   USDA   │   EIA    │  Census  │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │          │
     v          v          v          v          v          v
┌─────────────────────────────────────────────────────────────────┐
│                     Data Collectors                              │
│  (Node.js services that fetch data on schedule)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────────┐
│                     Data Transformers                            │
│  (Normalize, validate, calculate derived metrics)                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Database                             │
│  (Raw data + processed data + historical archives)               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  (Express.js endpoints with caching)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Collector Services

```javascript
// server/services/dataCollectors/blsCollector.js
import axios from 'axios';
import { parseISO, format } from 'date-fns';

const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const BLS_API_KEY = process.env.BLS_API_KEY;

// Series IDs for Consumer Price Index
const CPI_SERIES = {
  'all-items': 'CUUR0000SA0',      // All items, US city average
  'food': 'CUUR0000SAF1',          // Food
  'food-home': 'CUUR0000SAF11',    // Food at home
  'energy': 'CUUR0000SA0E',        // Energy
  'gasoline': 'CUUR0000SETB01',    // Gasoline
  'electricity': 'CUUR0000SEHF01', // Electricity
  'housing': 'CUUR0000SAH1',       // Housing
  'medical': 'CUUR0000SAM',        // Medical care
  'apparel': 'CUUR0000SAA',        // Apparel
  'transportation': 'CUUR0000SAT'  // Transportation
};

// Regional series prefixes
const REGIONAL_PREFIXES = {
  'Northeast': 'CUUR0100',
  'Midwest': 'CUUR0200',
  'South': 'CUUR0300',
  'West': 'CUUR0400'
};

export class BLSCollector {
  constructor() {
    this.apiKey = BLS_API_KEY;
    this.baseUrl = BLS_API_URL;
  }

  async fetchCPIData(seriesIds, startYear, endYear) {
    try {
      const response = await axios.post(this.baseUrl, {
        seriesid: seriesIds,
        startyear: startYear.toString(),
        endyear: endYear.toString(),
        registrationkey: this.apiKey
      });

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(`BLS API error: ${response.data.message}`);
      }

      return response.data.Results.series;
    } catch (error) {
      console.error('BLS fetch error:', error);
      throw error;
    }
  }

  async collectNationalCPI() {
    const currentYear = new Date().getFullYear();
    const seriesIds = Object.values(CPI_SERIES);

    const data = await this.fetchCPIData(
      seriesIds,
      currentYear - 2,
      currentYear
    );

    return this.transformCPIData(data);
  }

  transformCPIData(rawData) {
    const transformed = [];

    for (const series of rawData) {
      const seriesId = series.seriesID;
      const category = this.getCategoryFromSeriesId(seriesId);

      for (const dataPoint of series.data) {
        transformed.push({
          category,
          seriesId,
          year: parseInt(dataPoint.year),
          period: dataPoint.period,
          periodName: dataPoint.periodName,
          value: parseFloat(dataPoint.value),
          footnotes: dataPoint.footnotes,
          fetchedAt: new Date(),
          source: 'BLS',
          sourceUrl: `https://www.bls.gov/cpi/`
        });
      }
    }

    return transformed;
  }

  getCategoryFromSeriesId(seriesId) {
    for (const [category, id] of Object.entries(CPI_SERIES)) {
      if (seriesId.includes(id.slice(-6))) {
        return category;
      }
    }
    return 'unknown';
  }

  // Calculate year-over-year change
  calculateYoYChange(currentValue, previousValue) {
    if (!previousValue) return null;
    return ((currentValue - previousValue) / previousValue * 100).toFixed(2);
  }
}

export default new BLSCollector();
```

```javascript
// server/services/dataCollectors/fredCollector.js
import axios from 'axios';

const FRED_API_URL = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = process.env.FRED_API_KEY;

// Relevant FRED series
const FRED_SERIES = {
  'gdp': 'GDP',
  'unemployment': 'UNRATE',
  'inflation': 'CPIAUCSL',
  'fed-funds': 'FEDFUNDS',
  'consumer-sentiment': 'UMCSENT',
  'housing-starts': 'HOUST',
  'retail-sales': 'RSAFS',
  'personal-income': 'PI'
};

export class FREDCollector {
  constructor() {
    this.apiKey = FRED_API_KEY;
    this.baseUrl = FRED_API_URL;
  }

  async fetchSeries(seriesId, options = {}) {
    const {
      startDate,
      endDate,
      frequency = 'm' // monthly
    } = options;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          series_id: seriesId,
          api_key: this.apiKey,
          file_type: 'json',
          observation_start: startDate,
          observation_end: endDate,
          frequency
        }
      });

      return response.data.observations;
    } catch (error) {
      console.error(`FRED fetch error for ${seriesId}:`, error);
      throw error;
    }
  }

  async collectAllSeries() {
    const results = {};
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    for (const [name, seriesId] of Object.entries(FRED_SERIES)) {
      try {
        const data = await this.fetchSeries(seriesId, { startDate, endDate });
        results[name] = this.transformData(data, name, seriesId);
      } catch (error) {
        console.error(`Failed to collect ${name}:`, error);
      }
    }

    return results;
  }

  transformData(observations, name, seriesId) {
    return observations.map(obs => ({
      metric: name,
      seriesId,
      date: obs.date,
      value: parseFloat(obs.value) || null,
      fetchedAt: new Date(),
      source: 'FRED',
      sourceUrl: `https://fred.stlouisfed.org/series/${seriesId}`
    }));
  }
}

export default new FREDCollector();
```

```javascript
// server/services/dataCollectors/openSecretsCollector.js
import axios from 'axios';

const OPENSECRETS_API_URL = 'https://www.opensecrets.org/api/';
const OPENSECRETS_API_KEY = process.env.OPENSECRETS_API_KEY;

export class OpenSecretsCollector {
  constructor() {
    this.apiKey = OPENSECRETS_API_KEY;
    this.baseUrl = OPENSECRETS_API_URL;
  }

  async fetchLobbyingData(year) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'getLobbyingByIndustry',
          year,
          apikey: this.apiKey,
          output: 'json'
        }
      });

      return response.data.response.industries;
    } catch (error) {
      console.error('OpenSecrets lobbying fetch error:', error);
      throw error;
    }
  }

  async fetchTopContributors(industryCode) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'getSectors',
          apikey: this.apiKey,
          output: 'json'
        }
      });

      return response.data.response.sectors;
    } catch (error) {
      console.error('OpenSecrets contributors fetch error:', error);
      throw error;
    }
  }

  async collectLobbyingByIndustry() {
    const currentYear = new Date().getFullYear();
    const data = await this.fetchLobbyingData(currentYear);

    return data.map(industry => ({
      industry: industry.industry_name,
      industryCode: industry.industry_code,
      totalSpent: parseFloat(industry.total),
      year: currentYear,
      fetchedAt: new Date(),
      source: 'OpenSecrets',
      sourceUrl: 'https://www.opensecrets.org/federal-lobbying'
    }));
  }
}

export default new OpenSecretsCollector();
```

### Data Transformer

```javascript
// server/services/dataTransformers/priceTransformer.js
import StateComparison from '../../models/StateComparison.js';
import WalletShock from '../../models/WalletShock.js';
import CostDriver from '../../models/CostDriver.js';

export class PriceTransformer {
  // Transform raw CPI data into wallet shocks
  async createWalletShocks(cpiData, previousCpiData) {
    const shocks = [];

    for (const current of cpiData) {
      const previous = previousCpiData.find(
        p => p.category === current.category && p.period === current.period
      );

      if (previous) {
        const changePercent = ((current.value - previous.value) / previous.value * 100);

        // Only create shock if change is significant (> 2%)
        if (Math.abs(changePercent) > 2) {
          shocks.push({
            category: this.formatCategory(current.category),
            title: this.generateTitle(current.category, changePercent),
            icon: this.getCategoryIcon(current.category),
            iconBg: this.getCategoryColor(current.category),
            price: this.formatPrice(current.value),
            unit: 'index',
            change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
            changePercent,
            state: 'nationwide',
            dataDate: new Date(`${current.year}-${current.period.replace('M', '')}-01`),
            source: current.source,
            sourceUrl: current.sourceUrl,
            status: 'published'
          });
        }
      }
    }

    return shocks;
  }

  // Transform CPI data into state comparisons
  async createStateComparisons(stateData, nationalData) {
    const comparisons = [];

    for (const stateItem of stateData) {
      const nationalItem = nationalData.find(n => n.category === stateItem.category);

      if (nationalItem) {
        comparisons.push({
          state: stateItem.state,
          category: stateItem.category,
          stateValue: stateItem.value,
          nationalValue: nationalItem.value,
          dataDate: stateItem.date,
          dataSource: stateItem.source,
          sourceUrl: stateItem.sourceUrl,
          status: 'published'
        });
      }
    }

    return comparisons;
  }

  // Calculate cost drivers from multiple sources
  async calculateCostDrivers(tariffData, inflationData, supplyData) {
    // Normalize all factors to percentage contribution
    const total = tariffData.impact + inflationData.impact + supplyData.impact;

    return [
      {
        label: 'Tariffs',
        percentage: Math.round((tariffData.impact / total) * 100),
        color: '#3E5132',
        type: 'direct',
        source: tariffData.source
      },
      {
        label: 'Inflation',
        percentage: Math.round((inflationData.impact / total) * 100),
        color: '#6B7F5F',
        type: 'indirect',
        source: inflationData.source
      },
      {
        label: 'Supply Chain',
        percentage: Math.round((supplyData.impact / total) * 100),
        color: '#A8B89C',
        type: 'indirect',
        source: supplyData.source
      }
    ];
  }

  formatCategory(category) {
    const mapping = {
      'food': 'FOOD',
      'food-home': 'GROCERIES',
      'energy': 'ENERGY',
      'gasoline': 'FUEL',
      'electricity': 'UTILITIES',
      'housing': 'HOUSING',
      'medical': 'HEALTHCARE'
    };
    return mapping[category] || category.toUpperCase();
  }

  generateTitle(category, change) {
    const direction = change > 0 ? 'rise' : 'fall';
    const titles = {
      'food': `Food prices ${direction} by ${Math.abs(change).toFixed(1)}%`,
      'gasoline': `Gas prices ${direction} sharply`,
      'housing': `Housing costs ${direction}`,
      'electricity': `Electric bills ${direction}`
    };
    return titles[category] || `${category} prices ${direction}`;
  }

  getCategoryIcon(category) {
    const icons = {
      'food': '🛒',
      'food-home': '🥚',
      'gasoline': '⛽',
      'electricity': '💡',
      'housing': '🏠',
      'medical': '🏥'
    };
    return icons[category] || '📊';
  }

  getCategoryColor(category) {
    const colors = {
      'food': '#fef3c7',
      'gasoline': '#dbeafe',
      'electricity': '#fce7f3',
      'housing': '#d1fae5'
    };
    return colors[category] || '#f3f4f6';
  }

  formatPrice(value) {
    return value.toFixed(1);
  }
}

export default new PriceTransformer();
```

### Scheduler Service

```javascript
// server/services/scheduler.js
import cron from 'node-cron';
import blsCollector from './dataCollectors/blsCollector.js';
import fredCollector from './dataCollectors/fredCollector.js';
import openSecretsCollector from './dataCollectors/openSecretsCollector.js';
import priceTransformer from './dataTransformers/priceTransformer.js';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import StatsSummary from '../models/StatsSummary.js';
import logger from '../utils/logger.js';

class DataScheduler {
  constructor() {
    this.jobs = [];
  }

  init() {
    // Daily price data update (6 AM EST)
    this.jobs.push(
      cron.schedule('0 6 * * *', () => this.runDailyUpdate(), {
        timezone: 'America/New_York'
      })
    );

    // Weekly BLS data check (Monday 7 AM EST)
    this.jobs.push(
      cron.schedule('0 7 * * 1', () => this.runBLSUpdate(), {
        timezone: 'America/New_York'
      })
    );

    // Monthly lobbying data update (1st of month)
    this.jobs.push(
      cron.schedule('0 8 1 * *', () => this.runLobbyingUpdate(), {
        timezone: 'America/New_York'
      })
    );

    logger.info('Data scheduler initialized');
  }

  async runDailyUpdate() {
    logger.info('Starting daily data update');

    try {
      // Fetch FRED data
      const fredData = await fredCollector.collectAllSeries();
      logger.info('FRED data collected', { series: Object.keys(fredData).length });

      // Update stats
      await this.updateStats(fredData);

      logger.info('Daily update completed');
    } catch (error) {
      logger.error('Daily update failed', error);
    }
  }

  async runBLSUpdate() {
    logger.info('Starting BLS data update');

    try {
      const cpiData = await blsCollector.collectNationalCPI();
      logger.info('BLS CPI data collected', { records: cpiData.length });

      // Get previous period data
      const previousData = await this.getPreviousCPIData();

      // Transform into wallet shocks
      const shocks = await priceTransformer.createWalletShocks(cpiData, previousData);

      // Save new shocks
      for (const shock of shocks) {
        await WalletShock.findOneAndUpdate(
          {
            category: shock.category,
            state: shock.state,
            dataDate: shock.dataDate
          },
          shock,
          { upsert: true, new: true }
        );
      }

      logger.info('BLS update completed', { shocksCreated: shocks.length });
    } catch (error) {
      logger.error('BLS update failed', error);
    }
  }

  async runLobbyingUpdate() {
    logger.info('Starting lobbying data update');

    try {
      const lobbyingData = await openSecretsCollector.collectLobbyingByIndustry();
      logger.info('Lobbying data collected', { industries: lobbyingData.length });

      // Update lobbying stats
      const totalSpent = lobbyingData.reduce((sum, i) => sum + i.totalSpent, 0);

      await StatsSummary.findOneAndUpdate(
        { statType: 'lobbying', state: 'nationwide' },
        {
          value: totalSpent,
          formattedValue: this.formatLargeNumber(totalSpent),
          dataDate: new Date(),
          source: 'OpenSecrets',
          status: 'published'
        },
        { upsert: true }
      );

      logger.info('Lobbying update completed');
    } catch (error) {
      logger.error('Lobbying update failed', error);
    }
  }

  async updateStats(fredData) {
    // Update consumer cost impact from CPI
    if (fredData.inflation) {
      const latest = fredData.inflation[fredData.inflation.length - 1];
      await StatsSummary.findOneAndUpdate(
        { statType: 'consumer-cost', state: 'nationwide' },
        {
          value: latest.value,
          formattedValue: `$${(latest.value * 100).toFixed(0)}`,
          change: '+5.2%', // Calculate from previous
          dataDate: new Date(latest.date),
          source: 'FRED',
          status: 'published'
        },
        { upsert: true }
      );
    }
  }

  formatLargeNumber(num) {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num}`;
  }

  async getPreviousCPIData() {
    // Fetch from database or previous API call
    return [];
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    logger.info('Data scheduler stopped');
  }
}

export default new DataScheduler();
```

---

## Data Quality Checks

```javascript
// server/services/dataQuality.js

export class DataQualityChecker {
  // Validate incoming data
  validateCPIData(data) {
    const errors = [];

    for (const record of data) {
      // Check required fields
      if (!record.category) {
        errors.push({ record, error: 'Missing category' });
      }
      if (typeof record.value !== 'number' || isNaN(record.value)) {
        errors.push({ record, error: 'Invalid value' });
      }
      if (record.value < 0 || record.value > 1000) {
        errors.push({ record, error: 'Value out of range' });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      validRecords: data.filter(d => !errors.find(e => e.record === d))
    };
  }

  // Check for anomalies
  detectAnomalies(newData, historicalData) {
    const anomalies = [];

    for (const newRecord of newData) {
      const historical = historicalData.filter(
        h => h.category === newRecord.category
      );

      if (historical.length > 0) {
        const avgValue = historical.reduce((s, h) => s + h.value, 0) / historical.length;
        const stdDev = this.calculateStdDev(historical.map(h => h.value));

        // Flag if more than 3 standard deviations from mean
        if (Math.abs(newRecord.value - avgValue) > 3 * stdDev) {
          anomalies.push({
            record: newRecord,
            expectedRange: [avgValue - 2 * stdDev, avgValue + 2 * stdDev],
            message: 'Value significantly deviates from historical average'
          });
        }
      }
    }

    return anomalies;
  }

  calculateStdDev(values) {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((s, v) => s + v, 0) / values.length);
  }

  // Check data freshness
  checkFreshness(data, maxAgeHours = 24) {
    const now = new Date();
    const stale = [];

    for (const record of data) {
      const ageHours = (now - new Date(record.fetchedAt)) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) {
        stale.push({
          record,
          ageHours: Math.round(ageHours),
          message: `Data is ${Math.round(ageHours)} hours old`
        });
      }
    }

    return stale;
  }
}

export default new DataQualityChecker();
```

---

## Source Attribution

```javascript
// server/models/DataSource.js
import mongoose from 'mongoose';

const dataSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: String,
  description: String,
  url: String,
  apiEndpoint: String,
  updateFrequency: {
    type: String,
    enum: ['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']
  },
  reliability: {
    type: String,
    enum: ['official', 'verified', 'community', 'unverified']
  },
  license: String,
  attribution: String, // Required attribution text
  lastFetched: Date,
  lastSuccessful: Date,
  errorCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('DataSource', dataSourceSchema);

// Usage in responses
const addSourceAttribution = (data, sourceId) => {
  return {
    ...data,
    attribution: {
      source: sourceId,
      name: 'Bureau of Labor Statistics',
      url: 'https://www.bls.gov/',
      accessedAt: new Date(),
      license: 'Public Domain'
    }
  };
};
```

---

## Implementation Steps

### Step 1: API Keys & Setup (Day 1)

- [ ] Register for BLS API key
- [ ] Register for FRED API key
- [ ] Register for OpenSecrets API key
- [ ] Set up environment variables
- [ ] Test API connections

### Step 2: Data Collectors (Day 2-3)

- [ ] Implement BLS collector
- [ ] Implement FRED collector
- [ ] Implement OpenSecrets collector
- [ ] Add error handling and retries
- [ ] Create unit tests

### Step 3: Data Transformers (Day 3-4)

- [ ] Build price transformer
- [ ] Create state comparison transformer
- [ ] Build cost driver calculator
- [ ] Add validation logic
- [ ] Test transformations

### Step 4: Scheduler Setup (Day 4-5)

- [ ] Configure cron jobs
- [ ] Set up job monitoring
- [ ] Add failure notifications
- [ ] Create manual trigger endpoints
- [ ] Test scheduling

### Step 5: Data Quality (Day 5-6)

- [ ] Implement validation checks
- [ ] Add anomaly detection
- [ ] Create freshness monitoring
- [ ] Set up alerts
- [ ] Build quality dashboard

### Step 6: Migration (Day 6-7)

- [ ] Back up seed data
- [ ] Run initial data collection
- [ ] Validate new data
- [ ] Switch to live data
- [ ] Monitor for issues

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Data sources integrated | 5+ |
| Data freshness | < 24 hours |
| Validation pass rate | > 99% |
| Anomaly detection rate | > 95% |
| Source attribution coverage | 100% |

---

## Next Steps

After completing Phase 6:
1. Proceed to Phase 7 (SEO & Discoverability)
2. Real data enables:
   - Credible content for SEO
   - Shareable insights
   - User trust
