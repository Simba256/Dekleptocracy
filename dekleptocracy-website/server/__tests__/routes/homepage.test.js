import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import WalletShock from '../../models/WalletShock.js';
import CostDriver from '../../models/CostDriver.js';
import StatsSummary from '../../models/StatsSummary.js';
import StateComparison from '../../models/StateComparison.js';
import QuickQuestion from '../../models/QuickQuestion.js';
import ProductImpact from '../../models/ProductImpact.js';
import { createTestUser, getAuthHeader } from '../helpers/auth.js';

// Mock the report generator (PDF/CSV) to avoid pdfkit dependency issues in tests
vi.mock('../../services/reportGenerator.js', () => ({
  generateStateReport: vi.fn().mockReturnValue({
    pipe: vi.fn(),
    end: vi.fn(),
  }),
  generateCSVExport: vi.fn().mockResolvedValue('state,value\nCalifornia,100'),
}));

async function seedWalletShock(overrides = {}) {
  return new WalletShock({
    state: 'California',
    category: 'fuel',
    title: 'Gas prices up',
    price: '$4.50',
    unit: 'per gallon',
    change: '+12.5%',
    changePercent: 12.5,
    chartPath: 'M0,20 L10,15 L20,18 L30,10',
    dataDate: new Date(),
    status: 'published',
    source: 'test',
    ...overrides,
  }).save();
}

async function seedCostDriver(overrides = {}) {
  return new CostDriver({
    state: 'California',
    timePeriod: 'YoY',
    category: 'fuel',
    label: 'Gasoline',
    percentage: 35,
    color: '#ef4444',
    type: 'direct',
    displayOrder: 1,
    status: 'published',
    ...overrides,
  }).save();
}

async function seedStatsSummary(overrides = {}) {
  return new StatsSummary({
    state: 'California',
    statType: 'lobbying',
    value: 3200000000,
    displayValue: '$3.2B',
    change: 28.42,
    changeDisplay: '+28.42%',
    changeDirection: 'up',
    dataDate: new Date(),
    status: 'published',
    ...overrides,
  }).save();
}

