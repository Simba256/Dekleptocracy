/**
 * State Report Generator
 * Generates state-specific impact reports using ONLY real data from government APIs
 * Falls back to stale (but still real) cached data when fresh data is unavailable
 * NEVER returns fake or hardcoded data
 */

import logger from '../utils/logger.js';
import StateDataCache from '../models/StateDataCache.js';
import { fetchNews, checkMCPHealth, executeMCPTool } from './mcpClient.js';
import { refreshStateData } from './stateDataScheduler.js';
import { analyzeTrends, analyzeHistoricalContext, getMetricTypeFromTitle } from './trendAnalyzer.js';

/**
 * Fetch all cached data for a state
 */
async function fetchStateDataFromCache(stateName) {
  try {
    const result = await StateDataCache.getAllStateData(stateName);
    return result;
  } catch (error) {
    logger.error('Error fetching cached state data', error, { stateName });
    return { state: stateName, data: {}, hasStaleData: false, availableDataCount: 0 };
  }
}

/**
 * Build comparison cards from real data
 */
function buildComparisonCards(stateData, stateName) {
  const cards = [];

  // Energy costs card
  const electricity = stateData.electricity_prices;
  if (electricity?.processedData) {
    cards.push({
      value: electricity.processedData.changeDisplay || 'N/A',
      label: 'Energy Costs Trend',
      description: `Electricity bills in ${stateName} are ${electricity.processedData.displayValue}, ${electricity.processedData.changeDisplay} from last year`,
      isRealData: true,
      source: 'EIA',
      isStale: electricity.isStale
    });
  }

  // Housing costs card
  const rent = stateData.rent;
  if (rent?.processedData) {
    cards.push({
      value: rent.processedData.changeDisplay || 'N/A',
      label: 'Housing Cost Change',
      description: `Average fair market rent in ${stateName}: ${rent.processedData.displayValue}`,
      isRealData: true,
      source: 'HUD',
      isStale: rent.isStale
    });
  }

  // If we don't have 2 cards, try to add from other data
  if (cards.length < 2) {
    const gasoline = stateData.gas_prices;
    if (gasoline?.processedData && cards.length < 2) {
      cards.push({
        value: gasoline.processedData.changeDisplay || 'N/A',
        label: 'Fuel Price Trend',
        description: `Gas prices in ${stateName} region: ${gasoline.processedData.displayValue}`,
        isRealData: true,
        source: 'EIA',
        isStale: gasoline.isStale
      });
    }
  }

  return cards;
}

/**
 * Build key metrics from real data with trend analysis and historical context
 */
