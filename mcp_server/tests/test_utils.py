"""
Tests for utility functions
"""
import pytest
import time
from unittest.mock import patch, MagicMock
from utils import (
    validate_hts_code, validate_year, validate_country_code,
    sanitize_input, format_currency, format_percentage,
    safe_float, safe_int, extract_hts_from_text,
    get_cache_key, cache_result, retry_on_failure,
    make_api_request, create_session
)

class TestValidation:
    """Test validation functions"""
    
    def test_validate_hts_code_valid(self):
        """Test valid HTS codes"""
        valid_codes = [
            "123456",
            "1234567",
            "12345678",
            "123456789",
            "1234567890",
            "1234.56.78",
            "1234 56 78"
        ]
        
        for code in valid_codes:
            assert validate_hts_code(code), f"Should be valid: {code}"
    
    def test_validate_hts_code_invalid(self):
        """Test invalid HTS codes"""
        invalid_codes = [
            "",
            "12345",  # Too short
            "12345678901",  # Too long
            "abc123",
            "123-456",
            "123.456.789.012"  # Too many parts
        ]
        
        for code in invalid_codes:
            assert not validate_hts_code(code), f"Should be invalid: {code}"
    
    def test_validate_year_valid(self):
        """Test valid years"""
        valid_years = [1990, 2000, 2023, 2030, "1990", "2000", "2023", "2030"]
        
        for year in valid_years:
            assert validate_year(year), f"Should be valid: {year}"
    
    def test_validate_year_invalid(self):
        """Test invalid years"""
        invalid_years = [1989, 2031, "1989", "2031", "abc", None, ""]
        
        for year in invalid_years:
            assert not validate_year(year), f"Should be invalid: {year}"
    
    def test_validate_country_code_valid(self):
        """Test valid country codes"""
        valid_countries = [
            "us", "usa", "united states", "america",
            "china", "cn", "chinese",
            "mexico", "mx", "mexican",
            "canada", "ca", "canadian",
            "mfn", "most favored nation"
        ]
        
        for country in valid_countries:
            assert validate_country_code(country), f"Should be valid: {country}"
    
    def test_validate_country_code_invalid(self):
        """Test invalid country codes"""
        invalid_countries = ["", "invalid", "xyz", None]
        
        for country in invalid_countries:
            assert not validate_country_code(country), f"Should be invalid: {country}"

class TestSanitization:
    """Test sanitization functions"""
    
    def test_sanitize_input_normal(self):
        """Test normal input sanitization"""
        assert sanitize_input("normal text") == "normal text"
        assert sanitize_input("  whitespace  ") == "whitespace"
        assert sanitize_input(123) == "123"
        assert sanitize_input(None) == ""
    
    def test_sanitize_input_dangerous(self):
        """Test sanitization of dangerous characters"""
        dangerous_input = "<script>alert('xss')</script>"
        sanitized = sanitize_input(dangerous_input)
        assert "<" not in sanitized
        assert ">" not in sanitized
        assert "'" not in sanitized
        assert '"' not in sanitized
    
    def test_sanitize_input_sql_injection(self):
        """Test sanitization of SQL injection attempts"""
        sql_input = "'; DROP TABLE users; --"
        sanitized = sanitize_input(sql_input)
        assert "'" not in sanitized
        assert ";" not in sanitized
        assert "--" not in sanitized

class TestFormatting:
    """Test formatting functions"""
    
    def test_format_currency(self):
        """Test currency formatting"""
        assert format_currency(1000.50) == "$1,000.50"
        assert format_currency(0) == "$0.00"
        assert format_currency(1234567.89) == "$1,234,567.89"
        assert format_currency(100, "EUR") == "100.00 EUR"
    
    def test_format_percentage(self):
        """Test percentage formatting"""
        assert format_percentage(25.5) == "25.50%"
        assert format_percentage(0) == "0.00%"
        assert format_percentage(100) == "100.00%"
        assert format_percentage(25.555) == "25.56%"  # Rounded

class TestSafeConversion:
    """Test safe conversion functions"""
    
    def test_safe_float(self):
        """Test safe float conversion"""
        assert safe_float("123.45") == 123.45
        assert safe_float("1,234.56") == 1234.56
        assert safe_float("25%") == 25.0
        assert safe_float("invalid") == 0.0
        assert safe_float(None) == 0.0
        assert safe_float(123) == 123.0
    
    def test_safe_int(self):
        """Test safe int conversion"""
        assert safe_int("123") == 123
        assert safe_int("1,234") == 1234
        assert safe_int("invalid") == 0
        assert safe_int(None) == 0
        assert safe_int(123.45) == 123

