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
 * Build context string from trend analysis for richer insights
 */
function buildTrendContext(timeSeries, metricType, currentValue) {
  if (!timeSeries || timeSeries.length < 3) return null;

  const analysis = analyzeTrends(timeSeries, metricType, currentValue);
  const history = analyzeHistoricalContext(timeSeries, metricType, currentValue);

  const context = [];

  // Add momentum info
  if (analysis.trendSummary && analysis.trendSummary !== 'Insufficient data') {
    context.push(`Trend: ${analysis.trendSummary}`);
  }

  // Add streak info
  const streakAlert = analysis.alerts?.find(a => a.type === 'streak');
  if (streakAlert) {
    context.push(streakAlert.message);
  }

  // Add historical context
  if (history?.available) {
    if (history.historicalRank?.description) {
      context.push(history.historicalRank.description);
    }
    if (history.percentile && history.percentile.type !== 'typical') {
      context.push(`${history.percentile.percentile}th percentile historically`);
    }
  }

  return context.length > 0 ? context.join('. ') : null;
}

/**
 * Generate section-specific insight for energy costs
 */
async function generateEnergyInsight(stateData, stateName) {
  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;
  const elecTimeSeries = stateData.electricity_prices?.timeSeries;
  const gasTimeSeries = stateData.gas_prices?.timeSeries;

  if (!electricity && !gasoline) return null;

  const dataPoints = [];
  const trendContext = [];

  if (electricity) {
    dataPoints.push(`Electricity: ${electricity.displayValue} (${electricity.changeDisplay} YoY)`);
    const elecContext = buildTrendContext(elecTimeSeries, 'electricity_prices', parseFloat(electricity.value));
    if (elecContext) trendContext.push(`Electricity: ${elecContext}`);
  }
  if (gasoline) {
    dataPoints.push(`Gas: ${gasoline.displayValue} (${gasoline.changeDisplay} YoY)`);
    const gasContext = buildTrendContext(gasTimeSeries, 'gas_prices', parseFloat(gasoline.value));
    if (gasContext) trendContext.push(`Gas: ${gasContext}`);
  }

  // Calculate monthly impact
  let monthlyImpact = 0;
  if (electricity?.change) {
    monthlyImpact += (electricity.change * HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth) / 100;
  }
  if (gasoline?.change) {
    monthlyImpact += gasoline.change * HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth;
  }
  const impactStr = monthlyImpact !== 0 ? `Monthly impact: ~$${Math.abs(Math.round(monthlyImpact))} ${monthlyImpact > 0 ? 'more' : 'savings'}` : '';

  const prompt = `Write 2-3 sentences about energy costs in ${stateName}. Be specific and insightful.

Current Data:
${dataPoints.join('\n')}

Trend Analysis:
${trendContext.join('\n') || 'No significant trends'}

${impactStr}

Guidelines:
- First sentence: Current state with specific numbers
- Second sentence: What the trend means (rising streak, historical high/low, etc.)
- Third sentence (if notable): Impact on household budgets
- Use ONLY the data provided. No speculation.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 150, temperature: 0.3 });
    if (result?.result?.text) return result.result.text;
  } catch (error) {
    logger.warn('Failed to generate energy insight', error);
  }

  // Fallback
  const parts = [];
  if (electricity) {
    parts.push(`Electricity in ${stateName} is ${electricity.displayValue}, ${electricity.change > 0 ? 'up' : 'down'} ${electricity.changeDisplay} from last year.`);
  }
  if (gasoline) {
    parts.push(`Gas prices are at ${gasoline.displayValue}, ${gasoline.change > 0 ? 'an increase' : 'a decrease'} of ${gasoline.changeDisplay}.`);
  }
  if (monthlyImpact !== 0) {
    parts.push(`This means about $${Math.abs(Math.round(monthlyImpact))} ${monthlyImpact > 0 ? 'more' : 'less'} per month for typical households.`);
  }
  return parts.join(' ') || null;
}

/**
 * Generate section-specific insight for employment
 */
async function generateEmploymentInsight(stateData, stateName) {
  const unemployment = stateData.unemployment?.processedData;
  const income = stateData.personal_income?.processedData;
  const gdp = stateData.gdp?.processedData;
  const unempTimeSeries = stateData.unemployment?.timeSeries;

  if (!unemployment) return null;

  const dataPoints = [`Unemployment: ${unemployment.displayValue} (${unemployment.changeDisplay} YoY)`];
  if (income) {
    dataPoints.push(`Personal income: ${income.displayValue} (${income.changeDisplay} YoY)`);
  }
  if (gdp) {
    dataPoints.push(`State GDP: ${gdp.displayValue} (${gdp.changeDisplay} YoY)`);
  }

  // Get trend context for unemployment
  const unempContext = buildTrendContext(unempTimeSeries, 'unemployment', parseFloat(unemployment.value));

  // Check for concerning combinations
  const concerns = [];
  if (unemployment.change > 0 && income?.change < 0) {
    concerns.push('Rising unemployment with falling income');
  }
  if (unemployment.change > 0.5) {
    concerns.push('Significant unemployment increase');
  }
  if (parseFloat(unemployment.value) >= 5) {
    concerns.push('Above 5% unemployment threshold');
  }

  const prompt = `Write 2-3 sentences about the job market and economic health in ${stateName}.

Current Data:
${dataPoints.join('\n')}

Trend Analysis:
${unempContext || 'No significant unemployment trends'}

${concerns.length > 0 ? 'Notable concerns: ' + concerns.join(', ') : ''}

Guidelines:
- First sentence: Current unemployment situation with context
- Second sentence: What the trends suggest for workers
- If income/GDP data available, connect to overall economic picture
- Use ONLY the data provided. Be factual, not alarmist.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 150, temperature: 0.3 });
    if (result?.result?.text) return result.result.text;
  } catch (error) {
    logger.warn('Failed to generate employment insight', error);
  }

  // Fallback
  const parts = [];
  const rate = parseFloat(unemployment.value);
  if (rate < 4) {
    parts.push(`${stateName}'s unemployment rate of ${unemployment.displayValue} indicates a strong job market.`);
  } else if (rate < 5.5) {
    parts.push(`${stateName}'s unemployment rate stands at ${unemployment.displayValue}, near healthy levels.`);
  } else {
    parts.push(`${stateName}'s unemployment rate of ${unemployment.displayValue} suggests job market challenges.`);
  }

  if (unemployment.change !== 0) {
    parts.push(`The rate has ${unemployment.change > 0 ? 'increased' : 'decreased'} ${unemployment.changeDisplay} over the past year.`);
  }

  if (income) {
    parts.push(`Personal income is ${income.change > 0 ? 'up' : 'down'} ${income.changeDisplay}.`);
  }

  return parts.join(' ') || null;
}

