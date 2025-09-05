"""
Tests for API client modules
"""
import pytest
from unittest.mock import patch, MagicMock
from config import APIConfig
from apis import (
    BEAAPIClient, CensusAPIClient, DataWebAPIClient,
    FederalRegisterAPIClient, GNewsAPIClient, GeminiAPIClient
)

class TestBEAAPIClient:
    """Test BEA API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(
            base_url="https://apps.bea.gov/api/data",
            api_key="test_key"
        )
        self.client = BEAAPIClient(self.config)
    
    def test_init(self):
        """Test client initialization"""
        assert self.client.base_url == "https://apps.bea.gov/api/data"
        assert self.client.api_key == "test_key"
        assert self.client.timeout == 30
        assert self.client.max_retries == 3
    
    def test_is_configured(self):
        """Test configuration check"""
        assert self.client.is_configured() is True
        
        # Test without API key
        config_no_key = APIConfig(base_url="https://apps.bea.gov/api/data")
        client_no_key = BEAAPIClient(config_no_key)
        assert client_no_key.is_configured() is False
    
    @patch.object(BEAAPIClient, '_make_request')
    def test_get_datasets_success(self, mock_request):
        """Test successful dataset retrieval"""
        mock_request.return_value = {
            "success": True,
            "data": {
                "BEAAPI": {
                    "Results": {
                        "Dataset": [
                            {"DatasetName": "NIPA", "Description": "National Income and Product Accounts"},
                            {"DatasetName": "Regional", "Description": "Regional Economic Accounts"}
                        ]
                    }
                }
            }
        }
        
        result = self.client.get_datasets()
        
        assert result["status"] == "success"
        assert len(result["datasets"]) == 2
        assert result["total_count"] == 2
        assert result["datasets"][0]["DatasetName"] == "NIPA"
    
    @patch.object(BEAAPIClient, '_make_request')
    def test_get_datasets_error(self, mock_request):
        """Test dataset retrieval error"""
        mock_request.return_value = {
            "success": False,
            "error": "API error"
        }
        
        result = self.client.get_datasets()
        
        assert result["status"] == "error"
        assert result["error"] == "API error"
    
    @patch.object(BEAAPIClient, '_make_request')
    def test_get_data_success(self, mock_request):
        """Test successful data retrieval"""
        mock_request.return_value = {
            "success": True,
            "data": {
                "BEAAPI": {
                    "Results": {
                        "Data": [
                            {"LineDescription": "GDP", "DataValue": "1000.0", "TimePeriod": "2023"}
                        ],
                        "Notes": ["Note 1", "Note 2"]
                    }
                }
            }
        }
        
        result = self.client.get_data("NIPA", "T10101", "A", "2023")
        
        assert result["status"] == "success"
        assert result["dataset"] == "NIPA"
        assert result["table"] == "T10101"
        assert len(result["data"]) == 1
        assert result["metadata"]["frequency"] == "A"
        assert result["metadata"]["year"] == "2023"
    
    def test_get_data_invalid_year(self):
        """Test data retrieval with invalid year"""
        result = self.client.get_data("NIPA", "T10101", "A", "invalid")
        
        assert result["status"] == "error"
        assert "Invalid year" in result["error"]
    
    def test_get_data_invalid_frequency(self):
        """Test data retrieval with invalid frequency"""
        result = self.client.get_data("NIPA", "T10101", "X", "2023")
        
        assert result["status"] == "error"
        assert "Invalid frequency" in result["error"]

class TestCensusAPIClient:
    """Test Census API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(base_url="https://api.census.gov/data")
        self.client = CensusAPIClient(self.config)
    
    def test_get_trade_data_invalid_hts(self):
        """Test trade data retrieval with invalid HTS code"""
        result = self.client.get_trade_data("invalid", "CN", "2023")
        
        assert result["status"] == "error"
        assert "Invalid HTS code" in result["error"]
    
    def test_get_trade_data_invalid_year(self):
        """Test trade data retrieval with invalid year"""
        result = self.client.get_trade_data("87032300", "CN", "invalid")
        
        assert result["status"] == "error"
        assert "Invalid year" in result["error"]
    
    def test_get_trade_data_invalid_country(self):
        """Test trade data retrieval with invalid country"""
        result = self.client.get_trade_data("87032300", "invalid", "2023")
        
        assert result["status"] == "error"
        assert "Invalid country code" in result["error"]

