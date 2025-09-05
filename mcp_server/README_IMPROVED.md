# Improved Trade & Tariff Analysis MCP Server

A comprehensive, production-ready Model Context Protocol (MCP) server for trade and tariff analysis, built with security, performance, and maintainability in mind.

## 🚀 Key Improvements

### ✅ **Security Enhancements**
- **Environment Variables**: All API keys moved to environment variables
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error messages without sensitive data exposure

### ✅ **Modular Architecture**
- **Separate API Clients**: Each API has its own dedicated client class
- **Base API Class**: Common functionality shared across all APIs
- **Configuration Management**: Centralized configuration with validation

### ✅ **Performance Optimizations**
- **Intelligent Caching**: Function result caching with TTL
- **Retry Mechanisms**: Exponential backoff for failed requests
- **Rate Limiting**: Built-in rate limiting awareness
- **Connection Pooling**: Reusable HTTP connections

### ✅ **Enhanced Error Handling**
- **Comprehensive Logging**: Structured logging with different levels
- **Graceful Degradation**: System continues working even if some APIs fail
- **Detailed Error Messages**: Helpful error messages for debugging

### ✅ **Input Validation**
- **HTS Code Validation**: Proper format validation for tariff codes
- **Year Validation**: Range checking for years (1990-2030)
- **Country Code Validation**: Support for common country codes
- **Parameter Sanitization**: Protection against injection attacks

## 📁 Project Structure

```
mcp_server/
├── config.py                 # Configuration management
├── utils.py                  # Utility functions and helpers
├── apis/                     # API client modules
│   ├── __init__.py
│   ├── base_api.py          # Base API client class
│   ├── bea_api.py           # BEA API client
│   ├── census_api.py        # Census API client
│   ├── dataweb_api.py       # USITC DataWeb client
│   ├── federal_register_api.py # Federal Register client
│   ├── gnews_api.py         # GNews API client
│   └── gemini_api.py        # Gemini AI client
├── tariff_server_improved.py # Main improved server
├── tests/                    # Test suite
│   ├── test_config.py
│   ├── test_utils.py
│   ├── test_apis.py
│   └── test_integration.py
├── requirements.txt          # Dependencies
└── README_IMPROVED.md       # This file
```

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in the `mcp_server` directory:

```env
# API Configuration
BEA_API_KEY=your_bea_api_key_here
DATAWEB_TOKEN=your_dataweb_token_here
GOVINFO_API_KEY=your_govinfo_api_key_here
REGULATIONS_API_KEY=your_regulations_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
LOG_LEVEL=INFO
MAX_RETRIES=3
REQUEST_TIMEOUT=30
CACHE_TTL=300

# Data Paths
TARIFF_DATA_PATH=../Data_Collection/tariff_data
COMMODITY_TRANSLATION_PATH=../Data_Collection/commodity_translation
```

### 3. Run the Server
```bash
python tariff_server_improved.py
```

## 🛠️ Available Tools

### **System Management**
- `validate_inputs(hts_code, country, year)` - Validate input parameters
- `get_system_status()` - Get system health and API status
- `clear_system_cache()` - Clear the function result cache

### **BEA API Tools**
- `get_bea_datasets()` - Get available BEA datasets
- `get_bea_data(dataset, table, frequency, year)` - Get economic data
- `analyze_gdp_by_industry(year)` - Analyze GDP by industry

### **Census API Tools**
- `get_census_trade_data(hts_code, country, year)` - Get trade statistics

### **USITC DataWeb Tools**
- `search_usitc_trade_data(commodity_code, countries, start_year, end_year, trade_flow)` - Search trade data
- `analyze_trade_anomalies(hts_code, country, years)` - Detect trade anomalies

### **Federal Register Tools**
- `search_federal_register(query, start_date, end_date, agencies, document_type, max_results)` - Search policy documents
- `get_recent_tariff_announcements(days_back)` - Get recent announcements

### **GNews API Tools**
- `get_trade_news(query, country, max_results, days_back)` - Get trade news
- `analyze_trade_news_sentiment(query, max_articles)` - Analyze news sentiment

