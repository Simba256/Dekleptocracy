/**
 * Wallet Shock Transformer
 * Transforms real government API data from StateDataCache into WalletShock entries
 * for display on the homepage
 */

import StateDataCache from '../models/StateDataCache.js';
import WalletShock from '../models/WalletShock.js';
import logger from '../utils/logger.js';

// Mapping from StateDataCache data types to WalletShock categories
const DATA_TYPE_TO_CATEGORY = {
  gas_prices: {
    category: 'fuel',
    icon: '⛽',
    iconBg: '#fef3c7',
    chartColor: '#ef4444',
    unit: 'per gallon',
    titleTemplates: {
      up: (state, change) => `Gas prices ${change > 10 ? 'surge' : 'rise'} ${Math.abs(change).toFixed(1)}% in ${state}`,
      down: (state, change) => `Gas prices ${Math.abs(change) > 10 ? 'plunge' : 'drop'} ${Math.abs(change).toFixed(1)}% in ${state}`,
      neutral: (state) => `Gas prices hold steady in ${state}`
    }
  },
  electricity_prices: {
    category: 'utilities',
    icon: '💡',
    iconBg: '#dbeafe',
    chartColor: '#3b82f6',
    unit: 'per kWh',
    titleTemplates: {
      up: (state, change) => `Electric bills ${change > 15 ? 'spike' : 'climb'} ${Math.abs(change).toFixed(1)}% in ${state}`,
      down: (state, change) => `Electricity costs fall ${Math.abs(change).toFixed(1)}% in ${state}`,
      neutral: (state) => `Power prices stable in ${state}`
    }
  },
  food_prices: {
    category: 'groceries',
    icon: '🛒',
    iconBg: '#fef3c7',
    chartColor: '#f97316',
    unit: 'per month',
    titleTemplates: {
      up: (state, change) => `Grocery costs ${change > 10 ? 'jump' : 'increase'} ${Math.abs(change).toFixed(1)}% in ${state}`,
      down: (state, change) => `Food prices ease ${Math.abs(change).toFixed(1)}% in ${state}`,
      neutral: (state) => `Grocery prices unchanged in ${state}`
    }
  },
  grocery_basket: {
    category: 'groceries',
    icon: '🥚',
    iconBg: '#fef3c7',
    chartColor: '#f97316',
    unit: 'monthly basket',
    titleTemplates: {
      up: (state, change) => `Weekly grocery basket up ${Math.abs(change).toFixed(1)}% in ${state}`,
      down: (state, change) => `Grocery basket costs down ${Math.abs(change).toFixed(1)}% in ${state}`,
      neutral: (state) => `Grocery basket steady in ${state}`
    }
  }
};

// Source attribution mapping
const SOURCE_NAMES = {
  eia: 'U.S. Energy Information Administration',
  usda: 'USDA Economic Research Service',
  bls: 'Bureau of Labor Statistics',
  fred: 'Federal Reserve Economic Data',
  bea: 'Bureau of Economic Analysis'
};

/**
 * Generate SVG chart path from data points
 * @param {Array} values - Array of numeric values
 * @returns {string} SVG path string
 */
function generateChartPath(values) {
  if (!values || values.length === 0) return 'M 0 50 L 200 50';

  const width = 200;
  const height = 80;
  const stepX = width / (values.length - 1 || 1);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, i) => {
    const x = i * stepX;
    const y = height - ((val - min) / range * height);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}

/**
 * Generate chart data from time series or synthesize if not available
 * @param {Array} timeSeries - Time series from StateDataCache
 * @param {number} currentValue - Current value
 * @param {number} changePercent - Percent change
 * @returns {Array} Array of {date, value} objects
 */
function generateChartData(timeSeries, currentValue, changePercent) {
  // If we have real time series data, use it
  if (timeSeries && timeSeries.length >= 3) {
    return timeSeries.slice(-12).map(ts => ({
      date: new Date(ts.date),
      value: ts.value
    }));
  }

  // Otherwise, synthesize from current value and change
  const data = [];
  const now = new Date();
  const startValue = currentValue / (1 + (changePercent || 0) / 100);

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    const progress = (5 - i) / 5;
    const value = startValue + (currentValue - startValue) * progress;

    data.push({
      date: date,
      value: parseFloat(value.toFixed(2))
    });
  }

  return data;
}

