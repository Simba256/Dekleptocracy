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

// Average household consumption estimates for impact calculations
const HOUSEHOLD_CONSUMPTION = {
  electricityKwhPerMonth: 900,    // Average US household electricity usage
  gasolineGallonsPerMonth: 50,    // Average US household fuel consumption
  foodPersonsPerFamily: 3         // Average family size for food calculations
};

/**
 * Calculate household dollar impact from price changes
 * Returns breakdown of monthly cost increases by category
 */
function calculateHouseholdImpact(stateData) {
  const impact = {
    electricity: null,
    gasoline: null,
    food: null,
    total: 0,
    breakdown: []
  };

  // Electricity impact: change in cents/kWh * 900 kWh/month / 100
  const electricity = stateData.electricity_prices;
  if (electricity?.processedData?.change) {
    const changeInCents = electricity.processedData.change; // e.g., +1.2 cents/kWh
    const monthlyImpact = (changeInCents * HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth) / 100;
    if (monthlyImpact !== 0) {
      impact.electricity = Math.round(monthlyImpact);
      impact.total += impact.electricity;
      impact.breakdown.push({
        category: 'Electricity',
        amount: impact.electricity,
        description: `${changeInCents > 0 ? '+' : ''}${changeInCents.toFixed(1)}¢/kWh × ${HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth} kWh`
      });
    }
  }

  // Gasoline impact: change in $/gallon * 50 gallons/month
  const gasoline = stateData.gas_prices;
  if (gasoline?.processedData?.change) {
    const changeInDollars = gasoline.processedData.change; // e.g., +0.25 $/gallon
    const monthlyImpact = changeInDollars * HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth;
    if (monthlyImpact !== 0) {
      impact.gasoline = Math.round(monthlyImpact);
      impact.total += impact.gasoline;
      impact.breakdown.push({
        category: 'Fuel',
        amount: impact.gasoline,
        description: `${changeInDollars > 0 ? '+' : ''}$${changeInDollars.toFixed(2)}/gal × ${HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth} gal`
      });
    }
  }

  // Food impact: change per person * 3 family members
  const food = stateData.food_prices;
  if (food?.processedData?.change) {
    const changePerPerson = food.processedData.change; // e.g., +15 $/person/month
    const monthlyImpact = changePerPerson * HOUSEHOLD_CONSUMPTION.foodPersonsPerFamily;
    if (monthlyImpact !== 0) {
      impact.food = Math.round(monthlyImpact);
      impact.total += impact.food;
      impact.breakdown.push({
        category: 'Food',
        amount: impact.food,
        description: `${changePerPerson > 0 ? '+' : ''}$${changePerPerson.toFixed(0)}/person × ${HOUSEHOLD_CONSUMPTION.foodPersonsPerFamily} people`
      });
    }
  }

  impact.total = Math.round(impact.total);
  return impact;
}

/**
 * Generate section-specific insight for energy costs
 */
async function generateEnergyInsight(stateData, stateName) {
  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;

  if (!electricity && !gasoline) return null;

  const dataPoints = [];
  if (electricity) {
    dataPoints.push(`Electricity: ${electricity.displayValue} (${electricity.changeDisplay} YoY)`);
  }
  if (gasoline) {
    dataPoints.push(`Gas: ${gasoline.displayValue} (${gasoline.changeDisplay} YoY)`);
  }

  const prompt = `Write ONE concise sentence (max 20 words) about energy costs in ${stateName}.
Data: ${dataPoints.join(', ')}
Rules: Use ONLY these numbers. No qualifiers. Focus on household impact.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 80, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate energy insight', error);
    return null;
  }
}

/**
 * Generate section-specific insight for employment
 */
async function generateEmploymentInsight(stateData, stateName) {
  const unemployment = stateData.unemployment?.processedData;
  const income = stateData.personal_income?.processedData;
  const gdp = stateData.gdp?.processedData;

  if (!unemployment) return null;

  const dataPoints = [`Unemployment: ${unemployment.displayValue} (${unemployment.changeDisplay} YoY)`];
  if (income) {
    dataPoints.push(`Personal income: ${income.changeDisplay} YoY`);
  }
  if (gdp) {
    dataPoints.push(`State GDP: ${gdp.changeDisplay} YoY`);
  }

  const prompt = `Write ONE concise sentence (max 20 words) about the job market in ${stateName}.
Data: ${dataPoints.join(', ')}
Rules: Use ONLY these numbers. No qualifiers. Focus on what this means for workers.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 80, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate employment insight', error);
    return null;
  }
}

/**
 * Generate section-specific insight for food costs
 */
