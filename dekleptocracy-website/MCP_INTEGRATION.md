# MCP Server Integration for Article Generation

## 🚀 Quick Start (3 Steps)

### 1. Start Your MCP Server

```bash
cd mcp_server
python http_server.py
```

This starts your MCP server with all data APIs and LLM at `http://localhost:8000`

### 2. Start Node.js Server

```bash
cd dekleptocracy-website/server
npm install node-cron
npm run dev
```

The article generator will automatically start and use your MCP server every 2 hours.

### 3. Test Article Generation

```bash
curl -X POST http://localhost:5000/api/articles/generate -H "Content-Type: application/json" -d '{"count": 2}'
```

That's it! Articles will be generated using your MCP server and stored in MongoDB.

---

## Overview

Your existing MCP server (`mcp_server/`) is now **FULLY INTEGRATED** with the article generation system. The Node.js article generator **CALLS YOUR MCP SERVER** to generate articles using all your configured data sources and LLM capabilities.

## Current Setup

### Your MCP Server Provides:

- ✅ OpenAI GPT-4/GPT-5 via `apis/openai_api.py`
- ✅ Gemini AI via `apis/gemini_api.py`
- ✅ Multiple data sources (BEA, Census, Federal Register, GNews, etc.)
- ✅ HTTP endpoints via `http_server.py` (FastAPI)
- ✅ Intelligent chat with function calling

### Article Generator Now:

- ✅ **CALLS YOUR MCP SERVER** at `http://localhost:8000`
- ✅ Uses `/chat/intelligent/v2` endpoint (GPT with function calling)
- ✅ Fetches real data via `/execute` endpoint (news, tariffs, etc.)
- ✅ Falls back to mock data if MCP server is offline
- ✅ Generates 7-8 articles every 2-3 hours
- ✅ Stores articles in MongoDB with source references

## Setup Instructions

### 1. Start Your MCP Server

**This is the most important step!** The article generator needs your MCP server running:

```bash
cd mcp_server
python http_server.py
```

This starts your MCP server on `http://localhost:8000` with all your APIs and LLM capabilities.

### 2. Configure MCP Server (Optional)

Your MCP server uses `.env` files in the `mcp_server/` directory. Make sure you have:

```bash
# mcp_server/.env or mcp_server/.env.local
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key (optional)
GNEWS_API_KEY=your-gnews-key (optional)
BEA_API_KEY=your-bea-key (optional)
CENSUS_API_KEY=your-census-key (optional)
```

### 3. Configure Article Generator

Add this to `dekleptocracy-website/server/.env`:

```bash
# MCP Server URL (default: http://localhost:8000)
MCP_SERVER_URL=http://localhost:8000
```

The article generator will call your MCP server at this URL.

### 2. Verify Configuration

Check if your key is configured:

```bash
# In the server directory
node -e "console.log(process.env.OPENAI_API_KEY ? '✓ API Key configured' : '✗ API Key missing')"
```

### 3. Test Article Generation

Start the server and trigger manual generation:

```bash
cd dekleptocracy-website/server
npm run dev
```

Then in another terminal:

```bash
curl -X POST http://localhost:5000/api/articles/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 2}'
```

## How It Works

### 1. Article Generation Flow

```
Scheduler (Every 2 hours)
    ↓
Article Generator (Node.js)
    ↓
Call MCP Server (http://localhost:8000)
    ├── Fetch real news (GNews API)
    ├── Fetch tariff data (Federal Register)
    ├── Get economic data (BEA, Census)
    └── Generate article (GPT-4 with tools)
    ↓
Parse JSON Response
    ↓
Enrich with Sources
    ↓
Save to MongoDB
    ↓
Display on Frontend
```

### 2. MCP Server Communication

The article generator sends requests to your MCP server:

```javascript
// Request to MCP Server
POST http://localhost:8000/chat/intelligent/v2
{
  "messages": [
    {
      "role": "system",
      "content": "You are a data journalist..."
    },
    {
      "role": "user",
      "content": "Generate article with real data from sources..."
    }
  ],
  "use_mcp_tools": true,
  "max_iterations": 5,
  "max_total_tools": 8
}

// MCP Server response
{
  "role": "assistant",
  "content": "{...article JSON...}",
  "tool_calls": [...],
  "metadata": {
    "tokens_used": 1234,
    "tool_count": 3
  }
}
```

### 3. Expected Response Format

```json
{
  "title": "Article Title",
  "description": "One-line summary",
  "mainText": "Full article text with 2-3 paragraphs",
  "price": "$X.XX",
  "priceUnit": "per unit",
  "priceChange": "+X.X%",
  "impactScore": 75,
  "impactLevel": "high",
  "location": "California",
  "whyItHappened": [
    {
      "title": "Reason Title:",
      "description": "Detailed explanation"
    }
  ],
  "chartData": [{ "month": "Jan", "value": 100 }]
}
```

## Using Your MCP Server Data Sources

### Option 1: Call MCP Server APIs (Recommended)

Your MCP server has multiple data APIs that can enhance articles:

```javascript
// In articleGenerator.js

// Fetch real tariff data
async function getTariffData(htsCode) {
  const response = await fetch('http://localhost:8000/lookup_hts_code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hts_code: htsCode }),
  });
  return await response.json();
}

// Fetch news from GNews API
async function getLatestNews(topic) {
  const response = await fetch('http://localhost:8000/search_news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: topic, max_results: 10 }),
  });
  return await response.json();
}

// Use in article generation
const tariffData = await getTariffData('0207.14.00'); // Chicken
const newsData = await getLatestNews('egg prices');
```

### Option 2: Direct API Calls

Use your configured APIs directly:

