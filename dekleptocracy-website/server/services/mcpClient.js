/**
 * MCP Server Client
 * Provides utilities to fetch data from the MCP server HTTP API
 */

import logger from '../utils/logger.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

/**
 * Execute a tool on the MCP server
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments for the tool
 * @returns {Promise<object>} Tool execution result
 */
export async function executeMCPTool(toolName, args = {}) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool_name: toolName,
        arguments: args
      })
    });

    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
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

export default {
  executeMCPTool,
  fetchNews,
  fetchCensusTradeData,
  fetchBEAData,
  fetchTariffAnnouncements,
  checkMCPHealth,
  getMCPTools
};
