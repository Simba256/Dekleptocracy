"""
Utility functions for the Trade & Tariff Analysis MCP Server
"""
import logging
import time
import hashlib
import json
from typing import Dict, Any, Optional, Union
from functools import wraps
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Simple in-memory cache
_cache = {}
_cache_ttl = {}

def get_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

def cache_result(ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = get_cache_key(func.__name__, *args, **kwargs)
            current_time = time.time()
            
            # Check if cached result exists and is still valid
            if cache_key in _cache and cache_key in _cache_ttl:
                if current_time - _cache_ttl[cache_key] < ttl:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return _cache[cache_key]
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_ttl[cache_key] = current_time
            
            logger.debug(f"Cached result for {func.__name__}")
            return result
        return wrapper
    return decorator

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator to retry function on failure"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}")
                        time.sleep(delay * (2 ** attempt))  # Exponential backoff
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed for {func.__name__}")
            
            raise last_exception
        return wrapper
    return decorator

def validate_hts_code(hts_code: str) -> bool:
    """Validate HTS code format"""
    if not hts_code:
        return False
    
    # Remove dots and spaces
    clean_code = hts_code.replace(".", "").replace(" ", "")
    
    # Check if it's numeric and has appropriate length
    if not clean_code.isdigit():
        return False
    
    # HTS codes are typically 6-10 digits
    if len(clean_code) < 6 or len(clean_code) > 10:
        return False
    
    return True

def validate_year(year: Union[str, int]) -> bool:
    """Validate year format and range"""
    try:
        year_int = int(year)
        return 1990 <= year_int <= 2030
    except (ValueError, TypeError):
        return False

def validate_country_code(country: str) -> bool:
    """Validate country code format"""
    if not country:
        return False
    
    # Allow common country codes and names
    valid_countries = {
        "us", "usa", "united states", "america",
        "china", "cn", "chinese",
        "mexico", "mx", "mexican",
        "canada", "ca", "canadian",
        "japan", "jp", "japanese",
        "korea", "kr", "korean", "south korea",
        "germany", "de", "german",
        "vietnam", "vn", "vietnamese",
        "india", "in", "indian",
        "mfn", "most favored nation"
    }
    
    return country.lower() in valid_countries

def sanitize_input(value: Any) -> str:
    """Sanitize input to prevent injection attacks"""
    if value is None:
        return ""
    
    # Convert to string and strip whitespace
    sanitized = str(value).strip()
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized

def create_session() -> requests.Session:
    """Create a requests session with retry strategy"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session

@retry_on_failure(max_retries=3)
def make_api_request(
    url: str, 
    headers: Optional[Dict] = None, 
    params: Optional[Dict] = None, 
    json_data: Optional[Dict] = None, 
    method: str = "GET",
    timeout: int = 30
) -> Dict[str, Any]:
    """Make a standardized API request with error handling and retries"""
    try:
        session = create_session()
        
        logger.info(f"Making {method} request to {url}")
        
        if method.upper() == "GET":
            response = session.get(url, headers=headers, params=params, timeout=timeout)
        elif method.upper() == "POST":
            response = session.post(url, headers=headers, params=params, json=json_data, timeout=timeout)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        
        # Handle different response types
        if response.content:
            try:
                data = response.json()
            except json.JSONDecodeError:
                data = response.text
        else:
            data = {}
        
        return {
            "success": True,
            "data": data,
            "status_code": response.status_code,
            "headers": dict(response.headers)
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"Request timeout for {url}")
        return {
            "success": False,
            "error": "Request timeout",
            "status_code": 408
        }
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error for {url}")
        return {
            "success": False,
            "error": "Connection error",
            "status_code": None
        }
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error for {url}: {e}")
        return {
            "success": False,
            "error": f"HTTP error: {e}",
            "status_code": e.response.status_code if e.response else None
        }
    except Exception as e:
        logger.error(f"Unexpected error for {url}: {e}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "status_code": None
        }

def format_currency(amount: float, currency: str = "USD") -> str:
    """Format currency amount"""
    if currency == "USD":
        return f"${amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"

def format_percentage(rate: float) -> str:
    """Format percentage rate"""
    return f"{rate:.2f}%"

def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float"""
    try:
        if isinstance(value, str):
            # Remove commas and other formatting
            clean_value = value.replace(",", "").replace("%", "")
            return float(clean_value)
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert value to int"""
    try:
        if isinstance(value, str):
            clean_value = value.replace(",", "")
            return int(clean_value)
        return int(value)
    except (ValueError, TypeError):
        return default

def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to maximum length"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."

def extract_hts_from_text(text: str) -> Optional[str]:
    """Extract HTS code from text"""
    import re
    
    # Look for HTS code patterns
    patterns = [
        r'\b(\d{4}\.\d{2}\.\d{2})\b',  # 1234.56.78
        r'\b(\d{6,10})\b',              # 123456 or 1234567890
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            code = match.group(1)
            if validate_hts_code(code):
                return code
    
    return None

def log_api_call(api_name: str, endpoint: str, params: Dict = None, success: bool = True):
    """Log API call for monitoring"""
    status = "SUCCESS" if success else "FAILED"
    logger.info(f"API Call - {api_name}:{endpoint} - {status}")
    if params:
        logger.debug(f"Parameters: {params}")

def clear_cache():
    """Clear the function result cache"""
    global _cache, _cache_ttl
    _cache.clear()
    _cache_ttl.clear()
    logger.info("Cache cleared")

def get_cache_stats() -> Dict[str, int]:
    """Get cache statistics"""
    current_time = time.time()
    valid_entries = sum(1 for ttl in _cache_ttl.values() if current_time - ttl < 300)
    
    return {
        "total_entries": len(_cache),
        "valid_entries": valid_entries,
        "expired_entries": len(_cache) - valid_entries
    }
