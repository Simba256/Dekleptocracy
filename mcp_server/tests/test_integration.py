"""
Integration tests for the improved MCP server
"""
import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path so we can import the modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tariff_server_improved import (
    validate_inputs, get_system_status, clear_system_cache,
    calculate_tariff_cost, comprehensive_trade_analysis
)

class TestIntegration:
    """Integration tests for the improved MCP server"""
    
    def test_validate_inputs_comprehensive(self):
        """Test comprehensive input validation"""
        # Test all valid inputs
        result = validate_inputs("87032300", "china", "2024")
        assert result["status"] == "success"
        assert result["all_valid"] is True
        assert result["validation_results"]["hts_code"]["valid"] is True
        assert result["validation_results"]["country"]["valid"] is True
        assert result["validation_results"]["year"]["valid"] is True
        
        # Test with invalid inputs
        result = validate_inputs("invalid", "invalid", "invalid")
        assert result["status"] == "success"
        assert result["all_valid"] is False
        assert result["validation_results"]["hts_code"]["valid"] is False
        assert result["validation_results"]["country"]["valid"] is False
        assert result["validation_results"]["year"]["valid"] is False
    
    def test_calculate_tariff_cost_comprehensive(self):
        """Test comprehensive tariff cost calculation"""
        # Test normal calculation
        result = calculate_tariff_cost(100000, 25.0)
        assert result["status"] == "success"
        assert result["import_value_usd"] == 100000
        assert result["tariff_rate_percent"] == 25.0
        assert result["tariff_cost_usd"] == 25000.0
        assert result["total_cost_usd"] == 125000.0
        assert result["cost_increase_percent"] == 25.0
        assert "formatted" in result
        
        # Test edge cases
        result = calculate_tariff_cost(0, 0)
        assert result["status"] == "success"
        assert result["cost_increase_percent"] == 0
        
        # Test invalid inputs
        result = calculate_tariff_cost(-1000, 25.0)
        assert result["status"] == "error"
        assert "Import value cannot be negative" in result["error"]
        
        result = calculate_tariff_cost(1000, -5.0)
        assert result["status"] == "error"
        assert "Tariff rate must be between 0 and 100" in result["error"]
        
        result = calculate_tariff_cost(1000, 150.0)
        assert result["status"] == "error"
        assert "Tariff rate must be between 0 and 100" in result["error"]
    
    @patch('tariff_server_improved.api_clients')
    def test_comprehensive_trade_analysis_mock(self, mock_clients):
        """Test comprehensive trade analysis with mocked API clients"""
        # Mock the API clients
        mock_bea = MagicMock()
        mock_census = MagicMock()
        mock_dataweb = MagicMock()
        mock_federal_register = MagicMock()
        mock_gnews = MagicMock()
        mock_gemini = MagicMock()
        
        mock_clients.__getitem__.side_effect = lambda key: {
            "bea": mock_bea,
            "census": mock_census,
            "dataweb": mock_dataweb,
            "federal_register": mock_federal_register,
            "gnews": mock_gnews,
            "gemini": mock_gemini
        }[key]
        
        # Mock successful responses
        mock_bea.analyze_gdp_by_industry.return_value = {"status": "success", "data": "GDP data"}
        mock_census.get_trade_data.return_value = {"status": "success", "data": "Trade data"}
        mock_dataweb.search_trade_data.return_value = {"status": "success", "data": "USITC data"}
        mock_federal_register.search_documents.return_value = {"status": "success", "data": "Policy data"}
        mock_gnews.get_trade_news.return_value = {"status": "success", "data": "News data"}
        mock_gemini.analyze_news_sentiment.return_value = {"status": "success", "data": "Sentiment data"}
        
        # Test successful analysis
        result = comprehensive_trade_analysis("87032300", "china", "2024")
        
        assert result["status"] == "success"
        assert result["product_code"] == "87032300"
        assert result["target_country"] == "china"
        assert result["analysis_year"] == "2024"
        assert "data_sources" in result
        assert "synthesis" in result
        assert "timestamp" in result
        
        # Verify all API clients were called
        mock_bea.analyze_gdp_by_industry.assert_called_once()
        mock_census.get_trade_data.assert_called_once()
        mock_dataweb.search_trade_data.assert_called_once()
        mock_federal_register.search_documents.assert_called_once()
        mock_gnews.get_trade_news.assert_called_once()
        mock_gemini.analyze_news_sentiment.assert_called_once()
    
    def test_comprehensive_trade_analysis_invalid_inputs(self):
        """Test comprehensive trade analysis with invalid inputs"""
        # Test invalid HTS code
        result = comprehensive_trade_analysis("invalid", "china", "2024")
        assert result["status"] == "error"
        assert "Invalid HTS code" in result["error"]
        
        # Test invalid year
        result = comprehensive_trade_analysis("87032300", "china", "invalid")
        assert result["status"] == "error"
        assert "Invalid year" in result["error"]
        
        # Test invalid country
        result = comprehensive_trade_analysis("87032300", "invalid", "2024")
        assert result["status"] == "error"
        assert "Invalid country code" in result["error"]
    
    @patch('tariff_server_improved.api_clients')
    def test_get_system_status_mock(self, mock_clients):
        """Test system status with mocked API clients"""
        # Mock the API clients
        mock_bea = MagicMock()
        mock_census = MagicMock()
        mock_dataweb = MagicMock()
        mock_federal_register = MagicMock()
        mock_gnews = MagicMock()
        mock_gemini = MagicMock()
        
        # Mock test_connection methods
        mock_bea.test_connection.return_value = True
        mock_bea.is_configured.return_value = True
        mock_census.test_connection.return_value = False
        mock_census.is_configured.return_value = True
        mock_dataweb.test_connection.return_value = True
        mock_dataweb.is_configured.return_value = False
        mock_federal_register.test_connection.return_value = True
        mock_federal_register.is_configured.return_value = True
        mock_gnews.test_connection.return_value = False
        mock_gnews.is_configured.return_value = False
        mock_gemini.test_connection.return_value = True
        mock_gemini.is_configured.return_value = True
        
        mock_clients.__getitem__.side_effect = lambda key: {
            "bea": mock_bea,
            "census": mock_census,
            "dataweb": mock_dataweb,
            "federal_register": mock_federal_register,
            "gnews": mock_gnews,
            "gemini": mock_gemini
        }[key]
        
        result = get_system_status()
        
        assert result["server"]["status"] == "running"
        assert "apis" in result
        assert "cache" in result
        assert "configuration" in result
        
        # Check API statuses
        assert result["apis"]["bea"]["status"] == "operational"
        assert result["apis"]["census"]["status"] == "issues"
        assert result["apis"]["dataweb"]["status"] == "issues"
        assert result["apis"]["federal_register"]["status"] == "operational"
        assert result["apis"]["gnews"]["status"] == "issues"
        assert result["apis"]["gemini"]["status"] == "operational"
    
    def test_clear_system_cache(self):
        """Test system cache clearing"""
        result = clear_system_cache()
        
        assert result["status"] == "success"
        assert "System cache cleared successfully" in result["message"]
        assert "timestamp" in result
    
    def test_error_handling_consistency(self):
        """Test that error handling is consistent across functions"""
        # Test that all functions return consistent error format
        functions_to_test = [
            (validate_inputs, ("invalid", "invalid", "invalid")),
            (calculate_tariff_cost, (-1000, 25.0)),
            (comprehensive_trade_analysis, ("invalid", "invalid", "invalid"))
        ]
        
        for func, args in functions_to_test:
            result = func(*args)
            
            # All error responses should have these fields
            if result.get("status") == "error":
                assert "status" in result
                assert "error" in result
                assert isinstance(result["error"], str)
                assert len(result["error"]) > 0
    
    def test_success_response_consistency(self):
        """Test that success responses are consistent across functions"""
        # Test that all functions return consistent success format
        functions_to_test = [
            (validate_inputs, ("87032300", "china", "2024")),
            (calculate_tariff_cost, (1000, 10.0)),
            (clear_system_cache, ())
        ]
        
        for func, args in functions_to_test:
            result = func(*args)
            
            # All success responses should have these fields
            if result.get("status") == "success":
                assert "status" in result
                assert result["status"] == "success"
                # Should have some data beyond just status
                assert len(result) > 1