/**
 * Get direction from change value
 * @param {number} change - Percent change
 * @returns {string} 'up', 'down', or 'neutral'
 */
function getDirection(change) {
  if (change > 0.5) return 'up';
  if (change < -0.5) return 'down';
  return 'neutral';
}

/**
 * Format state name for display
 * @param {string} state - State name
 * @returns {string} Formatted state name
 */
function formatStateName(state) {
  if (state === 'nationwide' || state === 'District of Columbia') {
    return 'the U.S.';
  }
  return state;
}

/**
 * Transform a single data type for a state into a WalletShock
 * @param {string} stateName - State name
 * @param {string} dataType - Data type from StateDataCache
 * @returns {Promise<object|null>} WalletShock object or null
 */
async function transformDataType(stateName, dataType) {
  const config = DATA_TYPE_TO_CATEGORY[dataType];
  if (!config) {
    return null;
  }

  const cacheData = await StateDataCache.getLatestData(stateName, dataType);
  if (!cacheData || !cacheData.processedData) {
    logger.debug(`No cache data for ${dataType} in ${stateName}`);
    return null;
  }

  const { processedData, timeSeries, sourceApi, fetchedAt } = cacheData;

  // Extract values
  const value = processedData.value;
  const displayValue = processedData.displayValue || `$${value}`;
  const change = processedData.change || 0;
  const changeDisplay = processedData.changeDisplay || `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;

  // Determine direction
  const direction = getDirection(change);

  // Generate title
  const displayState = formatStateName(stateName);
  const title = config.titleTemplates[direction](displayState, change);

  // Generate chart data
  const chartData = generateChartData(timeSeries, value, change);
  const chartPath = generateChartPath(chartData.map(d => d.value));

  // Determine chart color based on direction
  const chartColor = direction === 'down' ? '#22c55e' : config.chartColor;

  // Build wallet shock object
  return {
    category: config.category,
    icon: config.icon,
    iconBg: config.iconBg,
    title: title.substring(0, 200),
    price: displayValue,
    unit: config.unit,
    change: changeDisplay,
    changePercent: change,
    chartColor,
    chartPath,
    chartData,
    state: stateName,
    source: SOURCE_NAMES[sourceApi] || sourceApi.toUpperCase(),
    dataDate: fetchedAt || new Date(),
    reactions: { shock: 0, angry: 0, sad: 0 },
    featured: false,
    status: 'published'
  };
}

/**
 * Transform all data types for a single state
 * @param {string} stateName - State name
 * @returns {Promise<object>} Results with success/failed arrays
 */
export async function transformStateData(stateName) {
  logger.info(`Transforming wallet shocks for ${stateName}`);

  const results = {
    state: stateName,
    created: [],
    updated: [],
    failed: []
  };

  // Data types to transform (in priority order)
  const dataTypes = ['gas_prices', 'electricity_prices', 'food_prices'];

  for (const dataType of dataTypes) {
    try {
      const walletShock = await transformDataType(stateName, dataType);

      if (!walletShock) {
        results.failed.push({ dataType, reason: 'No data available' });
        continue;
      }

      // Upsert to database - update existing or create new
      const existing = await WalletShock.findOne({
        state: stateName,
        category: walletShock.category,
        status: 'published'
      });

      if (existing) {
        // Preserve reactions from existing entry
        walletShock.reactions = existing.reactions;

        await WalletShock.findByIdAndUpdate(existing._id, walletShock);
        results.updated.push(walletShock.category);
        logger.debug(`Updated ${walletShock.category} wallet shock for ${stateName}`);
      } else {
        await WalletShock.create(walletShock);
        results.created.push(walletShock.category);
        logger.debug(`Created ${walletShock.category} wallet shock for ${stateName}`);
      }

    } catch (error) {
      logger.error(`Failed to transform ${dataType} for ${stateName}`, error);
      results.failed.push({ dataType, reason: error.message });
    }
  }

  logger.info(`Transformed wallet shocks for ${stateName}: ${results.created.length} created, ${results.updated.length} updated, ${results.failed.length} failed`);

  return results;
}

/**
 * Transform wallet shocks for all states with cached data
 * @param {Object} options - Options
 * @param {Array} options.priorityStates - States to process first
 * @returns {Promise<object>} Aggregated results
 */
export async function transformAllStates(options = {}) {
  const { priorityStates = [] } = options;

  logger.info('Starting wallet shock transformation for all states');

  // Get all states with cached data
  const cacheHealth = await StateDataCache.getCacheHealth();
  const allStates = cacheHealth.statesList || [];

  if (allStates.length === 0) {
    logger.warn('No states with cached data found');
    return { totalStates: 0, results: [] };
  }

  // Order states: priority first, then rest
  const orderedStates = [
    ...priorityStates.filter(s => allStates.includes(s)),
    ...allStates.filter(s => !priorityStates.includes(s))
  ];

  const results = {
    totalStates: orderedStates.length,
    successfulStates: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalFailed: 0,
    stateResults: []
  };

  for (const state of orderedStates) {
    try {
      const stateResult = await transformStateData(state);
      results.stateResults.push(stateResult);
      results.totalCreated += stateResult.created.length;
      results.totalUpdated += stateResult.updated.length;
      results.totalFailed += stateResult.failed.length;

      if (stateResult.created.length > 0 || stateResult.updated.length > 0) {
        results.successfulStates++;
      }

    } catch (error) {
      logger.error(`Failed to transform state ${state}`, error);
      results.stateResults.push({
        state,
        error: error.message
      });
    }
  }

  logger.info(`Wallet shock transformation complete: ${results.successfulStates}/${results.totalStates} states, ${results.totalCreated} created, ${results.totalUpdated} updated`);

  return results;
}

/**
 * Transform wallet shocks for nationwide (aggregated data)
 * Uses national averages from cached state data
 * @returns {Promise<object>} Results
 */
export async function transformNationwide() {
  logger.info('Transforming nationwide wallet shocks');

  // For nationwide, we'll use a representative large state or calculate averages
  // For now, use California as a proxy for national trends (adjust as needed)
  // TODO: Implement proper national average calculation

  const results = await transformStateData('nationwide');

  // If no nationwide data, try to synthesize from state data
  if (results.created.length === 0 && results.updated.length === 0) {
    logger.info('No nationwide data, attempting to use state averages');

    // Get a few large states and average their data
    const largeStates = ['California', 'Texas', 'Florida', 'New York'];
    // This is a placeholder - proper implementation would average the values

    for (const state of largeStates) {
      const stateResult = await transformStateData(state);
      if (stateResult.created.length > 0 || stateResult.updated.length > 0) {
        // Copy one state's data as nationwide if we have it
        // This is temporary until proper national data is available
        break;
      }
    }
  }

  return results;
}

/**
 * Get transformation status
 * @returns {Promise<object>} Status information
 */
export async function getTransformationStatus() {
  const walletShockCount = await WalletShock.countDocuments({ status: 'published' });
  const statesWithShocks = await WalletShock.distinct('state', { status: 'published' });
  const categoryCounts = await WalletShock.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const cacheHealth = await StateDataCache.getCacheHealth();

  return {
    walletShocks: {
      total: walletShockCount,
      statesWithData: statesWithShocks.length,
      states: statesWithShocks,
      byCategory: categoryCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    },
    cache: {
      totalEntries: cacheHealth.totalEntries,
      statesWithData: cacheHealth.statesWithData,
      healthPercentage: cacheHealth.healthPercentage
    },
    dataMapping: Object.keys(DATA_TYPE_TO_CATEGORY).map(dt => ({
      dataType: dt,
      category: DATA_TYPE_TO_CATEGORY[dt].category
    }))
  };
}

export default {
  transformStateData,
  transformAllStates,
  transformNationwide,
  getTransformationStatus
};