describe('Homepage Routes', () => {
  describe('GET /api/homepage/wallet-shocks', () => {
    it('should return wallet shocks for default state', async () => {
      await seedWalletShock({ state: 'nationwide' });

      const res = await request(app).get('/api/homepage/wallet-shocks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('nationwide');
      expect(res.body.shocks).toHaveLength(1);
    });

    it('should filter by query param state', async () => {
      await seedWalletShock({ state: 'Texas' });
      await seedWalletShock({ state: 'California' });

      const res = await request(app).get('/api/homepage/wallet-shocks?state=Texas');

      expect(res.status).toBe(200);
      expect(res.body.state).toBe('Texas');
      expect(res.body.shocks).toHaveLength(1);
    });
  });

  describe('GET /api/homepage/cost-drivers', () => {
    it('should return cost drivers for a state', async () => {
      await seedCostDriver({ state: 'nationwide' });

      const res = await request(app).get('/api/homepage/cost-drivers?state=nationwide');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.drivers).toHaveLength(1);
    });

    it('should respect period query param', async () => {
      await seedCostDriver({ state: 'nationwide', timePeriod: 'YoY' });
      await seedCostDriver({ state: 'nationwide', timePeriod: '30 days', name: 'Electric', category: 'utilities' });

      const res = await request(app).get('/api/homepage/cost-drivers?state=nationwide&period=30 days');

      expect(res.status).toBe(200);
      expect(res.body.drivers).toHaveLength(1);
      expect(res.body.period).toBe('30 days');
    });
  });

  describe('GET /api/homepage/stats', () => {
    it('should return grouped stats for a state', async () => {
      await seedStatsSummary({ state: 'nationwide', statType: 'lobbying' });
      await seedStatsSummary({ state: 'nationwide', statType: 'consumer-cost' });

      const res = await request(app).get('/api/homepage/stats?state=nationwide');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.lobbying).toBeDefined();
      expect(res.body.stats.consumerCost).toBeDefined();
    });
  });

  describe('GET /api/homepage/state-comparison', () => {
    it('should return state comparison data', async () => {
      await new StateComparison({
        state: 'California',
        category: 'fuel',
        label: 'Gas Price',
        stateValue: '$4.50',
        nationalValue: '$3.50',
        stateNumericValue: 4.5,
        nationalNumericValue: 3.5,
        percentDifference: 28.6,
        percentDisplay: '+28.6%',
        source: 'test',
        displayOrder: 1,
        status: 'published',
      }).save();

      const res = await request(app).get('/api/homepage/state-comparison?state=California');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comparisons).toHaveLength(1);
    });
  });

  describe('POST /api/homepage/wallet-shocks/:id/react', () => {
    it('should add a reaction to a wallet shock', async () => {
      const shock = await seedWalletShock();

      const res = await request(app)
        .post(`/api/homepage/wallet-shocks/${shock._id}/react`)
        .send({ reactionType: 'shock' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reactions).toBeDefined();
    });

    it('should return 400 for invalid reaction type', async () => {
      const shock = await seedWalletShock();

      const res = await request(app)
        .post(`/api/homepage/wallet-shocks/${shock._id}/react`)
        .send({ reactionType: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for nonexistent wallet shock', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .post(`/api/homepage/wallet-shocks/${fakeId}/react`)
        .send({ reactionType: 'shock' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/homepage/quick-questions', () => {
    it('should return featured quick questions', async () => {
      await new QuickQuestion({
        text: 'How much is gas?',
        category: 'prices',
        icon: '⛽',
        iconType: 'emoji',
        featured: true,
        displayOrder: 1,
        status: 'published',
      }).save();

      const res = await request(app).get('/api/homepage/quick-questions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.questions).toHaveLength(1);
    });
  });

  describe('POST /api/homepage/quick-questions/:id/click', () => {
    it('should increment click count', async () => {
      const question = await new QuickQuestion({
        text: 'Test question',
        category: 'prices',
        icon: '❓',
        iconType: 'emoji',
        featured: true,
        displayOrder: 1,
        status: 'published',
        clickCount: 0,
      }).save();

      const res = await request(app)
        .post(`/api/homepage/quick-questions/${question._id}/click`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.clickCount).toBe(1);
    });

    it('should return 404 for nonexistent question', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .post(`/api/homepage/quick-questions/${fakeId}/click`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/homepage/available-states', () => {
    it('should return distinct states', async () => {
      await seedWalletShock({ state: 'California' });
      await seedWalletShock({ state: 'Texas', title: 'Texas shock', slug: 'texas-shock' });

      const res = await request(app).get('/api/homepage/available-states');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.states).toContain('California');
      expect(res.body.states).toContain('Texas');
    });
  });

  describe('GET /api/homepage/featured-states', () => {
    it('should return featured states with most data', async () => {
      await seedWalletShock({ state: 'California' });
      await seedWalletShock({ state: 'California', title: 'CA 2', category: 'utilities' });
      await seedWalletShock({ state: 'Texas', title: 'TX 1' });

      const res = await request(app).get('/api/homepage/featured-states');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.states).toContain('California');
    });
  });

  describe('GET /api/homepage/timeline-config', () => {
    it('should return timeline config (or null)', async () => {
      const res = await request(app).get('/api/homepage/timeline-config');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Config may be null if none seeded
    });
  });

  describe('GET /api/homepage/trending-products', () => {
    it('should return trending products', async () => {
      await new ProductImpact({
        name: 'Eggs',
        category: 'groceries',
        currentPrice: 5.49,
        currentPriceDisplay: '$5.49',
        startingPrice: 3.99,
        startingPriceDisplay: '$3.99',
        priceChange: { amount: 1.5, amountDisplay: '+$1.50', percent: 25, percentDisplay: '+25%' },
        startingDate: new Date('2025-01-01'),
        source: 'test',
        trending: true,
        trendingScore: 95,
        searchCount: 100,
        status: 'published',
      }).save();

      const res = await request(app).get('/api/homepage/trending-products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(1);
    });
  });

  describe('GET /api/homepage/all', () => {
    it('should return aggregated homepage data', async () => {
      await seedWalletShock({ state: 'nationwide' });
      await seedCostDriver({ state: 'nationwide' });
      await seedStatsSummary({ state: 'nationwide' });

      const res = await request(app).get('/api/homepage/all?state=nationwide');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.walletShocks).toHaveLength(1);
      expect(res.body.data.costDrivers).toHaveLength(1);
    });
  });

  describe('GET /api/homepage/download/csv', () => {
    it('should return CSV data', async () => {
      const res = await request(app).get('/api/homepage/download/csv');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});
