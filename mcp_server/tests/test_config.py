"""
Tests for configuration management
"""
import pytest
import os
from unittest.mock import patch
from config import Config, APIConfig, ServerConfig

class TestAPIConfig:
    """Test APIConfig class"""
    
    def test_api_config_creation(self):
        """Test APIConfig creation with all parameters"""
        config = APIConfig(
            base_url="https://api.example.com",
            api_key="test_key",
            rate_limit={"requests_per_minute": 100},
            timeout=30,
            max_retries=3
        )
        
        assert config.base_url == "https://api.example.com"
        assert config.api_key == "test_key"
        assert config.rate_limit == {"requests_per_minute": 100}
        assert config.timeout == 30
        assert config.max_retries == 3
    
    def test_api_config_defaults(self):
        """Test APIConfig with default values"""
        config = APIConfig(base_url="https://api.example.com")
        
        assert config.base_url == "https://api.example.com"
        assert config.api_key is None
        assert config.token is None
        assert config.rate_limit is None
        assert config.timeout == 30
        assert config.max_retries == 3

class TestServerConfig:
    """Test ServerConfig class"""
    
    def test_server_config_creation(self):
        """Test ServerConfig creation with all parameters"""
        config = ServerConfig(
            log_level="DEBUG",
            max_retries=5,
            request_timeout=60,
            cache_ttl=600,
            tariff_data_path="/custom/path",
            commodity_translation_path="/custom/path2"
        )
        
        assert config.log_level == "DEBUG"
        assert config.max_retries == 5
        assert config.request_timeout == 60
        assert config.cache_ttl == 600
        assert config.tariff_data_path == "/custom/path"
        assert config.commodity_translation_path == "/custom/path2"
    
    def test_server_config_defaults(self):
        """Test ServerConfig with default values"""
        config = ServerConfig()
        
        assert config.log_level == "INFO"
        assert config.max_retries == 3
        assert config.request_timeout == 30
        assert config.cache_ttl == 300
        assert config.tariff_data_path == "../Data_Collection/tariff_data"
        assert config.commodity_translation_path == "../Data_Collection/commodity_translation"

class TestConfig:
    """Test Config class"""
    
    @patch.dict(os.environ, {
        'BEA_API_KEY': 'test_bea_key',
        'DATAWEB_TOKEN': 'test_dataweb_token',
        'GOVINFO_API_KEY': 'test_govinfo_key',
        'REGULATIONS_API_KEY': 'test_regulations_key',
        'GNEWS_API_KEY': 'test_gnews_key',
        'GEMINI_API_KEY': 'test_gemini_key',
        'LOG_LEVEL': 'DEBUG',
        'MAX_RETRIES': '5',
        'REQUEST_TIMEOUT': '60',
        'CACHE_TTL': '600'
    })
    def test_config_with_env_vars(self):
        """Test Config with environment variables"""
        config = Config()
        
        # Test server config
        assert config.server.log_level == "DEBUG"
        assert config.server.max_retries == 5
        assert config.server.request_timeout == 60
        assert config.server.cache_ttl == 600
        
        # Test API configs
        assert config.apis["bea"].api_key == "test_bea_key"
        assert config.apis["dataweb"].token == "test_dataweb_token"
        assert config.apis["govinfo"].api_key == "test_govinfo_key"
        assert config.apis["regulations"].api_key == "test_regulations_key"
        assert config.apis["gnews"].api_key == "test_gnews_key"
        assert config.apis["gemini"].api_key == "test_gemini_key"
    
    def test_config_without_env_vars(self):
        """Test Config without environment variables"""
        with patch.dict(os.environ, {}, clear=True):
            config = Config()
            
            # Test server config defaults
            assert config.server.log_level == "INFO"
            assert config.server.max_retries == 3
            assert config.server.request_timeout == 30
            assert config.server.cache_ttl == 300
            
            # Test API configs (should be None without env vars)
            assert config.apis["bea"].api_key is None
            assert config.apis["dataweb"].token is None
            assert config.apis["govinfo"].api_key is None
    
    def test_get_api_config(self):
        """Test get_api_config method"""
        config = Config()
        
        # Test valid API
        bea_config = config.get_api_config("bea")
        assert isinstance(bea_config, APIConfig)
        assert bea_config.base_url == "https://apps.bea.gov/api/data"
        
        # Test invalid API
        with pytest.raises(ValueError, match="Unknown API: invalid_api"):
            config.get_api_config("invalid_api")
    
    def test_validate_config(self):
        """Test validate_config method"""
        with patch.dict(os.environ, {
            'BEA_API_KEY': 'test_key',
            'DATAWEB_TOKEN': 'test_token',
            'GOVINFO_API_KEY': 'test_key',
            'REGULATIONS_API_KEY': 'test_key',
            'GNEWS_API_KEY': 'test_key',
            'GEMINI_API_KEY': 'test_key'
        }):
            config = Config()
            validation = config.validate_config()
            
            assert validation["bea"] is True
            assert validation["dataweb"] is True
            assert validation["govinfo"] is True
            assert validation["regulations"] is True
            assert validation["gnews"] is True
            assert validation["gemini"] is True
            assert validation["federal_register"] is True  # No auth required
    
    def test_validate_config_missing_keys(self):
        """Test validate_config with missing keys"""
        with patch.dict(os.environ, {}, clear=True):
            config = Config()
            validation = config.validate_config()
            
            assert validation["bea"] is False
            assert validation["dataweb"] is False
            assert validation["govinfo"] is False
            assert validation["regulations"] is False
            assert validation["gnews"] is False
            assert validation["gemini"] is False
            assert validation["federal_register"] is True  # No auth required
    
    def test_get_missing_keys(self):
        """Test get_missing_keys method"""
        with patch.dict(os.environ, {}, clear=True):
            config = Config()
            missing = config.get_missing_keys()
            
            expected_missing = ["bea", "dataweb", "govinfo", "regulations", "gnews", "gemini"]
            assert set(missing) == set(expected_missing)
        
        with patch.dict(os.environ, {
            'BEA_API_KEY': 'test_key',
            'DATAWEB_TOKEN': 'test_token'
        }):
            config = Config()
            missing = config.get_missing_keys()
            
            expected_missing = ["govinfo", "regulations", "gnews", "gemini"]
            assert set(missing) == set(expected_missing)