/**
 * Generate section-specific insight for food costs
 */
async function generateFoodInsight(stateData, stateName) {
  const food = stateData.food_prices?.processedData;
  const groceryBasket = stateData.grocery_basket?.processedData;
  const foodTimeSeries = stateData.food_prices?.timeSeries;

  if (!food && !groceryBasket) return null;

  const dataPoints = [];
  if (food) {
    dataPoints.push(`Food cost per person: ${food.displayValue} (${food.changeDisplay} YoY)`);
  }
  if (groceryBasket) {
    dataPoints.push(`Grocery basket: ${groceryBasket.displayValue}`);
    // Include national comparison if available
    if (stateData.grocery_basket?.nationalDisplayValue) {
      dataPoints.push(`National average: ${stateData.grocery_basket.nationalDisplayValue}`);
    }
  }

  // Get trend context
  const foodContext = buildTrendContext(foodTimeSeries, 'food_prices', parseFloat(food?.value));

  // Calculate family impact (3-person household)
  let familyImpact = null;
  if (food?.change) {
    familyImpact = Math.round(food.change * HOUSEHOLD_CONSUMPTION.foodPersonsPerFamily);
  }

  const prompt = `Write 2 sentences about food and grocery costs in ${stateName}.

Current Data:
${dataPoints.join('\n')}

${foodContext ? 'Trend: ' + foodContext : ''}
${familyImpact ? `Family impact: ~$${Math.abs(familyImpact)}/month ${familyImpact > 0 ? 'more' : 'savings'} for a family of 3` : ''}

Guidelines:
- First sentence: Current food costs with state vs national context if available
- Second sentence: What this means for family grocery budgets
- Use ONLY the data provided. Be specific with dollar amounts.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 120, temperature: 0.3 });
    if (result?.result?.text) return result.result.text;
  } catch (error) {
    logger.warn('Failed to generate food insight', error);
  }

  // Fallback
  const parts = [];
  if (food) {
    parts.push(`Food costs in ${stateName} average ${food.displayValue} per person monthly, ${food.change > 0 ? 'up' : 'down'} ${food.changeDisplay} from last year.`);
  }
  if (groceryBasket && stateData.grocery_basket?.nationalDisplayValue) {
    const stateVal = parseFloat(groceryBasket.value);
    const natVal = parseFloat(stateData.grocery_basket.nationalDisplayValue.replace(/[^0-9.]/g, ''));
    if (stateVal > natVal) {
      parts.push(`Groceries cost about ${((stateVal - natVal) / natVal * 100).toFixed(0)}% more than the national average.`);
    } else if (stateVal < natVal) {
      parts.push(`Groceries are about ${((natVal - stateVal) / natVal * 100).toFixed(0)}% cheaper than the national average.`);
    }
  }
  if (familyImpact && Math.abs(familyImpact) >= 5) {
    parts.push(`A family of three is spending about $${Math.abs(familyImpact)} ${familyImpact > 0 ? 'more' : 'less'} per month on food.`);
  }
  return parts.join(' ') || null;
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
    return result?.result?.text || null;
  } catch (error) {
    logger.warn('Failed to generate economic insight', error);
    return null;
  }
}

/**
 * Calculate a "squeeze index" - how many cost pressures are combining
 */
function calculateSqueezeIndex(stateData) {
  let pressures = 0;
  let reliefs = 0;
  const details = { pressures: [], reliefs: [] };

  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;
  const food = stateData.food_prices?.processedData;
  const unemployment = stateData.unemployment?.processedData;
  const income = stateData.personal_income?.processedData;

  // Check each metric for pressure or relief
  // Note: changeDisplay already includes the sign (e.g., "+8.6%" or "-13.4%")
  if (electricity?.change > 3) {
    pressures++;
    details.pressures.push(`electricity ${electricity.changeDisplay}`);
  } else if (electricity?.change < -3) {
    reliefs++;
    details.reliefs.push(`electricity ${electricity.changeDisplay}`);
  }

  if (gasoline?.change > 0.10) {
    pressures++;
    details.pressures.push(`gas ${gasoline.changeDisplay}`);
  } else if (gasoline?.change < -0.10) {
    reliefs++;
    details.reliefs.push(`gas ${gasoline.changeDisplay}`);
  }

  if (food?.change > 5) {
    pressures++;
    details.pressures.push(`food ${food.changeDisplay}`);
  } else if (food?.change < -5) {
    reliefs++;
    details.reliefs.push(`food ${food.changeDisplay}`);
  }

  if (unemployment?.change > 0.3) {
    pressures++;
    details.pressures.push(`unemployment ${unemployment.changeDisplay}`);
  } else if (unemployment?.change < -0.3) {
    reliefs++;
    details.reliefs.push(`unemployment ${unemployment.changeDisplay}`);
  }

  if (income?.change < 0) {
    pressures++;
    details.pressures.push(`income ${income.changeDisplay}`);
  } else if (income?.change > 2) {
    reliefs++;
    details.reliefs.push(`income ${income.changeDisplay}`);
  }

  // Determine overall status
  let status = 'stable';
  if (pressures >= 3) status = 'high_squeeze';
  else if (pressures >= 2 && reliefs === 0) status = 'moderate_squeeze';
  else if (pressures > reliefs) status = 'mild_squeeze';
  else if (reliefs > pressures) status = 'relief';
  else if (reliefs >= 2) status = 'significant_relief';

  return { pressures, reliefs, status, details };
}

/**
 * Generate cross-metric correlation insight with squeeze analysis
 */
async function generateCrossMetricInsight(stateData, stateName, householdImpact) {
  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;
  const food = stateData.food_prices?.processedData;
  const unemployment = stateData.unemployment?.processedData;
  const income = stateData.personal_income?.processedData;

  // Calculate squeeze index
  const squeeze = calculateSqueezeIndex(stateData);

  // Build comprehensive data picture
  const allMetrics = [];
  if (electricity) allMetrics.push(`Electricity: ${electricity.displayValue} (${electricity.changeDisplay} YoY)`);
  if (gasoline) allMetrics.push(`Gas: ${gasoline.displayValue} (${gasoline.changeDisplay} YoY)`);
  if (food) allMetrics.push(`Food: ${food.displayValue} (${food.changeDisplay} YoY)`);
  if (unemployment) allMetrics.push(`Unemployment: ${unemployment.displayValue} (${unemployment.changeDisplay} YoY)`);
  if (income) allMetrics.push(`Personal Income: ${income.displayValue} (${income.changeDisplay} YoY)`);

  if (allMetrics.length < 2) return null;

  // Build squeeze description
  let squeezeDesc = '';
  if (squeeze.status === 'high_squeeze') {
    squeezeDesc = `HIGH PRESSURE: ${squeeze.pressures} cost categories rising simultaneously`;
  } else if (squeeze.status === 'moderate_squeeze') {
    squeezeDesc = `MODERATE PRESSURE: ${squeeze.pressures} costs rising with no offsets`;
  } else if (squeeze.status === 'mild_squeeze') {
    squeezeDesc = `MILD PRESSURE: Some costs rising (${squeeze.pressures}) vs falling (${squeeze.reliefs})`;
  } else if (squeeze.status === 'relief' || squeeze.status === 'significant_relief') {
    squeezeDesc = `RELIEF: More costs falling (${squeeze.reliefs}) than rising (${squeeze.pressures})`;
  } else {
    squeezeDesc = 'STABLE: Costs relatively balanced';
  }

  const impactNote = householdImpact.total !== 0
    ? `Net monthly impact: ${householdImpact.total > 0 ? '+' : ''}$${householdImpact.total}/month for typical household`
    : '';

  const prompt = `Write 3-4 sentences analyzing how multiple economic factors combine to affect ${stateName} households.

Current Metrics:
${allMetrics.join('\n')}

Squeeze Analysis: ${squeezeDesc}
${squeeze.details.pressures.length > 0 ? 'Rising costs: ' + squeeze.details.pressures.join(', ') : ''}
${squeeze.details.reliefs.length > 0 ? 'Falling costs: ' + squeeze.details.reliefs.join(', ') : ''}

${impactNote}

${householdImpact.breakdown?.length > 0 ? 'Breakdown: ' + householdImpact.breakdown.map(b => `${b.category}: ${b.amount > 0 ? '+' : ''}$${b.amount}`).join(', ') : ''}

Guidelines:
- First sentence: Summarize the overall situation (squeeze or relief)
- Second sentence: Explain how specific factors combine (e.g., "Rising energy + stagnant wages = household squeeze")
- Third sentence: Quantify the total monthly impact on a typical household
- If there are offsetting factors, mention what's providing relief
- Be specific with numbers. Use phrases like "the combined effect" or "when taken together".`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 200, temperature: 0.3 });
    if (result?.result?.text) return result.result.text;
  } catch (error) {
    logger.warn('Failed to generate cross-metric insight', error);
  }

  // Fallback cross-metric narrative
  const parts = [];

  if (squeeze.status === 'high_squeeze') {
    parts.push(`${stateName} households face pressure from multiple directions with ${squeeze.pressures} cost categories rising.`);
  } else if (squeeze.status === 'moderate_squeeze') {
    parts.push(`${stateName} residents are seeing some cost increases without offsetting relief.`);
  } else if (squeeze.status === 'relief' || squeeze.status === 'significant_relief') {
    parts.push(`${stateName} households are catching a break with ${squeeze.reliefs} cost categories declining.`);
  } else {
    parts.push(`${stateName}'s cost picture is mixed with some prices rising and others falling.`);
  }

  if (squeeze.details.pressures.length > 0 && squeeze.details.reliefs.length > 0) {
    parts.push(`Rising costs in ${squeeze.details.pressures.join(' and ')} are partially offset by savings in ${squeeze.details.reliefs.join(' and ')}.`);
  } else if (squeeze.details.pressures.length > 0) {
    parts.push(`The main pressures come from ${squeeze.details.pressures.join(' and ')}.`);
  } else if (squeeze.details.reliefs.length > 0) {
    parts.push(`Relief is coming from ${squeeze.details.reliefs.join(' and ')}.`);
  }

  if (householdImpact.total !== 0) {
    parts.push(`The combined effect is approximately ${householdImpact.total > 0 ? '+' : ''}$${householdImpact.total} per month for a typical household.`);
  }

  return parts.join(' ') || null;
}

