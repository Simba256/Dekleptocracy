# Debug Chatbot Interface

## Overview

The Debug Chatbot is a development and testing interface that provides detailed visibility into the AI assistant's tool calling behavior, parameters, and results.

## Accessing the Debug Interface

### Local Development
Navigate to: `http://localhost:5173/chatbot/debug`

### Production (Vercel)
Navigate to: `https://dekleptocracy.vercel.app/chatbot/debug`

## Features

### Split-Screen Interface

**Left Panel: Chat Interface**
- Standard chatbot interaction
- Send messages and receive AI responses
- Same functionality as the production chatbot

**Right Panel: Debug Information**
- Real-time debugging information for each query
- Detailed tool call analysis
- Performance metrics

### Debug Information Displayed

#### 1. Performance Metrics
- **Total Time**: End-to-end request time in milliseconds
- **Iterations**: Number of tool calling iterations used
- **Tokens Used**: Total OpenAI tokens consumed
- **Tools Called**: Number of tools executed
- **Max Iterations Warning**: Alert when the 10-iteration limit is reached

#### 2. Tool Call Details
For each tool called, you can see:

**Tool Name**: The specific MCP tool that was executed

**Parameters**: Complete JSON of input parameters
```json
{
  "symbol": "AAPL",
  "period": "1mo"
}
```

**Result**: Complete JSON response from the tool
```json
{
  "success": true,
  "data": {
    "currentPrice": 178.45,
    "marketCap": 2800000000000
  }
}
```

#### 3. User Query
- The exact question/message that triggered the tool calls

#### 4. Raw Response Data
- Expandable section with the complete API response
- Useful for deep debugging

## Use Cases

### 1. Tool Selection Testing
Verify that the AI is selecting appropriate tools for different queries:
- "What's the current price of Tesla stock?" → Should use `get_stock_info`
- "Latest tariff news" → Should use `search_tariff_info` or `search_news`
- "GDP by industry" → Should use `analyze_gdp_by_industry`

### 2. Performance Monitoring
- Track response times
- Identify slow tools
- Monitor token usage for cost analysis

### 3. Tool Parameter Verification
- Ensure correct parameters are being passed
- Debug parameter formatting issues
- Validate tool input/output schemas

### 4. Iteration Limit Testing
- Test queries that might hit the 10-iteration limit
- Verify that meaningful responses are still returned
- Check for "limited by time constraints" messages

### 5. Error Debugging
- See exact error messages from failed tool calls
- Identify missing API keys or configuration issues
- Debug tool execution failures

## Example Test Queries

### Simple Queries (1-2 tools)
```
What is the current price of Apple stock?
What are the latest tariff announcements?
Show me GDP growth data
```

### Medium Queries (3-5 tools)
```
Compare Tesla and GM stock prices and find recent news about both
What are the tariff impacts on steel and aluminum?
Show me economic indicators and related news
```

### Complex Queries (May hit limit)
```
Analyze the complete trade relationship between US and China including stocks, tariffs, policies, and news
Compare economic indicators across 10 different industries with supporting data
Give me a comprehensive analysis of tech sector including multiple stocks, economic data, and news
```

## Tips for Testing

1. **Start Simple**: Begin with single-tool queries to verify basic functionality
2. **Test Incrementally**: Gradually increase query complexity
3. **Monitor Iterations**: Watch the iteration count to understand tool usage patterns
4. **Check Results**: Verify that tool results contain expected data
5. **Test Edge Cases**: Try queries that might fail or hit limits

## Differences from Production Chatbot

| Feature | Production (`/chatbot`) | Debug (`/chatbot/debug`) |
|---------|------------------------|-------------------------|
| UI | Clean, minimal | Split-screen with debug panel |
| Tool Visibility | Hidden (console only) | Fully visible with details |
| Performance Metrics | Hidden | Displayed |
| Raw Data | Not shown | Expandable view |
| Purpose | End users | Developers & testing |

## Integration with Backend

The debug interface uses the same backend endpoint as the production chatbot:
```
POST /chat/intelligent/v2
```

The backend already returns all necessary debug information in the response:
```json
{
  "role": "assistant",
  "content": "Response text...",
  "tool_calls": [...],
  "tool_results": {...},
  "metadata": {
    "version": "v2",
    "llm_driven": true,
    "iterations": 3,
    "tokens_used": 1250,
    "tool_count": 4,
    "max_iterations_reached": false
  }
}
```

The debug interface simply displays this data instead of hiding it.

## Development Workflow

1. **Make Backend Changes**: Modify tool handlers, add new tools, etc.
2. **Test in Debug Interface**: Use `/chatbot/debug` to verify tool calls
3. **Review Parameters & Results**: Check that data is correct
4. **Optimize**: Reduce unnecessary tool calls, improve parameters
5. **Test in Production**: Once satisfied, test in regular `/chatbot`
6. **Deploy**: Deploy backend changes to Railway, frontend to Vercel

## Security Note

⚠️ **Important**: This debug interface exposes detailed system information including:
- API call patterns
- Tool results (may contain sensitive data)
- Performance metrics
- System architecture details

**Recommendations**:
- Do NOT link to `/chatbot/debug` from the main navigation
- Consider adding authentication/password protection in production
- Use environment variables to disable it in production if needed
- Keep the URL private and only share with developers

## Future Enhancements

Potential improvements for the debug interface:
- [ ] Export debug logs to JSON/CSV
- [ ] Filter/search through debug history
- [ ] Compare multiple queries side-by-side
- [ ] Real-time streaming of tool calls
- [ ] Tool call visualization/timeline
- [ ] Cost calculator (tokens × pricing)
- [ ] Performance benchmarking
- [ ] Authentication/password protection
