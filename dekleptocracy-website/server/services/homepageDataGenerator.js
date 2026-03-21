/**
 * Homepage Data Generator
 * Uses MCP server's intelligent chat to generate wallet shocks, cost drivers, and stats
 */

import WalletShock from '../models/WalletShock.js';
import logger from '../utils/logger.js';

/**
 * Call MCP intelligent chat endpoint
 * @param {string} prompt - The prompt to send
 * @param {string} conversationId - Optional conversation ID
 * @returns {Promise<string>} LLM response
 */
async function callIntelligentChat(prompt, _conversationId = null) {
  try {
    const mcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:8000';
    logger.info(`Calling MCP server at: ${mcpUrl}`);
    const response = await fetch(`${mcpUrl}/chat/intelligent/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.content || data.response || data.message || '';

  } catch (error) {
    logger.error('Error calling MCP intelligent chat', error, { prompt: prompt.substring(0, 100) });
    throw error;
  }
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 * @param {string} response - LLM response text
 * @returns {object|null} Parsed JSON object
 */
function extractJSON(response) {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch (e) {
    // Try to extract from markdown code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                     response.match(/```\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        logger.warn('Failed to parse JSON from code block', e2);
      }
    }

    // Try to find JSON object in text
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (e3) {
        logger.warn('Failed to parse JSON object from text', e3);
      }
    }

    return null;
  }
}

/**
 * Generate chart path from data points (simple SVG path for sparkline)
 * @param {array} values - Array of numbers
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
 * Generate 6-month historical chart data
 * @param {number} currentValue - Current value
 * @param {number} changePercent - Percent change
 * @returns {array} Array of {date, value} objects
 */
function generateChartData(currentValue, changePercent) {
  const data = [];
  const now = new Date();

  // Calculate starting value 6 months ago
  const startValue = currentValue / (1 + changePercent / 100);

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Linear interpolation with some randomness
    const progress = (5 - i) / 5;
    const value = startValue + (currentValue - startValue) * progress;
    const variance = value * 0.05 * (Math.random() - 0.5); // ±5% variance

    data.push({
      date: date.toISOString(),
      value: parseFloat((value + variance).toFixed(2))
    });
  }

  return data;
}

/**
 * Generate wallet shock for a specific category and state
 * @param {string} category - Category (groceries, fuel, utilities, tech)
 * @param {string} state - State name
 * @returns {Promise<object>} Wallet shock data
 */
