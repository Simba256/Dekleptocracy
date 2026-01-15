/**
 * State Data Scheduler
 * Periodically fetches real economic data from government APIs via MCP
 * and caches it in MongoDB for state reports
 */

import cron from 'node-cron';
import StateDataCache from '../models/StateDataCache.js';
import { executeMCPTool, checkMCPHealth } from './mcpClient.js';
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

// Data types with their MCP tool mappings and TTL
const DATA_TYPES = [
  {
    type: 'unemployment',
    tool: 'get_bls_unemployment_by_state',
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
  {
    type: 'rent',
    tool: 'get_hud_rent_history',
    ttlHours: 168, // Weekly - HUD data is annual
    args: { years: 5 },
    processResult: (result) => ({
      sourceApi: 'hud',
      rawData: result,
      processedData: {
        value: result.value,
        displayValue: result.displayValue,
        change: result.change,
        changeDisplay: result.changeDisplay,
        changeDirection: result.change > 0 ? 'up' : result.change < 0 ? 'down' : 'neutral',
        unit: '$/month',
        period: result.history?.[result.history.length - 1]?.year
      },
      timeSeries: result.time_series?.map(ts => ({
        date: new Date(`${ts.date}-01-01`),
        value: ts.value,
        label: ts.label
      })) || [],
      metadata: { fiveYearChange: result.five_year_change }
    })
  },
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
    tool: 'get_fred_state_gdp',
    ttlHours: 168, // Weekly - GDP is quarterly
    processResult: (result) => ({
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
      metadata: { seriesId: result.series_id }
    })
  },
  {
    type: 'personal_income',
    tool: 'get_fred_state_personal_income',
    ttlHours: 168,
    processResult: (result) => ({
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
      metadata: { seriesId: result.series_id }
    })
  },
  {
    type: 'income_limits',
    tool: 'get_hud_income_limits',
    ttlHours: 168, // Weekly - HUD data is annual
    processResult: (result) => ({
      sourceApi: 'hud',
      rawData: result,
      processedData: {
        value: result.median_income,
        displayValue: result.displayValue,
        change: null,
        changeDisplay: '',
        changeDirection: 'neutral',
        unit: 'USD/year'
      },
      timeSeries: [],
      metadata: {
        lowIncomeLimit: result.avg_low_income_limit,
        veryLowIncomeLimit: result.avg_very_low_income_limit,
        extremelyLowIncomeLimit: result.avg_extremely_low_income_limit,
        areasCount: result.areas_count
      }
    })
  },
  {
    type: 'affordability',
    tool: 'get_hud_affordability_analysis',
    ttlHours: 168, // Weekly - combines FMR and income limits
    processResult: (result) => ({
      sourceApi: 'hud',
      rawData: result,
      processedData: {
        value: result.rent_as_percent_of_median,
        displayValue: result.displayValue,
        change: null,
        changeDisplay: result.affordability_status,
        changeDirection: result.is_affordable_for_median ? 'down' : 'up',
        unit: 'percent'
      },
      timeSeries: [],
      metadata: {
        monthlyRent: result.monthly_rent_2br,
        medianIncome: result.median_income,
        incomeNeeded: result.income_needed_for_affordable,
        hourlyWageNeeded: result.hourly_wage_needed,
        isAffordable: result.is_affordable_for_median
      }
    })
  }
];

/**
 * Refresh a single data type for a state
 */
async function refreshDataType(stateName, dataConfig) {
  try {
    const args = { state_name: stateName, ...(dataConfig.args || {}) };
    const result = await executeMCPTool(dataConfig.tool, args);

    if (result.status === 'success') {
      const processedResult = dataConfig.processResult(result);

      await StateDataCache.upsertData(
        stateName,
        dataConfig.type,
        processedResult,
        dataConfig.ttlHours
      );

      logger.info(`Refreshed ${dataConfig.type} data for ${stateName}`);
      return true;
    } else {
      logger.warn(`Failed to fetch ${dataConfig.type} for ${stateName}: ${result.error}`);
      await StateDataCache.markError(stateName, dataConfig.type, result.error);
      return false;
    }
  } catch (error) {
    logger.error(`Error refreshing ${dataConfig.type} for ${stateName}`, error);
    await StateDataCache.markError(stateName, dataConfig.type, error.message);
    return false;
  }
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
      ttlHours: d.ttlHours
    })),
    stateCount: US_STATES.length,
    priorityStates: PRIORITY_STATES
  };
}

/**
 * Trigger manual refresh for a specific state
 */
export async function triggerStateRefresh(stateName) {
  if (!US_STATES.includes(stateName)) {
    throw new Error(`Unknown state: ${stateName}`);
  }

  return await refreshStateData(stateName);
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

export default {
  initializeScheduler,
  refreshStateData,
  triggerStateRefresh,
  triggerDataTypeRefresh,
  getSchedulerStatus
};
