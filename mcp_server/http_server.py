#!/usr/bin/env python3
"""
HTTP/SSE Server wrapper for the MCP Tariff Server
Provides HTTP endpoints and Server-Sent Events for web applications
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, AsyncGenerator
import json
import asyncio
import logging
from datetime import datetime
import importlib
import sys
from pathlib import Path

# Add the current directory to the path so we can import the MCP server modules
sys.path.insert(0, str(Path(__file__).parent))

# Import the MCP server modules
from config import config
from utils import sanitize_input, format_currency, clear_cache, get_cache_stats
from apis.bea_api import BEAAPIClient
from apis.census_api import CensusAPIClient
from apis.dataweb_api import DataWebAPIClient
from apis.federal_register_api import FederalRegisterAPIClient
from apis.gnews_api import GNewsAPIClient
from apis.gemini_api import GeminiAPIClient
from apis.yfinance_api import YFinanceAPIClient
from apis.websearch_api import WebSearchAPIClient
from apis.openai_api import OpenAIAPIClient
# State report API clients
from apis.bls_api import BLSAPIClient
from apis.fred_api import FREDAPIClient
from apis.eia_api import EIAAPIClient
from apis.housing_api import HUDAPIClient
from apis.usda_api import USDAAPIClient
from intelligent_chat import IntelligentChatHandler
from intelligent_chat_v2 import IntelligentChatHandlerV2

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MCP Tariff Server HTTP API",
    description="HTTP/SSE interface for the MCP Trade & Tariff Analysis Server",
    version="1.0.0",
)

# Add CORS middleware for frontend applications
# In production, update this list to include your Vercel domain
import os
allowed_origins = [
    "http://localhost:3000",      # Next.js dev server
    "http://localhost:3001",      # Next.js alternative port
    "http://localhost:5173",      # Vite dev server (dekleptocracy-website)
    "http://localhost:5174",      # Vite alternative port
    "http://localhost:5000",      # Backend dev server
    "https://dekleptocracy.vercel.app",  # Production Vercel frontend
]

# Add production frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
    # Also allow HTTPS version
    if frontend_url.startswith("http://"):
        allowed_origins.append(frontend_url.replace("http://", "https://"))

# Allow all Vercel preview deployments (for testing)
# This uses regex pattern matching
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Initialize API clients
bea_client = BEAAPIClient(config.apis["bea"])
census_client = CensusAPIClient(config.apis["census"])
dataweb_client = DataWebAPIClient(config.apis["dataweb"])
federal_register_client = FederalRegisterAPIClient(config.apis["federal_register"])
gnews_client = GNewsAPIClient(config.apis["gnews"])
gemini_client = GeminiAPIClient(config.apis["gemini"])
yfinance_client = YFinanceAPIClient()
websearch_client = WebSearchAPIClient()
openai_client = OpenAIAPIClient()  # Will use OPENAI_API_KEY from env

# Initialize state report API clients
bls_client = BLSAPIClient(config.apis["bls"])
fred_client = FREDAPIClient(config.apis["fred"])
eia_client = EIAAPIClient(config.apis["eia"])
hud_client = HUDAPIClient(config.apis["hud"])
usda_client = USDAAPIClient(config.apis["usda"])

# Initialize intelligent chat handler (will be set up after AVAILABLE_TOOLS is defined)
intelligent_chat_handler = None

# Request/Response models
class ToolRequest(BaseModel):
    """Model for tool execution requests"""
    tool_name: str = Field(..., description="Name of the tool to execute")
    parameters: Dict[str, Any] = Field(default={}, description="Tool parameters")
    arguments: Dict[str, Any] = Field(default={}, description="Tool arguments (alias for parameters)")

class ToolResponse(BaseModel):
    """Model for tool execution responses"""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    timestamp: str

class ChatMessage(BaseModel):
    """Model for chat messages"""
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    """Model for chat requests"""
    messages: List[ChatMessage]
    use_mcp_tools: bool = Field(default=True, description="Whether to use MCP tools")
    stream: bool = Field(default=True, description="Whether to stream the response")
    max_iterations: int = Field(default=10, description="Maximum number of tool calling iterations")
    max_total_tools: int = Field(default=8, description="Maximum total number of tools to call")
    max_context_tokens: Optional[int] = Field(default=None, description="Maximum tokens for context (if None, uses model default)")
    preserve_recent_messages: int = Field(default=3, description="Number of recent messages to preserve when truncating")
    system_prompt: Optional[str] = Field(default=None, description="Optional override for system prompt (e.g., synthetic research mode)")

class TitleRequest(BaseModel):
    """Model for title generation requests"""
    message: str = Field(..., description="The user message to generate a title from")

# Helper function for comprehensive state data
def get_comprehensive_state_data(state_name: str) -> Dict[str, Any]:
    """Get comprehensive economic data for a state from all available sources"""
    results = {
        "state": state_name,
        "status": "success",
        "data": {},
        "errors": []
    }

    # Unemployment
    try:
        results["data"]["unemployment"] = bls_client.get_unemployment_by_state(state_name)
    except Exception as e:
        results["errors"].append(f"BLS unemployment: {str(e)}")

    # GDP (using BEA instead of FRED to avoid Railway network blocking)
    try:
        results["data"]["gdp"] = bea_client.get_state_gdp(state_name)
    except Exception as e:
        results["errors"].append(f"BEA GDP: {str(e)}")

    # Electricity prices
    try:
        results["data"]["electricity"] = eia_client.get_electricity_prices_by_state(state_name)
    except Exception as e:
        results["errors"].append(f"EIA electricity: {str(e)}")

    # Gas prices
    try:
        results["data"]["gasoline"] = eia_client.get_gasoline_prices_by_region(state_name=state_name)
    except Exception as e:
        results["errors"].append(f"EIA gasoline: {str(e)}")

    # Rent
    try:
        results["data"]["rent"] = hud_client.get_fmr_history(state_name)
    except Exception as e:
        results["errors"].append(f"HUD rent: {str(e)}")

    # Income Limits & Affordability
    try:
        results["data"]["income_limits"] = hud_client.get_state_income_limits(state_name)
    except Exception as e:
        results["errors"].append(f"HUD income limits: {str(e)}")

    try:
        results["data"]["affordability"] = hud_client.get_affordability_analysis(state_name)
    except Exception as e:
        results["errors"].append(f"HUD affordability: {str(e)}")

    # Food prices
    try:
        results["data"]["food"] = usda_client.get_state_food_prices(state_name)
    except Exception as e:
        results["errors"].append(f"USDA food: {str(e)}")

    return results

# Tool implementations
AVAILABLE_TOOLS = {
    "get_bea_datasets": {
        "handler": lambda params: bea_client.get_datasets(),
        "description": "Get list of available BEA datasets"
    },
    "get_bea_data": {
        "handler": lambda params: bea_client.get_data(
            dataset_name=params.get("dataset_name"),
            parameters=params.get("parameters", {})
        ),
        "description": "Get BEA economic data"
    },
    "analyze_gdp_by_industry": {
        "handler": lambda params: bea_client.analyze_gdp_by_industry(
            year=params.get("year"),
            frequency=params.get("frequency", "A")
        ),
        "description": "Analyze GDP by industry"
    },
    "get_bea_state_gdp": {
        "handler": lambda params: bea_client.get_state_gdp(
            state_name=params.get("state_name")
        ),
        "description": "Get state GDP from Bureau of Economic Analysis (BEA)"
    },
    "get_bea_state_personal_income": {
        "handler": lambda params: bea_client.get_state_personal_income(
            state_name=params.get("state_name")
        ),
        "description": "Get state per capita personal income from BEA"
    },
    "get_census_trade_data": {
        "handler": lambda params: census_client.get_trade_statistics(
            hts_code=params.get("hts_code"),
            country_code=params.get("country_code"),
            year=params.get("year"),
            month=params.get("month")
        ),
        "description": "Get Census trade statistics"
    },
    "search_usitc_trade_data": {
        "handler": lambda params: dataweb_client.search_trade_data(
            hts_code=params.get("hts_code"),
            start_year=params.get("start_year"),
            end_year=params.get("end_year"),
            country=params.get("country"),
            flow_type=params.get("flow_type", "both")
        ),
        "description": "Search USITC trade data"
    },
    "analyze_trade_anomalies": {
        "handler": lambda params: dataweb_client.analyze_trade_anomalies(
            hts_code=params.get("hts_code"),
            years=params.get("years", 5)
        ),
        "description": "Analyze trade anomalies"
    },
    "search_federal_register": {
        "handler": lambda params: federal_register_client.search_documents(
            query=params.get("query"),
            agencies=params.get("agencies"),
            start_date=params.get("start_date"),
            end_date=params.get("end_date"),
            document_types=params.get("document_types")
        ),
        "description": "Search Federal Register documents"
    },
    "get_recent_tariff_announcements": {
        "handler": lambda params: federal_register_client.get_recent_tariff_announcements(
            days=params.get("days", 30)
        ),
        "description": "Get recent tariff announcements"
    },
    "get_trade_news": {
        "handler": lambda params: gnews_client.get_trade_news(
            query=params.get("query", "tariff"),
            country=params.get("country", "us"),
            max_results=params.get("max_results", 10),
            days_back=params.get("days_back", 7)
        ),
        "description": "Get trade-related news from GNews"
    },
    # Web Search Tools
    "search_web": {
        "handler": lambda params: websearch_client.search_web(
            query=params.get("query"),
            max_results=params.get("max_results", 10),
            region=params.get("region", "us-en")
        ),
        "description": "Search the web for information"
    },
    "search_news": {
        "handler": lambda params: websearch_client.search_news(
            query=params.get("query"),
            max_results=params.get("max_results", 10),
            region=params.get("region", "us-en")
        ),
        "description": "Search for recent news articles"
    },
    "search_tariff_info": {
        "handler": lambda params: websearch_client.search_tariff_info(
            topic=params.get("topic", "steel")
        ),
        "description": "Search for tariff-specific information"
    },
    "get_trade_policy_news": {
        "handler": lambda params: websearch_client.get_trade_policy_news(
            country=params.get("country", "US")
        ),
        "description": "Get recent trade policy news"
    },
    # YFinance Tools
    "get_stock_info": {
        "handler": lambda params: yfinance_client.get_stock_info(
            symbol=params.get("symbol", "AAPL")
        ),
        "description": "Get comprehensive stock information"
    },
    "get_stock_history": {
        "handler": lambda params: yfinance_client.get_stock_history(
            symbol=params.get("symbol", "AAPL"),
            period=params.get("period", "1mo")
        ),
        "description": "Get historical stock data"
    },
    "search_stocks_by_sector": {
        "handler": lambda params: yfinance_client.search_stocks_by_sector(
            sector=params.get("sector", "technology"),
            limit=params.get("limit", 10)
        ),
        "description": "Get stocks in a specific sector"
    },
    "get_market_indices": {
        "handler": lambda params: yfinance_client.get_market_indices(),
        "description": "Get major market indices"
    },
    # ===== STATE REPORT DATA TOOLS =====
    # BLS (Bureau of Labor Statistics) Tools
    "get_bls_unemployment_by_state": {
        "handler": lambda params: bls_client.get_unemployment_by_state(
            state_name=params.get("state_name"),
            start_year=params.get("start_year"),  # Defaults to dynamic year in API client
            end_year=params.get("end_year")
        ),
        "description": "Get state unemployment rate from Bureau of Labor Statistics"
    },
    "get_bls_cpi_for_state": {
        "handler": lambda params: bls_client.get_regional_cpi_for_state(
            state_name=params.get("state_name"),
            start_year=params.get("start_year"),
            end_year=params.get("end_year")
        ),
        "description": "Get regional Consumer Price Index for a state from BLS"
    },
    "get_bls_wages_by_state": {
        "handler": lambda params: bls_client.get_average_wages_by_state(
            state_name=params.get("state_name"),
            start_year=params.get("start_year"),
            end_year=params.get("end_year")
        ),
        "description": "Get average weekly wages for a state from BLS QCEW data"
    },
    # FRED (Federal Reserve Economic Data) Tools
    "get_fred_state_gdp": {
        "handler": lambda params: fred_client.get_state_gdp(
            state_name=params.get("state_name")
        ),
        "description": "Get state GDP from Federal Reserve Economic Data (FRED)"
    },
    "get_fred_state_personal_income": {
        "handler": lambda params: fred_client.get_state_personal_income(
            state_name=params.get("state_name")
        ),
        "description": "Get state per capita personal income from FRED"
    },
    "get_fred_state_unemployment": {
        "handler": lambda params: fred_client.get_state_unemployment_rate(
            state_name=params.get("state_name")
        ),
        "description": "Get state unemployment rate from FRED"
    },
    "get_fred_series": {
        "handler": lambda params: fred_client.get_series_data(
            series_id=params.get("series_id"),
            observation_start=params.get("observation_start"),
            observation_end=params.get("observation_end")
        ),
        "description": "Get any FRED economic data series by ID"
    },
    # EIA (Energy Information Administration) Tools
    "get_electricity_prices_by_state": {
        "handler": lambda params: eia_client.get_electricity_prices_by_state(
            state_name=params.get("state_name"),
            sector=params.get("sector", "RES")
        ),
        "description": "Get electricity prices for a state from EIA (sectors: RES, COM, IND)"
    },
    "get_gasoline_prices_by_state": {
        "handler": lambda params: eia_client.get_gasoline_prices_by_region(
            state_name=params.get("state_name")
        ),
        "description": "Get gasoline prices for a state's region from EIA"
    },
    "get_natural_gas_prices_by_state": {
        "handler": lambda params: eia_client.get_natural_gas_prices_by_state(
            state_name=params.get("state_name"),
            sector=params.get("sector", "RES")
        ),
        "description": "Get natural gas prices for a state from EIA"
    },
    "get_national_electricity_price": {
        "handler": lambda params: eia_client.get_national_electricity_price(
            sector=params.get("sector", "RES")
        ),
        "description": "Get national average electricity price from EIA"
    },
    "get_national_gasoline_price": {
        "handler": lambda params: eia_client.get_national_gasoline_price(),
        "description": "Get national average gasoline price from EIA"
    },
    # HUD (Housing and Urban Development) Tools
    "get_hud_fair_market_rent": {
        "handler": lambda params: hud_client.get_state_fmr(
            state_name=params.get("state_name"),
            year=params.get("year")
        ),
        "description": "Get HUD Fair Market Rent data for a state"
    },
    "get_hud_rent_history": {
        "handler": lambda params: hud_client.get_fmr_history(
            state_name=params.get("state_name"),
            years=params.get("years", 5)
        ),
        "description": "Get historical HUD Fair Market Rent data for trend analysis"
    },
    "get_hud_income_limits": {
        "handler": lambda params: hud_client.get_state_income_limits(
            state_name=params.get("state_name"),
            year=params.get("year")
        ),
        "description": "Get HUD Income Limits data for a state"
    },
    "get_hud_affordability_analysis": {
        "handler": lambda params: hud_client.get_affordability_analysis(
            state_name=params.get("state_name"),
            year=params.get("year")
        ),
        "description": "Get housing affordability analysis combining FMR and Income Limits"
    },
    "get_hud_chas_data": {
        "handler": lambda params: hud_client.get_state_chas(
            state_name=params.get("state_name"),
            year=params.get("year")
        ),
        "description": "Get HUD CHAS data showing cost-burdened households"
    },
    "get_hud_housing_summary": {
        "handler": lambda params: hud_client.get_housing_summary(
            state_name=params.get("state_name"),
            year=params.get("year")
        ),
        "description": "Get comprehensive housing summary combining FMR, Income Limits, and affordability"
    },
    # USDA (Food Prices) Tools
    "get_usda_food_prices": {
        "handler": lambda params: usda_client.get_state_food_prices(
            state_name=params.get("state_name")
        ) if params.get("state_name") else usda_client.get_food_price_cpi(),
        "description": "Get USDA food price data, optionally adjusted for a state"
    },
    "get_usda_grocery_basket": {
        "handler": lambda params: usda_client.get_grocery_basket_comparison(
            state_name=params.get("state_name")
        ),
        "description": "Get grocery basket cost comparison for a state vs national average"
    },
    # Comprehensive State Economic Data
    "get_state_economic_data": {
        "handler": lambda params: get_comprehensive_state_data(params.get("state_name")),
        "description": "Get comprehensive economic data for a state from all available sources"
    },
    # ===== TEXT GENERATION TOOLS =====
    "generate_text": {
        "handler": lambda params: openai_client.generate_content(
            prompt=params.get("prompt", ""),
            max_tokens=params.get("max_tokens", 150),
            temperature=params.get("temperature", 0.3),
            model=params.get("model", "gpt-5-mini")  # GPT-5 mini via Responses API
        ),
        "description": "Generate text using OpenAI GPT-5 for insights and analysis"
    },
}

# Initialize intelligent chat handlers
# V1: Manual pattern matching (fallback)
intelligent_chat_handler = IntelligentChatHandler(gemini_client, AVAILABLE_TOOLS, openai_client=openai_client)

# V2: LLM-driven with function calling (recommended)
try:
    intelligent_chat_handler_v2 = IntelligentChatHandlerV2(openai_client, AVAILABLE_TOOLS)
    logger.info("LLM-driven chat handler V2 initialized successfully")
except Exception as e:
    logger.warning(f"Could not initialize V2 handler: {e}")
    intelligent_chat_handler_v2 = None

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "MCP Tariff Server HTTP API",
        "version": "1.0.0",
        "endpoints": {
            "/tools": "List available tools",
            "/execute": "Execute a specific tool",
            "/chat": "Chat endpoint with MCP tool integration",
            "/sse/chat": "SSE streaming chat endpoint",
            "/health": "Health check endpoint",
            "/cache/clear": "Clear API response cache (POST)",
            "/cache/stats": "Get cache statistics"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "bea_api": config.apis["bea"].api_key is not None,
            "census_api": config.apis["census"].api_key is not None,
            "dataweb_api": config.apis["dataweb"].token is not None,
            "federal_register": True,  # No API key required
            "gnews_api": config.apis["gnews"].api_key is not None,
            "gemini_api": config.apis["gemini"].api_key is not None,
            # State report APIs
            "bls_api": config.apis["bls"].api_key is not None,
            "fred_api": config.apis["fred"].api_key is not None,
            "eia_api": config.apis["eia"].api_key is not None,
            "hud_api": config.apis["hud"].token is not None,
            "usda_api": True,  # USDA key is optional, uses fallback data
        }
    }

@app.post("/cache/clear")
async def clear_api_cache():
    """Clear the API response cache"""
    result = clear_cache()
    return {
        "status": "success",
        "message": f"Cleared {result['cleared']} cached items",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/cache/stats")
async def get_api_cache_stats():
    """Get cache statistics"""
    stats = get_cache_stats()
    return {
        "status": "success",
        "cache": stats,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/tools")
async def list_tools():
    """List all available tools"""
    return {
        "tools": [
            {
                "name": name,
                "description": tool["description"]
            }
            for name, tool in AVAILABLE_TOOLS.items()
        ]
    }

@app.post("/execute")
async def execute_tool(request: ToolRequest):
    """Execute a specific tool"""
    try:
        if request.tool_name not in AVAILABLE_TOOLS:
            raise HTTPException(status_code=404, detail=f"Tool '{request.tool_name}' not found")

        tool = AVAILABLE_TOOLS[request.tool_name]

        # Use arguments if provided, otherwise use parameters (for backwards compatibility)
        raw_params = request.arguments if request.arguments else request.parameters

        # Validate and sanitize inputs
        sanitized_params = {}
        for key, value in raw_params.items():
            if isinstance(value, str):
                sanitized_params[key] = sanitize_input(value)
            else:
                sanitized_params[key] = value

        # Execute the tool
        result = tool["handler"](sanitized_params)

        return ToolResponse(
            success=True,
            result=result,
            error=None,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Error executing tool {request.tool_name}: {str(e)}")
        return ToolResponse(
            success=False,
            result=None,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

async def generate_sse_response(message: str, tools_to_use: List[str] = None) -> AsyncGenerator[str, None]:
    """Generate SSE response stream"""
    try:
        # Start with acknowledgment
        yield f"data: {json.dumps({'type': 'start', 'message': 'Processing request...'})}\n\n"

        # Check if we need to use MCP tools
        if tools_to_use:
            for tool_name in tools_to_use:
                if tool_name in AVAILABLE_TOOLS:
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

                    try:
                        tool = AVAILABLE_TOOLS[tool_name]
                        # For demo, we'll execute with empty params
                        # In production, you'd extract params from the message
                        result = tool["handler"]({})

                        yield f"data: {json.dumps({'type': 'tool_result', 'tool': tool_name, 'result': str(result)[:500]})}\n\n"
                    except Exception as e:
                        yield f"data: {json.dumps({'type': 'tool_error', 'tool': tool_name, 'error': str(e)})}\n\n"

        # Simulate streaming response
        response_text = f"Based on the analysis of trade data, here's what I found regarding '{message}'..."
        words = response_text.split()

        for i, word in enumerate(words):
            yield f"data: {json.dumps({'type': 'content', 'content': word + ' '})}\n\n"
            await asyncio.sleep(0.05)  # Simulate streaming delay

        # End signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Regular chat endpoint"""
    try:
        # Extract the last user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break

        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Determine which tools to use based on the message
        tools_to_use = []
        if "trade" in user_message.lower() or "tariff" in user_message.lower():
            if "news" in user_message.lower():
                tools_to_use.append("get_trade_news")
            if "gdp" in user_message.lower():
                tools_to_use.append("analyze_gdp_by_industry")
            if "census" in user_message.lower() or "import" in user_message.lower() or "export" in user_message.lower():
                tools_to_use.append("get_census_trade_data")

        # Execute tools and gather results
        tool_results = {}
        if request.use_mcp_tools:
            for tool_name in tools_to_use:
                if tool_name in AVAILABLE_TOOLS:
                    try:
                        tool = AVAILABLE_TOOLS[tool_name]
                        result = tool["handler"]({})  # Demo params
                        tool_results[tool_name] = str(result)[:500]
                    except Exception as e:
                        tool_results[tool_name] = f"Error: {str(e)}"

        # Generate response
        response = {
            "role": "assistant",
            "content": f"I've analyzed your request about '{user_message}'. ",
            "tools_used": tools_to_use,
            "tool_results": tool_results
        }

        if tool_results:
            response["content"] += "Based on the data from our trade analysis tools, "
            response["content"] += "I can provide you with specific insights. "

        response["content"] += "The trade and tariff landscape is complex and constantly evolving."

        return response

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sse/chat")
async def sse_chat_endpoint(request: ChatRequest):
    """SSE streaming chat endpoint"""
    try:
        # Extract the last user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break

        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Determine tools to use
        tools_to_use = []
        if request.use_mcp_tools and ("trade" in user_message.lower() or "tariff" in user_message.lower()):
            if "news" in user_message.lower():
                tools_to_use.append("get_trade_news")
            if "gdp" in user_message.lower():
                tools_to_use.append("analyze_gdp_by_industry")

        # Return SSE stream
        return StreamingResponse(
            generate_sse_response(user_message, tools_to_use),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable Nginx buffering
            }
        )

    except Exception as e:
        logger.error(f"SSE chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/intelligent/v2")