```javascript
// BEA API for economic data
const beaResponse = await fetch(
  `https://apps.bea.gov/api/data?UserID=${process.env.BEA_API_KEY}&...`,
);

// Census API for demographic data
const censusResponse = await fetch(
  `https://api.census.gov/data?key=${process.env.CENSUS_API_KEY}&...`,
);

// Federal Register for policy data
const policyResponse = await fetch('https://www.federalregister.gov/api/v1/documents?...');
```

## Advanced Integration

### 1. Start MCP Server

Your Python MCP server provides additional intelligence:

```bash
cd mcp_server
python tariff_server_improved.py
```

This starts an HTTP server (usually on port 8000) with these endpoints:

- `/calculate_tariff_cost` - Calculate tariff impacts
- `/lookup_hts_code` - Look up tariff codes
- `/search_news` - Search news via GNews
- `/analyze_sentiment` - Gemini sentiment analysis
- `/generate_summary` - AI summaries

### 2. Enhanced Article Generation

Call MCP server from Node.js:

```javascript
// In articleGenerator.js

async function generateEnhancedArticle(category, topic) {
  // 1. Get latest news
  const newsResponse = await fetch('http://localhost:8000/search_news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: topic, max_results: 5 }),
  });
  const newsData = await newsResponse.json();

  // 2. Analyze sentiment
  const sentimentResponse = await fetch('http://localhost:8000/analyze_sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: newsData.articles.map((a) => a.description).join(' '),
      context: `${category} price analysis`,
    }),
  });
  const sentiment = await sentimentResponse.json();

  // 3. Generate article with real data
  const prompt = `
    Generate article about ${topic} in ${category}.
    
    Latest news sentiment: ${sentiment.analysis}
    
    Recent headlines:
    ${newsData.articles.map((a) => `- ${a.title}`).join('\n')}
    
    [Rest of prompt...]
  `;

  return await callLLM(prompt);
}
```

### 3. Real-Time Data Updates

Poll your data sources periodically:

```javascript
// Schedule data refresh
setInterval(async () => {
  // Update tariff rates
  const tariffs = await fetchLatestTariffs();

  // Update news cache
  const news = await fetchLatestNews();

  // Store in database for article generation
  await updateDataCache({ tariffs, news });
}, 3600000); // Every hour
```

## Environment Variables

Add these to `server/.env`:

```env
# Required for article generation
OPENAI_API_KEY=sk-your-openai-key

# Optional: Use Gemini instead
GEMINI_API_KEY=your-gemini-key

# Optional: Your MCP server data APIs
BEA_API_KEY=your-bea-key
CENSUS_API_KEY=your-census-key
GNEWS_API_KEY=your-gnews-key

# Optional: MCP server URL
MCP_SERVER_URL=http://localhost:8000
```

## Testing

### Test OpenAI Integration

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Should return list of available models
```

### Test Article Generation

```bash
# Generate single article
curl -X POST http://localhost:5000/api/articles/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 1}'

# Check articles
curl http://localhost:5000/api/articles/latest
```

### Test MCP Server Integration

```bash
# Start Python MCP server
cd mcp_server
python tariff_server_improved.py

# In another terminal, test it
curl -X POST http://localhost:8000/search_news \
  -H "Content-Type: application/json" \
  -d '{"query": "tariffs", "max_results": 5}'
```

## Switching to Gemini

If you prefer Gemini over OpenAI:

1. **Update articleGenerator.js:**

```javascript
async function callLLM(prompt) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    },
  );

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}
```

2. **Add Gemini key to .env:**

```env
GEMINI_API_KEY=your-gemini-key
```

## Monitoring

### Check Generation Logs

```bash
# Server logs show:
🤖 Starting scheduled article generation...
⏰ Time: 12/8/2025, 2:00:00 PM
✓ Article generated via OpenAI
✓ Generated article: Egg Prices Surge 28% in California
✅ Successfully generated 7 articles
```

### Check API Usage

Monitor your OpenAI usage:

- https://platform.openai.com/usage

Monitor your Gemini usage:

- https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com

## Troubleshooting

### No Articles Generated

1. Check API key: `echo $OPENAI_API_KEY`
2. Check logs: `tail -f server/logs/app.log`
3. Check MongoDB: `db.articles.find().count()`
4. Test API manually: Use curl commands above

### API Errors

- **401 Unauthorized**: Check API key
- **429 Rate Limit**: Wait or upgrade plan
- **500 Server Error**: Check prompt format

### MCP Server Not Responding

1. Check if Python server is running: `ps aux | grep tariff_server`
2. Check port: `lsof -i :8000`
3. Restart: `cd mcp_server && python tariff_server_improved.py`

## Cost Optimization

### OpenAI Costs

- GPT-4: ~$0.03 per article (1000 tokens)
- 7 articles every 2 hours = 84 articles/day
- Estimated: $2.52/day or $75/month

### Reduce Costs

1. Use GPT-3.5-turbo instead (10x cheaper)
2. Generate fewer articles (5 instead of 7)
3. Increase interval (every 3-4 hours)
4. Use Gemini (free tier available)

## Next Steps

1. ✅ Configure OpenAI API key
2. ✅ Test article generation
3. ⬜ Start MCP server for enhanced data
4. ⬜ Connect real data sources (BEA, Census, etc.)
5. ⬜ Add custom categories for your needs
6. ⬜ Implement article review workflow
7. ⬜ Add image generation
8. ⬜ Setup monitoring dashboard

## Support

- OpenAI Docs: https://platform.openai.com/docs
- Gemini Docs: https://ai.google.dev/docs
- Your MCP Server: `mcp_server/README.md`
- Article System: `ARTICLE_GENERATION_README.md`
