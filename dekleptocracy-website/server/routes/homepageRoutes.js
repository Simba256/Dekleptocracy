import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import StatsSummary from '../models/StatsSummary.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { generateStateReport, generateCSVExport } from '../services/reportGenerator.js';

const router = express.Router();

// Rate limiting: 500 requests per 15 minutes per IP (allows ~165 page loads)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes
router.use(limiter);

// Optional authentication middleware - extracts user if token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;

      // Fetch user to get preferences
      const user = await User.findById(req.userId);
      if (user) {
        req.userPreferences = user.preferences;
      }
    }
  } catch (error) {
    // Invalid token - proceed as unauthenticated
    console.log('Optional auth failed:', error.message);
  }
  next();
};

/**
 * GET /api/homepage/wallet-shocks
 * Get wallet shocks for a specific state
 * Query params: state (optional), limit (optional, default: 4)
 */
router.get('/wallet-shocks', optionalAuth, async (req, res) => {
  try {
    // Determine state: query param > user preference (from token) > default
    let state = req.query.state;
    let stateSource = 'query';

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
      stateSource = 'user-preference';
    }

    if (!state) {
      state = 'nationwide';
      stateSource = 'default';
    }

    logger.info(`Fetching wallet shocks for state: ${state} (source: ${stateSource})`, {
      userId: req.userId,
      queryState: req.query.state,
      preferenceState: req.userPreferences?.selectedState
    });

    const limit = parseInt(req.query.limit) || 4;
    const sortBy = req.query.sortBy || 'date'; // 'date', 'change', 'abs-change'

    // Query wallet shocks
    let query = WalletShock.find({
      state: state,
      status: 'published'
    });

    // Sort by biggest changes or most recent
    if (sortBy === 'change') {
      // Sort by highest positive change (biggest increases)
      query = query.sort('-changePercent -dataDate');
    } else if (sortBy === 'abs-change') {
      // Sort by absolute value of change (biggest changes up or down)
      query = query.sort({ $expr: { $abs: '$changePercent' } }).sort('-dataDate');
    } else {
      // Default: sort by most recent
      query = query.sort('-dataDate');
    }

    const shocks = await query.limit(limit).exec();

    res.json({
      success: true,
      state: state,
      shocks: shocks
    });

  } catch (error) {
    logger.error('Error fetching wallet shocks', error, {
      state: req.query.state,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet shocks',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/cost-drivers
 * Get cost drivers for a specific state and time period
 * Query params: state (optional), period (optional, default: YoY)
 */
router.get('/cost-drivers', optionalAuth, async (req, res) => {
  try {
    // Determine state: query param > user preference (from token) > default
    let state = req.query.state;
    let stateSource = 'query';

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
      stateSource = 'user-preference';
    }

    if (!state) {
      state = 'nationwide';
      stateSource = 'default';
    }

    // Determine time period: query param > user preference (from token) > default
    let period = req.query.period;
    let periodSource = 'query';

    if (!period && req.userPreferences?.defaultTimePeriod) {
      period = req.userPreferences.defaultTimePeriod;
      periodSource = 'user-preference';
    }

    if (!period) {
      period = 'YoY';
      periodSource = 'default';
    }

    logger.info(`Fetching cost drivers for state: ${state} (${stateSource}), period: ${period} (${periodSource})`, {
      userId: req.userId,
      queryState: req.query.state,
      queryPeriod: req.query.period,
      preferenceState: req.userPreferences?.selectedState,
      preferencePeriod: req.userPreferences?.defaultTimePeriod
    });

    // Query cost drivers
    const drivers = await CostDriver.find({
      state: state,
      timePeriod: period,
      status: 'published'
    })
      .sort('displayOrder')
      .exec();

    res.json({
      success: true,
      state: state,
      period: period,
      drivers: drivers
    });

  } catch (error) {
    logger.error('Error fetching cost drivers', error, {
      state: req.query.state,
      period: req.query.period,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching cost drivers',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/stats
 * Get all stats summary for a specific state
 * Query params: state (optional)
 */
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    // Determine state: query param > user preference (from token) > default
    let state = req.query.state;
    let stateSource = 'query';

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
      stateSource = 'user-preference';
    }

    if (!state) {
      state = 'nationwide';
      stateSource = 'default';
    }

    logger.info(`Fetching stats for state: ${state} (source: ${stateSource})`, {
      userId: req.userId,
      queryState: req.query.state,
      preferenceState: req.userPreferences?.selectedState
    });

    // Query all stat types for this state
    const stats = await StatsSummary.find({
      state: state,
      status: 'published'
    })
      .sort('-dataDate')
      .exec();

    // Group stats by type
    const statsObj = {
      lobbying: stats.find(s => s.statType === 'lobbying'),
      consumerCost: stats.find(s => s.statType === 'consumer-cost'),
      contributions: stats.find(s => s.statType === 'contributions'),
      tariffRevenue: stats.find(s => s.statType === 'tariff-revenue')
    };

    res.json({
      success: true,
      state: state,
      stats: statsObj
    });

  } catch (error) {
    logger.error('Error fetching stats', error, {
      state: req.query.state,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

/**
 * POST /api/homepage/wallet-shocks/:id/react
 * Add a reaction to a wallet shock
 * Body: { reactionType: 'shock' | 'angry' | 'sad' }
 */
router.post('/wallet-shocks/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body;

    // Validate reaction type
    if (!['shock', 'angry', 'sad'].includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type. Must be: shock, angry, or sad'
      });
    }

    // Find the wallet shock
    const walletShock = await WalletShock.findById(id);

    if (!walletShock) {
      return res.status(404).json({
        success: false,
        message: 'Wallet shock not found'
      });
    }

    // Use the model's method to add reaction
    await walletShock.addReaction(reactionType);

    res.json({
      success: true,
      reactions: walletShock.reactions
    });

  } catch (error) {
    logger.error('Error adding reaction', error, {
      shockId: req.params.id,
      reactionType: req.body.reactionType,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/scheduler/status
 * Get status of the homepage data scheduler (placeholder for future scheduler)
 */
router.get('/scheduler/status', (req, res) => {
  res.json({
    success: true,
    scheduler: {
      enabled: false,
      note: 'Using seed data. Scheduler not yet implemented.',
      lastRun: null,
      nextRun: null
    }
  });
});

/**
 * POST /api/homepage/seed
 * Manually trigger seeding (useful for testing/admin)
 * Note: In production, this should be protected with admin authentication
 */
router.post('/seed', async (req, res) => {
  try {
    // Import the seed function
    const { seedAll } = await import('../scripts/seedHomepageData.js');

    console.log('🌱 Manual seed triggered via API');

    // Run seeding in background to avoid timeout
    seedAll()
      .then(() => console.log('✅ Manual seeding complete'))
      .catch(err => console.error('❌ Manual seeding failed:', err));

    res.json({
      success: true,
      message: 'Seeding initiated. Check server logs for progress.'
    });

  } catch (error) {
    logger.error('Error triggering seed', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering seed',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/available-states
 * Get list of states with data available
 */
router.get('/available-states', async (req, res) => {
  try {
    // Get unique states from wallet shocks
    const states = await WalletShock.distinct('state', { status: 'published' });

    res.json({
      success: true,
      states: states
    });

  } catch (error) {
    logger.error('Error fetching available states', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available states',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/download/report
 * Download PDF report for a specific state
 */
router.get('/download/report', optionalAuth, async (req, res) => {
  try {
    // Determine state
    let state = req.query.state;
    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }
    if (!state) {
      state = 'nationwide';
    }

    const timePeriod = req.query.period || req.userPreferences?.defaultTimePeriod || 'YoY';

    logger.info(`Generating PDF report for ${state}`);

    // Generate PDF
    const pdfDoc = await generateStateReport(state, timePeriod);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dekleptocracy-report-${state}-${Date.now()}.pdf"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    logger.error('Error generating PDF report', error, {
      state: req.query.state,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/download/csv
 * Download CSV export of wallet shocks
 */
router.get('/download/csv', optionalAuth, async (req, res) => {
  try {
    // Determine state
    let state = req.query.state;
    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }
    if (!state) {
      state = 'nationwide';
    }

    logger.info(`Generating CSV export for ${state}`);

    // Generate CSV
    const csv = await generateCSVExport(state);

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dekleptocracy-data-${state}-${Date.now()}.csv"`);

    res.send(csv);

  } catch (error) {
    logger.error('Error generating CSV export', error, {
      state: req.query.state,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Error generating CSV export',
      error: error.message
    });
  }
});

export default router;
