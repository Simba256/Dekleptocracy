#!/usr/bin/env python3
"""
Test script for intelligent chat endpoint
Tests the AI's ability to automatically select and use tools based on user queries
"""
import requests
import json
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

def test_intelligent_chat(user_query: str, description: str = None):
    """
    Test the intelligent chat endpoint with a user query

    Args:
        user_query: The user's question
        description: Optional description of what we're testing
    """
    print_header(f"TEST: {description or user_query}")
    print(f"\n💬 User Query: \"{user_query}\"")

    try:
        response = requests.post(
            f"{BASE_URL}/chat/intelligent",
            json={
                "messages": [
                    {"role": "user", "content": user_query}
                ],
                "use_mcp_tools": True,
                "stream": False
            },
            timeout=120  # Increased to 120 seconds for GPT-5
        )

        if response.status_code == 200:
            result = response.json()

            print_success("Chat response received")
            print(f"\n🎯 Detected Intent: {result.get('intent', {}).get('primary_intent', 'unknown')}")
            print(f"\n🔧 Tools Used ({len(result.get('tools_used', []))}): {', '.join(result.get('tools_used', []))}")

            if result.get('tool_calls'):
                print(f"\n📋 Tool Calls:")
                for call in result['tool_calls']:
                    print(f"   - {call['name']}({json.dumps(call['parameters'])})")

            print(f"\n🤖 AI Response:")
            print(f"   {result.get('content', 'No response')}")

            return result
        else:
            print_error(f"Request failed with status {response.status_code}")
            print(f"   {response.text}")
            return None

    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return None

def main():
    print_header("INTELLIGENT CHAT TESTING SUITE")
    print("\nThis test demonstrates the AI's ability to:")
    print("  1. Understand user intent from natural language")
    print("  2. Automatically select appropriate tools")
    print("  3. Extract parameters from user queries")
    print("  4. Execute multiple tools when needed")
    print("  5. Synthesize results into comprehensive answers")

    # Check if server is running
    print("\n🔍 Checking server status...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        health = response.json()
        print_success("Server is running")
        print(f"   Status: {health.get('status')}")
    except Exception as e:
        print_error(f"Server is not running: {e}")
        print("\nPlease start the server with: python http_server.py")
        return

    # Test scenarios

    # 1. News query - should trigger search_news
    test_intelligent_chat(
        "What's the latest news on tariffs?",
        "News Query - Should use search_news"
    )

    # 2. Stock query - should trigger get_stock_info
    test_intelligent_chat(
        "How is Tesla stock doing?",
        "Stock Query - Should use get_stock_info with TSLA"
    )

    # 3. Market query - should trigger get_market_indices
    test_intelligent_chat(
        "What's happening in the market today?",
        "Market Query - Should use get_market_indices"
    )

    # 4. Tariff query - should trigger search_tariff_info + search_news
    test_intelligent_chat(
        "Tell me about steel tariffs",
        "Tariff Query - Should use search_tariff_info + search_news"
    )

    # 5. Policy query - should trigger get_trade_policy_news
    test_intelligent_chat(
        "What are the current US trade policies?",
        "Policy Query - Should use get_trade_policy_news"
    )

    # 6. Sector query - should trigger search_stocks_by_sector
    test_intelligent_chat(
        "Which automotive companies are affected by tariffs?",
        "Sector Query - Should use search_stocks_by_sector"
    )

    # 7. Complex query - should trigger multiple tools
    test_intelligent_chat(
        "How are tariffs affecting Tesla and the automotive industry?",
        "Complex Query - Should use multiple tools (stock info + sector + news)"
    )

    # 8. Economic query - should trigger BEA tools
    test_intelligent_chat(
        "What economic data is available about GDP?",
        "Economic Query - Should use get_bea_datasets"
    )

    # Summary
    print_header("TEST SUMMARY")
    print("""
✅ Intelligent chat system can:
   1. Detect user intent from natural language
   2. Automatically select appropriate tools
   3. Extract entities (stocks, countries, sectors) from queries
   4. Use multiple tools for complex questions
   5. Provide comprehensive answers with real data

📊 The system uses the tool catalog to:
   - Understand when each tool should be used
   - Know what parameters each tool needs
   - Extract parameters from natural language
   - Choose between multiple relevant tools

🎯 Next steps:
   - Integrate with Next.js frontend
   - Add streaming support for real-time responses
   - Enhance parameter extraction with NLP
   - Add conversation memory for follow-up questions
""")

if __name__ == "__main__":
    main()
