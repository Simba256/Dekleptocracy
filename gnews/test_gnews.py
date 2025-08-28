#!/usr/bin/env python3
"""
Simple test script to verify GNews API functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Your GNews API key
GNEWS_API_KEY = "afcc06e1baf1f551f5231cf621a210e4"

def test_gnews_basic():
    """Basic GNews API test"""
    print("🔍 Testing GNews API - Basic Test")
    print("=" * 50)
    
    url = "https://gnews.io/api/v4/search"
    params = {
        "q": "news",
        "lang": "en",
        "country": "us",
        "max": 5,
        "apikey": GNEWS_API_KEY
    }
    
    try:
        print(f"📡 Making request to: {url}")
        print(f"🔑 Using API key: {GNEWS_API_KEY}")
        print(f"📋 Parameters: {params}")
        print()
        
        response = requests.get(url, params=params, timeout=30)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📏 Response Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! GNews API is working")
            print(f"📰 Total articles: {data.get('totalArticles', 0)}")
            print(f"🔢 Articles returned: {len(data.get('articles', []))}")
            
            # Show first article
            articles = data.get('articles', [])
            if articles:
                first = articles[0]
                print(f"\n📄 Sample Article:")
                print(f"   Title: {first.get('title', 'N/A')}")
                print(f"   Source: {first.get('source', {}).get('name', 'N/A')}")
                print(f"   Published: {first.get('publishedAt', 'N/A')}")
            
            return True, data
            
        else:
            print(f"❌ ERROR: Status {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False, None

def test_gnews_tariff_search():
    """Test GNews with tariff-specific search"""
    print("\n🔍 Testing GNews API - Tariff Search")
    print("=" * 50)
    
    url = "https://gnews.io/api/v4/search"
    date_from = (datetime.now() - timedelta(days=30)).isoformat("T") + "Z"
    
    params = {
        "q": "tariff OR trade war OR import duty",
        "lang": "en", 
        "country": "us",
        "max": 10,
        "from": date_from,
        "sortby": "publishedAt",
        "apikey": GNEWS_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Tariff search successful!")
            print(f"📰 Found {data.get('totalArticles', 0)} tariff-related articles")
            
            articles = data.get('articles', [])
            print(f"📋 Showing {len(articles)} recent articles:")
            
            for i, article in enumerate(articles[:5], 1):
                print(f"\n   {i}. {article.get('title', 'No title')}")
                print(f"      Source: {article.get('source', {}).get('name', 'Unknown')}")
                print(f"      Date: {article.get('publishedAt', 'Unknown')}")
            
            return True, data
        else:
            print(f"❌ Tariff search failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Tariff search exception: {e}")
        return False, None

def test_gnews_account_info():
    """Test GNews account/quota information"""
    print("\n🔍 Testing GNews API - Account Information")
    print("=" * 50)
    
    # Try to get account info (if available)
    url = "https://gnews.io/api/v4/search"
    params = {
        "q": "test",
        "max": 1,
        "apikey": GNEWS_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        
        print(f"Response Headers:")
        for header, value in response.headers.items():
            if any(keyword in header.lower() for keyword in ['limit', 'quota', 'rate', 'remaining']):
                print(f"   {header}: {value}")
        
        if response.status_code == 200:
            print("✅ Account access confirmed")
        elif response.status_code == 403:
            print("❌ 403 Forbidden - Possible issues:")
            print("   • API key might be invalid")
            print("   • Account might need verification")
            print("   • Daily/monthly quota might be exceeded")
            print("   • IP address might be blocked")
        elif response.status_code == 429:
            print("❌ 429 Too Many Requests - Rate limit exceeded")
        else:
            print(f"❌ Status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Account test exception: {e}")

def diagnose_api_key():
    """Diagnose potential API key issues"""
    print("\n🔧 GNews API Key Diagnosis")
    print("=" * 50)
    
    api_key = GNEWS_API_KEY
    
    print(f"🔑 API Key: {api_key}")
    print(f"📏 Length: {len(api_key)} characters")
    print(f"✅ Expected length: 32 characters")
    
    if len(api_key) == 32:
        print("✅ API key length is correct")
    else:
        print("❌ API key length is incorrect")
    
    # Check character pattern
    if api_key.isalnum():
        print("✅ API key contains only alphanumeric characters")
    else:
        print("❌ API key contains non-alphanumeric characters")
    
    print(f"\n📋 API Key Analysis:")
    print(f"   Format: {'✅ Valid' if len(api_key) == 32 and api_key.isalnum() else '❌ Invalid'}")
    print(f"   First 8 chars: {api_key[:8]}")
    print(f"   Last 8 chars: {api_key[-8:]}")

def main():
    """Run all GNews tests"""
    print("🚀 GNews API Test Suite")
    print("🔑 API Key: afcc06e1baf1f551f5231cf621a210e4")
    print("🌐 Endpoint: https://gnews.io/api/v4/search")
    print("\n" + "=" * 60)
    
    # Run diagnostics first
    diagnose_api_key()
    
    # Test basic functionality
    basic_success, basic_data = test_gnews_basic()
    
    # Test tariff search if basic works
    if basic_success:
        tariff_success, tariff_data = test_gnews_tariff_search()
    else:
        tariff_success = False
    
    # Check account info
    test_gnews_account_info()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    print(f"Basic API Test:     {'✅ PASS' if basic_success else '❌ FAIL'}")
    print(f"Tariff Search:      {'✅ PASS' if tariff_success else '❌ FAIL'}")
    
    if basic_success:
        print("\n🎉 GNews API is working correctly!")
        print("\n📝 Next steps:")
        print("1. Your API key is valid and functional")
        print("2. You can integrate with the MCP server")
        print("3. Run: python server.py (in gnews folder)")
    else:
        print("\n⚠️ GNews API is not working. Possible solutions:")
        print("1. Check if API key needs activation at https://gnews.io")
        print("2. Verify account status and billing")
        print("3. Check daily/monthly usage limits")
        print("4. Contact GNews support if needed")
        print("\n💡 Alternative: Use Federal Register API (already working)")

if __name__ == "__main__":
    main()
