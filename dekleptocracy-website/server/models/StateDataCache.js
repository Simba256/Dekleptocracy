import mongoose from 'mongoose';

/**
 * StateDataCache - Caches real economic data from government APIs
 * Used to provide real data for state reports with fallback to stale data
 */
const stateDataCacheSchema = new mongoose.Schema({
  // Identification
  state: {
    type: String,
    required: [true, 'State is required'],
    index: true
  },
  dataType: {
    type: String,
    required: [true, 'Data type is required'],
    enum: [
      'unemployment',      // BLS unemployment rate
      'cpi',               // BLS Consumer Price Index
      'wages',             // BLS average wages
      'gdp',               // FRED state GDP
      'personal_income',   // FRED personal income
      'electricity_prices', // EIA electricity
      'gas_prices',        // EIA gasoline
      'natural_gas_prices', // EIA natural gas
      'rent',              // HUD Fair Market Rent
      'income_limits',     // HUD Income Limits (median income thresholds)
      'affordability',     // HUD Affordability Analysis (rent as % of income)
      'chas',              // HUD CHAS (cost-burdened households)
      'food_prices',       // USDA food prices
      'grocery_basket'     // USDA grocery basket comparison
    ],
    index: true
  },

  // Source API identification
  sourceApi: {
    type: String,
    required: true,
    enum: ['bls', 'fred', 'eia', 'hud', 'usda', 'gnews', 'bea']
  },

  // Raw API response for debugging/reprocessing
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Processed data ready for display
  processedData: {
    value: mongoose.Schema.Types.Mixed,           // Numeric or complex value
    displayValue: String,                          // Formatted for display (e.g., "$3.45/gallon")
    change: Number,                                // Numeric change value
    changeDisplay: String,                         // Formatted change (e.g., "+12%")
    changeDirection: {
      type: String,
      enum: ['up', 'down', 'neutral']
    },
    unit: String,                                  // Unit of measurement
    period: String,                                // Data period (e.g., "2024-01")
    comparisonPeriod: String                       // Period compared against
  },

  // Time series data for trend charts
  timeSeries: [{
    date: Date,
    value: Number,
    label: String                                  // Display label (e.g., "Jan 2024")
  }],

  // National comparison data
  nationalValue: mongoose.Schema.Types.Mixed,
  nationalDisplayValue: String,

  // Cache metadata
  fetchedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // Data freshness status
  status: {
    type: String,
    enum: ['fresh', 'stale', 'error'],
    default: 'fresh'
  },
  errorMessage: String,

  // Additional metadata
  metadata: {
    seriesId: String,                              // API series ID used
    region: String,                                // Regional grouping
    sector: String,                                // Economic sector
    notes: [String]                                // Any notes from the API
  }

}, { timestamps: true });

// Compound indexes for efficient queries
stateDataCacheSchema.index({ state: 1, dataType: 1, expiresAt: 1 });
stateDataCacheSchema.index({ state: 1, fetchedAt: -1 });
stateDataCacheSchema.index({ dataType: 1, status: 1 });
// TTL index - automatically delete documents 30 days after they expire
stateDataCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 });

/**
 * Static method to get the latest data for a state and type
 * Returns fresh data if available, otherwise falls back to stale data
 * Never returns fake data - returns null if no real data exists
 */
stateDataCacheSchema.statics.getLatestData = async function(state, dataType) {
  // First try to get fresh data
  let data = await this.findOne({
    state,
    dataType,
    expiresAt: { $gt: new Date() },
    status: { $ne: 'error' }
  }).sort({ fetchedAt: -1 });

  if (data) {
    return data;
  }

  // Fall back to stale data (but still real data)
  data = await this.findOne({
    state,
    dataType,
    status: { $ne: 'error' }
  }).sort({ fetchedAt: -1 });

  if (data) {
    // Mark as stale for the response
    data.status = 'stale';
  }

  return data;
};

/**
 * Static method to get all cached data for a state
 */
stateDataCacheSchema.statics.getAllStateData = async function(state) {
  // These data types match what stateDataScheduler actually fetches
  // Note: HUD data (rent, income_limits, affordability) removed due to API access issues
  const dataTypes = [
    'unemployment', 'electricity_prices', 'gas_prices',
    'food_prices', 'grocery_basket', 'gdp', 'personal_income'
  ];

  const results = {};
  const staleData = [];

  for (const dataType of dataTypes) {
    const data = await this.getLatestData(state, dataType);
    if (data) {
      results[dataType] = {
        processedData: data.processedData,
        timeSeries: data.timeSeries,
        nationalValue: data.nationalValue,
        nationalDisplayValue: data.nationalDisplayValue,
        fetchedAt: data.fetchedAt,
        isStale: data.status === 'stale'
      };
      if (data.status === 'stale') {
        staleData.push(dataType);
      }
    } else {
      results[dataType] = null;
    }
  }

  return {
    state,
    data: results,
    hasStaleData: staleData.length > 0,
    staleDataTypes: staleData,
    availableDataCount: Object.values(results).filter(v => v !== null).length
  };
};

/**
 * Static method to upsert cache entry
 */
stateDataCacheSchema.statics.upsertData = async function(state, dataType, data, ttlHours = 24) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  return this.findOneAndUpdate(
    { state, dataType },
    {
      state,
      dataType,
      sourceApi: data.sourceApi,
      rawData: data.rawData,
      processedData: data.processedData,
      timeSeries: data.timeSeries || [],
      nationalValue: data.nationalValue,
      nationalDisplayValue: data.nationalDisplayValue,
      fetchedAt: new Date(),
      expiresAt,
      status: 'fresh',
      errorMessage: null,
      metadata: data.metadata || {}
    },
    { upsert: true, new: true }
  );
};

/**
 * Static method to mark data as error
 */
stateDataCacheSchema.statics.markError = async function(state, dataType, errorMessage) {
  return this.findOneAndUpdate(
    { state, dataType },
    {
      status: 'error',
      errorMessage
    },
    { new: true }
  );
};

/**
 * Static method to get cache health status
 */
stateDataCacheSchema.statics.getCacheHealth = async function() {
  const now = new Date();

  const totalEntries = await this.countDocuments();
  const freshEntries = await this.countDocuments({ expiresAt: { $gt: now }, status: 'fresh' });
  const staleEntries = await this.countDocuments({
    $or: [
      { expiresAt: { $lte: now } },
      { status: 'stale' }
    ]
  });
  const errorEntries = await this.countDocuments({ status: 'error' });

  // Get unique states with data
  const statesWithData = await this.distinct('state');

  // Get data freshness by type
  const freshnessByType = await this.aggregate([
    {
      $group: {
        _id: '$dataType',
        totalCount: { $sum: 1 },
        freshCount: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$expiresAt', now] }, { $eq: ['$status', 'fresh'] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return {
    totalEntries,
    freshEntries,
    staleEntries,
    errorEntries,
    healthPercentage: totalEntries > 0 ? Math.round((freshEntries / totalEntries) * 100) : 0,
    statesWithData: statesWithData.length,
    statesList: statesWithData,
    freshnessByType: freshnessByType.reduce((acc, item) => {
      acc[item._id] = {
        total: item.totalCount,
        fresh: item.freshCount,
        percentage: item.totalCount > 0 ? Math.round((item.freshCount / item.totalCount) * 100) : 0
      };
      return acc;
    }, {})
  };
};

const StateDataCache = mongoose.model('StateDataCache', stateDataCacheSchema);

export default StateDataCache;
