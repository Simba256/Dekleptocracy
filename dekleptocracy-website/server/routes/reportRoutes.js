import express from 'express';
import { generateStateReportData, getStateDataStatus } from '../services/stateReportGenerator.js';
import { triggerStateRefresh, getSchedulerStatus } from '../services/stateDataScheduler.js';
import StateDataCache from '../models/StateDataCache.js';

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

  try {
    const report = await generateStateReportData(stateName, role, name);

    res.json({
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
    });
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
 */
router.post('/state/refresh', async (req, res) => {
  const { state } = req.body;

  if (!state) {
    return res.status(400).json({
      success: false,
      error: 'State name is required'
    });
  }

  try {
    const result = await triggerStateRefresh(state);

    res.json({
      success: true,
      message: `Data refresh completed for ${state}`,
      result
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

export default router;
