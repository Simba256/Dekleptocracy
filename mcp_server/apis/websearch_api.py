"""
Web Search API client using DuckDuckGo
"""
import logging
from typing import Dict, Any, List, Optional
from duckduckgo_search import DDGS
from utils import cache_result, sanitize_input

logger = logging.getLogger(__name__)

class WebSearchAPIClient:
    """Client for web search using DuckDuckGo"""

    def __init__(self):
        """Initialize Web Search client (no API key needed)"""
        self.ddgs = DDGS()

    def test_connection(self) -> bool:
        """Test search API connection"""
        try:
            results = list(self.ddgs.text("test", max_results=1))
            return len(results) > 0
        except Exception as e:
            logger.error(f"Web search API connection test failed: {e}")
            return False

    @cache_result(ttl=1800)  # Cache for 30 minutes
    def search_web(
        self,
        query: str,
        max_results: int = 10,
        region: str = "us-en"
    ) -> Dict[str, Any]:
        """Search the web using DuckDuckGo

        Args:
            query: Search query
            max_results: Maximum number of results (1-20)
            region: Region code (us-en, uk-en, etc.)
        """
        try:
            query = sanitize_input(query)
            if not query:
                return {"status": "error", "error": "Query cannot be empty"}

            if max_results < 1 or max_results > 20:
                max_results = 10

            results = list(self.ddgs.text(
                query,
                region=region,
                max_results=max_results
            ))

            processed_results = []
            for result in results:
                processed_results.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("body", ""),
                    "url": result.get("href", ""),
                })

            return {
                "status": "success",
                "query": query,
                "results": processed_results,
                "total_results": len(processed_results)
            }

        except Exception as e:
            logger.error(f"Error searching web: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=1800)
    def search_news(
        self,
        query: str,
        max_results: int = 10,
        region: str = "us-en"
    ) -> Dict[str, Any]:
        """Search news using DuckDuckGo

        Args:
            query: Search query
            max_results: Maximum number of results (1-20)
            region: Region code (us-en, uk-en, etc.)
        """
        try:
            query = sanitize_input(query)
            if not query:
                return {"status": "error", "error": "Query cannot be empty"}

            if max_results < 1 or max_results > 20:
                max_results = 10

            results = list(self.ddgs.news(
                query,
                region=region,
                max_results=max_results
            ))

            processed_results = []
            for result in results:
                processed_results.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("body", ""),
                    "url": result.get("url", ""),
                    "date": result.get("date", ""),
                    "source": result.get("source", "")
                })

            return {
                "status": "success",
                "query": query,
                "results": processed_results,
                "total_results": len(processed_results)
            }

        except Exception as e:
            logger.error(f"Error searching news: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def search_tariff_info(self, topic: str) -> Dict[str, Any]:
        """Search for tariff-specific information

        Args:
            topic: Topic to search (e.g., 'steel tariffs', 'china tariffs')
        """
        query = f"{topic} tariffs trade policy"
        return self.search_web(query, max_results=10)

    @cache_result(ttl=3600)
    def get_trade_policy_news(self, country: str = "US") -> Dict[str, Any]:
        """Get recent trade policy news for a country

        Args:
            country: Country name (default: US)
        """
        query = f"{country} trade policy tariffs news"
        return self.search_news(query, max_results=10)
