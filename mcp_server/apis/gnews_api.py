"""
GNews API client for trade and tariff news
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .base_api import BaseAPIClient
from ..utils import cache_result, sanitize_input

logger = logging.getLogger(__name__)

class GNewsAPIClient(BaseAPIClient):
    """Client for GNews API"""
    
    def test_connection(self) -> bool:
        """Test GNews API connection"""
        try:
            result = self.get_news("tariff", max_results=1)
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"GNews API connection test failed: {e}")
            return False
    
    @cache_result(ttl=900)  # Cache for 15 minutes
    def get_news(
        self,
        query: str = "tariff",
        country: str = "us",
        max_results: int = 10,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """Get trade and tariff-related news using GNews API"""
        
        # Sanitize inputs
        query = sanitize_input(query)
        country = sanitize_input(country).lower()
        
        if not query:
            return {"status": "error", "error": "Query cannot be empty"}
        
        if days_back < 1 or days_back > 30:
            return {"status": "error", "error": "Days back must be between 1 and 30"}
        
        if max_results < 1 or max_results > 100:
            return {"status": "error", "error": "Max results must be between 1 and 100"}
        
        url = "search"
        
        # Calculate date range
        date_from = (datetime.utcnow() - timedelta(days=days_back)).isoformat("T") + "Z"
        
        params = {
            "q": query,
            "country": country,
            "lang": "en",
            "max": min(max_results, 100),  # API limit
            "from": date_from,
            "sortby": "publishedAt",
            "apikey": self.api_key
        }
        
        result = self._make_request(url, params=params)
        
        if result["success"]:
            articles = result["data"].get("articles", [])
            
            # Process articles
            processed_articles = []
            for article in articles:
                processed_articles.append({
                    "title": article.get("title", ""),
                    "description": article.get("description", ""),
                    "content": article.get("content", ""),
                    "url": article.get("url", ""),
                    "image": article.get("image", ""),
                    "published_at": article.get("publishedAt", ""),
                    "source": {
                        "name": article.get("source", {}).get("name", ""),
                        "url": article.get("source", {}).get("url", "")
                    }
                })
            
            return {
                "status": "success",
                "query": query,
                "total_articles": result["data"].get("totalArticles", 0),
                "articles_returned": len(processed_articles),
                "articles": processed_articles,
                "search_params": {
                    "country": country,
                    "days_back": days_back,
                    "max_results": max_results,
                    "date_from": date_from
                }
            }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
    
    def get_trade_news(
        self,
        query: str = "tariff",
        country: str = "us",
        max_results: int = 10,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """Get trade-specific news with enhanced query"""
        
        # Enhance query for trade-specific news
        trade_queries = [
            f"{query} trade",
            f"{query} import export",
            f"{query} tariff duty",
            f"{query} customs"
        ]
        
        all_articles = []
        seen_urls = set()
        
        for trade_query in trade_queries[:2]:  # Limit to avoid too many API calls
            result = self.get_news(
                query=trade_query,
                country=country,
                max_results=max_results // 2,
                days_back=days_back
            )
            
            if result["status"] == "success":
                for article in result["articles"]:
                    url = article.get("url", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        all_articles.append(article)
        
        return {
            "status": "success",
            "query": query,
            "total_articles": len(all_articles),
            "articles": all_articles[:max_results],
            "search_params": {
                "country": country,
                "days_back": days_back,
                "max_results": max_results
            }
        }
    
    def get_policy_news(self, days_back: int = 14) -> Dict[str, Any]:
        """Get policy-specific news"""
        
        policy_queries = [
            "tariff policy announcement",
            "trade policy change",
            "customs duty increase",
            "import tax policy"
        ]
        
        all_articles = []
        seen_urls = set()
        
        for query in policy_queries:
            result = self.get_news(
                query=query,
                country="us",
                max_results=5,
                days_back=days_back
            )
            
            if result["status"] == "success":
                for article in result["articles"]:
                    url = article.get("url", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        all_articles.append(article)
        
        return {
            "status": "success",
            "query": "policy news",
            "total_articles": len(all_articles),
            "articles": all_articles,
            "search_params": {
                "days_back": days_back,
                "queries_used": policy_queries
            }
        }
    
    def search_by_keywords(
        self,
        keywords: List[str],
        country: str = "us",
        max_results: int = 20,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """Search news by multiple keywords"""
        
        if not keywords:
            return {"status": "error", "error": "Keywords list cannot be empty"}
        
        all_articles = []
        seen_urls = set()
        
        for keyword in keywords[:5]:  # Limit to 5 keywords
            result = self.get_news(
                query=keyword,
                country=country,
                max_results=max_results // len(keywords),
                days_back=days_back
            )
            
            if result["status"] == "success":
                for article in result["articles"]:
                    url = article.get("url", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        all_articles.append(article)
        
        return {
            "status": "success",
            "keywords": keywords,
            "total_articles": len(all_articles),
            "articles": all_articles[:max_results],
            "search_params": {
                "country": country,
                "days_back": days_back,
                "max_results": max_results
            }
        }