/**
 * Generate forward-looking projection insight with richer trend analysis
 */
async function generateForwardLookingInsight(stateData, stateName) {
  const electricity = stateData.electricity_prices;
  const gasoline = stateData.gas_prices;
  const unemployment = stateData.unemployment;
  const food = stateData.food_prices;

  const trendAnalysis = [];
  const projections = [];

  // Analyze electricity trend with momentum
  if (electricity?.timeSeries?.length >= 6) {
    const analysis = analyzeTrends(electricity.timeSeries, 'electricity_prices', parseFloat(electricity.processedData?.value));
    const recent = electricity.timeSeries.slice(-3);
    const recentChange = recent[2]?.value - recent[0]?.value;

    if (analysis.momentum === 'steady_up' || analysis.momentum === 'up') {
      trendAnalysis.push({ metric: 'electricity', direction: 'rising', momentum: analysis.momentum });
      if (recentChange > 0) {
        const monthlyProjection = Math.round((recentChange / 3) * 6 * HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth / 100);
        if (monthlyProjection > 5) projections.push(`electricity could add ~$${monthlyProjection} more over 6 months`);
      }
    } else if (analysis.momentum === 'steady_down' || analysis.momentum === 'down') {
      trendAnalysis.push({ metric: 'electricity', direction: 'falling', momentum: analysis.momentum });
    } else {
      trendAnalysis.push({ metric: 'electricity', direction: 'stable', momentum: analysis.momentum });
    }
  }

  // Analyze gas trend
  if (gasoline?.timeSeries?.length >= 6) {
    const analysis = analyzeTrends(gasoline.timeSeries, 'gas_prices', parseFloat(gasoline.processedData?.value));
    const recent = gasoline.timeSeries.slice(-3);
    const recentChange = recent[2]?.value - recent[0]?.value;

    if (analysis.momentum === 'steady_up' || analysis.momentum === 'up') {
      trendAnalysis.push({ metric: 'fuel', direction: 'rising', momentum: analysis.momentum });
      if (recentChange > 0) {
        const monthlyProjection = Math.round((recentChange / 3) * 6 * HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth);
        if (monthlyProjection > 10) projections.push(`fuel could add ~$${monthlyProjection} more over 6 months`);
      }
    } else if (analysis.momentum === 'steady_down' || analysis.momentum === 'down') {
      trendAnalysis.push({ metric: 'fuel', direction: 'falling', momentum: analysis.momentum });
    } else {
      trendAnalysis.push({ metric: 'fuel', direction: 'stable', momentum: analysis.momentum });
    }
  }

  // Analyze unemployment trend
  if (unemployment?.timeSeries?.length >= 6) {
    const analysis = analyzeTrends(unemployment.timeSeries, 'unemployment', parseFloat(unemployment.processedData?.value));
    if (analysis.momentum === 'steady_up' || analysis.momentum === 'up') {
      trendAnalysis.push({ metric: 'unemployment', direction: 'rising', momentum: analysis.momentum });
    } else if (analysis.momentum === 'steady_down' || analysis.momentum === 'down') {
      trendAnalysis.push({ metric: 'unemployment', direction: 'falling', momentum: analysis.momentum });
    }
  }

  if (trendAnalysis.length === 0) return null;

  // Build summary
  const rising = trendAnalysis.filter(t => t.direction === 'rising').map(t => t.metric);
  const falling = trendAnalysis.filter(t => t.direction === 'falling').map(t => t.metric);
  const stable = trendAnalysis.filter(t => t.direction === 'stable').map(t => t.metric);

  const currentValues = [];
  if (electricity?.processedData) currentValues.push(`Electricity: ${electricity.processedData.displayValue}`);
  if (gasoline?.processedData) currentValues.push(`Gas: ${gasoline.processedData.displayValue}`);
  if (unemployment?.processedData) currentValues.push(`Unemployment: ${unemployment.processedData.displayValue}`);

  const prompt = `Write 2-3 forward-looking sentences for ${stateName} based on current trends.

Current Values:
${currentValues.join('\n')}

Trend Direction:
${rising.length > 0 ? '- Rising: ' + rising.join(', ') : ''}
${falling.length > 0 ? '- Falling: ' + falling.join(', ') : ''}
${stable.length > 0 ? '- Stable: ' + stable.join(', ') : ''}

${projections.length > 0 ? 'Projected impact if trends continue:\n' + projections.join('\n') : ''}

Guidelines:
- Start with "If current trends continue..." or "Based on recent momentum..."
- Be specific about which metrics are driving the outlook
- Include projected dollar impact if available
- Use hedging language ("could", "may", "likely to")
- Do NOT make predictions beyond 6 months
- Use ONLY the data provided.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 150, temperature: 0.4 });
    return {
      text: result?.result?.text || null,
      basedOnTrends: [...rising.map(r => `${r} rising`), ...falling.map(f => `${f} falling`), ...stable.map(s => `${s} stable`)],
      projections
    };
  } catch (error) {
    logger.warn('Failed to generate forward-looking insight', error);
    return null;
  }
}

/**
 * Generate state vs national comparison narrative with dollar impact
 */
async function generateComparisonNarrative(stateData, stateName, nationalAvgs) {
  const comparisons = [];
  const dollarImpacts = [];

  const electricity = stateData.electricity_prices?.processedData;
  if (electricity && nationalAvgs.electricity) {
    const stateVal = parseFloat(electricity.value);
    const natVal = parseFloat(nationalAvgs.electricity.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100);
      const direction = diff > 0 ? 'above' : 'below';
      comparisons.push({
        metric: 'electricity',
        stateValue: electricity.displayValue,
        nationalValue: nationalAvgs.electricity.displayValue,
        diff: Math.abs(diff).toFixed(1),
        direction
      });

      // Calculate monthly dollar difference
      const centsDiff = stateVal - natVal;
      const monthlyDiff = Math.round((centsDiff * HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth) / 100);
      if (Math.abs(monthlyDiff) >= 5) {
        const sign = monthlyDiff > 0 ? '+' : '-';
        dollarImpacts.push(`Electricity: ${sign}$${Math.abs(monthlyDiff)}/month vs national average`);
      }
    }
  }

  const gasoline = stateData.gas_prices?.processedData;
  if (gasoline && nationalAvgs.gasoline) {
    const stateVal = parseFloat(gasoline.value);
    const natVal = parseFloat(nationalAvgs.gasoline.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100);
      const direction = diff > 0 ? 'above' : 'below';
      comparisons.push({
        metric: 'gas',
        stateValue: gasoline.displayValue,
        nationalValue: nationalAvgs.gasoline.displayValue,
        diff: Math.abs(diff).toFixed(1),
        direction
      });

      // Calculate monthly dollar difference
      const dollarDiff = stateVal - natVal;
      const monthlyDiff = Math.round(dollarDiff * HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth);
      if (Math.abs(monthlyDiff) >= 5) {
        const sign = monthlyDiff > 0 ? '+' : '-';
        dollarImpacts.push(`Fuel: ${sign}$${Math.abs(monthlyDiff)}/month vs national average`);
      }
    }
  }

  // Add grocery basket comparison if available
  const groceryBasket = stateData.grocery_basket;
  if (groceryBasket?.processedData && groceryBasket?.nationalDisplayValue) {
    const stateVal = parseFloat(groceryBasket.processedData.value);
    const natVal = parseFloat(groceryBasket.nationalDisplayValue.replace(/[^0-9.]/g, ''));
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100);
      comparisons.push({
        metric: 'groceries',
        stateValue: groceryBasket.processedData.displayValue,
        nationalValue: groceryBasket.nationalDisplayValue,
        diff: Math.abs(diff).toFixed(1),
        direction: diff > 0 ? 'above' : 'below'
      });
    }
  }

  if (comparisons.length === 0) return null;

  // Determine overall standing
  const aboveCount = comparisons.filter(c => c.direction === 'above').length;
  const belowCount = comparisons.filter(c => c.direction === 'below').length;
  let overallStanding = 'mixed';
  if (aboveCount > belowCount) overallStanding = 'more expensive';
  else if (belowCount > aboveCount) overallStanding = 'more affordable';

  const comparisonText = comparisons.map(c =>
    `${c.metric}: ${c.stateValue} (${c.diff}% ${c.direction} national ${c.nationalValue})`
  ).join('\n');

  const prompt = `Write 2-3 sentences comparing ${stateName}'s cost of living to national averages.

Comparisons:
${comparisonText}

${dollarImpacts.length > 0 ? 'Monthly dollar impact vs national:\n' + dollarImpacts.join('\n') : ''}

Overall: ${stateName} is ${overallStanding} than national average

Guidelines:
- First sentence: Overall positioning (more/less expensive than average)
- Second sentence: Specific comparisons with percentages and dollar amounts
- If there's a mix, highlight both advantages and disadvantages
- Help residents understand if they're getting a good deal or paying a premium
- Use ONLY the data provided.`;

  try {
    const result = await executeMCPTool('generate_text', { prompt, max_tokens: 150, temperature: 0.3 });
    if (result?.result?.text) {
      return result.result.text;
    }
  } catch (error) {
    logger.warn('Failed to generate comparison narrative', error);
  }

  // Fallback: Generate a readable comparison text without LLM
  return generateFallbackComparisonNarrative(comparisons, dollarImpacts, stateName, overallStanding);
}

/**
 * Generate fallback comparison narrative when LLM is unavailable
 */
function generateFallbackComparisonNarrative(comparisons, dollarImpacts, stateName, overallStanding) {
  if (comparisons.length === 0) {
    return `${stateName}'s costs are generally in line with national averages across tracked categories.`;
  }

  const parts = [];

  // Opening based on overall standing
  if (overallStanding === 'more expensive') {
    parts.push(`${stateName} tends to be more expensive than the national average.`);
  } else if (overallStanding === 'more affordable') {
    parts.push(`${stateName} offers more affordable costs compared to the national average.`);
  } else {
    parts.push(`${stateName} shows a mix of costs compared to national averages.`);
  }

  // Add specific comparisons
  const above = comparisons.filter(c => c.direction === 'above');
  const below = comparisons.filter(c => c.direction === 'below');

  if (above.length > 0) {
    const aboveList = above.map(c => `${c.metric} (${c.diff}% higher)`).join(', ');
    parts.push(`Higher costs: ${aboveList}.`);
  }

  if (below.length > 0) {
    const belowList = below.map(c => `${c.metric} (${c.diff}% lower)`).join(', ');
    parts.push(`Lower costs: ${belowList}.`);
  }

  // Add dollar impact if available
  if (dollarImpacts.length > 0) {
    parts.push(`This translates to ${dollarImpacts.join(' and ').toLowerCase()}.`);
  }

  return parts.join(' ');
}