### **Tariff Database Tools**
- `lookup_tariff_rate(hts_code, country, year)` - Look up tariff rates
- `calculate_tariff_cost(import_value, tariff_rate)` - Calculate costs

### **Analysis Tools**
- `comprehensive_trade_analysis(hts_code, country, year)` - Multi-source analysis

## 📊 Available Resources

- `trade://api_status` - API configuration and status
- `trade://capabilities` - Full server capabilities and improvements

## 🔍 Usage Examples

### Basic Tariff Lookup
```python
# Look up tariff rate for Chinese cars
result = lookup_tariff_rate("87032300", "china", "2024")
```

### Comprehensive Analysis
```python
# Get comprehensive analysis for a product
analysis = comprehensive_trade_analysis("87032300", "china", "2024")
```

### Input Validation
```python
# Validate inputs before processing
validation = validate_inputs("87032300", "china", "2024")
if validation["all_valid"]:
    # Proceed with analysis
    pass
```

### System Monitoring
```python
# Check system health
status = get_system_status()
print(f"BEA API: {status['apis']['bea']['status']}")
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test modules
python -m pytest tests/test_config.py -v
python -m pytest tests/test_utils.py -v
python -m pytest tests/test_apis.py -v
```

## 📈 Performance Features

### **Caching**
- Function results are cached with configurable TTL
- Cache statistics available via `get_cache_stats()`
- Cache can be cleared with `clear_system_cache()`

### **Retry Logic**
- Automatic retry with exponential backoff
- Configurable retry attempts
- Graceful handling of rate limits

### **Rate Limiting**
- Built-in awareness of API rate limits
- Intelligent request spacing
- Rate limit information in API responses

## 🔒 Security Features

### **Input Validation**
- HTS code format validation
- Year range validation (1990-2030)
- Country code validation
- Parameter sanitization

### **Error Handling**
- No sensitive data in error messages
- Comprehensive logging for debugging
- Graceful degradation on API failures

### **Configuration Security**
- Environment variable configuration
- No hardcoded API keys
- Secure credential management

## 🚨 Error Handling

The improved server provides comprehensive error handling:

```python
{
    "status": "error",
    "error": "Invalid HTS code: 12345",
    "suggestion": "HTS codes should be 6-10 digits"
}
```

Common error types:
- **Validation Errors**: Invalid input parameters
- **API Errors**: External API failures
- **Configuration Errors**: Missing API keys
- **Network Errors**: Connection timeouts

## 📝 Logging

Structured logging with different levels:

```python
# Configure logging level
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

Log messages include:
- Timestamp
- Module name
- Log level
- Detailed message
- Context information

## 🔄 Migration from Original Server

To migrate from the original server:

1. **Update imports**: Use `tariff_server_improved.py` instead of `tariff_server.py`
2. **Set environment variables**: Move API keys to `.env` file
3. **Update tool calls**: All original tools are available with enhanced validation
4. **Add new tools**: Use new system management and validation tools

## 🎯 Best Practices

### **Input Validation**
Always validate inputs before processing:
```python
validation = validate_inputs(hts_code, country, year)
if not validation["all_valid"]:
    return {"status": "error", "error": "Invalid inputs"}
```

### **Error Handling**
Handle errors gracefully:
```python
try:
    result = api_call()
    if result["status"] == "error":
        logger.error(f"API call failed: {result['error']}")
        return fallback_response()
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    return {"status": "error", "error": "Internal server error"}
```

### **Caching**
Use caching for expensive operations:
```python
@cache_result(ttl=3600)  # Cache for 1 hour
def expensive_operation():
    # Expensive computation
    pass
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Add tests for new functionality**
4. **Ensure all tests pass**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the logs for detailed error information
2. Use `get_system_status()` to diagnose API connectivity
3. Validate inputs with `validate_inputs()`
4. Check the test suite for usage examples

## 🔮 Future Enhancements

- **Async Operations**: Full async/await support
- **Database Integration**: Persistent caching and data storage
- **Advanced Analytics**: Machine learning integration
- **Real-time Updates**: WebSocket support for live data
- **API Versioning**: Support for multiple API versions
- **Monitoring**: Prometheus metrics integration