async function generateFoodInsight(stateData, stateName) {
  const food = stateData.food_prices?.processedData;
  const groceryBasket = stateData.grocery_basket?.processedData;

  if (!food && !groceryBasket) return null;

  const dataPoints = [];
  if (food) {
    dataPoints.push(`Food cost per person: ${food.displayValue} (${food.changeDisplay} YoY)`);
  }
  if (groceryBasket) {
    dataPoints.push(`Grocery basket: ${groceryBasket.displayValue}`);
  }

  const prompt = `Write ONE concise sentence (max 20 words) about food costs in ${stateName}.
Data: ${dataPoints.join(', ')}
Rules: Use ONLY these numbers. No qualifiers. Focus on grocery budget impact.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 80, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate food insight', error);
    return null;
  }
}

/**
 * Generate section-specific insight for economic overview
 */
async function generateEconomicInsight(stateData, stateName) {
  const gdp = stateData.gdp?.processedData;
  const income = stateData.personal_income?.processedData;
  const unemployment = stateData.unemployment?.processedData;

  if (!gdp && !income) return null;

  const dataPoints = [];
  if (gdp) {
    dataPoints.push(`State GDP: ${gdp.displayValue} (${gdp.changeDisplay} YoY)`);
  }
  if (income) {
    dataPoints.push(`Personal income: ${income.displayValue} (${income.changeDisplay} YoY)`);
  }
  if (unemployment) {
    dataPoints.push(`Unemployment: ${unemployment.displayValue}`);
  }

  const prompt = `Write ONE concise sentence (max 20 words) about ${stateName}'s economic health.
Data: ${dataPoints.join(', ')}
Rules: Use ONLY these numbers. No qualifiers. Focus on economic trajectory.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 80, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate economic insight', error);
    return null;
  }
}

/**
 * Generate cross-metric correlation insight
 */
async function generateCrossMetricInsight(stateData, stateName, householdImpact) {
  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;
  const food = stateData.food_prices?.processedData;
  const unemployment = stateData.unemployment?.processedData;
  const income = stateData.personal_income?.processedData;

  const trends = [];
  if (electricity?.change > 0) trends.push(`electricity up ${electricity.changeDisplay}`);
  if (gasoline?.change > 0) trends.push(`gas up ${gasoline.changeDisplay}`);
  if (food?.change > 0) trends.push(`food up ${food.changeDisplay}`);
  if (unemployment?.change > 0) trends.push(`unemployment up to ${unemployment.displayValue}`);
  if (income?.change < 0) trends.push(`income down ${income.changeDisplay}`);

  if (trends.length < 2) return null;

  const impactNote = householdImpact.total !== 0
    ? `Total household impact: ~$${Math.abs(householdImpact.total)}/month ${householdImpact.total > 0 ? 'more' : 'less'}.`
    : '';

  const prompt = `Write ONE sentence (max 25 words) connecting these trends for ${stateName} families:
Trends: ${trends.join(', ')}
${impactNote}
Rules: Show how these factors combine to squeeze or help household budgets. Use ONLY provided data.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 100, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate cross-metric insight', error);
    return null;
  }
}

/**
 * Generate forward-looking projection insight
 */
async function generateForwardLookingInsight(stateData, stateName) {
  // Look at momentum/trend data to project
  const electricity = stateData.electricity_prices;
  const gasoline = stateData.gas_prices;
  const unemployment = stateData.unemployment;

  const trendInfo = [];

  // Check electricity trend
  if (electricity?.timeSeries?.length >= 3) {
    const recent = electricity.timeSeries.slice(-3);
    const isRising = recent[2]?.value > recent[0]?.value;
    if (isRising) trendInfo.push('electricity trending up');
    else trendInfo.push('electricity stabilizing');
  }

  // Check gas trend
  if (gasoline?.timeSeries?.length >= 3) {
    const recent = gasoline.timeSeries.slice(-3);
    const isRising = recent[2]?.value > recent[0]?.value;
    if (isRising) trendInfo.push('fuel prices rising');
    else trendInfo.push('fuel prices easing');
  }

  // Check unemployment trend
  if (unemployment?.timeSeries?.length >= 3) {
    const recent = unemployment.timeSeries.slice(-3);
    const isRising = recent[2]?.value > recent[0]?.value;
    if (isRising) trendInfo.push('unemployment climbing');
    else trendInfo.push('job market steady');
  }

  if (trendInfo.length === 0) return null;

  const currentValues = [];
  if (electricity?.processedData) currentValues.push(`electricity at ${electricity.processedData.displayValue}`);
  if (gasoline?.processedData) currentValues.push(`gas at ${gasoline.processedData.displayValue}`);

  const prompt = `Write ONE forward-looking sentence (max 25 words) for ${stateName} based on trends.
Current: ${currentValues.join(', ')}
Recent trends: ${trendInfo.join(', ')}
Rules: Start with "If trends continue..." Be specific but cautious. Use ONLY provided data.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 100, temperature: 0.4 });
    return {
      text: result?.text || null,
      basedOnTrends: trendInfo
    };
  } catch (error) {
    logger.warn('Failed to generate forward-looking insight', error);
    return null;
  }
}

