import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import StateDataCache from '../../models/StateDataCache.js';

// Mock heavy service dependencies
vi.mock('../../services/stateReportGenerator.js', () => ({
  generateStateReportData: vi.fn().mockResolvedValue({
    title: 'Test Report',
    sections: [],
    metadata: {
      dataFreshness: 'fresh',
      sources: ['test'],
    },
  }),
  getStateDataStatus: vi.fn().mockResolvedValue({
    state: 'California',
    hasData: true,
    dataTypes: ['gas_prices'],
    lastUpdated: new Date().toISOString(),
  }),
}));

vi.mock('../../services/stateDataScheduler.js', () => ({
  triggerStateRefresh: vi.fn().mockResolvedValue({ success: true }),
  getSchedulerStatus: vi.fn().mockReturnValue({
    running: true,
    lastRun: new Date().toISOString(),
    nextRun: new Date().toISOString(),
  }),
  initializeScheduler: vi.fn(),
}));

vi.mock('../../services/walletShockTransformer.js', () => ({
  transformAllStates: vi.fn().mockResolvedValue({ transformed: 50 }),
  transformStateData: vi.fn().mockResolvedValue({ transformed: 4 }),
  getTransformationStatus: vi.fn().mockResolvedValue({
    totalStates: 50,
    transformedStates: 48,
  }),
}));

vi.mock('../../services/statsTransformer.js', () => ({
  transformStats: vi.fn().mockResolvedValue({ transformed: true }),
  getStatsStatus: vi.fn().mockResolvedValue({
    lastRun: new Date().toISOString(),
    status: 'complete',
  }),
}));

vi.mock('../../services/mcpClient.js', () => ({
  checkMCPHealth: vi.fn().mockResolvedValue(true),
  executeMCPTool: vi.fn().mockResolvedValue({ result: { text: 'MCP test successful' } }),
  getMCPTools: vi.fn().mockResolvedValue([{ name: 'generate_text' }]),
}));

describe('Report Routes', () => {
  describe('GET /api/reports/state', () => {
    it('should return a state report', async () => {
      const res = await request(app).get('/api/reports/state?state=California');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toBeDefined();
      expect(res.body.metadata.stateName).toBe('California');
    });
  });

  describe('GET /api/reports/state/data-status', () => {
    it('should return data status for a state', async () => {
      const res = await request(app).get('/api/reports/state/data-status?state=California');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('California');
    });
  });

  describe('POST /api/reports/state/refresh', () => {
    it('should return 400 when state is missing', async () => {
      const res = await request(app)
        .post('/api/reports/state/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should start refresh for a valid state', async () => {
      const res = await request(app)
        .post('/api/reports/state/refresh')
        .send({ state: 'California' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('in_progress');
    });

    it('should wait for completion when requested', async () => {
      const res = await request(app)
        .post('/api/reports/state/refresh')
        .send({ state: 'California', waitForCompletion: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toBeDefined();
    });
  });

  describe('GET /api/reports/scheduler/status', () => {
    it('should return scheduler status', async () => {
      // Seed cache data for getCacheHealth to work
      await new StateDataCache({
        state: 'California',
        dataType: 'gas_prices',
        rawData: { value: 3.5 },
        processedData: { value: 3.5, displayValue: '$3.50', change: 5 },
        source: 'test',
      }).save();

      const res = await request(app).get('/api/reports/scheduler/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.scheduler).toBeDefined();
    });
  });

  describe('GET /api/reports/available-states', () => {
    it('should return available states', async () => {
      await new StateDataCache({
        state: 'Texas',
        dataType: 'gas_prices',
        rawData: { value: 3.0 },
        processedData: { value: 3.0, displayValue: '$3.00', change: 2 },
        source: 'test',
      }).save();

      const res = await request(app).get('/api/reports/available-states');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.states).toBeDefined();
    });
  });

  describe('GET /api/reports/mcp-diagnostic', () => {
    it('should return MCP diagnostic results', async () => {
      const res = await request(app).get('/api/reports/mcp-diagnostic');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tests.healthCheck.success).toBe(true);
      expect(res.body.tests.listTools.success).toBe(true);
      expect(res.body.tests.generateText.success).toBe(true);
    });
  });
});