class TestHTSExtraction:
    """Test HTS code extraction"""
    
    def test_extract_hts_from_text(self):
        """Test HTS code extraction from text"""
        # Test various formats
        assert extract_hts_from_text("Product code 1234.56.78 is used") == "1234.56.78"
        assert extract_hts_from_text("HTS 123456") == "123456"
        assert extract_hts_from_text("Code: 1234567890") == "1234567890"
        assert extract_hts_from_text("No HTS code here") is None
        assert extract_hts_from_text("") is None

class TestCaching:
    """Test caching functionality"""
    
    def test_get_cache_key(self):
        """Test cache key generation"""
        key1 = get_cache_key("func", "arg1", "arg2", kwarg1="value1")
        key2 = get_cache_key("func", "arg1", "arg2", kwarg1="value1")
        key3 = get_cache_key("func", "arg1", "arg2", kwarg1="value2")
        
        assert key1 == key2  # Same arguments should generate same key
        assert key1 != key3  # Different arguments should generate different keys
    
    def test_cache_result_decorator(self):
        """Test cache_result decorator"""
        call_count = 0
        
        @cache_result(ttl=1)
        def test_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call should execute function
        result1 = test_function(5)
        assert result1 == 10
        assert call_count == 1
        
        # Second call should use cache
        result2 = test_function(5)
        assert result2 == 10
        assert call_count == 1  # Should not increment
        
        # Different argument should execute function
        result3 = test_function(6)
        assert result3 == 12
        assert call_count == 2

class TestRetry:
    """Test retry functionality"""
    
    def test_retry_on_failure_success(self):
        """Test retry decorator with successful function"""
        call_count = 0
        
        @retry_on_failure(max_retries=3)
        def successful_function():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = successful_function()
        assert result == "success"
        assert call_count == 1
    
    def test_retry_on_failure_retry_success(self):
        """Test retry decorator with function that succeeds after retries"""
        call_count = 0
        
        @retry_on_failure(max_retries=3, delay=0.01)
        def retry_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return "success"
        
        result = retry_function()
        assert result == "success"
        assert call_count == 3
    
    def test_retry_on_failure_max_retries(self):
        """Test retry decorator with function that always fails"""
        call_count = 0
        
        @retry_on_failure(max_retries=2, delay=0.01)
        def failing_function():
            nonlocal call_count
            call_count += 1
            raise Exception("Always fails")
        
        with pytest.raises(Exception, match="Always fails"):
            failing_function()
        
        assert call_count == 3  # Initial call + 2 retries

class TestAPIFunctions:
    """Test API-related functions"""
    
    def test_create_session(self):
        """Test session creation"""
        session = create_session()
        assert session is not None
        assert hasattr(session, 'get')
        assert hasattr(session, 'post')
    
    @patch('utils.requests.Session')
    def test_make_api_request_success(self, mock_session_class):
        """Test successful API request"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"success": true}'
        mock_response.json.return_value = {"success": True}
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.raise_for_status.return_value = None
        
        mock_session = MagicMock()
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = make_api_request("https://api.example.com/test")
        
        assert result["success"] is True
        assert result["data"] == {"success": True}
        assert result["status_code"] == 200
    
    @patch('utils.requests.Session')
    def test_make_api_request_timeout(self, mock_session_class):
        """Test API request timeout"""
        from requests.exceptions import Timeout
        
        mock_session = MagicMock()
        mock_session.get.side_effect = Timeout("Request timeout")
        mock_session_class.return_value = mock_session
        
        result = make_api_request("https://api.example.com/test")
        
        assert result["success"] is False
        assert result["error"] == "Request timeout"
        assert result["status_code"] == 408
    
    @patch('utils.requests.Session')
    def test_make_api_request_connection_error(self, mock_session_class):
        """Test API request connection error"""
        from requests.exceptions import ConnectionError
        
        mock_session = MagicMock()
        mock_session.get.side_effect = ConnectionError("Connection error")
        mock_session_class.return_value = mock_session
        
        result = make_api_request("https://api.example.com/test")
        
        assert result["success"] is False
        assert result["error"] == "Connection error"
        assert result["status_code"] is None
