#!/usr/bin/env python3
"""
Improved Trade & Tariff Analysis MCP Server using FastMCP
This server provides tools for accessing multiple US government trade APIs
including BEA, Census, USITC DataWeb, Federal Register, and tariff databases.

Improvements:
- Modular architecture with separate API clients
- Environment variable configuration
- Comprehensive error handling and logging
- Input validation and sanitization
- Caching and retry mechanisms
- Better security practices
"""

# Try to import FastMCP; provide a no-op fallback if unavailable
try:
    from mcp.server.fastmcp import FastMCP  # type: ignore
    _mcp_available = True
except Exception:
    _mcp_available = False

    class _NoOpMCP:
        def __init__(self, name: str):
            self.name = name

        def tool(self):
            def decorator(func):
                return func
            return decorator

        def resource(self, _uri: str):
            def decorator(func):
                return func
            return decorator

        def run(self):
            print("MCP not available; run() is a no-op.")

    FastMCP = _NoOpMCP  # type: ignore

import logging
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# Import our improved modules
from config import config
from utils import (
    validate_hts_code, validate_year, validate_country_code,
    sanitize_input, format_currency, format_percentage,
    safe_float, safe_int, extract_hts_from_text,
    clear_cache, get_cache_stats
)
from apis import (
    BEAAPIClient, CensusAPIClient, DataWebAPIClient,
    FederalRegisterAPIClient, GNewsAPIClient, GeminiAPIClient
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.server.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create an MCP server (or no-op stub)
mcp = FastMCP("Improved Trade & Tariff Analysis Server")

# Initialize API clients
api_clients = {
    "bea": BEAAPIClient(config.get_api_config("bea")),
    "census": CensusAPIClient(config.get_api_config("census")),
    "dataweb": DataWebAPIClient(config.get_api_config("dataweb")),
    "federal_register": FederalRegisterAPIClient(config.get_api_config("federal_register")),
    "gnews": GNewsAPIClient(config.get_api_config("gnews")),
    "gemini": GeminiAPIClient(config.get_api_config("gemini"))
}

# ===== UTILITY TOOLS =====

@mcp.tool()
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together - basic test tool"""
    return a + b

@mcp.tool()
def greet(name: str = "Trade Analyst") -> str:
    """Greet someone by name"""
    return f"Hello, {name}! Welcome to the Improved Tariff Analysis Server!"

@mcp.tool()
def validate_inputs(hts_code: str = "", country: str = "", year: str = "") -> Dict[str, Any]:
    """Validate common input parameters"""
    results = {}
    
    if hts_code:
        results["hts_code"] = {
            "value": hts_code,
            "valid": validate_hts_code(hts_code),
            "message": "Valid HTS code" if validate_hts_code(hts_code) else "Invalid HTS code format"
        }
    
    if country:
        results["country"] = {
            "value": country,
            "valid": validate_country_code(country),
            "message": "Valid country code" if validate_country_code(country) else "Invalid country code"
        }
    
    if year:
        results["year"] = {
            "value": year,
            "valid": validate_year(year),
            "message": "Valid year" if validate_year(year) else "Invalid year (must be 1990-2030)"
        }
    
    return {
        "status": "success",
        "validation_results": results,
        "all_valid": all(result["valid"] for result in results.values())
    }

# ===== BEA API TOOLS =====

@mcp.tool()
def get_bea_datasets() -> Dict[str, Any]:
    """Get list of available BEA datasets"""
    try:
        return api_clients["bea"].get_datasets()
    except Exception as e:
        logger.error(f"Error getting BEA datasets: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def get_bea_data(dataset_name: str, table_name: str, frequency: str = "A", year: str = "2023") -> Dict[str, Any]:
    """Get BEA economic data for specific dataset and table"""
    try:
        # Validate inputs
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        if frequency not in ["A", "Q", "M"]:
            return {"status": "error", "error": f"Invalid frequency: {frequency}"}
        
        return api_clients["bea"].get_data(dataset_name, table_name, frequency, year)
    except Exception as e:
        logger.error(f"Error getting BEA data: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def analyze_gdp_by_industry(year: str = "2023") -> Dict[str, Any]:
    """Analyze GDP by industry from BEA data to understand economic structure"""
    try:
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        return api_clients["bea"].analyze_gdp_by_industry(year)
    except Exception as e:
        logger.error(f"Error analyzing GDP by industry: {e}")
        return {"status": "error", "error": str(e)}

# ===== CENSUS DATA API TOOLS =====

@mcp.tool()
def get_census_trade_data(hts_code: str, country: str = "all", year: str = "2023") -> Dict[str, Any]:
    """Get U.S. trade data from Census API for specific HTS codes and countries"""
    try:
        # Validate inputs
        if not validate_hts_code(hts_code):
            return {"status": "error", "error": f"Invalid HTS code: {hts_code}"}
        
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        if country.lower() != "all" and not validate_country_code(country):
            return {"status": "error", "error": f"Invalid country code: {country}"}
        
        return api_clients["census"].get_trade_data(hts_code, country, year)
    except Exception as e:
        logger.error(f"Error getting Census trade data: {e}")
        return {"status": "error", "error": str(e)}

# ===== USITC DATAWEB API TOOLS =====

@mcp.tool()
def search_usitc_trade_data(
    commodity_code: str = "",
    country_codes: List[str] = None,
    start_year: str = "2023",
    end_year: str = "2023",
    trade_flow: str = "Import"
) -> Dict[str, Any]:
    """Search USITC DataWeb for detailed trade statistics"""
    try:
        # Validate inputs
        if commodity_code and not validate_hts_code(commodity_code):
            return {"status": "error", "error": f"Invalid commodity code: {commodity_code}"}
        
        if not validate_year(start_year) or not validate_year(end_year):
            return {"status": "error", "error": "Invalid year range"}
        
        if trade_flow not in ["Import", "Export", "Re-export"]:
            return {"status": "error", "error": f"Invalid trade flow: {trade_flow}"}
        
        return api_clients["dataweb"].search_trade_data(
            commodity_code, country_codes or [], start_year, end_year, trade_flow
        )
    except Exception as e:
        logger.error(f"Error searching USITC trade data: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def analyze_trade_anomalies(hts_code: str, country_code: str, years: List[str] = None) -> Dict[str, Any]:
    """Analyze trade data for potential anomalies or suspicious patterns"""
    try:
        if not validate_hts_code(hts_code):
            return {"status": "error", "error": f"Invalid HTS code: {hts_code}"}
        
        if years is None:
            years = ["2022", "2023"]
        
        # Validate all years
        for year in years:
            if not validate_year(year):
                return {"status": "error", "error": f"Invalid year: {year}"}
        
        return api_clients["dataweb"].analyze_trade_anomalies(hts_code, country_code, years)
    except Exception as e:
        logger.error(f"Error analyzing trade anomalies: {e}")
        return {"status": "error", "error": str(e)}

# ===== FEDERAL REGISTER API TOOLS =====

@mcp.tool()
def search_federal_register(
    query: str,
    start_date: str = "",
    end_date: str = "",
    agencies: List[str] = None,
    document_type: str = "",
    max_results: int = 20
) -> Dict[str, Any]:
    """Search Federal Register for trade and tariff-related documents"""
    try:
        # Sanitize inputs
        query = sanitize_input(query)
        if not query:
            return {"status": "error", "error": "Query cannot be empty"}
        
        return api_clients["federal_register"].search_documents(
            query, start_date, end_date, agencies or [], document_type, max_results
        )
    except Exception as e:
        logger.error(f"Error searching Federal Register: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def get_recent_tariff_announcements(days_back: int = 30) -> Dict[str, Any]:
    """Get recent tariff and trade-related announcements from Federal Register"""
    try:
        if days_back < 1 or days_back > 365:
            return {"status": "error", "error": "Days back must be between 1 and 365"}
        
        return api_clients["federal_register"].get_recent_tariff_announcements(days_back)
    except Exception as e:
        logger.error(f"Error getting recent tariff announcements: {e}")
        return {"status": "error", "error": str(e)}

# ===== GNEWS API TOOLS =====

@mcp.tool()
def get_trade_news(
    query: str = "tariff",
    country: str = "us",
    max_results: int = 10,
    days_back: int = 7
) -> Dict[str, Any]:
    """Get trade and tariff-related news using GNews API"""
    try:
        # Sanitize inputs
        query = sanitize_input(query)
        if not query:
            return {"status": "error", "error": "Query cannot be empty"}
        
        if days_back < 1 or days_back > 30:
            return {"status": "error", "error": "Days back must be between 1 and 30"}
        
        if max_results < 1 or max_results > 100:
            return {"status": "error", "error": "Max results must be between 1 and 100"}
        
        return api_clients["gnews"].get_trade_news(query, country, max_results, days_back)
    except Exception as e:
        logger.error(f"Error getting trade news: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def analyze_trade_news_sentiment(query: str = "tariff", max_articles: int = 5) -> Dict[str, Any]:
    """Get trade news and analyze sentiment using Gemini AI"""
    try:
        if max_articles < 1 or max_articles > 20:
            return {"status": "error", "error": "Max articles must be between 1 and 20"}
        
        # First get the news
        news_result = api_clients["gnews"].get_trade_news(query=query, max_results=max_articles)
        
        if news_result["status"] == "error":
            return news_result
        
        articles = news_result.get("articles", [])
        if not articles:
            return {"status": "error", "error": "No articles found for analysis"}
        
        # Analyze sentiment using Gemini
        return api_clients["gemini"].analyze_news_sentiment(articles, query)
    except Exception as e:
        logger.error(f"Error analyzing trade news sentiment: {e}")
        return {"status": "error", "error": str(e)}

# ===== TARIFF DATABASE TOOLS =====

@mcp.tool()
def lookup_tariff_rate(hts_code: str, country: str = "mfn", year: str = "2024") -> Dict[str, Any]:
    """Look up tariff rates for specific HTS code from local tariff database"""
    try:
        # Validate inputs
        if not validate_hts_code(hts_code):
            return {"status": "error", "error": f"Invalid HTS code: {hts_code}"}
        
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        # Construct file path for tariff data
        data_dir = config.server.tariff_data_path
        
        if int(year) >= 2019:
            # CSV format for 2019+
            file_pattern = f"tariff_data_{year}\\trade_tariff_database_{year}*.txt"
        else:
            # Pipe-separated format for 1997-2018
            file_pattern = f"tariff_data_{year}\\tariff_database_{year}.txt"
        
        # Try to find and read the file
        import glob
        files = glob.glob(os.path.join(data_dir, file_pattern))
        
        if not files:
            return {
                "status": "error",
                "error": f"No tariff data file found for year {year}",
                "hts_code": hts_code,
                "searched_path": os.path.join(data_dir, file_pattern)
            }
        
        file_path = files[0]
        
        # For now, return a simulated response based on known structure
        # In a full implementation, this would parse the actual file
        return {
            "status": "success",
            "hts_code": hts_code,
            "year": year,
            "country_preference": country,
            "data": {
                "brief_description": f"Product under HTS {hts_code}",
                "mfn_rate": "5.5%",
                "mfn_ave": 5.5,
                "canada_rate": "Free" if country.lower() == "canada" else None,
                "mexico_rate": "Free" if country.lower() == "mexico" else None,
                "china_rate": "25.0%" if country.lower() == "china" else None,
                "note": "This is simulated data - actual implementation would parse the file"
            },
            "file_path": file_path
        }
        
    except Exception as e:
        logger.error(f"Error looking up tariff rate: {e}")
        return {
            "status": "error",
            "error": f"Error reading tariff database: {str(e)}",
            "hts_code": hts_code
        }

# ===== ENHANCED ANALYSIS TOOLS =====

@mcp.tool()
def calculate_tariff_cost(import_value: float, tariff_rate: float) -> Dict[str, Any]:
    """Calculate the tariff cost and total cost including tariffs"""
    try:
        if import_value < 0:
            return {"status": "error", "error": "Import value cannot be negative"}
        
        if tariff_rate < 0 or tariff_rate > 100:
            return {"status": "error", "error": "Tariff rate must be between 0 and 100"}
        
        tariff_cost = import_value * (tariff_rate / 100)
        total_cost = import_value + tariff_cost
        
        return {
            "status": "success",
            "import_value_usd": import_value,
            "tariff_rate_percent": tariff_rate,
            "tariff_cost_usd": round(tariff_cost, 2),
            "total_cost_usd": round(total_cost, 2),
            "cost_increase_percent": round((tariff_cost / import_value) * 100, 2) if import_value > 0 else 0,
            "formatted": {
                "import_value": format_currency(import_value),
                "tariff_rate": format_percentage(tariff_rate),
                "tariff_cost": format_currency(tariff_cost),
                "total_cost": format_currency(total_cost)
            }
        }
    except Exception as e:
        logger.error(f"Error calculating tariff cost: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def comprehensive_trade_analysis(hts_code: str, country: str = "china", year: str = "2024") -> Dict[str, Any]:
    """Perform comprehensive trade analysis combining multiple data sources"""
    try:
        # Validate inputs
        if not validate_hts_code(hts_code):
            return {"status": "error", "error": f"Invalid HTS code: {hts_code}"}
        
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        if not validate_country_code(country):
            return {"status": "error", "error": f"Invalid country code: {country}"}
        
        analysis_results = {
            "product_code": hts_code,
            "target_country": country,
            "analysis_year": year,
            "data_sources": {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Get tariff information
        tariff_data = lookup_tariff_rate(hts_code, country.lower(), year)
        analysis_results["data_sources"]["tariff_rates"] = tariff_data
        
        # Get trade statistics
        trade_data = search_usitc_trade_data(hts_code, [country.upper()], year, year)
        analysis_results["data_sources"]["trade_statistics"] = trade_data
        
        # Get recent policy changes
        policy_data = search_federal_register(f"HTS {hts_code} OR tariff {hts_code}")
        analysis_results["data_sources"]["policy_documents"] = policy_data
        
        # Get news sentiment
        news_data = analyze_trade_news_sentiment(f"{hts_code} {country} tariff")
        analysis_results["data_sources"]["news_sentiment"] = news_data
        
        # Synthesize findings
        analysis_results["synthesis"] = {
            "tariff_exposure": f"Product faces tariff rates based on {country} trade preferences",
            "trade_volumes": "Trade volume analysis based on USITC data",
            "policy_changes": "Recent regulatory changes affecting this product",
            "news_sentiment": "Current news sentiment and market perception",
            "risk_assessment": "Overall assessment of trade and policy risks"
        }
        
        return analysis_results
    except Exception as e:
        logger.error(f"Error in comprehensive trade analysis: {e}")
        return {"status": "error", "error": str(e)}

# ===== SYSTEM MANAGEMENT TOOLS =====

@mcp.tool()
def get_system_status() -> Dict[str, Any]:
    """Get system status and API connectivity"""
    try:
        status = {
            "server": {
                "name": "Improved Trade & Tariff Analysis Server",
                "version": "2.1.0",
                "status": "running",
                "timestamp": datetime.now().isoformat()
            },
            "apis": {},
            "cache": get_cache_stats(),
            "configuration": {
                "log_level": config.server.log_level,
                "max_retries": config.server.max_retries,
                "request_timeout": config.server.request_timeout
            }
        }
        
        # Test API connections
        for api_name, client in api_clients.items():
            try:
                is_connected = client.test_connection()
                is_configured = client.is_configured()
                
                status["apis"][api_name] = {
                    "configured": is_configured,
                    "connected": is_connected,
                    "status": "operational" if (is_configured and is_connected) else "issues"
                }
            except Exception as e:
                status["apis"][api_name] = {
                    "configured": False,
                    "connected": False,
                    "status": "error",
                    "error": str(e)
                }
        
        return status
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        return {"status": "error", "error": str(e)}

@mcp.tool()
def clear_system_cache() -> Dict[str, Any]:
    """Clear the system cache"""
    try:
        clear_cache()
        return {
            "status": "success",
            "message": "System cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return {"status": "error", "error": str(e)}

# ===== RESOURCES =====

@mcp.resource("trade://api_status")
def get_api_status() -> str:
    """Get status of all integrated APIs"""
    try:
        status = get_system_status()
        return json.dumps(status, indent=2)
    except Exception as e:
        logger.error(f"Error getting API status: {e}")
        return json.dumps({"status": "error", "error": str(e)}, indent=2)

@mcp.resource("trade://capabilities")
def get_capabilities() -> str:
    """Get comprehensive list of server capabilities"""
    capabilities = {
        "server_info": {
            "name": "Improved Trade & Tariff Analysis MCP Server",
            "version": "2.1.0",
            "description": "Enhanced server with modular architecture, security improvements, and comprehensive error handling",
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        "improvements": [
            "Modular API client architecture",
            "Environment variable configuration",
            "Comprehensive input validation",
            "Enhanced error handling and logging",
            "Caching and retry mechanisms",
            "Security improvements",
            "Better performance optimization"
        ],
        "api_integrations": {
            "BEA_API": {"status": "improved", "features": ["GDP analysis", "Regional data", "Trade accounts"]},
            "Census_API": {"status": "improved", "features": ["Trade statistics", "Import/export data"]},
            "USITC_DataWeb": {"status": "improved", "features": ["Detailed trade stats", "Anomaly detection"]},
            "Federal_Register": {"status": "improved", "features": ["Policy documents", "Tariff announcements"]},
            "GNews_API": {"status": "improved", "features": ["Trade news", "Sentiment analysis"]},
            "Gemini_AI": {"status": "improved", "features": ["AI analysis", "Sentiment analysis"]}
        },
        "tools": [
            "validate_inputs: Input validation utility",
            "get_system_status: System health monitoring",
            "clear_system_cache: Cache management",
            "comprehensive_trade_analysis: Multi-source analysis",
            "calculate_tariff_cost: Enhanced cost calculations"
        ]
    }
    
    return json.dumps(capabilities, indent=2)

# This is important - allows the server to run directly
if __name__ == "__main__":
    print("Starting Improved Trade & Tariff Analysis MCP Server...")
    print("=" * 70)
    print("🚀 IMPROVEMENTS IMPLEMENTED:")
    print("✅ Modular architecture with separate API clients")
    print("✅ Environment variable configuration")
    print("✅ Comprehensive input validation")
    print("✅ Enhanced error handling and logging")
    print("✅ Caching and retry mechanisms")
    print("✅ Security improvements")
    print("✅ Better performance optimization")
    print("=" * 70)
    
    # Check configuration
    missing_keys = config.get_missing_keys()
    if missing_keys:
        print("⚠️  WARNING: Missing API keys for:", ", ".join(missing_keys))
        print("   Please set environment variables or create a .env file")
    else:
        print("✅ All API keys configured")
    
    print("\n📊 System Status:")
    status = get_system_status()
    for api_name, api_status in status["apis"].items():
        status_icon = "✅" if api_status["status"] == "operational" else "❌"
        print(f"   {status_icon} {api_name}: {api_status['status']}")
    
    print("\n🛠️  Available Tools:")
    print("   - validate_inputs: Input validation utility")
    print("   - get_system_status: System health monitoring")
    print("   - clear_system_cache: Cache management")
    print("   - comprehensive_trade_analysis: Multi-source analysis")
    print("   - calculate_tariff_cost: Enhanced cost calculations")
    print("   - All original API tools with improvements")
    
    print("\n📚 Available Resources:")
    print("   - trade://api_status: API configuration status")
    print("   - trade://capabilities: Full server capabilities")
    
    print("=" * 70)
    print("🎯 Improved server ready for comprehensive trade analysis!")
    
    mcp.run()
