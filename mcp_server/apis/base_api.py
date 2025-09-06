"""
Base API client class for common functionality
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from config import APIConfig
from utils import make_api_request, log_api_call, cache_result

logger = logging.getLogger(__name__)

class BaseAPIClient(ABC):
    """Base class for all API clients"""
    
    def __init__(self, config: APIConfig):
        self.config = config
        self.base_url = config.base_url
        self.api_key = config.api_key
        self.token = config.token
        self.timeout = config.timeout
        self.max_retries = config.max_retries
    
    def _make_request(
        self, 
        endpoint: str, 
        method: str = "GET",
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make a request to the API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Add authentication headers
        request_headers = headers or {}
        if self.api_key:
            request_headers["Authorization"] = f"Bearer {self.api_key}"
        elif self.token:
            request_headers["Authorization"] = f"Bearer {self.token}"
        
        # Add default headers
        request_headers.setdefault("Content-Type", "application/json")
        request_headers.setdefault("User-Agent", "Trade-Tariff-MCP-Server/2.0")
        
        result = make_api_request(
            url=url,
            method=method,
            params=params,
            json_data=json_data,
            headers=request_headers,
            timeout=self.timeout
        )
        
        # Log the API call
        log_api_call(
            api_name=self.__class__.__name__,
            endpoint=endpoint,
            params=params,
            success=result["success"]
        )
        
        return result
    
    @abstractmethod
    def test_connection(self) -> bool:
        """Test API connection"""
        pass
    
    def get_rate_limit_info(self) -> Optional[Dict[str, int]]:
        """Get rate limit information"""
        return self.config.rate_limit
    
    def is_configured(self) -> bool:
        """Check if API is properly configured"""
        return bool(self.api_key or self.token)
