/**
 * MCP Server Client
 * Provides utilities to fetch data from the MCP server HTTP API
 */

import logger from '../utils/logger.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

// Default timeout for MCP tool execution (30 seconds)
const DEFAULT_TOOL_TIMEOUT = 30000;

/**
 * Execute a tool on the MCP server
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments for the tool
 * @param {number} timeout - Timeout in milliseconds (default 30s)
 * @returns {Promise<object>} Tool execution result
 */
export async function executeMCPTool(toolName, args = {}, timeout = DEFAULT_TOOL_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool_name: toolName,
        arguments: args
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      logger.error(`MCP tool execution timed out after ${timeout}ms: ${toolName}`, null, { toolName, args });
      throw new Error(`MCP tool execution timed out: ${toolName}`, { cause: error });
    }
    logger.error(`Error executing MCP tool: ${toolName}`, error, { toolName, args });
    throw error;
  }
}

/**
 * Get news articles for a specific category and state
 * @param {string} category - Category (groceries, fuel, utilities, tech, etc.)
 * @param {string} state - State name
 * @param {number} maxResults - Max number of articles
 * @returns {Promise<array>} News articles
 */
export async function fetchNews(category, state = 'nationwide', maxResults = 5) {
  try {
    // Map category to search query
    const queryMap = {
      groceries: `food prices ${state}`,
      fuel: `gas prices ${state}`,
      utilities: `electricity prices ${state}`,
      tech: `electronics prices tariffs ${state}`,
    };

    const query = queryMap[category] || `${category} prices ${state}`;

    const result = await executeMCPTool('get_trade_news', {
      query,
      max_results: maxResults
    });

    return result.articles || [];

  } catch (error) {
    logger.warn(`Failed to fetch news for ${category} in ${state}`, error);
    return [];
  }
}

/**
 * Get Census trade data for specific HTS code
 * @param {string} htsCode - Harmonized Tariff Schedule code
 * @param {string} tradeFlow - 'imports' or 'exports'
 * @returns {Promise<object>} Trade data
 */
export async function fetchCensusTradeData(htsCode, tradeFlow = 'imports') {
  try {
    const result = await executeMCPTool('get_census_trade_data', {
      hts_code: htsCode,
      trade_flow: tradeFlow,
      year: new Date().getFullYear()
    });

    return result.data || null;

  } catch (error) {
    logger.warn(`Failed to fetch Census data for HTS ${htsCode}`, error);
    return null;
  }
}

/**
 * Get BEA economic indicators
 * @param {string} datasetName - BEA dataset name
 * @param {object} parameters - Additional parameters
 * @returns {Promise<object>} BEA data
 */
export async function fetchBEAData(datasetName, parameters = {}) {
  try {
    const result = await executeMCPTool('get_bea_data', {
      dataset_name: datasetName,
      ...parameters
    });

    return result.data || null;

  } catch (error) {
    logger.warn(`Failed to fetch BEA data for ${datasetName}`, error);
    return null;
  }
}

/**
 * Get recent tariff announcements from Federal Register
 * @param {number} days - Number of days to look back
 * @returns {Promise<array>} Tariff announcements
 */
export async function fetchTariffAnnouncements(days = 30) {
  try {
    const result = await executeMCPTool('get_recent_tariff_announcements', {
      days
    });

    return result.announcements || [];

  } catch (error) {
    logger.warn(`Failed to fetch tariff announcements`, error);
    return [];
  }
}

/**
 * Check if MCP server is available
 * @returns {Promise<boolean>} True if server is healthy
 */
export async function checkMCPHealth() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });

    return response.ok;
  } catch (error) {
    logger.error('MCP server health check failed', error);
    return false;
  }
}

/**
 * Get list of available MCP tools
 * @returns {Promise<array>} List of tool names
 */
export async function getMCPTools() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/tools`);
    const data = await response.json();
    return data.tools || [];
  } catch (error) {
    logger.error('Failed to fetch MCP tools list', error);
    return [];
  }
}

// ============================================
// State Report Data Fetching Functions
// ============================================

/**
 * Get unemployment data for a state
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Unemployment data
 */
export async function fetchUnemploymentData(stateName) {
  try {
    return await executeMCPTool('get_bls_unemployment_by_state', {
      state_name: stateName,
      start_year: '2023',
      end_year: '2024'
    });
  } catch (error) {
    logger.warn(`Failed to fetch unemployment for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get electricity prices for a state
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Electricity price data
 */
export async function fetchElectricityPrices(stateName) {
  try {
    return await executeMCPTool('get_electricity_prices_by_state', {
      state_name: stateName,
      sector: 'RES'
    });
  } catch (error) {
    logger.warn(`Failed to fetch electricity prices for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get gasoline prices for a state's region
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Gas price data
 */
export async function fetchGasolinePrices(stateName) {
  try {
    return await executeMCPTool('get_gasoline_prices_by_state', {
      state_name: stateName
    });
  } catch (error) {
    logger.warn(`Failed to fetch gas prices for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get HUD Fair Market Rent data for a state
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Rent data with history
 */
export async function fetchRentData(stateName) {
  try {
    return await executeMCPTool('get_hud_rent_history', {
      state_name: stateName,
      years: 5
    });
  } catch (error) {
    logger.warn(`Failed to fetch rent data for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get food prices for a state
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Food price data
 */
export async function fetchFoodPrices(stateName) {
  try {
    return await executeMCPTool('get_usda_food_prices', {
      state_name: stateName
    });
  } catch (error) {
    logger.warn(`Failed to fetch food prices for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get grocery basket comparison for a state vs national
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} Grocery comparison data
 */
export async function fetchGroceryBasket(stateName) {
  try {
    return await executeMCPTool('get_usda_grocery_basket', {
      state_name: stateName
    });
  } catch (error) {
    logger.warn(`Failed to fetch grocery basket for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get state GDP from FRED
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} GDP data
 */
export async function fetchStateGDP(stateName) {
  try {
    return await executeMCPTool('get_fred_state_gdp', {
      state_name: stateName
    });
  } catch (error) {
    logger.warn(`Failed to fetch GDP for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get comprehensive economic data for a state (all sources)
 * @param {string} stateName - Full state name
 * @returns {Promise<object>} All available economic data
 */
export async function fetchAllStateData(stateName) {
  try {
    return await executeMCPTool('get_state_economic_data', {
      state_name: stateName
    });
  } catch (error) {
    logger.warn(`Failed to fetch comprehensive data for ${stateName}`, error);
    return { status: 'error', error: error.message };
  }
}

export default {
  executeMCPTool,
  fetchNews,
  fetchCensusTradeData,
  fetchBEAData,
  fetchTariffAnnouncements,
  checkMCPHealth,
  getMCPTools,
  // New state data functions
  fetchUnemploymentData,
  fetchElectricityPrices,
  fetchGasolinePrices,
  fetchRentData,
  fetchFoodPrices,
  fetchGroceryBasket,
  fetchStateGDP,
  fetchAllStateData
};
