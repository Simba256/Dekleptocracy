"""
Configuration management for the Trade & Tariff Analysis MCP Server
"""
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

@dataclass
class APIConfig:
    """Configuration for a single API"""
    base_url: str
    api_key: Optional[str] = None
    token: Optional[str] = None
    rate_limit: Optional[Dict[str, int]] = None
    timeout: int = 30
    max_retries: int = 3

@dataclass
class ServerConfig:
    """Main server configuration"""
    log_level: str = "INFO"
    max_retries: int = 3
    request_timeout: int = 30
    cache_ttl: int = 300
    tariff_data_path: str = "../Data_Collection/tariff_data"
    commodity_translation_path: str = "../Data_Collection/commodity_translation"

class Config:
    """Centralized configuration management"""
    
    def __init__(self):
        self.server = ServerConfig(
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            max_retries=int(os.getenv("MAX_RETRIES", "3")),
            request_timeout=int(os.getenv("REQUEST_TIMEOUT", "30")),
            cache_ttl=int(os.getenv("CACHE_TTL", "300")),
            tariff_data_path=os.getenv("TARIFF_DATA_PATH", "../Data_Collection/tariff_data"),
            commodity_translation_path=os.getenv("COMMODITY_TRANSLATION_PATH", "../Data_Collection/commodity_translation")
        )
        
        self.apis = {
            "bea": APIConfig(
                base_url="https://apps.bea.gov/api/data",
                api_key=os.getenv("BEA_API_KEY"),
                rate_limit={"requests_per_minute": 100, "data_mb_per_minute": 100}
            ),
            "census": APIConfig(
                base_url="https://api.census.gov/data",
                api_key=os.getenv("CENSUS_API_KEY"),
                rate_limit={"requests_per_minute": 500}
            ),
            "dataweb": APIConfig(
                base_url="https://datawebws.usitc.gov/dataweb",
                token=os.getenv("DATAWEB_TOKEN")
            ),
            "federal_register": APIConfig(
                base_url="https://www.federalregister.gov/api/v1",
                rate_limit={"requests_per_minute": 1000}
            ),
            "govinfo": APIConfig(
                base_url="https://api.govinfo.gov",
                api_key=os.getenv("GOVINFO_API_KEY")
            ),
            "regulations": APIConfig(
                base_url="https://api.regulations.gov/v4",
                api_key=os.getenv("REGULATIONS_API_KEY")
            ),
            "gnews": APIConfig(
                base_url="https://gnews.io/api/v4",
                api_key=os.getenv("GNEWS_API_KEY"),
                rate_limit={"requests_per_day": 100}
            ),
            "gemini": APIConfig(
                base_url="https://generativelanguage.googleapis.com/v1beta",
                api_key=os.getenv("GEMINI_API_KEY")
            )
        }
    
    def get_api_config(self, api_name: str) -> APIConfig:
        """Get configuration for a specific API"""
        if api_name not in self.apis:
            raise ValueError(f"Unknown API: {api_name}")
        return self.apis[api_name]
    
    def validate_config(self) -> Dict[str, bool]:
        """Validate that all required API keys are present"""
        validation_results = {}
        
        for api_name, config in self.apis.items():
            if api_name in ["bea", "census", "govinfo", "regulations", "gnews", "gemini"]:
                validation_results[api_name] = bool(config.api_key)
            elif api_name == "dataweb":
                validation_results[api_name] = bool(config.token)
            else:
                validation_results[api_name] = True  # No auth required
        
        return validation_results
    
    def get_missing_keys(self) -> list:
        """Get list of missing API keys"""
        missing = []
        validation = self.validate_config()
        
        for api_name, is_valid in validation.items():
            if not is_valid:
                missing.append(api_name)
        
        return missing

# Global configuration instance
config = Config()
