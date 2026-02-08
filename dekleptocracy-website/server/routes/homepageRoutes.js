import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import StatsSummary from '../models/StatsSummary.js';
import StateComparison from '../models/StateComparison.js';
import SocialPost from '../models/SocialPost.js';
import ProductImpact from '../models/ProductImpact.js';
import MapRegion from '../models/MapRegion.js';
import QuickQuestion from '../models/QuickQuestion.js';
import TimelineConfig from '../models/TimelineConfig.js';
import User from '../models/User.js';
import StateDataCache from '../models/StateDataCache.js';
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

/**
 * GET /api/homepage/all
 * Aggregated endpoint - returns all homepage data in a single request
 * Reduces round trips from 7+ to 1 for better performance
 * Query params: state (optional), period (optional)
 */
router.get('/all', async (req, res) => {
  try {
    // Extract auth token if provided
    let userPreferences = {};
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          userPreferences = user.preferences || {};
        }
      }
    } catch (authError) {
      // Invalid token - proceed with defaults
    }

    // Determine state and period from query, user preferences, or defaults
    const state = req.query.state || userPreferences.selectedState || 'nationwide';
    const period = req.query.period || userPreferences.defaultTimePeriod || 'YoY';

    logger.info(`Fetching aggregated homepage data for state: ${state}, period: ${period}`);

    // Parallel database queries - all at once
    const [
      shocks,
      drivers,
      stats,
      comparisons,
      socialPosts,
      quickQuestions,
      timelineConfig
    ] = await Promise.all([
      WalletShock.find({ state, status: 'published' })
        .sort('-dataDate')
        .limit(4)
        .lean(),
      CostDriver.find({ state, timePeriod: period, status: 'published' })
        .sort('displayOrder')
        .lean(),
      StatsSummary.find({ state, status: 'published' })
        .sort('-dataDate')
        .lean(),
      StateComparison.find({ state, status: 'published' })
        .sort('displayOrder')
        .lean(),
      SocialPost.find({ status: 'published', 'moderation.status': 'approved' })
        .sort({ featured: -1, postedAt: -1 })
        .limit(3)
        .lean(),
      QuickQuestion.find({ status: 'published', featured: true })
        .sort({ displayOrder: 1, clickCount: -1 })
        .limit(3)
        .lean(),
      TimelineConfig.findOne({ status: 'published' }).lean()
    ]);

    // Group stats by type
    const statsGrouped = {
      lobbying: stats.find(s => s.statType === 'lobbying'),
      consumerCost: stats.find(s => s.statType === 'consumer-cost'),
      contributions: stats.find(s => s.statType === 'contributions'),
      tariffRevenue: stats.find(s => s.statType === 'tariff-revenue')
    };

    // Personalize quick questions if state is provided
    const personalizedQuestions = quickQuestions.map(q => ({
      _id: q._id,
      text: q.textTemplate ? q.textTemplate.replace('{state}', state !== 'nationwide' ? state : 'your state') : q.text,
      category: q.category,
      icon: q.icon,
      iconType: q.iconType,
      iconPath: q.iconPath,
      topics: q.topics
    }));

    res.json({
      success: true,
      state,
      period,
      data: {
        walletShocks: shocks,
        costDrivers: drivers,
        stats: statsGrouped,
        stateComparisons: comparisons,
        socialPosts: socialPosts,
        quickQuestions: personalizedQuestions,
        timelineConfig: timelineConfig
      }
    });

  } catch (error) {
    logger.error('Error fetching aggregated homepage data', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homepage data',
      error: error.message
    });
  }
});

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

/**
 * GET /api/homepage/state-comparison
 * Get state vs national comparison data
 * Query params: state (optional)
 */
