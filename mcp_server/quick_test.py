#!/usr/bin/env python3
"""
Quick test script - tests a few key tools to verify everything is working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_tool(name, params):
    """Test a single tool"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")
    try:
        response = requests.post(
            f"{BASE_URL}/execute",
            json={"tool_name": name, "parameters": params},
            timeout=30
        )
        result = response.json()

        if result.get("success"):
            print("✅ SUCCESS")
            # Pretty print the result
            if result.get("result"):
                print("\nResult:")
                print(json.dumps(result["result"], indent=2)[:1000])
        else:
            print(f"❌ FAILED: {result.get('error')}")

        return result
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

# Quick tests
print("\n" + "="*60)
print(" QUICK MCP SERVER TOOL TEST")
print("="*60)

# 1. Test web search
test_tool("search_news", {"query": "tariffs 2024", "max_results": 3})

# 2. Test market data
test_tool("get_market_indices", {})

# 3. Test stock info
test_tool("get_stock_info", {"symbol": "TSLA"})

# 4. Test BEA
test_tool("get_bea_datasets", {})

print("\n" + "="*60)
print(" TESTS COMPLETE")
print("="*60)
print("\nIf all tests passed, your MCP server is working correctly!")
print("Run 'python test_all_tools.py' for comprehensive testing.")
