#!/usr/bin/env python3
"""
Comprehensive test script for all MCP server tools
Tests each tool individually and shows results
"""
import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def print_header(text: str):
    """Print a formatted header"""
    print("\n" + "="*80)
    print(f" {text}")
    print("="*80)

def print_success(text: str):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text: str):
    """Print error message"""
    print(f"❌ {text}")

def print_result(result: Dict[str, Any], max_lines: int = 10):
    """Print formatted result"""
    if isinstance(result, dict):
        if result.get("success"):
            print_success("Tool executed successfully")
            if result.get("result"):
                result_data = result["result"]
                if isinstance(result_data, dict):
                    for key, value in list(result_data.items())[:max_lines]:
                        if isinstance(value, (list, dict)):
                            print(f"  {key}: {type(value).__name__} with {len(value)} items")
                        else:
                            print(f"  {key}: {value}")
                else:
                    print(f"  Result: {str(result_data)[:200]}")
        else:
            print_error(f"Tool failed: {result.get('error', 'Unknown error')}")
    else:
        print(f"  {str(result)[:200]}")

def test_tool(tool_name: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Test a single tool"""
    if params is None:
        params = {}

    print(f"\n🔧 Testing: {tool_name}")
    print(f"   Parameters: {json.dumps(params, indent=2)}")

    try:
        response = requests.post(
            f"{BASE_URL}/execute",
            json={"tool_name": tool_name, "parameters": params},
            timeout=30
        )
        result = response.json()
        print_result(result)
        return result
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    print_header("MCP SERVER TOOL TESTING SUITE")

    # Check if server is running
    print("\n🔍 Checking server status...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        health = response.json()
        print_success("Server is running")
        print(f"   Status: {health.get('status')}")
        print(f"   Services: {health.get('services')}")
    except Exception as e:
        print_error(f"Server is not running: {e}")
        print("\nPlease start the server with: python http_server.py")
        return

    # Get list of all tools
    print("\n📋 Getting list of available tools...")
    try:
        response = requests.get(f"{BASE_URL}/tools", timeout=5)
        tools_data = response.json()
        tools = tools_data.get("tools", [])
        print_success(f"Found {len(tools)} tools")
        for tool in tools:
            print(f"   - {tool['name']}: {tool['description']}")
    except Exception as e:
        print_error(f"Failed to get tools: {e}")
        return

    # Test each category of tools

    # ========================================
    # 1. WEB SEARCH TOOLS
    # ========================================
    print_header("1. WEB SEARCH TOOLS")

    test_tool("search_web", {
        "query": "US tariffs 2024",
        "max_results": 3
    })
    time.sleep(1)

    test_tool("search_news", {
        "query": "Trump tariffs China",
        "max_results": 3
    })
    time.sleep(1)

    test_tool("search_tariff_info", {
        "topic": "steel"
    })
    time.sleep(1)

    test_tool("get_trade_policy_news", {
        "country": "US"
    })
    time.sleep(1)

    # ========================================
    # 2. YFINANCE / MARKET DATA TOOLS
    # ========================================
    print_header("2. YFINANCE / MARKET DATA TOOLS")

    test_tool("get_market_indices", {})
    time.sleep(1)

    test_tool("get_stock_info", {
        "symbol": "TSLA"
    })
    time.sleep(1)

    test_tool("get_stock_history", {
        "symbol": "AAPL",
        "period": "5d"
    })
    time.sleep(1)

    test_tool("search_stocks_by_sector", {
        "sector": "steel",
        "limit": 5
    })
    time.sleep(1)

    # ========================================
    # 3. BEA (Bureau of Economic Analysis) TOOLS
    # ========================================
    print_header("3. BEA (BUREAU OF ECONOMIC ANALYSIS) TOOLS")

    test_tool("get_bea_datasets", {})
    time.sleep(1)

    # ========================================
    # 4. FEDERAL REGISTER TOOLS
    # ========================================
    print_header("4. FEDERAL REGISTER TOOLS")

    test_tool("get_recent_tariff_announcements", {
        "days": 30
    })
    time.sleep(1)

    # ========================================
    # 5. USITC DATAWEB TOOLS
    # ========================================
    print_header("5. USITC DATAWEB TOOLS")

    test_tool("search_usitc_trade_data", {
        "hts_code": "8703",
        "start_year": 2023,
        "end_year": 2024
    })
    time.sleep(1)

    # ========================================
    # 6. GNEWS TOOLS
    # ========================================
    print_header("6. GNEWS TOOLS")

    test_tool("get_trade_news", {
        "query": "tariff",
        "max_results": 3,
        "days_back": 7
    })

    # ========================================
    # SUMMARY
    # ========================================
    print_header("TEST SUMMARY")
    print("\n✅ Testing complete!")
    print("\nKey tools tested:")
    print("  1. Web Search - For real-time tariff and trade information")
    print("  2. Market Data - For stock and sector analysis")
    print("  3. Government APIs - For official data (BEA, Federal Register, USITC)")
    print("  4. News - For current events and policy changes")
    print("\nYour MCP server now has comprehensive tools for tariff and trade analysis!")

if __name__ == "__main__":
    main()
