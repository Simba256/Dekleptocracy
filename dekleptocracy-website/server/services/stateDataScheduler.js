/**
 * State Data Scheduler
 * Periodically fetches real economic data from government APIs via MCP
 * and caches it in MongoDB for state reports
 */

import cron from 'node-cron';
import StateDataCache from '../models/StateDataCache.js';
import { executeMCPTool, checkMCPHealth } from './mcpClient.js';
import { transformAllStates, transformStateData } from './walletShockTransformer.js';
import logger from '../utils/logger.js';

// All US states for data refresh
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
];

// Priority states to refresh more frequently
const PRIORITY_STATES = [
  'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
  'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
];

// Data types with their MCP tool mappings, TTL, and optional fallbacks
const DATA_TYPES = [
  {
    type: 'unemployment',
    tool: 'get_bls_unemployment_by_state',
    fallbackTool: 'get_fred_state_unemployment', // FRED fallback
    ttlHours: 24,
    processResult: (result) => ({
      sourceApi: 'bls',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.changeDirection,
        unit: 'percent',
        period: result.data?.[result.data.length - 1]?.periodName
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { seriesId: result.series_id }
    }),
    processFallbackResult: (result) => ({
      sourceApi: 'fred',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: 'percent',
        period: result.latest_date
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { seriesId: result.series_id, source: 'FRED (fallback)' }
    })
  },
  {
    type: 'electricity_prices',
    tool: 'get_electricity_prices_by_state',
    ttlHours: 24,
    args: { sector: 'RES' },
    processResult: (result) => ({
      sourceApi: 'eia',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.changeDirection,
        unit: 'cents/kWh',
        period: result.data?.[result.data.length - 1]?.period
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { sector: 'RES' }
    })
  },
  {
    type: 'gas_prices',
    tool: 'get_gasoline_prices_by_state',
    ttlHours: 6, // More volatile, refresh more often
    processResult: (result) => ({
      sourceApi: 'eia',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.changeDirection,
        unit: '$/gallon',
        period: result.data?.[result.data.length - 1]?.period
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { region: result.region, padd: result.padd }
    })
  },
  // HUD rent data removed - API access issues (403 Forbidden)
  // {
  //   type: 'rent',
  //   tool: 'get_hud_rent_history',
  //   ...
  // },
  {
    type: 'food_prices',
    tool: 'get_usda_food_prices',
    ttlHours: 24,
    processResult: (result) => ({
      sourceApi: 'usda',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.changeDirection,
        unit: '$/person/month'
      },
      timeSeries: [],
      metadata: { region: result.region, costFactor: result.cost_factor }
    })
  },
  {
    type: 'grocery_basket',
    tool: 'get_usda_grocery_basket',
    ttlHours: 24,
    processResult: (result) => ({
      sourceApi: 'usda',
      rawData: result,
      processedData: {
        value: result.stateValue,
        displayValue: result.comparison?.stateValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.changeDirection,
        unit: '$/month'
      },
      nationalValue: result.nationalValue,
      nationalDisplayValue: result.comparison?.nationalValue,
      timeSeries: [],
      metadata: {}
    })
  },
  {
    type: 'gdp',
    tool: 'get_bea_state_gdp',
    fallbackTool: 'get_fred_state_gdp', // FRED fallback
    ttlHours: 168, // Weekly - GDP is quarterly
    processResult: (result) => ({
      sourceApi: 'bea',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: 'billions USD'
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { source: result.source }
    }),
    processFallbackResult: (result) => ({
      sourceApi: 'fred',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: 'billions USD'
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { source: 'FRED (fallback)' }
    })
  },
  {
    type: 'personal_income',
    tool: 'get_bea_state_personal_income',
    fallbackTool: 'get_fred_state_personal_income', // FRED fallback
    ttlHours: 168,
    processResult: (result) => ({
      sourceApi: 'bea',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: 'USD/year'
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { source: result.source }
    }),
    processFallbackResult: (result) => ({
      sourceApi: 'fred',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: 'USD/year'
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(ts.date),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { source: 'FRED (fallback)' }
    })
  },
  // HUD income_limits removed - API access issues (403 Forbidden)
  // HUD affordability removed - API access issues (403 Forbidden)
];

