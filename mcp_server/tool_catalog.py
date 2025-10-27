"""
Comprehensive tool catalog with detailed descriptions, parameters, and examples
This helps AI models understand when and how to use each tool
"""

TOOL_CATALOG = {
    # ============================================
    # WEB SEARCH TOOLS - For current information
    # ============================================
    "search_web": {
        "description": "Search the web for current information about tariffs, trade policy, or any topic",
        "when_to_use": [
            "User asks about current tariff policies or recent changes",
            "Need to find general information not in specialized databases",
            "Looking for news, articles, or analysis about trade topics",
            "Want broad web search results"
        ],
        "parameters": {
            "query": {
                "type": "string",
                "required": True,
                "description": "Search query (e.g., 'US China tariffs 2024', 'steel import duties')"
            },
            "max_results": {
                "type": "integer",
                "default": 10,
                "range": "1-20",
                "description": "Number of results to return"
            },
            "region": {
                "type": "string",
                "default": "us-en",
                "description": "Region code (us-en, uk-en, etc.)"
            }
        },
        "examples": [
            {
                "user_query": "What are the current tariffs on Chinese goods?",
                "tool_call": {"query": "US tariffs on Chinese goods 2024", "max_results": 5}
            },
            {
                "user_query": "Tell me about steel import duties",
                "tool_call": {"query": "steel import tariffs duties", "max_results": 10}
            }
        ]
    },

    "search_news": {
        "description": "Search for recent news articles about trade, tariffs, or policy changes",
        "when_to_use": [
            "User asks 'what's the latest news about...'",
            "Need recent developments or announcements",
            "Looking for breaking news on trade policy",
            "Want news-specific results rather than general web"
        ],
        "parameters": {
            "query": {
                "type": "string",
                "required": True,
                "description": "News search query"
            },
            "max_results": {
                "type": "integer",
                "default": 10,
                "range": "1-20"
            },
            "region": {
                "type": "string",
                "default": "us-en"
            }
        },
        "examples": [
            {
                "user_query": "What's the latest news on Trump tariffs?",
                "tool_call": {"query": "Trump tariffs latest", "max_results": 5}
            },
            {
                "user_query": "Recent trade war developments",
                "tool_call": {"query": "US China trade war recent", "max_results": 10}
            }
        ]
    },

    "search_tariff_info": {
        "description": "Specialized search for tariff-specific information on a particular topic or commodity",
        "when_to_use": [
            "User asks specifically about tariffs on a product/commodity",
            "Need focused tariff information rather than general search",
            "Looking for tariff rates, policies, or regulations"
        ],
        "parameters": {
            "topic": {
                "type": "string",
                "required": True,
                "description": "Commodity or topic (e.g., 'steel', 'aluminum', 'semiconductors', 'automobiles')"
            }
        },
        "examples": [
            {
                "user_query": "What are the tariffs on steel imports?",
                "tool_call": {"topic": "steel"}
            },
            {
                "user_query": "Tell me about semiconductor tariffs",
                "tool_call": {"topic": "semiconductors"}
            }
        ]
    },

    "get_trade_policy_news": {
        "description": "Get recent trade policy news for a specific country",
        "when_to_use": [
            "User asks about a country's trade policy",
            "Need policy-focused news rather than general news",
            "Looking for government policy announcements"
        ],
        "parameters": {
            "country": {
                "type": "string",
                "default": "US",
                "description": "Country name (e.g., 'US', 'China', 'EU')"
            }
        },
        "examples": [
            {
                "user_query": "What's happening with US trade policy?",
                "tool_call": {"country": "US"}
            },
            {
                "user_query": "China's recent trade policies",
                "tool_call": {"country": "China"}
            }
        ]
    },

    # ============================================
    # MARKET DATA TOOLS - For financial analysis
    # ============================================
    "get_market_indices": {
        "description": "Get current values of major US stock market indices (S&P 500, Dow Jones, NASDAQ, Russell 2000)",
        "when_to_use": [
            "User asks about stock market performance",
            "Need context on market conditions",
            "Analyzing market impact of trade policies",
            "User wants to know how the market is doing"
        ],
        "parameters": {},
        "examples": [
            {
                "user_query": "How is the stock market doing?",
                "tool_call": {}
            },
            {
                "user_query": "What's the current S&P 500?",
                "tool_call": {}
            }
        ]
    },

    "get_stock_info": {
        "description": "Get comprehensive information about a specific stock including price, market cap, PE ratio, sector, industry",
        "when_to_use": [
            "User asks about a specific company's stock",
            "Need financial details for a company",
            "Analyzing company affected by tariffs",
            "User mentions a stock ticker or company name"
        ],
        "parameters": {
            "symbol": {
                "type": "string",
                "required": True,
                "description": "Stock ticker symbol (e.g., 'AAPL', 'TSLA', 'F', 'X' for US Steel)"
            }
        },
        "examples": [
            {
                "user_query": "How is Tesla stock doing?",
                "tool_call": {"symbol": "TSLA"}
            },
            {
                "user_query": "What's the price of Apple stock?",
                "tool_call": {"symbol": "AAPL"}
            },
            {
                "user_query": "Tell me about US Steel",
                "tool_call": {"symbol": "X"}
            }
        ]
    },

    "get_stock_history": {
        "description": "Get historical stock price data for trend analysis",
        "when_to_use": [
            "User asks about stock performance over time",
            "Need historical price trends",
            "Analyzing impact of tariff announcements on stock price",
            "User asks 'how has [stock] performed'"
        ],
        "parameters": {
            "symbol": {
                "type": "string",
                "required": True,
                "description": "Stock ticker symbol"
            },
            "period": {
                "type": "string",
                "default": "1mo",
                "options": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"],
                "description": "Time period for historical data"
            }
        },
        "examples": [
            {
                "user_query": "How has Ford stock performed this year?",
                "tool_call": {"symbol": "F", "period": "1y"}
            },
            {
                "user_query": "Show me Tesla's stock for the past month",
                "tool_call": {"symbol": "TSLA", "period": "1mo"}
            }
        ]
    },

    "search_stocks_by_sector": {
        "description": "Get stocks in a specific sector affected by trade/tariffs",
        "when_to_use": [
            "User asks about an industry or sector",
            "Need to analyze sector-wide impacts",
            "User mentions 'automotive', 'steel', 'technology', etc.",
            "Looking for multiple companies in same industry"
        ],
        "parameters": {
            "sector": {
                "type": "string",
                "required": True,
                "options": ["technology", "automotive", "retail", "agriculture", "manufacturing", "steel", "energy"],
                "description": "Industry sector"
            },
            "limit": {
                "type": "integer",
                "default": 10,
                "description": "Number of stocks to return"
            }
        },
        "examples": [
            {
                "user_query": "Which steel companies are affected by tariffs?",
                "tool_call": {"sector": "steel", "limit": 5}
            },
            {
                "user_query": "Show me automotive stocks",
                "tool_call": {"sector": "automotive", "limit": 10}
            }
        ]
    },

    # ============================================
    # GOVERNMENT DATA TOOLS - For official data
    # ============================================
    "get_bea_datasets": {
        "description": "Get list of available economic datasets from Bureau of Economic Analysis",
        "when_to_use": [
            "User asks about available economic data",
            "Need to see what BEA data is available",
            "Starting point for economic analysis"
        ],
        "parameters": {},
        "examples": [
            {
                "user_query": "What economic data is available?",
                "tool_call": {}
            }
        ]
    },

    "get_trade_news": {
        "description": "Get trade-related news from GNews API with filtering",
        "when_to_use": [
            "Need news from a specific news API",
            "Want news from particular countries",
            "Need configurable time range for news"
        ],
        "parameters": {
            "query": {
                "type": "string",
                "default": "tariff",
                "description": "Search query"
            },
            "country": {
                "type": "string",
                "default": "us",
                "description": "Country code (us, uk, etc.)"
            },
            "max_results": {
                "type": "integer",
                "default": 10
            },
            "days_back": {
                "type": "integer",
                "default": 7,
                "description": "How many days back to search"
            }
        },
        "examples": [
            {
                "user_query": "Trade news from last 2 weeks",
                "tool_call": {"query": "trade", "days_back": 14, "max_results": 5}
            }
        ]
    }
}

