import express from 'express';
import { generateStateReportData, getStateDataStatus } from '../services/stateReportGenerator.js';
import { triggerStateRefresh, getSchedulerStatus } from '../services/stateDataScheduler.js';
import { transformAllStates, transformStateData, getTransformationStatus } from '../services/walletShockTransformer.js';
import { transformStats, getStatsStatus } from '../services/statsTransformer.js';
import StateDataCache from '../models/StateDataCache.js';
import cache from '../utils/memoryCache.js';
import { validate } from '../middleware/validate.js';
import { stateRefreshSchema } from '../validators/reports.js';

const router = express.Router();

/**
 * GET /api/reports/state
 * Generate a state impact report using ONLY real data
 * Returns 503 if no real data is available (never fake data)
 */
router.get('/state', async (req, res) => {
  const stateName = req.query.state || 'California';
  const role = req.query.role || 'VOTER';
  const name = req.query.name || `${stateName} Resident`;

  // Check in-memory cache
  const cacheKey = `report:${stateName}:${role}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const report = await generateStateReportData(stateName, role, name);

    const responseBody = {
      success: true,
      report,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'real_data',
        dataFreshness: report.metadata.dataFreshness,
        sources: report.metadata.sources,
        stateName,
        role
      }
    };

    cache.set(cacheKey, responseBody, 15 * 60 * 1000); // 15 min TTL
    res.json(responseBody);
  } catch (error) {
    // Determine appropriate status code
    let statusCode = 500;
    let message = 'Error generating state report';

    if (error.code === 'NO_DATA_AVAILABLE') {
      statusCode = 503;
      message = 'No real data available for this state. Data is being collected from government sources. Please try again later.';
    } else if (error.code === 'REPORT_GENERATION_FAILED') {
      statusCode = 500;
      message = 'Unable to generate report. Please try again later.';
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message,
      errorCode: error.code,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'error',
        stateName,
        role
      },
      // No fallback data - we only return real data
      suggestion: 'Try refreshing data manually at /api/reports/state/refresh'
    });
  }
});

/**
 * GET /api/reports/state/data-status
 * Check data availability and freshness for a state
 */
router.get('/state/data-status', async (req, res) => {
  const stateName = req.query.state || 'California';

  try {
    const status = await getStateDataStatus(stateName);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/state/refresh
 * Manually trigger data refresh for a state
 * Starts the refresh in background and returns immediately
 */
router.post('/state/refresh', validate(stateRefreshSchema), async (req, res) => {
  const { state, waitForCompletion } = req.body;

  if (!state) {
    return res.status(400).json({
      success: false,
      error: 'State name is required'
    });
  }

  try {
    // If waitForCompletion is true, wait for the refresh (for backwards compatibility)
    if (waitForCompletion) {
      const result = await triggerStateRefresh(state);
      return res.json({
        success: true,
        message: `Data refresh completed for ${state}`,
        result
      });
    }

    // Otherwise, start refresh in background and return immediately
    triggerStateRefresh(state)
      .then(result => console.log(`Background refresh completed for ${state}:`, result))
      .catch(err => console.error(`Background refresh failed for ${state}:`, err));

    res.json({
      success: true,
      message: `Data refresh started for ${state}. Please wait 30-60 seconds and reload the page.`,
      status: 'in_progress'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/scheduler/status
 * Get scheduler status and configuration
 */
router.get('/scheduler/status', async (req, res) => {
  try {
    const schedulerStatus = getSchedulerStatus();
    const cacheHealth = await StateDataCache.getCacheHealth();

    res.json({
      success: true,
      scheduler: schedulerStatus,
      cacheHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/cache/health
 * Get overall cache health statistics
 */
router.get('/cache/health', async (req, res) => {
  try {
    const health = await StateDataCache.getCacheHealth();

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/available-states
 * Get list of states with available data
 */
router.get('/available-states', async (req, res) => {
  try {
    const health = await StateDataCache.getCacheHealth();

    res.json({
      success: true,
      states: health.statesList,
      count: health.statesWithData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/wallet-shocks/status
 * Get wallet shock transformation status
 */
router.get('/wallet-shocks/status', async (req, res) => {
  try {
    const status = await getTransformationStatus();

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/wallet-shocks/transform
 * Manually trigger wallet shock transformation
 * Body: { state?: string } - Optional specific state, otherwise transforms all
 */
router.post('/wallet-shocks/transform', async (req, res) => {
  const { state } = req.body;

  try {
    let result;

    if (state) {
      // Transform specific state
      result = await transformStateData(state);
      res.json({
        success: true,
        message: `Wallet shocks transformed for ${state}`,
        result
      });
    } else {
      // Transform all states in background
      transformAllStates({ priorityStates: ['California', 'Texas', 'Florida', 'New York'] })
        .then(result => console.log('Background wallet shock transformation complete:', result))
        .catch(err => console.error('Background wallet shock transformation failed:', err));

      res.json({
        success: true,
        message: 'Wallet shock transformation started for all states. Check /api/reports/wallet-shocks/status for progress.',
        status: 'in_progress'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/stats/transform
 * Manually trigger stats transformation from LDA/FEC APIs
 */
router.post('/stats/transform', async (req, res) => {
  try {
    // Run transformation in background
    transformStats()
      .then(result => console.log('Stats transformation complete:', result))
      .catch(err => console.error('Stats transformation failed:', err));

    res.json({
      success: true,
      message: 'Stats transformation started. Check /api/reports/stats/status for progress.',
      status: 'in_progress'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/stats/status
 * Get current stats transformation status
 */
router.get('/stats/status', async (req, res) => {
  try {
    const status = await getStatsStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/mcp-diagnostic
 * Test MCP server connectivity and generate_text tool
 */
router.get('/mcp-diagnostic', async (req, res) => {
  const { checkMCPHealth, executeMCPTool, getMCPTools } = await import('../services/mcpClient.js');

  const results = {
    mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:8000 (default)',
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Health check
  try {
    const healthy = await checkMCPHealth();
    results.tests.healthCheck = { success: healthy, error: null };
  } catch (error) {
    results.tests.healthCheck = { success: false, error: error.message };
  }

  // Test 2: List tools
  try {
    const tools = await getMCPTools();
    results.tests.listTools = {
      success: true,
      toolCount: tools.length,
      hasGenerateText: tools.some(t => t.name === 'generate_text'),
      tools: tools.map(t => t.name)
    };
  } catch (error) {
    results.tests.listTools = { success: false, error: error.message };
  }

  // Test 3: Test generate_text
  try {
    const testResult = await executeMCPTool('generate_text', {
      prompt: 'Say "MCP test successful" in exactly those words.',
      max_tokens: 20,
      temperature: 0.1
    });
    results.tests.generateText = {
      success: true,
      rawResponse: testResult,
      extractedText: testResult?.result?.text || testResult?.text || null
    };
  } catch (error) {
    results.tests.generateText = { success: false, error: error.message };
  }

  const allPassed = Object.values(results.tests).every(t => t.success);
  res.status(allPassed ? 200 : 500).json({
    success: allPassed,
    ...results
  });
});

export default router;