function buildKeyMetrics(stateData, stateName) {
  const metrics = [];

  // Unemployment
  const unemployment = stateData.unemployment;
  if (unemployment?.processedData) {
    const isNegative = unemployment.processedData.change > 0; // Higher unemployment is bad
    const currentValue = parseFloat(unemployment.processedData.value) || null;
    const analysis = analyzeTrends(unemployment.timeSeries, 'unemployment', currentValue);
    const historicalContext = analyzeHistoricalContext(unemployment.timeSeries, 'unemployment', currentValue);
    metrics.push({
      title: 'Unemployment Rate',
      value: unemployment.processedData.displayValue,
      change: unemployment.processedData.changeDisplay,
      color: isNegative ? '#FF6B5A' : '#4A5D3F',
      source: 'BLS',
      isRealData: true,
      isStale: unemployment.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Rent
  const rent = stateData.rent;
  if (rent?.processedData) {
    const isNegative = rent.processedData.change > 0; // Higher rent is bad for consumers
    const currentValue = parseFloat(rent.processedData.value) || null;
    const analysis = analyzeTrends(rent.timeSeries, 'rent', currentValue);
    const historicalContext = analyzeHistoricalContext(rent.timeSeries, 'rent', currentValue);
    metrics.push({
      title: 'Average Monthly Rent',
      value: rent.processedData.displayValue,
      change: rent.processedData.changeDisplay,
      color: isNegative ? '#FF6B5A' : '#4A5D3F',
      source: 'HUD',
      isRealData: true,
      isStale: rent.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Gas prices
  const gasoline = stateData.gas_prices;
  if (gasoline?.processedData) {
    const isNegative = gasoline.processedData.change > 0;
    const currentValue = parseFloat(gasoline.processedData.value) || null;
    const analysis = analyzeTrends(gasoline.timeSeries, 'gas_prices', currentValue);
    const historicalContext = analyzeHistoricalContext(gasoline.timeSeries, 'gas_prices', currentValue);
    metrics.push({
      title: 'Gas Price (Regular)',
      value: gasoline.processedData.displayValue,
      change: gasoline.processedData.changeDisplay,
      color: isNegative ? '#FF6B5A' : '#4A5D3F',
      source: 'EIA',
      isRealData: true,
      isStale: gasoline.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Electricity
  const electricity = stateData.electricity_prices;
  if (electricity?.processedData) {
    const isNegative = electricity.processedData.change > 0;
    const currentValue = parseFloat(electricity.processedData.value) || null;
    const analysis = analyzeTrends(electricity.timeSeries, 'electricity_prices', currentValue);
    const historicalContext = analyzeHistoricalContext(electricity.timeSeries, 'electricity_prices', currentValue);
    metrics.push({
      title: 'Electricity (cents/kWh)',
      value: electricity.processedData.displayValue,
      change: electricity.processedData.changeDisplay,
      color: isNegative ? '#FF6B5A' : '#4A5D3F',
      source: 'EIA',
      isRealData: true,
      isStale: electricity.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Food prices
  const food = stateData.food_prices;
  if (food?.processedData && metrics.length < 6) {
    const isNegative = food.processedData.change > 0;
    const currentValue = parseFloat(food.processedData.value) || null;
    const analysis = analyzeTrends(food.timeSeries, 'food_prices', currentValue);
    const historicalContext = analyzeHistoricalContext(food.timeSeries, 'food_prices', currentValue);
    metrics.push({
      title: 'Food (per person/month)',
      value: food.processedData.displayValue,
      change: food.processedData.changeDisplay,
      color: isNegative ? '#FF6B5A' : '#4A5D3F',
      source: 'USDA',
      isRealData: true,
      isStale: food.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Income / Affordability metrics
  const incomeData = stateData.income_limits;
  if (incomeData?.processedData && metrics.length < 6) {
    const historicalContext = analyzeHistoricalContext(incomeData.timeSeries, 'income', null);
    metrics.push({
      title: 'Median Income',
      value: incomeData.processedData.displayValue,
      change: '',
      color: '#4A5D3F',
      source: 'HUD',
      isRealData: true,
      isStale: incomeData.isStale,
      alerts: [],
      momentum: 'stable',
      trendSummary: '',
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  const affordability = stateData.affordability;
  if (affordability?.processedData && metrics.length < 6) {
    // If rent takes more than 30% of income, it's considered cost-burdened
    const isUnaffordable = affordability.processedData.value > 30;
    const currentValue = parseFloat(affordability.processedData.value) || null;
    const analysis = analyzeTrends(affordability.timeSeries, 'affordability', currentValue);
    const historicalContext = analyzeHistoricalContext(affordability.timeSeries, 'affordability', currentValue);
    metrics.push({
      title: 'Rent as % of Income',
      value: affordability.processedData.displayValue,
      change: isUnaffordable ? 'Cost-burdened' : 'Affordable',
      color: isUnaffordable ? '#FF6B5A' : '#4A5D3F',
      source: 'HUD',
      isRealData: true,
      isStale: affordability.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  return metrics;
}

/**
 * Build trend data from time series with trend analysis and historical context
 */
function buildTrendData(stateData) {
  const trends = [];

  // Rent trend
  const rent = stateData.rent;
  if (rent?.timeSeries?.length > 0) {
    const firstValue = rent.timeSeries[0]?.value || 0;
    const currentValue = parseFloat(rent.processedData?.value) || null;
    const analysis = analyzeTrends(rent.timeSeries, 'rent', currentValue);
    const historicalContext = analyzeHistoricalContext(rent.timeSeries, 'rent', currentValue);
    trends.push({
      title: 'Fair Market Rent (Annual)',
      currentValue: rent.processedData?.displayValue || 'N/A',
      data: rent.timeSeries.map(point => ({
        month: point.label,
        value: point.value,
        color: point.value > firstValue ? '#FF6B5A' : '#4A5D3F'
      })),
      source: 'HUD',
      isRealData: true,
      isStale: rent.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Gas prices trend
  const gasoline = stateData.gas_prices;
  if (gasoline?.timeSeries?.length > 0) {
    const firstValue = gasoline.timeSeries[0]?.value || 0;
    const currentValue = parseFloat(gasoline.processedData?.value) || null;
    const analysis = analyzeTrends(gasoline.timeSeries, 'gas_prices', currentValue);
    const historicalContext = analyzeHistoricalContext(gasoline.timeSeries, 'gas_prices', currentValue);
    trends.push({
      title: 'Fuel Prices Over Time',
      currentValue: gasoline.processedData?.displayValue || 'N/A',
      data: gasoline.timeSeries.map(point => ({
        month: point.label,
        value: Math.round(point.value * 100), // Convert to cents for visualization
        color: point.value > firstValue ? '#FF6B5A' : '#4A5D3F'
      })),
      source: 'EIA',
      isRealData: true,
      isStale: gasoline.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  // Electricity trend
  const electricity = stateData.electricity_prices;
  if (electricity?.timeSeries?.length > 0) {
    const firstValue = electricity.timeSeries[0]?.value || 0;
    const currentValue = parseFloat(electricity.processedData?.value) || null;
    const analysis = analyzeTrends(electricity.timeSeries, 'electricity_prices', currentValue);
    const historicalContext = analyzeHistoricalContext(electricity.timeSeries, 'electricity_prices', currentValue);
    trends.push({
      title: 'Electricity Prices Over Time',
      currentValue: electricity.processedData?.displayValue || 'N/A',
      data: electricity.timeSeries.map(point => ({
        month: point.label,
        value: Math.round(point.value * 10), // Scale for visualization
        color: point.value > firstValue ? '#FF6B5A' : '#4A5D3F'
      })),
      source: 'EIA',
      isRealData: true,
      isStale: electricity.isStale,
      alerts: analysis.alerts,
      momentum: analysis.momentum,
      trendSummary: analysis.trendSummary,
      historicalContext: historicalContext.available ? historicalContext : null
    });
  }

  return trends;
}

/**
 * Fetch national averages for comparison
 * These are cached at module level since they're the same for all states
 */
let nationalAveragesCache = {
  electricity: null,
  gasoline: null,
  lastFetched: null
};

async function fetchNationalAverages() {
  const now = Date.now();
  const cacheAge = nationalAveragesCache.lastFetched
    ? now - nationalAveragesCache.lastFetched
    : Infinity;

  // Use cached values if less than 1 hour old
  if (cacheAge < 3600000 && nationalAveragesCache.electricity && nationalAveragesCache.gasoline) {
    return nationalAveragesCache;
  }

  try {
    // Fetch both national averages in parallel
    const [electricityResult, gasolineResult] = await Promise.all([
      executeMCPTool('get_national_electricity_price', {}),
      executeMCPTool('get_national_gasoline_price', {})
    ]);

    if (electricityResult?.result?.status === 'success') {
      nationalAveragesCache.electricity = electricityResult.result;
    }
    if (gasolineResult?.result?.status === 'success') {
      nationalAveragesCache.gasoline = gasolineResult.result;
    }
    nationalAveragesCache.lastFetched = now;
  } catch (error) {
    logger.warn('Failed to fetch national averages', error);
  }

  return nationalAveragesCache;
}

/**
 * Build state vs national comparison data
 */
async function buildComparisonData(stateData, stateName) {
  const comparisons = [];

  // Fetch national averages for comparison
  const nationalAvgs = await fetchNationalAverages();

  // Grocery basket comparison
  const groceryBasket = stateData.grocery_basket;
  if (groceryBasket?.processedData && groceryBasket?.nationalDisplayValue) {
    comparisons.push({
      category: 'Grocery basket',
      change: groceryBasket.processedData.changeDisplay,
      stateValue: groceryBasket.processedData.displayValue,
      nationalValue: groceryBasket.nationalDisplayValue,
      source: 'USDA',
      isRealData: true,
      isStale: groceryBasket.isStale
    });
  }

  // Gas prices comparison with national average
  const gasoline = stateData.gas_prices;
  if (gasoline?.processedData) {
    const nationalGasValue = nationalAvgs.gasoline?.displayValue || 'N/A';
    comparisons.push({
      category: 'Fuel Price',
      change: gasoline.processedData.changeDisplay,
      stateValue: gasoline.processedData.displayValue,
      nationalValue: nationalGasValue,
      source: 'EIA',
      isRealData: true,
      isStale: gasoline.isStale
    });
  }

  // Electricity comparison with national average
  const electricity = stateData.electricity_prices;
  if (electricity?.processedData) {
    const nationalElecValue = nationalAvgs.electricity?.displayValue || 'N/A';
    comparisons.push({
      category: 'Electricity Bill',
      change: electricity.processedData.changeDisplay,
      stateValue: electricity.processedData.displayValue,
      nationalValue: nationalElecValue,
      source: 'EIA',
      isRealData: true,
      isStale: electricity.isStale
    });
  }

  return comparisons;
}

/**
 * Generate narrative overview using LLM
 * The LLM only generates text - all data values come from real sources
 */
async function generateNarrativeOverview(stateData, stateName, newsHeadlines) {
  // Build a summary of available real data
  const dataSummary = [];

  if (stateData.unemployment?.processedData) {
    dataSummary.push(`Unemployment: ${stateData.unemployment.processedData.displayValue}`);
  }
  if (stateData.electricity_prices?.processedData) {
    dataSummary.push(`Electricity: ${stateData.electricity_prices.processedData.displayValue}`);
  }
  if (stateData.gas_prices?.processedData) {
    dataSummary.push(`Gas: ${stateData.gas_prices.processedData.displayValue}`);
  }
  if (stateData.rent?.processedData) {
    dataSummary.push(`Rent: ${stateData.rent.processedData.displayValue}`);
  }

  // If we have data, try to generate a narrative
  if (dataSummary.length > 0) {
    const prompt = `Generate a brief, factual 1-2 sentence overview for ${stateName}'s economic situation.

Real data available:
${dataSummary.join('\n')}

Recent headlines: ${newsHeadlines.slice(0, 3).join('; ') || 'None available'}

Write a factual summary focusing on how these factors impact residents. Use hedging language like "approximately", "around", "based on latest data". Do NOT invent any numbers - only reference the data provided above.`;

    try {
      const result = await executeMCPTool('generate_text', { prompt, max_tokens: 150 });
      if (result.text) {
        return result.text;
      }
    } catch (error) {
      logger.warn('Failed to generate narrative overview', error);
    }
  }

  // Fallback to a generic factual statement
  if (dataSummary.length > 0) {
    return `Current economic data for ${stateName} shows: ${dataSummary.slice(0, 3).join(', ')}. These indicators directly affect household budgets.`;
  }

  return `Economic indicators for ${stateName} are being collected from government sources.`;
}

/**
 * Fetch news from multiple categories for comprehensive coverage
 */
async function fetchMultiCategoryNews(stateName) {
  const categories = [
    { query: `economy jobs ${stateName}`, category: 'economy' },
    { query: `housing rent ${stateName}`, category: 'housing' },
    { query: `gas prices energy ${stateName}`, category: 'energy' },
    { query: `grocery prices inflation ${stateName}`, category: 'food' },
    { query: `tariffs trade impact ${stateName}`, category: 'tariffs' },
    { query: `federal policy ${stateName}`, category: 'policy' }
  ];

  const allNews = [];

  for (const cat of categories) {
    try {
      const news = await fetchNews(cat.query, stateName, 3);
      if (news && news.length > 0) {
        allNews.push(...news.map(n => ({ ...n, category: cat.category })));
      }
    } catch (error) {
      logger.warn(`Failed to fetch ${cat.category} news for ${stateName}`, error);
    }
  }

  return allNews;
}

/**
 * Main function: Generate state report using ONLY real cached data
 * Returns error if no real data is available - NEVER returns fake data
 */
export async function generateStateReportData(stateName = 'California', role = 'VOTER', name = 'California Resident') {
  try {
    // Fetch cached data for the state
    let cachedData = await fetchStateDataFromCache(stateName);

    // If no data available, start a background refresh but don't wait for it
    if (cachedData.availableDataCount === 0) {
      logger.warn(`No cached data for ${stateName}, triggering background refresh...`);

      const isHealthy = await checkMCPHealth();
      if (isHealthy) {
        // Start refresh in background - don't await
        refreshStateData(stateName)
          .then(() => logger.info(`Background refresh completed for ${stateName}`))
          .catch(err => logger.error(`Background refresh failed for ${stateName}`, err));
      }

      // Return immediately with NO_DATA_AVAILABLE - don't block the request
      const error = new Error(`No real data available for ${stateName}. Data collection has been started. Please try again in a minute.`);
      error.code = 'NO_DATA_AVAILABLE';
      throw error;
    }

    const stateData = cachedData.data;

    // Fetch news
    const news = await fetchMultiCategoryNews(stateName);
    const headlines = news.map(n => n.title).filter(Boolean);

    // Generate narrative (LLM only for text, not data)
    const overview = await generateNarrativeOverview(stateData, stateName, headlines);

    // Build report sections from real data
    const comparisonCards = buildComparisonCards(stateData, stateName);
    const keyMetrics = buildKeyMetrics(stateData, stateName);
    const trendData = buildTrendData(stateData);
    const comparisonData = await buildComparisonData(stateData, stateName);

    // Collect all sources used
    const sourcesUsed = new Set();
    keyMetrics.forEach(m => m.source && sourcesUsed.add(m.source));
    comparisonCards.forEach(c => c.source && sourcesUsed.add(c.source));
    trendData.forEach(t => t.source && sourcesUsed.add(t.source));

    return {
      name,
      stateName,
      role,
      overviewTitle: 'State Impact Overview',
      overviewStatement: overview,
      comparisonCards,
      keyMetrics,
      trendData,
      comparisonData,
      metadata: {
        dataFreshness: cachedData.hasStaleData ? 'stale' : 'fresh',
        staleDataTypes: cachedData.staleDataTypes || [],
        lastUpdated: new Date().toISOString(),
        sources: Array.from(sourcesUsed),
        availableMetrics: cachedData.availableDataCount,
        isRealData: true
      },
      isFallback: false
    };

  } catch (error) {
    logger.error('Error generating real data state report', error, { stateName });

    // Re-throw with clear indication that we don't have real data
    if (error.code === 'NO_DATA_AVAILABLE') {
      throw error;
    }

    // For other errors, wrap with context
    const wrappedError = new Error(`Unable to generate report with real data: ${error.message}`);
    wrappedError.code = 'REPORT_GENERATION_FAILED';
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

/**
 * Get data availability status for a state
 */
export async function getStateDataStatus(stateName) {
  const cachedData = await fetchStateDataFromCache(stateName);
  const cacheHealth = await StateDataCache.getCacheHealth();

  return {
    state: stateName,
    availableDataCount: cachedData.availableDataCount,
    hasStaleData: cachedData.hasStaleData,
    staleDataTypes: cachedData.staleDataTypes,
    dataTypes: Object.entries(cachedData.data).map(([type, data]) => ({
      type,
      available: data !== null,
      isStale: data?.isStale || false,
      fetchedAt: data?.fetchedAt
    })),
    overallCacheHealth: cacheHealth
  };
}

export default {
  generateStateReportData,
  getStateDataStatus
};
