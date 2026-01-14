# Trade & Tariff Analysis Chatbot

A Next.js web application that combines GPT-5 (or GPT-4 fallback) with a custom MCP (Model Context Protocol) server for comprehensive trade and tariff analysis.

## Features

- **Dual AI Integration**: Seamlessly routes between GPT-5 for general queries and MCP tools for specialized trade analysis
- **Real-time Streaming**: Server-sent events (SSE) for responsive chat interactions
- **Trade Analysis Tools**: Access to multiple US government APIs including:
  - BEA (Bureau of Economic Analysis) - GDP and economic data
  - Census Bureau - Import/export statistics
  - USITC DataWeb - Detailed trade data
  - Federal Register - Regulations and announcements
  - GNews + Gemini AI - Trade news and sentiment analysis
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key (for GPT-5/GPT-4 access)
- API keys for trade data sources (configured in MCP server)

## Installation & Setup

### 1. Install Next.js Dependencies

```bash
cd next-app
npm install --legacy-peer-deps
```

Note: If you encounter permission errors with symlinks, use:
```bash
npm install --no-bin-links --legacy-peer-deps
```

### 2. Configure Environment Variables

Create or update `.env.local` in the `next-app` directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:8000
```

### 3. Start the MCP Server

In a separate terminal, navigate to the MCP server directory:

```bash
cd ../mcp_server

# Install Python dependencies if not already done
pip install -r requirements_improved.txt

# Start the HTTP/SSE server
python http_server.py
```

The MCP server will start on `http://localhost:8000`

### 4. Start the Next.js Development Server

Back in the `next-app` directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Chat Interface

The chatbot automatically routes your queries:

- **Trade/Tariff Queries**: Automatically routed to MCP tools for specialized analysis
  - Keywords: tariff, trade, import, export, customs, HTS, GDP, etc.
  - Example: "What are the current tariff rates for electronics from China?"

- **General Queries**: Handled by GPT-5 (or GPT-4 fallback)
  - Example: "Explain how machine learning works"

### Available MCP Tools

The MCP server provides access to:

1. **BEA Tools**
   - `get_bea_datasets` - List available economic datasets
   - `analyze_gdp_by_industry` - GDP analysis by sector

2. **Census Tools**
   - `get_census_trade_data` - Import/export statistics by HTS code

3. **USITC Tools**
   - `search_usitc_trade_data` - Detailed trade data search
   - `analyze_trade_anomalies` - Detect unusual trade patterns

4. **Federal Register Tools**
   - `search_federal_register` - Search government documents
   - `get_recent_tariff_announcements` - Latest tariff news

5. **News & Sentiment Tools**
   - `get_trade_news` - Real-time trade news
   - `analyze_trade_news_sentiment` - AI-powered sentiment analysis

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│  API Routes  │────▶│   GPT-5     │
│   Frontend  │◀────│ (Orchestrator)│     │   OpenAI    │
└─────────────┘ SSE └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  MCP Server  │
                    │   (Python)   │
                    └──────────────┘
                            │
                    ┌──────────────┐
                    │ Trade APIs   │
                    │ BEA, Census, │
                    │ USITC, etc.  │
                    └──────────────┘
```

## API Endpoints

### Next.js API Routes

- `POST /api/chat` - Main chat endpoint
  - Accepts: `{ messages: [...], stream: boolean }`
  - Returns: SSE stream or JSON response

### MCP Server Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /tools` - List available tools
- `POST /execute` - Execute specific tool
- `POST /chat` - Regular chat endpoint
- `POST /sse/chat` - SSE streaming chat
- `GET /mcp` - MCP protocol information

## Troubleshooting

### NPM Installation Issues

If you encounter permission errors:
```bash
npm install --no-bin-links --legacy-peer-deps
```

### MCP Server Connection

Ensure the MCP server is running before starting the Next.js app:
```bash
# Check if server is running
curl http://localhost:8000/health
```

### OpenAI API Errors

- Verify your API key is correctly set in `.env.local`
- The app automatically falls back to GPT-4 if GPT-5 is not available

## Development

### Project Structure

```
next-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Chat API endpoint
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── ChatInterface.tsx        # Main chat component
│   └── MessageList.tsx          # Message display
├── lib/
│   └── mcp-client.ts           # MCP client utilities
└── package.json
```

### Adding New Features

1. **New MCP Tools**: Add to `AVAILABLE_TOOLS` in `http_server.py`
2. **UI Components**: Add to `components/` directory
3. **API Routes**: Add to `app/api/` directory

## Future Enhancements

- User authentication and sessions
- Chat history persistence
- Rate limiting and usage tracking
- File upload for document analysis
- WebSocket support for bidirectional communication
- Fine-tuning GPT-5 on trade-specific data
- Database integration for data persistence

## License

This project is part of the Dekleptocracy system for trade and tariff analysis.