/**
 * Master function to generate all AI insights
 * Returns structured aiInsights object
 */
async function generateAIInsights(stateData, stateName, nationalAvgs) {
  try {
    // Calculate household impact first (sync operation)
    const householdImpact = calculateHouseholdImpact(stateData);

    // Calculate squeeze index for overall pressure assessment
    const squeezeIndex = calculateSqueezeIndex(stateData);

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
        householdImpact,
        squeezeIndex: {
          status: squeezeIndex.status,
          pressures: squeezeIndex.pressures,
          reliefs: squeezeIndex.reliefs,
          details: squeezeIndex.details
        }
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
  // Build a comprehensive summary of available real data with trends
  const dataSummary = [];
  const trendSummary = [];

  if (stateData.unemployment?.processedData) {
    const unemp = stateData.unemployment.processedData;
    dataSummary.push(`Unemployment: ${unemp.displayValue} (${unemp.changeDisplay} YoY)`);
    if (stateData.unemployment.timeSeries?.length >= 3) {
      const analysis = analyzeTrends(stateData.unemployment.timeSeries, 'unemployment', parseFloat(unemp.value));
      if (analysis.trendSummary !== 'Insufficient data') {
        trendSummary.push(`Unemployment: ${analysis.trendSummary}`);
      }
    }
  }
  if (stateData.electricity_prices?.processedData) {
    const elec = stateData.electricity_prices.processedData;
    dataSummary.push(`Electricity: ${elec.displayValue} (${elec.changeDisplay} YoY)`);
  }
  if (stateData.gas_prices?.processedData) {
    const gas = stateData.gas_prices.processedData;
    dataSummary.push(`Gas: ${gas.displayValue} (${gas.changeDisplay} YoY)`);
  }
  if (stateData.food_prices?.processedData) {
    const food = stateData.food_prices.processedData;
    dataSummary.push(`Food: ${food.displayValue} (${food.changeDisplay} YoY)`);
  }

  // Calculate squeeze index for overview
  const squeeze = calculateSqueezeIndex(stateData);
  const householdImpact = calculateHouseholdImpact(stateData);

  // If we have data, try to generate a narrative
  if (dataSummary.length > 0) {
    let squeezeContext = '';
    if (squeeze.status === 'high_squeeze') {
      squeezeContext = `Overall pressure: HIGH - ${squeeze.pressures} cost categories rising`;
    } else if (squeeze.status === 'moderate_squeeze') {
      squeezeContext = `Overall pressure: MODERATE - costs rising with no relief`;
    } else if (squeeze.status === 'relief' || squeeze.status === 'significant_relief') {
      squeezeContext = `Overall pressure: LOW - more costs falling than rising`;
    }

    const impactContext = householdImpact.total !== 0
      ? `Net household impact: ${householdImpact.total > 0 ? '+' : ''}$${householdImpact.total}/month`
      : '';

    const prompt = `Write a 2-3 sentence executive summary of ${stateName}'s economic situation for residents.

Current Data:
${dataSummary.join('\n')}

${trendSummary.length > 0 ? 'Trends:\n' + trendSummary.join('\n') : ''}

${squeezeContext}
${impactContext}

Recent headlines: ${newsHeadlines.slice(0, 3).join('; ') || 'None available'}

Guidelines:
- First sentence: Characterize the overall economic situation (mixed signals, strong, challenging, etc.)
- Second sentence: Highlight the most significant metric or trend
- Third sentence: Summarize what this means for household budgets
- Use specific numbers from the data provided
- Be balanced - mention both pressures and reliefs if present
- Do NOT invent any numbers - only reference the data provided above.`;

    try {
      const result = await executeMCPTool('generate_text', { prompt, max_tokens: 200, temperature: 0.3 });
      if (result?.result?.text) {
        return result.result.text;
      }
    } catch (error) {
      logger.warn('Failed to generate narrative overview', error);
    }
  }

  // Fallback to a narrative-style statement based on squeeze analysis
  if (dataSummary.length > 0) {
    return generateFallbackOverview(stateData, stateName, squeeze, householdImpact);
  }

  return `Economic indicators for ${stateName} are being collected from government sources.`;
}

/**
 * Generate a readable fallback overview when LLM is unavailable
 */
function generateFallbackOverview(stateData, stateName, squeeze, householdImpact) {
  const parts = [];

  // Opening sentence based on squeeze status
  if (squeeze.status === 'high_squeeze') {
    parts.push(`${stateName} residents are facing significant cost pressures across multiple categories.`);
  } else if (squeeze.status === 'moderate_squeeze') {
    parts.push(`${stateName}'s economy shows some cost pressures for households.`);
  } else if (squeeze.status === 'relief' || squeeze.status === 'significant_relief') {
    parts.push(`${stateName} residents are seeing some relief in household costs.`);
  } else {
    parts.push(`${stateName}'s economy shows mixed signals for household budgets.`);
  }

  // Highlight key metrics
  const highlights = [];
  const electricity = stateData.electricity_prices?.processedData;
  const gasoline = stateData.gas_prices?.processedData;
  const unemployment = stateData.unemployment?.processedData;
  const food = stateData.food_prices?.processedData;

  if (electricity?.change) {
    const direction = electricity.change > 0 ? 'risen' : 'fallen';
    highlights.push(`electricity has ${direction} ${electricity.changeDisplay}`);
  }
  if (gasoline?.change) {
    const direction = gasoline.change > 0 ? 'up' : 'down';
    highlights.push(`gas prices are ${direction} ${gasoline.changeDisplay}`);
  }
  if (unemployment) {
    highlights.push(`unemployment stands at ${unemployment.displayValue}`);
  }

  if (highlights.length > 0) {
    parts.push(`Key indicators show ${highlights.slice(0, 3).join(', ')}.`);
  }

  // Impact statement
  if (householdImpact.total !== 0) {
    if (householdImpact.total > 0) {
      parts.push(`Combined, these changes add approximately $${householdImpact.total} per month to typical household expenses.`);
    } else {
      parts.push(`On balance, households are seeing savings of approximately $${Math.abs(householdImpact.total)} per month.`);
    }
  }

  return parts.join(' ');
}

/**
 * Generate fallback comparison text when LLM is unavailable
 */
function generateFallbackComparisonText(stateData, stateName, nationalAvgs) {
  const comparisons = [];

  const electricity = stateData.electricity_prices?.processedData;
  if (electricity && nationalAvgs.electricity) {
    const stateVal = parseFloat(electricity.value);
    const natVal = parseFloat(nationalAvgs.electricity.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100);
      if (Math.abs(diff) >= 5) {
        const direction = diff > 0 ? 'higher' : 'lower';
        const monthlyDiff = Math.round(Math.abs((stateVal - natVal) * HOUSEHOLD_CONSUMPTION.electricityKwhPerMonth / 100));
        comparisons.push({
          metric: 'electricity',
          direction,
          percent: Math.abs(diff).toFixed(0),
          monthly: monthlyDiff
        });
      }
    }
  }

  const gasoline = stateData.gas_prices?.processedData;
  if (gasoline && nationalAvgs.gasoline) {
    const stateVal = parseFloat(gasoline.value);
    const natVal = parseFloat(nationalAvgs.gasoline.value);
    if (stateVal && natVal) {
      const diff = ((stateVal - natVal) / natVal * 100);
      if (Math.abs(diff) >= 5) {
        const direction = diff > 0 ? 'higher' : 'lower';
        const monthlyDiff = Math.round(Math.abs((stateVal - natVal) * HOUSEHOLD_CONSUMPTION.gasolineGallonsPerMonth));
        comparisons.push({
          metric: 'fuel',
          direction,
          percent: Math.abs(diff).toFixed(0),
          monthly: monthlyDiff
        });
      }
    }
  }

  if (comparisons.length === 0) {
    return `${stateName}'s costs are generally in line with national averages.`;
  }

  const parts = [];

  // Count higher vs lower
  const higher = comparisons.filter(c => c.direction === 'higher');
  const lower = comparisons.filter(c => c.direction === 'lower');

  if (higher.length > lower.length) {
    parts.push(`${stateName} residents pay more than the national average for most tracked expenses.`);
  } else if (lower.length > higher.length) {
    parts.push(`${stateName} offers lower costs than the national average in key categories.`);
  } else {
    parts.push(`${stateName} shows a mix of costs compared to national averages.`);
  }

  // Add specifics
  const specifics = comparisons.map(c => {
    return `${c.metric} is ${c.percent}% ${c.direction} (about $${c.monthly}/month difference)`;
  });

  if (specifics.length > 0) {
    parts.push(`Specifically, ${specifics.join(' and ')}.`);
  }

  return parts.join(' ');
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