class TestDataWebAPIClient:
    """Test DataWeb API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(
            base_url="https://datawebws.usitc.gov/dataweb",
            token="test_token"
        )
        self.client = DataWebAPIClient(self.config)
    
    def test_is_configured(self):
        """Test configuration check"""
        assert self.client.is_configured() is True
        
        # Test without token
        config_no_token = APIConfig(base_url="https://datawebws.usitc.gov/dataweb")
        client_no_token = DataWebAPIClient(config_no_token)
        assert client_no_token.is_configured() is False
    
    def test_search_trade_data_invalid_commodity_code(self):
        """Test trade data search with invalid commodity code"""
        result = self.client.search_trade_data("invalid", ["CN"], "2023", "2023")
        
        assert result["status"] == "error"
        assert "Invalid commodity code" in result["error"]
    
    def test_search_trade_data_invalid_year(self):
        """Test trade data search with invalid year"""
        result = self.client.search_trade_data("87032300", ["CN"], "invalid", "2023")
        
        assert result["status"] == "error"
        assert "Invalid year range" in result["error"]
    
    def test_search_trade_data_invalid_trade_flow(self):
        """Test trade data search with invalid trade flow"""
        result = self.client.search_trade_data("87032300", ["CN"], "2023", "2023", "Invalid")
        
        assert result["status"] == "error"
        assert "Invalid trade flow" in result["error"]

class TestFederalRegisterAPIClient:
    """Test Federal Register API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(base_url="https://www.federalregister.gov/api/v1")
        self.client = FederalRegisterAPIClient(self.config)
    
    def test_search_documents_empty_query(self):
        """Test document search with empty query"""
        result = self.client.search_documents("")
        
        assert result["status"] == "error"
        assert "Query cannot be empty" in result["error"]
    
    def test_get_recent_tariff_announcements_invalid_days(self):
        """Test recent announcements with invalid days"""
        result = self.client.get_recent_tariff_announcements(0)
        
        assert result["status"] == "error"
        assert "Days back must be between 1 and 365" in result["error"]
        
        result = self.client.get_recent_tariff_announcements(400)
        
        assert result["status"] == "error"
        assert "Days back must be between 1 and 365" in result["error"]

class TestGNewsAPIClient:
    """Test GNews API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(
            base_url="https://gnews.io/api/v4",
            api_key="test_key"
        )
        self.client = GNewsAPIClient(self.config)
    
    def test_is_configured(self):
        """Test configuration check"""
        assert self.client.is_configured() is True
        
        # Test without API key
        config_no_key = APIConfig(base_url="https://gnews.io/api/v4")
        client_no_key = GNewsAPIClient(config_no_key)
        assert client_no_key.is_configured() is False
    
    def test_get_news_empty_query(self):
        """Test news retrieval with empty query"""
        result = self.client.get_news("")
        
        assert result["status"] == "error"
        assert "Query cannot be empty" in result["error"]
    
    def test_get_news_invalid_days_back(self):
        """Test news retrieval with invalid days back"""
        result = self.client.get_news("tariff", days_back=0)
        
        assert result["status"] == "error"
        assert "Days back must be between 1 and 30" in result["error"]
        
        result = self.client.get_news("tariff", days_back=40)
        
        assert result["status"] == "error"
        assert "Days back must be between 1 and 30" in result["error"]
    
    def test_get_news_invalid_max_results(self):
        """Test news retrieval with invalid max results"""
        result = self.client.get_news("tariff", max_results=0)
        
        assert result["status"] == "error"
        assert "Max results must be between 1 and 100" in result["error"]
        
        result = self.client.get_news("tariff", max_results=150)
        
        assert result["status"] == "error"
        assert "Max results must be between 1 and 100" in result["error"]

class TestGeminiAPIClient:
    """Test Gemini API client"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.config = APIConfig(
            base_url="https://generativelanguage.googleapis.com/v1beta",
            api_key="test_key"
        )
        self.client = GeminiAPIClient(self.config)
    
    def test_is_configured(self):
        """Test configuration check"""
        assert self.client.is_configured() is True
        
        # Test without API key
        config_no_key = APIConfig(base_url="https://generativelanguage.googleapis.com/v1beta")
        client_no_key = GeminiAPIClient(config_no_key)
        assert client_no_key.is_configured() is False
    
    def test_analyze_sentiment_empty_text(self):
        """Test sentiment analysis with empty text"""
        result = self.client.analyze_sentiment("")
        
        assert result["status"] == "error"
        assert "Text cannot be empty" in result["error"]
    
    def test_analyze_news_sentiment_no_articles(self):
        """Test news sentiment analysis with no articles"""
        result = self.client.analyze_news_sentiment([])
        
        assert result["status"] == "error"
        assert "No articles provided" in result["error"]
    
    def test_analyze_policy_impact_no_documents(self):
        """Test policy impact analysis with no documents"""
        result = self.client.analyze_policy_impact([])
        
        assert result["status"] == "error"
        assert "No policy documents provided" in result["error"]
    
    def test_generate_summary_no_data(self):
        """Test summary generation with no data"""
        result = self.client.generate_summary({})
        
        assert result["status"] == "error"
        assert "No data provided" in result["error"]
    
    def test_compare_scenarios_insufficient_scenarios(self):
        """Test scenario comparison with insufficient scenarios"""
        result = self.client.compare_scenarios([])
        
        assert result["status"] == "error"
        assert "At least 2 scenarios required" in result["error"]
        
        result = self.client.compare_scenarios([{"name": "Scenario 1"}])
        
        assert result["status"] == "error"
        assert "At least 2 scenarios required" in result["error"]