def get_tool_selection_prompt() -> str:
    """
    Generate a system prompt that teaches the AI how to select tools
    """
    return """You are a Trade & Tariff Analysis Assistant with access to specialized tools.

# YOUR CAPABILITIES:

## 1. WEB SEARCH TOOLS (Use for current information)
- **search_web**: General web search for any topic
- **search_news**: Recent news articles (use when user asks "what's the latest...")
- **search_tariff_info**: Focused tariff searches for specific commodities
- **get_trade_policy_news**: Country-specific trade policy news

## 2. MARKET DATA TOOLS (Use for financial analysis)
- **get_market_indices**: Current market performance (S&P 500, Dow, NASDAQ)
- **get_stock_info**: Detailed info for a specific stock (use when user mentions a company)
- **get_stock_history**: Historical price trends (use when user asks "how has... performed")
- **search_stocks_by_sector**: Industry/sector analysis

## 3. GOVERNMENT DATA TOOLS (Use for official statistics)
- **get_bea_datasets**: Economic datasets
- **get_trade_news**: GNews API for trade news

# TOOL SELECTION STRATEGY:

1. **Identify User Intent**:
   - Current news? → search_news
   - Specific tariff? → search_tariff_info
   - Stock/company? → get_stock_info
   - Market overview? → get_market_indices
   - Industry analysis? → search_stocks_by_sector
   - General info? → search_web

2. **Use Multiple Tools When Helpful**:
   - For "How do tariffs affect Tesla?": Use search_tariff_info + get_stock_info
   - For "Market impact of tariffs": Use get_market_indices + search_news
   - For sector analysis: Use search_stocks_by_sector + search_news

3. **Extract Parameters Smartly**:
   - Company names → Convert to ticker (Tesla→TSLA, Apple→AAPL, Ford→F)
   - Time references → Convert to period (this year→1y, this month→1mo)
   - Industries → Use sector names (cars→automotive, tech→technology)

# EXAMPLE CONVERSATIONS:

User: "What are the current tariffs on Chinese steel?"
Think: User wants specific tariff information
Tool: search_tariff_info(topic="steel")
Also: search_news(query="China steel tariffs 2024")

User: "How is Tesla doing?"
Think: User wants stock information
Tool: get_stock_info(symbol="TSLA")

User: "What's happening in the market?"
Think: User wants general market overview
Tool: get_market_indices()

User: "How have tariffs affected automotive companies?"
Think: User wants sector analysis + context
Tools:
  1. search_stocks_by_sector(sector="automotive")
  2. search_news(query="tariffs automotive industry")

# IMPORTANT RULES:

1. ALWAYS use tools before answering - don't make up information
2. Use multiple tools when it provides better context
3. Extract parameters intelligently from user queries
4. Combine tool results to give comprehensive answers
5. Cite sources from tool results when possible

Now assist the user with their trade and tariff questions!"""

def get_tool_by_name(tool_name: str) -> dict:
    """Get detailed information about a specific tool"""
    return TOOL_CATALOG.get(tool_name, {})

def get_all_tool_descriptions() -> str:
    """Get formatted descriptions of all tools for AI"""
    descriptions = []
    for name, info in TOOL_CATALOG.items():
        desc = f"\n## {name}\n"
        desc += f"Description: {info['description']}\n"
        desc += f"When to use: {', '.join(info['when_to_use'])}\n"
        if info['parameters']:
            desc += "Parameters:\n"
            for param, details in info['parameters'].items():
                required = " (REQUIRED)" if details.get('required') else " (optional)"
                desc += f"  - {param}{required}: {details['description']}\n"
        if info['examples']:
            desc += "Examples:\n"
            for ex in info['examples'][:1]:  # Show first example
                desc += f"  User: \"{ex['user_query']}\"\n"
                desc += f"  Call: {name}({ex['tool_call']})\n"
        descriptions.append(desc)
    return "\n".join(descriptions)
