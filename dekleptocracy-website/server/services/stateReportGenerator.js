import logger from '../utils/logger.js';
import { fetchNews, checkMCPHealth } from './mcpClient.js';

// Reusable fallback template aligned with the existing StateReport UI
export function getFallbackStateReport(stateName = 'California', role = 'VOTER', name = 'California Resident') {
  return {
    name,
    stateName,
    role,
    overviewTitle: 'State Impact Overview',
    overviewStatement: 'Lobbyists and corporations profit while working families and schools lose',
    comparisonCards: [
      {
        value: '+68%',
        label: 'Energy Costs Rising',
        description: 'Our electricity and gas bills increased by 68% since tariffs, directly impacting household budgets'
      },
      {
        value: '-$2,847',
        label: 'Per-Student School Funding Cut',
        description: 'Local schools lost $2,847 per student while Washington lobbyists gained $9.2M in your state'
      }
    ],
    keyMetrics: [
      { title: 'Average Monthly Rent Increase', value: '+$340', change: '▲ 18% since 2022', color: '#FF6B5A' },
      { title: 'Green Jobs Created (IRA)', value: '1,200', change: '▲ +450 this quarter', color: '#FF6B5A' },
      { title: 'Residents Still Uninsured', value: '12%', change: '▲ Down from 15%', color: '#FF6B5A' },
      { title: 'DACA Recipients Protected', value: '4,847', change: '▲ +340 this month', color: '#FF6B5A' },
    ],
    trendData: [
      {
        title: 'Monthly Average Rent',
        currentValue: '$1,200',
        data: [
          { month: 'Jan', value: 800, color: '#4A5D3F' },
          { month: 'Feb', value: 850, color: '#4A5D3F' },
          { month: 'March', value: 900, color: '#4A5D3F' },
          { month: 'April', value: 950, color: '#FF6B5A' },
          { month: 'June', value: 1200, color: '#FF6B5A' },
        ],
      },
      {
        title: 'Fuel Prices Over Time',
        currentValue: '$1,200',
        data: [
          { month: 'Jan', value: 600, color: '#4A5D3F' },
          { month: 'Feb', value: 650, color: '#4A5D3F' },
          { month: 'March', value: 700, color: '#4A5D3F' },
          { month: 'April', value: 800, color: '#FF6B5A' },
          { month: 'June', value: 1200, color: '#FF6B5A' },
        ],
      },
      {
        title: 'Grocery Basket Trend',
        currentValue: '$1,200',
        data: [
          { month: 'Jan', value: 700, color: '#4A5D3F' },
          { month: 'Feb', value: 750, color: '#4A5D3F' },
          { month: 'March', value: 800, color: '#4A5D3F' },
          { month: 'April', value: 900, color: '#FF6B5A' },
          { month: 'June', value: 1200, color: '#FF6B5A' },
        ],
      },
    ],
    comparisonData: [
      { category: 'Grocery basket', change: '+4% higher', stateValue: '$412', nationalValue: '$395' },
      { category: 'Fuel Price', change: '+3.8% higher', stateValue: '$3.84', nationalValue: '$3.70' },
      { category: 'Electricity Bill', change: '+69% higher', stateValue: '$282', nationalValue: '$167' },
      { category: 'Books & Printing', change: '+12% higher', stateValue: '$4.6', nationalValue: '$4.1' },
    ],
  };
}

