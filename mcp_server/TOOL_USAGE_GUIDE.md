# MCP Server Tool Usage Guide

## Overview

The MCP Tariff Server now includes an **Intelligent Tool Selection System** that teaches AI models how to automatically select and use tools based on user queries. This guide explains how the system works and how to use it.

## Architecture

### Components

1. **Tool Catalog** (`tool_catalog.py`)
   - Comprehensive metadata for each tool
   - "When to use" guidelines
   - Parameter specifications
   - Real-world examples

2. **Intelligent Chat Handler** (`intelligent_chat.py`)
   - Intent detection from natural language
   - Automatic tool selection
   - Parameter extraction
   - Multi-tool coordination

3. **HTTP Endpoints** (`http_server.py`)
   - `/execute` - Direct tool execution
   - `/chat` - Basic chat with manual tool selection
   - `/chat/intelligent` - **NEW** AI-powered chat with automatic tool selection

## How It Works

### 1. Intent Detection

The system analyzes user queries to detect intent:

| User Says | Intent Detected | Tools Selected |
|-----------|----------------|----------------|
| "What's the latest news on tariffs?" | `news_query` | `search_news`, `get_trade_news` |
| "How is Tesla doing?" | `market_query` | `get_stock_info` |
| "What's happening in the market?" | `market_query` | `get_market_indices` |
| "Tell me about steel tariffs" | `tariff_query` | `search_tariff_info`, `search_news` |

### 2. Entity Extraction

The system extracts relevant entities from queries:

- **Stock symbols**: TSLA, AAPL, MSFT, etc.
- **Countries**: US, China, EU, etc.
- **Commodities/Sectors**: steel, automotive, technology, etc.
- **Time references**: this year, this month, etc.

### 3. Parameter Building

Extracted entities are mapped to tool parameters:

```python
User: "How has Tesla performed this year?"
↓
Intent: market_query
Entity: TSLA (stock symbol), 1y (time period)
↓
Tool Call: get_stock_history(symbol="TSLA", period="1y")
```

### 4. Multi-Tool Coordination

For complex queries, multiple tools are used:

```python
User: "How are tariffs affecting the automotive industry?"
↓
Intent: tariff_query + sector_query
↓
Tools:
  - search_tariff_info(topic="automotive")
  - search_stocks_by_sector(sector="automotive")
  - search_news(query="tariffs automotive industry")
```

## Available Tools by Category

### Web Search Tools

**When to use**: Need current information, news, or general web content

| Tool | Use Case | Example Query |
|------|----------|---------------|
| `search_web` | General web search | "US tariffs 2024" |
| `search_news` | Recent news articles | "What's the latest on trade war?" |
| `search_tariff_info` | Specific tariff information | "steel tariffs" |
| `get_trade_policy_news` | Country-specific policy news | "US trade policy" |

### Market Data Tools

**When to use**: Stock prices, market indices, financial analysis

| Tool | Use Case | Example Query |
|------|----------|---------------|
| `get_market_indices` | Overall market status | "How's the market doing?" |
| `get_stock_info` | Specific company data | "Tesla stock price" |
| `get_stock_history` | Historical trends | "AAPL performance this year" |
| `search_stocks_by_sector` | Industry analysis | "automotive stocks" |

### Government Data Tools

**When to use**: Official statistics, economic data, regulations

| Tool | Use Case | Example Query |
|------|----------|---------------|
| `get_bea_datasets` | Available economic data | "What GDP data is available?" |
| `get_recent_tariff_announcements` | Official policy changes | "Recent tariff announcements" |
| `search_usitc_trade_data` | Trade statistics by HTS code | "Imports of automobiles" |
| `get_trade_news` | GNews trade articles | "Trade news last week" |

## Using the Intelligent Chat Endpoint

### Basic Request

```bash
curl -X POST http://localhost:8000/chat/intelligent \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How is Tesla stock doing?"}
    ],
    "use_mcp_tools": true,
    "stream": false
  }'
```

### Response Format

```json
{
  "role": "assistant",
  "content": "Based on current data, Tesla (TSLA) stock is...",
  "tools_used": ["get_stock_info"],
  "tool_calls": [
    {
      "name": "get_stock_info",
      "parameters": {"symbol": "TSLA"}
    }
  ],
  "intent": {
    "primary_intent": "market_query",
    "suggested_tools": ["get_stock_info"],
    "extracted_entities": {"stock_symbols": ["TSLA"]}
  },
  "metadata": {
    "tool_count": 1,
    "primary_intent": "market_query"
  }
}
```

## Testing the System

### Quick Test

```bash
cd /media/shared/bld.ai/Dekleptocracy/mcp_server
python test_intelligent_chat.py
```

This runs 8 test scenarios covering:
- News queries
- Stock queries
- Market overview queries
- Tariff queries
- Policy queries
- Sector queries
- Complex multi-tool queries
- Economic data queries

### Individual Tool Test

```bash
python quick_test.py  # Tests 4 key tools
python test_all_tools.py  # Tests all 17 tools
```

## Tool Selection Strategy

### Single Tool Queries