export async function generateWalletShock(category, state) {
  logger.info(`Generating wallet shock for ${category} in ${state}`);

  const categoryConfig = {
    groceries: { icon: '🥚', iconBg: '#fef3c7', color: '#ef4444', item: 'eggs', unit: 'per dozen' },
    fuel: { icon: '⛽', iconBg: '#fef3c7', color: '#ef4444', item: 'gas', unit: 'per gallon' },
    utilities: { icon: '💡', iconBg: '#dbeafe', color: '#3b82f6', item: 'electricity', unit: 'per kWh' },
    tech: { icon: '📱', iconBg: '#e0e7ff', color: '#6366f1', item: 'iPhone', unit: 'base model' }
  };

  const config = categoryConfig[category] || categoryConfig.groceries;

  const prompt = `
You are a data analyst specializing in consumer prices and tariff impacts.

Task: Analyze current ${config.item} prices in ${state} and generate a wallet shock entry.

Use your available tools to:
1. Search recent news about ${config.item} prices in ${state}
2. Check relevant trade data and tariff information
3. Analyze price trends

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "A compelling 1-sentence headline about the price change (max 150 chars)",
  "price": "$X.XX",
  "change": "+X.X%" or "-X.X%",
  "changePercent": X.X (positive or negative number),
  "reasoning": "1-2 sentence explanation of what's driving the change"
}

Example for eggs in California:
{
  "title": "Egg prices hit $6.50 in California, up 12.3% from last year due to avian flu and tariffs",
  "price": "$6.50",
  "change": "+12.3%",
  "changePercent": 12.3,
  "reasoning": "Combination of avian flu outbreaks reducing supply and new tariffs on imported feed ingredients driving costs higher."
}

Provide current, realistic data for ${config.item} in ${state}.
`;

  try {
    const response = await callIntelligentChat(prompt);
    const data = extractJSON(response);

    if (!data || !data.price || !data.title) {
      throw new Error('Invalid response format from LLM');
    }

    // Parse price to get numeric value
    const priceValue = parseFloat(data.price.replace(/[^0-9.]/g, ''));

    // Generate chart data
    const chartData = generateChartData(priceValue, data.changePercent);
    const chartPath = generateChartPath(chartData.map(d => d.value));

    // Build wallet shock object
    const walletShock = {
      category,
      icon: config.icon,
      iconBg: config.iconBg,
      title: data.title.substring(0, 200), // Max 200 chars
      price: data.price,
      unit: config.unit,
      change: data.change,
      changePercent: data.changePercent,
      chartColor: config.color,
      chartPath,
      chartData,
      state,
      source: 'MCP Intelligent Analysis',
      dataDate: new Date(),
      reactions: { shock: 0, angry: 0, sad: 0 },
      featured: false,
      status: 'published'
    };

    logger.info(`Successfully generated wallet shock for ${category} in ${state}`);
    return walletShock;

  } catch (error) {
    logger.error(`Failed to generate wallet shock for ${category} in ${state}`, error);
    throw error;
  }
}

/**
 * Generate wallet shocks for multiple states
 * @param {array} states - Array of state names
 * @param {array} categories - Array of categories (default: all)
 * @returns {Promise<array>} Array of generated wallet shocks
 */
export async function generateWalletShocks(states = ['California'], categories = ['groceries', 'fuel', 'utilities', 'tech']) {
  const results = [];

  for (const state of states) {
    for (const category of categories) {
      try {
        const shock = await generateWalletShock(category, state);

        // Upsert to database (update if exists, create if not)
        await WalletShock.findOneAndUpdate(
          { state, category, status: 'published' },
          shock,
          { upsert: true, new: true }
        );

        results.push(shock);
        logger.info(`✅ Saved wallet shock: ${category} in ${state}`);

        // Rate limit: wait 2 seconds between requests to avoid overwhelming MCP server
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        logger.error(`Failed to generate/save wallet shock for ${category} in ${state}`, error);
        results.push({ error: error.message, category, state });
      }
    }
  }

  return results;
}

/**
 * Generate homepage data for specified states
 * @param {object} options - Generation options
 * @returns {Promise<object>} Generation results
 */
export async function generateHomepageData(options = {}) {
  const {
    states = ['California', 'Texas'],
    skipWalletShocks = false,
    skipCostDrivers: _skipCostDrivers = true, // Skip for now, implement later
    skipStats: _skipStats = true // Skip for now, implement later
  } = options;

  logger.info('🚀 Starting homepage data generation', { states, options });

  const results = {
    walletShocks: [],
    costDrivers: [],
    stats: [],
    errors: []
  };

  // Generate wallet shocks
  if (!skipWalletShocks) {
    try {
      results.walletShocks = await generateWalletShocks(states);
      logger.info(`✅ Generated ${results.walletShocks.length} wallet shocks`);
    } catch (error) {
      logger.error('Error generating wallet shocks', error);
      results.errors.push({ type: 'walletShocks', error: error.message });
    }
  }

  // TODO: Implement cost drivers generation
  // TODO: Implement stats generation

  logger.info('✅ Homepage data generation complete', {
    walletShocks: results.walletShocks.length,
    costDrivers: results.costDrivers.length,
    stats: results.stats.length,
    errors: results.errors.length
  });

  return results;
}

export default {
  generateWalletShock,
  generateWalletShocks,
  generateHomepageData
};
