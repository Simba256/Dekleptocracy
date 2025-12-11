import express from 'express';
import { generateStateReportData, getFallbackStateReport } from '../services/stateReportGenerator.js';

const router = express.Router();

/**
 * GET /api/reports/state
 * Generate a state impact report (JSON) using MCP with graceful fallback.
 * Query params:
 *  - state: state name (default: California)
 *  - role: optional role label
 *  - name: optional display name
 */
router.get('/state', async (req, res) => {
  const stateName = req.query.state || 'California';
  const role = req.query.role || 'VOTER';
  const name = req.query.name || `${stateName} Resident`;

  try {
    const report = await generateStateReportData(stateName, role, name);
    res.json({ success: true, report });
  } catch (error) {
    const fallback = getFallbackStateReport(stateName, role, name);
    res.status(500).json({
      success: false,
      message: 'Error generating state report; returning fallback data',
      error: error.message,
      report: fallback,
    });
  }
});

export default router;