For straightforward queries, one tool is selected:

| Query Pattern | Tool Selected | Why |
|--------------|---------------|-----|
| "latest news..." | `search_news` | Explicitly asks for news |
| "stock price of..." | `get_stock_info` | Asks about specific company |
| "market today" | `get_market_indices` | General market overview |

### Multi-Tool Queries

For complex queries, multiple tools provide comprehensive answers:

| Query Pattern | Tools Selected | Why |
|--------------|----------------|-----|
| "tariffs on steel" | `search_tariff_info` + `search_news` | Current policy + recent developments |
| "Tesla and tariffs" | `get_stock_info` + `search_news` | Company data + related news |
| "automotive industry impact" | `search_stocks_by_sector` + `search_news` | Sector analysis + context |

## System Prompt

The system uses a comprehensive prompt that teaches the AI:

1. **Available capabilities** - What each tool does
2. **Selection strategy** - When to use each tool
3. **Parameter extraction** - How to get params from natural language
4. **Multi-tool usage** - When to combine tools
5. **Example conversations** - Real usage patterns

Access the prompt with:

```python
from tool_catalog import get_tool_selection_prompt
prompt = get_tool_selection_prompt()
```

## Advanced Features

### Intent-Based Routing

The system categorizes intents:

- `news_query` → News search tools
- `market_query` → Financial/stock tools
- `tariff_query` → Tariff-specific searches
- `policy_query` → Government data tools
- `economic_query` → BEA/economic tools
- `general_query` → General web search

### Entity Recognition

Extracts structured data from natural language:

```python
"How has Tesla performed this year?"
↓
{
  "stock_symbols": ["TSLA"],
  "time_period": "1y"
}
```

### Context-Aware Parameters

Default parameters are intelligently set based on context:

- News queries → `max_results=10`
- Stock queries → `period="1mo"` for history
- Search queries → Use user message as query

## Best Practices

### For Users

1. **Be specific**: "Tesla stock" vs "TSLA performance this year"
2. **Mention time frames**: "this week", "2024", "recent"
3. **Specify entities**: Company names, countries, commodities
4. **Ask naturally**: The system understands conversational queries

### For Developers

1. **Add new tools to catalog**: Document when to use them
2. **Provide examples**: Show real user queries and tool calls
3. **Test intent detection**: Ensure your tool is selected correctly
4. **Handle errors gracefully**: Tools should return structured errors

## Extending the System

### Adding a New Tool

1. **Implement the tool** in appropriate API client
2. **Add to AVAILABLE_TOOLS** in `http_server.py`
3. **Document in tool_catalog.py**:

```python
"my_new_tool": {
    "description": "What the tool does",
    "when_to_use": [
        "User asks about X",
        "Need Y information"
    ],
    "parameters": {
        "param1": {
            "type": "string",
            "required": True,
            "description": "What this parameter means"
        }
    },
    "examples": [
        {
            "user_query": "Example question",
            "tool_call": {"param1": "value"}
        }
    ]
}
```

4. **Update intent detection** in `intelligent_chat.py`
5. **Test thoroughly** with various query patterns

### Improving Intent Detection

Add patterns to `_analyze_user_intent()`:

```python
if "your_keyword" in message_lower:
    intent["primary_intent"] = "your_intent"
    intent["suggested_tools"].append("your_tool")
```

### Enhancing Parameter Extraction

Add entity extraction logic:

```python
if "entity_pattern" in message_lower:
    intent["extracted_entities"]["entity_type"] = extracted_value
```

## Troubleshooting

### Tool Not Being Selected

1. Check if query pattern matches intent detection logic
2. Verify tool is documented in catalog with "when_to_use"
3. Add specific keywords to intent detection
4. Test with explicit tool mention

### Wrong Parameters

1. Check entity extraction in `_analyze_user_intent()`
2. Verify parameter mapping in `process_message()`
3. Add default values in tool catalog
4. Test with explicit parameter values

### Multiple Tools Not Coordinating

1. Verify intent allows multiple tools
2. Check tool combination logic
3. Ensure tools are compatible
4. Test with complex queries

## Performance Considerations

- **Caching**: Web search and news results are cached (30 min)
- **Rate Limiting**: Some APIs have rate limits
- **Timeout**: Each tool has 30-second timeout
- **Parallel Execution**: Tools are executed sequentially (can be parallelized)

## Security

- Input sanitization on all parameters
- API keys stored in environment variables
- No arbitrary code execution
- Request validation with Pydantic models

## Future Enhancements

- [ ] Streaming responses with SSE
- [ ] Conversation memory for follow-ups
- [ ] Advanced NLP for entity extraction
- [ ] Parallel tool execution
- [ ] Tool result caching
- [ ] User preferences and personalization
- [ ] Analytics and usage tracking

## Support

For issues or questions:

1. Check tool test results: `python test_all_tools.py`
2. Test intelligent chat: `python test_intelligent_chat.py`
3. Review server logs for errors
4. Verify API keys are configured

---

**Created**: 2025-10-24
**Version**: 1.0
**Status**: Production Ready