router.get('/state-comparison', optionalAuth, async (req, res) => {
  try {
    // Determine state
    let state = req.query.state;
    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }
    if (!state) {
      state = 'nationwide';
    }

    logger.info(`Fetching state comparison for: ${state}`);

    const comparisons = await StateComparison.find({
      state: state,
      status: 'published'
    })
      .sort('displayOrder')
      .exec();

    res.json({
      success: true,
      state: state,
      comparisons: comparisons
    });

  } catch (error) {
    logger.error('Error fetching state comparison', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching state comparison',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/product-impact
 * Get product price impact data
 * Query params: product (required), state (optional), startDate (optional)
 */
router.get('/product-impact', optionalAuth, async (req, res) => {
  try {
    const { product, startDate } = req.query;
    let state = req.query.state;

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }
    if (!state) {
      state = 'nationwide';
    }

    logger.info(`Fetching product impact for: ${product} in ${state}`);

    // Build query
    let query = { status: 'published' };

    if (product) {
      // Search by name or keywords
      query.$or = [
        { name: { $regex: product, $options: 'i' } },
        { keywords: { $regex: product, $options: 'i' } }
      ];
    }

    if (state !== 'nationwide') {
      query.$or = query.$or || [];
      query.$or.push({ state: state }, { state: 'nationwide' });
    }

    const impacts = await ProductImpact.find(query)
      .sort({ searchCount: -1, 'priceChange.percent': -1 })
      .limit(10)
      .exec();

    // Increment search count for the first result
    if (impacts.length > 0 && product) {
      impacts[0].incrementSearchCount().catch(err =>
        logger.error('Error incrementing search count', err)
      );
    }

    res.json({
      success: true,
      product: product,
      state: state,
      impacts: impacts
    });

  } catch (error) {
    logger.error('Error fetching product impact', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product impact',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/social-posts
 * Get social media posts for the conversation section
 * Query params: limit (optional, default: 6), state (optional)
 */
router.get('/social-posts', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    let state = req.query.state;

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }

    logger.info(`Fetching social posts, limit: ${limit}`);

    // Build query for approved, published posts
    let query = {
      status: 'published',
      'moderation.status': 'approved'
    };

    // Optionally filter by state
    if (state && state !== 'nationwide') {
      query.$or = [{ state: state }, { state: 'nationwide' }];
    }

    const posts = await SocialPost.find(query)
      .sort({ featured: -1, postedAt: -1, displayOrder: 1 })
      .limit(limit)
      .exec();

    res.json({
      success: true,
      posts: posts
    });

  } catch (error) {
    logger.error('Error fetching social posts', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching social posts',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/map-data
 * Get heat map data for all regions with multiple metrics
 * Returns: priceImpact, tariffRevenue, costOfLiving per state
 * Data sourced from StateDataCache (real government API data)
 */
router.get('/map-data', async (req, res) => {
  try {
    logger.info('Fetching map data with metrics from StateDataCache');

    // Get all states that have cached data
    const statesWithData = await StateDataCache.distinct('state');

    // US States list (fallback if no cached data)
    const allStates = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ];

    // Use states with data, or all states if cache is empty
    const statesToProcess = statesWithData.length > 0 ? statesWithData : allStates;

    // Generate metrics for each state from cached data
    const stateDataPromises = statesToProcess.map(async (stateName) => {
      // Skip District of Columbia for the map (not in TopoJSON)
      if (stateName === 'District of Columbia') return null;

      // Fetch cached data for this state
      const [gasPrices, electricityPrices, foodPrices, gdp, personalIncome, unemployment] = await Promise.all([
        StateDataCache.getLatestData(stateName, 'gas_prices'),
        StateDataCache.getLatestData(stateName, 'electricity_prices'),
        StateDataCache.getLatestData(stateName, 'food_prices'),
        StateDataCache.getLatestData(stateName, 'gdp'),
        StateDataCache.getLatestData(stateName, 'personal_income'),
        StateDataCache.getLatestData(stateName, 'unemployment')
      ]);

      // Calculate Price Impact (average of price changes)
      const gasChange = gasPrices?.processedData?.change || 0;
      const electricityChange = electricityPrices?.processedData?.change || 0;
      const foodChange = foodPrices?.processedData?.change || 0;

      // Weight: gas 40%, electricity 30%, food 30%
      const priceImpact = (gasChange * 0.4) + (electricityChange * 0.3) + (foodChange * 0.3);

      // Calculate Tariff Revenue (estimate based on GDP and trade exposure)
      const gdpValue = gdp?.processedData?.value || 0;
      // Use a deterministic rate based on state name hash for consistency
      const stateHash = stateName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const tariffRate = 0.008 + ((stateHash % 100) / 100) * 0.012; // 0.8% - 2% of GDP
      const tariffRevenue = gdpValue * tariffRate;

      // Calculate Cost of Living Index (100 = US national average)
      // Based on actual data units from government APIs:
      // - Gas: $/gallon (e.g., 2.50-3.80, US avg ~3.20)
      // - Electricity: cents/kWh (e.g., 12-31, US avg ~16)
      // - Food: $/person/month (e.g., 140-165, US avg ~150)
      const gasValue = gasPrices?.processedData?.value || 3.2;
      const electricityValue = electricityPrices?.processedData?.value || 16; // cents/kWh
      const foodValue = foodPrices?.processedData?.value || 150;
      const incomeValue = personalIncome?.processedData?.value || 65000;
      const unemploymentValue = unemployment?.processedData?.value || 4;

      // Normalize each component relative to US average (each contributes 33.3 points at average = 100 total)
      const gasIndex = (gasValue / 3.2) * 33.33;           // Gas at $3.20 = 33.3 points
      const electricityIndex = (electricityValue / 16) * 33.33;  // Electricity at 16 cents = 33.3 points
      const foodIndex = (foodValue / 150) * 33.34;         // Food at $150/mo = 33.3 points

      // Income adjustment: higher income = lower effective cost of living burden
      const incomeAdjustment = Math.max(0.85, Math.min(1.15, 65000 / (incomeValue || 65000)));

      // Unemployment adds to economic burden (max +5 points)
      const unemploymentPenalty = Math.max(0, Math.min(5, (unemploymentValue - 4) * 1));

      // Index where 100 = national average
      const costOfLiving = Math.max(50,
        (gasIndex + electricityIndex + foodIndex) * incomeAdjustment + unemploymentPenalty
      );

      const hasRealData = !!(gasPrices || electricityPrices || foodPrices || gdp);

      return {
        name: stateName,
        // Calculated metrics
        priceImpact: Math.round(priceImpact * 10) / 10,
        tariffRevenue: Math.round(tariffRevenue),
        costOfLiving: Math.round(costOfLiving * 10) / 10,
        // Use priceImpact as default intensity for backwards compatibility
        intensity: Math.abs(Math.round(priceImpact * 10) / 10),
        // Raw data for tooltips
        metrics: {
          gasPrices: {
            value: gasPrices?.processedData?.value,
            displayValue: gasPrices?.processedData?.displayValue,
            change: gasPrices?.processedData?.change
          },
          electricityPrices: {
            value: electricityPrices?.processedData?.value,
            displayValue: electricityPrices?.processedData?.displayValue,
            change: electricityPrices?.processedData?.change
          },
          foodPrices: {
            value: foodPrices?.processedData?.value,
            displayValue: foodPrices?.processedData?.displayValue,
            change: foodPrices?.processedData?.change
          },
          gdp: {
            value: gdp?.processedData?.value,
            displayValue: gdp?.processedData?.displayValue
          },
          unemployment: {
            value: unemployment?.processedData?.value,
            displayValue: unemployment?.processedData?.displayValue
          },
          personalIncome: {
            value: personalIncome?.processedData?.value,
            displayValue: personalIncome?.processedData?.displayValue
          }
        },
        hasRealData,
        // Top shocks placeholder (can be populated from WalletShock collection)
        topShocks: []
      };
    });

    const regionsWithMetrics = (await Promise.all(stateDataPromises))
      .filter(r => r !== null) // Remove null entries (DC)
      .sort((a, b) => Math.abs(b.priceImpact) - Math.abs(a.priceImpact)); // Sort by impact

    logger.info(`Returning ${regionsWithMetrics.length} states with metrics`);

    res.json({
      success: true,
      regions: regionsWithMetrics
    });

  } catch (error) {
    logger.error('Error fetching map data', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map data',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/nearby-shocks
 * Get top shocks near a specific state/location
 * Query params: state (optional), limit (optional, default: 5)
 */
router.get('/nearby-shocks', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    let state = req.query.state;

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }
    if (!state) {
      state = 'nationwide';
    }

    logger.info(`Fetching nearby shocks for: ${state}`);

    // Get region data with top shocks
    let query = { status: 'published' };
    if (state !== 'nationwide') {
      query.name = state;
    }

    const regions = await MapRegion.find(query)
      .sort({ intensity: -1 })
      .limit(state === 'nationwide' ? 10 : 1)
      .exec();

    // Collect all top shocks from regions
    let nearbyShocks = [];
    for (const region of regions) {
      if (region.topShocks && region.topShocks.length > 0) {
        nearbyShocks.push(...region.topShocks.map(shock => ({
          ...shock.toObject(),
          state: region.name
        })));
      }
    }

    // Sort by change percent and limit
    nearbyShocks.sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));
    nearbyShocks = nearbyShocks.slice(0, limit);

    res.json({
      success: true,
      state: state,
      shocks: nearbyShocks
    });

  } catch (error) {
    logger.error('Error fetching nearby shocks', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby shocks',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/quick-questions
 * Get quick questions for the search box
 * Query params: limit (optional, default: 3), state (optional)
 */
router.get('/quick-questions', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    let state = req.query.state;

    if (!state && req.userPreferences?.selectedState) {
      state = req.userPreferences.selectedState;
    }

    logger.info(`Fetching quick questions, limit: ${limit}`);

    // Build query for featured, published questions
    let query = {
      status: 'published',
      featured: true
    };

    const questions = await QuickQuestion.find(query)
      .sort({ displayOrder: 1, clickCount: -1 })
      .limit(limit)
      .exec();

    // Personalize questions if state is provided
    const personalizedQuestions = questions.map(q => ({
      _id: q._id,
      text: q.personalize({ state }),
      category: q.category,
      icon: q.icon,
      iconType: q.iconType,
      iconPath: q.iconPath,
      topics: q.topics
    }));

    res.json({
      success: true,
      questions: personalizedQuestions
    });

  } catch (error) {
    logger.error('Error fetching quick questions', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quick questions',
      error: error.message
    });
  }
});

/**
 * POST /api/homepage/quick-questions/:id/click
 * Track click on a quick question
 */
router.post('/quick-questions/:id/click', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await QuickQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await question.incrementClickCount();

    res.json({
      success: true,
      clickCount: question.clickCount
    });

  } catch (error) {
    logger.error('Error tracking question click', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking question click',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/featured-states
 * Get list of featured states with data
 */
router.get('/featured-states', async (req, res) => {
  try {
    logger.info('Fetching featured states');

    // Get states that have the most data
    const statesWithData = await WalletShock.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const featuredStates = statesWithData.map(s => s._id).filter(s => s !== 'nationwide');

    res.json({
      success: true,
      states: featuredStates
    });

  } catch (error) {
    logger.error('Error fetching featured states', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured states',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/timeline-config
 * Get timeline configuration
 */
router.get('/timeline-config', async (req, res) => {
  try {
    logger.info('Fetching timeline config');

    // Get active configuration
    let config = await TimelineConfig.getActive();

    // If no active config, get the first published one
    if (!config) {
      config = await TimelineConfig.findOne({ status: 'published' }).exec();
    }

    res.json({
      success: true,
      config: config
    });

  } catch (error) {
    logger.error('Error fetching timeline config', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timeline config',
      error: error.message
    });
  }
});

/**
 * GET /api/homepage/trending-products
 * Get trending product searches
 * Query params: limit (optional, default: 5)
 */
router.get('/trending-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    logger.info(`Fetching trending products, limit: ${limit}`);

    const products = await ProductImpact.find({
      status: 'published',
      trending: true
    })
      .sort({ trendingScore: -1, searchCount: -1 })
      .limit(limit)
      .select('name category priceChange.percentDisplay')
      .exec();

    res.json({
      success: true,
      products: products
    });

  } catch (error) {
    logger.error('Error fetching trending products', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending products',
      error: error.message
    });
  }
});

export default router;