/**
 * Try to fetch data from a specific tool
 */
async function tryFetchFromTool(stateName, toolName, args) {
  try {
    const mcpResponse = await executeMCPTool(toolName, args);

    if (!mcpResponse.success) {
      return { success: false, error: mcpResponse.error || 'MCP request failed' };
    }

    const result = mcpResponse.result;
    if (result?.status === 'success') {
      return { success: true, result };
    } else {
      return { success: false, error: result?.error || 'API returned non-success status' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Refresh a single data type for a state (with fallback support)
 */
async function refreshDataType(stateName, dataConfig) {
  const args = { state_name: stateName, ...(dataConfig.args || {}) };

  // Try primary API
  const primaryResult = await tryFetchFromTool(stateName, dataConfig.tool, args);

  if (primaryResult.success) {
    try {
      const processedResult = dataConfig.processResult(primaryResult.result);
      await StateDataCache.upsertData(
        stateName,
        dataConfig.type,
        processedResult,
        dataConfig.ttlHours
      );
      logger.info(`Refreshed ${dataConfig.type} data for ${stateName} (primary: ${dataConfig.tool})`);
      return true;
    } catch (error) {
      logger.error(`Error processing ${dataConfig.type} for ${stateName}`, error);
    }
  } else {
    logger.warn(`Primary API failed for ${dataConfig.type} in ${stateName}: ${primaryResult.error}`);
  }

  // Try fallback API if available
  if (dataConfig.fallbackTool && dataConfig.processFallbackResult) {
    logger.info(`Trying fallback ${dataConfig.fallbackTool} for ${dataConfig.type} in ${stateName}`);

    const fallbackResult = await tryFetchFromTool(stateName, dataConfig.fallbackTool, args);

    if (fallbackResult.success) {
      try {
        const processedResult = dataConfig.processFallbackResult(fallbackResult.result);
        await StateDataCache.upsertData(
          stateName,
          dataConfig.type,
          processedResult,
          dataConfig.ttlHours
        );
        logger.info(`Refreshed ${dataConfig.type} data for ${stateName} (fallback: ${dataConfig.fallbackTool})`);
        return true;
      } catch (error) {
        logger.error(`Error processing fallback ${dataConfig.type} for ${stateName}`, error);
      }
    } else {
      logger.warn(`Fallback API also failed for ${dataConfig.type} in ${stateName}: ${fallbackResult.error}`);
    }
  }

  // Both primary and fallback failed
  const errorMsg = primaryResult.error || 'All APIs failed';
  await StateDataCache.markError(stateName, dataConfig.type, errorMsg);
  return false;
}

/**
 * Refresh all data types for a state
 */
export async function refreshStateData(stateName) {
  logger.info(`Starting data refresh for ${stateName}`);

  const results = {
    state: stateName,
    success: [],
    failed: []
  };

  for (const dataConfig of DATA_TYPES) {
    const success = await refreshDataType(stateName, dataConfig);
    if (success) {
      results.success.push(dataConfig.type);
    } else {
      results.failed.push(dataConfig.type);
    }

    // Rate limiting - wait between API calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logger.info(`Completed refresh for ${stateName}: ${results.success.length} success, ${results.failed.length} failed`);
  return results;
}

/**
 * Refresh data for all states
 */
async function refreshAllStates() {
  logger.info('Starting full state data refresh...');

  const isHealthy = await checkMCPHealth();
  if (!isHealthy) {
    logger.error('MCP server is not healthy, skipping refresh');
    return;
  }

  // Process priority states first
  for (const state of PRIORITY_STATES) {
    await refreshStateData(state);
    // Wait 2 seconds between states to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Then process remaining states
  const remainingStates = US_STATES.filter(s => !PRIORITY_STATES.includes(s));
  for (const state of remainingStates) {
    await refreshStateData(state);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logger.info('Full state data refresh complete');

  // Transform cached data into wallet shocks for homepage
  logger.info('Starting wallet shock transformation...');
  try {
    const transformResult = await transformAllStates({ priorityStates: PRIORITY_STATES });
    logger.info(`Wallet shock transformation complete: ${transformResult.successfulStates} states updated`);
  } catch (error) {
    logger.error('Wallet shock transformation failed', error);
  }
}

/**
 * Refresh only gas prices (more volatile data)
 */
async function refreshGasPrices() {
  logger.info('Starting gas price refresh...');

  const isHealthy = await checkMCPHealth();
  if (!isHealthy) {
    logger.error('MCP server is not healthy, skipping gas price refresh');
    return;
  }

  const gasConfig = DATA_TYPES.find(d => d.type === 'gas_prices');
  if (!gasConfig) return;

  for (const state of PRIORITY_STATES) {
    await refreshDataType(state, gasConfig);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logger.info('Gas price refresh complete');

  // Update fuel wallet shocks for priority states
  logger.info('Updating fuel wallet shocks for priority states...');
  try {
    for (const state of PRIORITY_STATES) {
      await transformStateData(state);
    }
    logger.info('Fuel wallet shocks updated');
  } catch (error) {
    logger.error('Fuel wallet shock update failed', error);
  }
}

/**
 * Initialize scheduler
 */
export function initializeScheduler() {
  // Daily full refresh at 2 AM EST
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily state data refresh (scheduled)');
    try {
      await refreshAllStates();
    } catch (error) {
      logger.error('Daily refresh failed', error);
    }
  }, {
    timezone: 'America/New_York'
  });

  // Gas prices every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running gas price refresh (scheduled)');
    try {
      await refreshGasPrices();
    } catch (error) {
      logger.error('Gas price refresh failed', error);
    }
  }, {
    timezone: 'America/New_York'
  });

  logger.info('State data scheduler initialized');
  logger.info('  - Full refresh: Daily at 2 AM EST');
  logger.info('  - Gas prices: Every 6 hours');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    status: 'active',
    schedules: [
      { name: 'Full state data refresh', schedule: 'Daily at 2 AM EST' },
      { name: 'Gas price refresh', schedule: 'Every 6 hours' }
    ],
    dataTypes: DATA_TYPES.map(d => ({
      type: d.type,
      tool: d.tool,
      fallbackTool: d.fallbackTool || null,
      ttlHours: d.ttlHours
    })),
    stateCount: US_STATES.length,
    priorityStates: PRIORITY_STATES
  };
}

/**
 * Trigger manual refresh for a specific state
 * @param {string} stateName - State name
 * @param {boolean} includeTransform - Whether to also transform wallet shocks (default: true)
 */
export async function triggerStateRefresh(stateName, includeTransform = true) {
  if (!US_STATES.includes(stateName)) {
    throw new Error(`Unknown state: ${stateName}`);
  }

  const refreshResult = await refreshStateData(stateName);

  // Also transform to wallet shocks if requested
  if (includeTransform) {
    try {
      const transformResult = await transformStateData(stateName);
      refreshResult.walletShocks = transformResult;
    } catch (error) {
      logger.error(`Failed to transform wallet shocks for ${stateName}`, error);
      refreshResult.walletShocksError = error.message;
    }
  }

  return refreshResult;
}

/**
 * Trigger manual refresh for specific data type across all states
 */
export async function triggerDataTypeRefresh(dataType) {
  const dataConfig = DATA_TYPES.find(d => d.type === dataType);
  if (!dataConfig) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  logger.info(`Triggering ${dataType} refresh for all states...`);

  const results = { success: [], failed: [] };

  for (const state of US_STATES) {
    const success = await refreshDataType(state, dataConfig);
    if (success) {
      results.success.push(state);
    } else {
      results.failed.push(state);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

export { PRIORITY_STATES, US_STATES };

export default {
  initializeScheduler,
  refreshStateData,
  triggerStateRefresh,
  triggerDataTypeRefresh,
  getSchedulerStatus,
  PRIORITY_STATES,
  US_STATES
};