async def intelligent_chat_v2_endpoint(request: ChatRequest):
    """LLM-driven intelligent chat endpoint (GPT-5 with function calling)"""
    try:
        if not intelligent_chat_handler_v2:
            raise HTTPException(status_code=503, detail="LLM-driven chat handler not available")

        # Extract the last user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break

        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Process with LLM-driven handler (run in thread to avoid blocking)
        # This allows multiple concurrent requests to be processed in parallel
        result = await asyncio.to_thread(
            intelligent_chat_handler_v2.process_message,
            user_message=user_message,
            conversation_history=request.messages,
            max_iterations=request.max_iterations,
            max_total_tools=request.max_total_tools,
            max_context_tokens=request.max_context_tokens,
            preserve_recent_messages=request.preserve_recent_messages,
            system_prompt_override=request.system_prompt
        )

        return {
            "role": "assistant",
            "content": result["response"],
            "tool_calls": result.get("tool_calls", []),
            "tool_results": result.get("tool_results", {}),
            "metadata": {
                "version": "v2",
                "llm_driven": True,
                "iterations": result.get("iterations", 0),
                "tokens_used": result.get("tokens_used", 0),
                "tool_count": len(result.get("tool_calls", [])),
                "token_metadata": result.get("token_metadata", {}),
                "tool_limit_reached": result.get("tool_limit_reached", False),
                "max_iterations_reached": result.get("max_iterations_reached", False)
            }
        }

    except Exception as e:
        logger.error(f"LLM-driven chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/intelligent")