function buildStateReportPrompt(stateName, role, name, newsHeadlines = []) {
  const headlinesSection = newsHeadlines.length
    ? `Recent headlines for ${stateName}:\n${newsHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`
    : '';

  return `You are generating a factual, state-specific impact report for the Dekleptocracy platform. 

GOAL:
- Produce concise, data-focused content for the "${stateName}" state report.
- Tone: professional, measured, hedged language ("around", "estimated", "according to analysts").
- No sensationalism. Use ranges instead of exact fabricated numbers.

RETURN ONLY VALID JSON WITH THIS SHAPE:
{
  "name": "Person name to display",
  "stateName": "State name",
  "role": "Role label (keep as provided)",
  "overviewTitle": "State Impact Overview",
  "overviewStatement": "One-sentence summary for the header",
  "comparisonCards": [
    { "value": "+X%", "label": "Short label", "description": "1-2 sentence description" },
    { "value": "-$X", "label": "Short label", "description": "1-2 sentence description" }
  ],
  "keyMetrics": [
    { "title": "Metric title", "value": "Value", "change": "Change vs prior period", "color": "#FF6B5A" }
  ],
  "trendData": [
    { "title": "Series title", "currentValue": "$X", "data": [ { "month": "Jan", "value": 100, "color": "#4A5D3F" } ] }
  ],
  "comparisonData": [
    { "category": "Grocery basket", "change": "+4% higher", "stateValue": "$X", "nationalValue": "$Y" }
  ]
}

REQUIREMENTS:
- All values should be realistic ranges, hedged, and state-specific for ${stateName}.
- Keep array lengths modest (3-5 keyMetrics, 3 trends with 5-7 points each, 3-4 comparison items).
- Use USD formatting for dollar amounts where appropriate.
- If uncertain, use approximate language and conservative estimates.

Context:
- State: ${stateName}
- Role: ${role}
- Name: ${name}
${headlinesSection}
`;
}

async function callLLM(prompt) {
  const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  const body = {
    messages: [
      {
        role: 'system',
        content: 'You generate concise JSON-only state impact reports for Dekleptocracy. Use hedging language, ranges, and avoid fabrication. Return ONLY JSON with the requested shape, no markdown.'
      },
      { role: 'user', content: prompt }
    ],
    use_mcp_tools: true,
    stream: false,
    max_iterations: 4,
    max_total_tools: 6,
    max_context_tokens: 4000
  };

  const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`MCP server error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  let content = data.content;

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      // Attempt to extract JSON substring
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('Unable to parse LLM JSON response');
    }
  }

  return content;
}

function sanitizeReportData(raw, fallback) {
  if (!raw || typeof raw !== 'object') return fallback;

  const safe = { ...fallback, ...raw };

  safe.name = raw.name || fallback.name;
  safe.stateName = raw.stateName || fallback.stateName;
  safe.role = raw.role || fallback.role;
  safe.overviewTitle = raw.overviewTitle || fallback.overviewTitle;
  safe.overviewStatement = raw.overviewStatement || fallback.overviewStatement;
  safe.comparisonCards = Array.isArray(raw.comparisonCards) && raw.comparisonCards.length > 0
    ? raw.comparisonCards
    : fallback.comparisonCards;
  safe.keyMetrics = Array.isArray(raw.keyMetrics) && raw.keyMetrics.length > 0
    ? raw.keyMetrics
    : fallback.keyMetrics;
  safe.trendData = Array.isArray(raw.trendData) && raw.trendData.length > 0
    ? raw.trendData
    : fallback.trendData;
  safe.comparisonData = Array.isArray(raw.comparisonData) && raw.comparisonData.length > 0
    ? raw.comparisonData
    : fallback.comparisonData;

  return safe;
}

/**
 * Generate state report data using MCP (with news context) and fall back to a static template.
 */
export async function generateStateReportData(stateName = 'California', role = 'VOTER', name = 'California Resident') {
  const fallback = getFallbackStateReport(stateName, role, name);

  try {
    const isHealthy = await checkMCPHealth();
    if (!isHealthy) {
      logger.warn('MCP health check failed; returning fallback state report');
      return fallback;
    }

    const news = await fetchNews('groceries', stateName, 3);
    const headlines = news?.map(n => n.title).filter(Boolean).slice(0, 3) || [];
    const prompt = buildStateReportPrompt(stateName, role, name, headlines);

    const raw = await callLLM(prompt);
    const sanitized = sanitizeReportData(raw, fallback);
    return sanitized;

  } catch (error) {
    logger.error('Error generating state report via MCP', error, { stateName, role });
    return fallback;
  }
}

export default {
  generateStateReportData,
  getFallbackStateReport,
};

