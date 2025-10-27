#!/usr/bin/env python3
"""
Test LLM-driven intelligent chat (V2)
Shows how GPT-5 decides which tools to use and parameters to pass
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_v2(query, description):
    print(f"\n{'='*80}")
    print(f" {description}")
    print(f"{'='*80}")
    print(f"\n💬 User: \"{query}\"")
    
    print("\n⏳ Waiting for GPT-5 to analyze and call tools...")

    response = requests.post(
        f"{BASE_URL}/chat/intelligent/v2",
        json={
            "messages": [{"role": "user", "content": query}],
            "use_mcp_tools": True
        },
        timeout=300  # Increased to 5 minutes for complex queries
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n🤖 GPT-5's Response:")
        print(f"{result['content']}\n")
        print(f"📊 Metadata:")
        print(f"   - Tools used: {result['metadata']['tool_count']}")
        print(f"   - Iterations: {result['metadata']['iterations']}")
        print(f"   - Tokens: {result['metadata']['tokens_used']}")
        print(f"\n🔧 Tool Calls Made by GPT-5:")
        for call in result.get('tool_calls', []):
            print(f"   - {call['name']}({json.dumps(call['arguments'])})")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

print("="*80)
print(" LLM-DRIVEN INTELLIGENT CHAT TEST (V2)")
print("="*80)
print("\nIn this version, GPT-5 decides:")
print("  1. Which tools to use")
print("  2. What parameters to pass")
print("  3. When to call multiple tools")
print("  4. How to interpret and synthesize results")

# Test 1: Simple stock query
test_v2(
    "How is Tesla stock doing?",
    "TEST 1: GPT-5 should extract 'TSLA' from 'Tesla'"
)

# Test 2: Complex multi-tool query  
test_v2(
    "How are tariffs affecting Tesla and the automotive industry?",
    "TEST 2: GPT-5 should use multiple tools (stock + news + search)"
)

# Test 3: Ambiguous query requiring context understanding
test_v2(
    "What's happening with steel?",
    "TEST 3: GPT-5 should understand context (tariffs + prices + news)"
)

print("\n" + "="*80)
print(" KEY ADVANTAGES OF V2 (LLM-Driven)")
print("="*80)
print("""
✅ No hard-coded patterns - LLM understands natural language
✅ Better parameter extraction - LLM knows Tesla = TSLA  
✅ Smarter tool selection - LLM picks best combination
✅ Context awareness - LLM understands user intent
✅ Easily extensible - Just add tool schema, no code changes
✅ Handles edge cases - LLM can reason about ambiguous queries
""")