async def intelligent_chat_endpoint(request: ChatRequest):
    """Intelligent chat endpoint with automatic tool selection and calling (V1 - pattern matching)"""
    try:
        # Extract the last user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break

        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Process with intelligent chat handler (run in thread to avoid blocking)
        result = await asyncio.to_thread(
            intelligent_chat_handler.process_message,
            user_message=user_message,
            conversation_history=request.messages
        )

        return {
            "role": "assistant",
            "content": result["response"],
            "tools_used": result["tools_used"],
            "tool_calls": result["tool_calls"],
            "intent": result["intent"],
            "metadata": {
                "tool_count": len(result["tools_used"]),
                "primary_intent": result["intent"]["primary_intent"]
            }
        }

    except Exception as e:
        logger.error(f"Intelligent chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-title")
async def generate_title_endpoint(request: TitleRequest):
    """
    Quick, lightweight endpoint for generating chat titles
    Uses gpt-3.5-turbo for speed and cost efficiency
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="No message provided")

        if not openai_client.client:
            raise HTTPException(status_code=503, detail="OpenAI client not available")

        # Truncate message to first 500 characters for efficiency
        message_content = request.message[:500]

        # Call OpenAI API with gpt-3.5-turbo for fast title generation
        response = await asyncio.to_thread(
            openai_client.client.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Generate a concise, 2-6 word title for the chat message. Focus on the main topic or question. Return only the title, no explanation or punctuation at the end."
                },
                {
                    "role": "user",
                    "content": message_content
                }
            ],
            max_tokens=20,
            temperature=0.7
        )

        title = response.choices[0].message.content.strip()

        # Remove any trailing punctuation
        title = title.rstrip('.,!?;:')

        return {
            "title": title,
            "model": "gpt-3.5-turbo",
            "tokens_used": response.usage.total_tokens
        }

    except Exception as e:
        logger.error(f"Title generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp")
async def mcp_info():
    """MCP protocol information endpoint"""
    return {
        "protocol": "Model Context Protocol",
        "version": "1.0",
        "server_name": "Trade & Tariff Analysis Server",
        "capabilities": {
            "tools": len(AVAILABLE_TOOLS),
            "apis": ["BEA", "Census", "USITC", "Federal Register", "GNews", "Gemini", "BLS", "FRED", "EIA", "HUD", "USDA"],
            "streaming": True,
            "http_endpoints": True,
            "intelligent_chat": True,
            "state_reports": True
        }
    }

if __name__ == "__main__":
    import uvicorn

    # Run the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )