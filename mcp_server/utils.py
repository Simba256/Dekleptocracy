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

def clear_cache() -> dict:
    """Clear all cached results and return stats"""
    global _cache, _cache_ttl
    count = len(_cache)
    _cache = {}
    _cache_ttl = {}
    logger.info(f"Cleared {count} cached items")
    return {"cleared": count}

def get_cache_stats() -> dict:
    """Get cache statistics"""
    return {
        "items": len(_cache),
        "keys": list(_cache.keys())[:20]  # Show first 20 keys
    }

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


# ============================================================================
# Token Counting and Context Management Utilities
# ============================================================================

try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False
    logger.warning("tiktoken not available - token counting will use character estimation")

# Token encoding cache
_encoding_cache = {}

# Model to encoding mapping
MODEL_TO_ENCODING = {
    "gpt-4": "cl100k_base",
    "gpt-4-turbo": "cl100k_base",
    "gpt-4o": "o200k_base",
    "gpt-5": "o200k_base",
    "gpt-3.5-turbo": "cl100k_base",
    "o1": "o200k_base",
    "o1-preview": "o200k_base",
    "o1-mini": "o200k_base",
}

# Context window limits for different models
MODEL_CONTEXT_LIMITS = {
    "gpt-4": 8192,
    "gpt-4-32k": 32768,
    "gpt-4-turbo": 128000,
    "gpt-4o": 128000,
    "gpt-5": 128000,
    "gpt-3.5-turbo": 16385,
    "o1": 200000,
    "o1-preview": 128000,
    "o1-mini": 128000,
    "gemini-pro": 32768,
    "gemini-1.5-pro": 1000000,
    "gemini-1.5-flash": 1000000,
}


def get_encoding_for_model(model: str):
    """Get the tiktoken encoding for a specific model"""
    if not TIKTOKEN_AVAILABLE:
        return None

    # Check cache first
    if model in _encoding_cache:
        return _encoding_cache[model]

    # Find the right encoding name
    encoding_name = "cl100k_base"  # default
    for model_prefix, enc_name in MODEL_TO_ENCODING.items():
        if model.startswith(model_prefix):
            encoding_name = enc_name
            break

    try:
        encoding = tiktoken.get_encoding(encoding_name)
        _encoding_cache[model] = encoding
        return encoding
    except Exception as e:
        logger.warning(f"Could not get encoding for model {model}: {e}")
        return None


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """
    Count the number of tokens in a text string for a specific model.
    Falls back to character-based estimation if tiktoken is not available.

    Args:
        text: The text to count tokens for
        model: The model to use for token counting

    Returns:
        Estimated number of tokens
    """
    if not text:
        return 0

    if TIKTOKEN_AVAILABLE:
        encoding = get_encoding_for_model(model)
        if encoding:
            try:
                return len(encoding.encode(text))
            except Exception as e:
                logger.warning(f"Error counting tokens with tiktoken: {e}")

    # Fallback: estimate based on characters (roughly 4 chars per token for English)
    return len(text) // 4


def count_message_tokens(messages: list, model: str = "gpt-4") -> int:
    """
    Count tokens for a list of messages in OpenAI chat format.

    Args:
        messages: List of message dicts with 'role' and 'content' keys
        model: The model to use for token counting

    Returns:
        Total estimated tokens including message formatting overhead
    """
    if not messages:
        return 0

    total_tokens = 0

    # Tokens per message overhead (varies by model)
    tokens_per_message = 3  # Default overhead for role + formatting
    tokens_per_name = 1  # Overhead if name field is present

    for message in messages:
        total_tokens += tokens_per_message

        # Handle both dict and object-style messages
        if isinstance(message, dict):
            role = message.get("role", "")
            content = message.get("content", "")
            name = message.get("name", "")
        else:
            role = getattr(message, "role", "")
            content = getattr(message, "content", "")
            name = getattr(message, "name", "")

        total_tokens += count_tokens(role, model)
        total_tokens += count_tokens(content, model)

        if name:
            total_tokens += tokens_per_name
            total_tokens += count_tokens(name, model)

    # Add overhead for assistant reply priming
    total_tokens += 3

    return total_tokens


def get_model_context_limit(model: str) -> int:
    """
    Get the context window limit for a specific model.

    Args:
        model: The model name

    Returns:
        Maximum context window size in tokens
    """
    # Check for exact match first
    if model in MODEL_CONTEXT_LIMITS:
        return MODEL_CONTEXT_LIMITS[model]

    # Check for prefix match
    for model_prefix, limit in MODEL_CONTEXT_LIMITS.items():
        if model.startswith(model_prefix):
            return limit

    # Default conservative limit
    logger.warning(f"Unknown model {model}, using conservative 8K context limit")
    return 8192


def estimate_tokens_remaining(
    messages: list,
    model: str = "gpt-4",
    max_completion_tokens: int = 4000
) -> Dict[str, int]:
    """
    Estimate how many tokens remain for completion.

    Args:
        messages: Current conversation messages
        model: Model being used
        max_completion_tokens: Maximum tokens to reserve for completion

    Returns:
        Dict with token usage breakdown
    """
    context_limit = get_model_context_limit(model)
    messages_tokens = count_message_tokens(messages, model)
    tokens_for_completion = min(max_completion_tokens, context_limit - messages_tokens)

    return {
        "context_limit": context_limit,
        "messages_tokens": messages_tokens,
        "reserved_for_completion": max_completion_tokens,
        "available_for_completion": max(0, tokens_for_completion),
        "tokens_remaining": max(0, context_limit - messages_tokens - max_completion_tokens),
        "utilization_percent": round((messages_tokens / context_limit) * 100, 2) if context_limit > 0 else 0
    }


def truncate_messages_to_fit(
    messages: list,
    model: str = "gpt-4",
    max_tokens: Optional[int] = None,
    reserved_for_completion: int = 4000,
    preserve_system: bool = True,
    preserve_recent: int = 3
) -> list:
    """
    Truncate message history to fit within token limits.

    Args:
        messages: List of message dicts
        model: Model being used
        max_tokens: Maximum tokens for messages (if None, uses model limit - reserved_for_completion)
        reserved_for_completion: Tokens to reserve for the completion
        preserve_system: Always keep system messages
        preserve_recent: Number of recent messages to always keep

    Returns:
        Truncated list of messages
    """
    if not messages:
        return []

    # Calculate token budget
    if max_tokens is None:
        context_limit = get_model_context_limit(model)
        max_tokens = context_limit - reserved_for_completion

    # Separate system messages and conversation messages
    system_messages = []
    conversation_messages = []

    for msg in messages:
        role = msg.get("role") if isinstance(msg, dict) else getattr(msg, "role", "")
        if role == "system" and preserve_system:
            system_messages.append(msg)
        else:
            conversation_messages.append(msg)

    # Count system message tokens
    system_tokens = count_message_tokens(system_messages, model) if system_messages else 0
    remaining_budget = max_tokens - system_tokens

    if remaining_budget <= 0:
        logger.warning(f"System messages alone exceed token budget ({system_tokens} > {max_tokens})")
        return system_messages

    # Always preserve the most recent messages
    preserved_messages = conversation_messages[-preserve_recent:] if preserve_recent > 0 else []
    older_messages = conversation_messages[:-preserve_recent] if preserve_recent > 0 else conversation_messages

    # Build message list from preserved messages backwards
    preserved_tokens = count_message_tokens(preserved_messages, model)
    remaining_budget -= preserved_tokens

    # Add older messages until we run out of budget
    included_older = []
    for msg in reversed(older_messages):
        msg_tokens = count_message_tokens([msg], model)
        if msg_tokens <= remaining_budget:
            included_older.insert(0, msg)
            remaining_budget -= msg_tokens
        else:
            break

    # Combine all parts
    final_messages = system_messages + included_older + preserved_messages

    # Log truncation info
    original_count = len(messages)
    final_count = len(final_messages)
    if original_count > final_count:
        logger.info(f"Truncated conversation history: {original_count} -> {final_count} messages")
        logger.info(f"Token usage: {count_message_tokens(final_messages, model)}/{max_tokens}")

    return final_messages


def summarize_old_messages(
    messages: list,
    model: str = "gpt-4",
    keep_recent: int = 5
) -> str:
    """
    Create a summary of old messages to compress context.
    This is a simple extraction-based summary for now.

    Args:
        messages: List of message dicts
        model: Model being used
        keep_recent: Number of recent messages to exclude from summary

    Returns:
        Summary text
    """
    if len(messages) <= keep_recent:
        return ""

    old_messages = messages[:-keep_recent]

    # Extract key information
    summary_parts = []
    summary_parts.append(f"Previous conversation context ({len(old_messages)} messages):")

    for i, msg in enumerate(old_messages, 1):
        role = msg.get("role") if isinstance(msg, dict) else getattr(msg, "role", "")
        content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")

        # Truncate long messages in summary
        truncated_content = truncate_text(content, max_length=200)
        summary_parts.append(f"{i}. {role}: {truncated_content}")

    return "\n".join(summary_parts)