/**
 * Generate state vs national comparison narrative
 */
async function generateComparisonNarrative(stateData, stateName, nationalAvgs) {
  const comparisons = [];

  const electricity = stateData.electricity_prices?.processedData;
  if (electricity && nationalAvgs.electricity) {
    const stateVal = parseFloat(electricity.value);
    const natVal = parseFloat(nationalAvgs.electricity.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100).toFixed(1);
      comparisons.push(`electricity ${diff > 0 ? diff + '% above' : Math.abs(diff) + '% below'} national average`);
    }
  }

  const gasoline = stateData.gas_prices?.processedData;
  if (gasoline && nationalAvgs.gasoline) {
    const stateVal = parseFloat(gasoline.value);
    const natVal = parseFloat(nationalAvgs.gasoline.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100).toFixed(1);
      comparisons.push(`gas ${diff > 0 ? diff + '% above' : Math.abs(diff) + '% below'} national average`);
    }
  }

  if (comparisons.length === 0) return null;

  const prompt = `Write TWO concise sentences comparing ${stateName} costs to national averages.
Comparisons: ${comparisons.join(', ')}
Rules: Explain what this means for ${stateName} residents vs other Americans. Use ONLY provided data.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 100, temperature: 0.3 });
    return result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate comparison narrative', error);
    return null;
  }
}

/**
 * Master function to generate all AI insights
 * Returns structured aiInsights object
 */
async function generateAIInsights(stateData, stateName, nationalAvgs) {
  try {
    // Calculate household impact first (sync operation)
    const householdImpact = calculateHouseholdImpact(stateData);

    // Generate all insights in parallel for speed
    const [
      energyInsight,
      employmentInsight,
      foodInsight,
      economicInsight,
      crossMetricInsight,
      forwardLookingResult,
      comparisonNarrative
    ] = await Promise.all([
      generateEnergyInsight(stateData, stateName),
      generateEmploymentInsight(stateData, stateName),
      generateFoodInsight(stateData, stateName),
      generateEconomicInsight(stateData, stateName),
      generateCrossMetricInsight(stateData, stateName, householdImpact),
      generateForwardLookingInsight(stateData, stateName),
      generateComparisonNarrative(stateData, stateName, nationalAvgs)
    ]);

    return {
      sections: {
        energy: energyInsight,
        employment: employmentInsight,
        food: foodInsight,
        economic: economicInsight
      },
      crossMetric: {
        text: crossMetricInsight,
        householdImpact
      },
      forwardLooking: forwardLookingResult,
      comparison: {
        text: comparisonNarrative
      }
    };
  } catch (error) {
    logger.error('Error generating AI insights', error);
    return null;
  }
}

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

  // Fuel costs card
  const gasoline = stateData.gas_prices;
  if (gasoline?.processedData) {
    cards.push({
      value: gasoline.processedData.changeDisplay || 'N/A',
      label: 'Fuel Price Trend',
      description: `Gas prices in ${stateName} region: ${gasoline.processedData.displayValue}`,
      isRealData: true,
      source: 'EIA',
      isStale: gasoline.isStale
    });
  }

  // If we don't have 2 cards, try food prices
  if (cards.length < 2) {
    const food = stateData.food_prices;
    if (food?.processedData) {
      cards.push({
        value: food.processedData.changeDisplay || 'N/A',
        label: 'Food Cost Trend',
        description: `Food costs in ${stateName}: ${food.processedData.displayValue}`,
        isRealData: true,
        source: 'USDA',
        isStale: food.isStale
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

  // HUD rent data removed - API access issues

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

  // HUD income_limits and affordability removed - API access issues

  return metrics;
}

/**
 * Build trend data from time series with trend analysis and historical context
 */
function buildTrendData(stateData) {
  const trends = [];

  // HUD rent trend removed - API access issues

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

    // Fetch national averages for AI comparison narrative
    const nationalAvgs = await fetchNationalAverages();

    // Generate AI insights (runs in parallel internally)
    const aiInsights = await generateAIInsights(stateData, stateName, nationalAvgs);

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
      aiInsights,
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
