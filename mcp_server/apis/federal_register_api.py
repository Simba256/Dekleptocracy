"""
Federal Register API client
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .base_api import BaseAPIClient
from ..utils import cache_result, sanitize_input

logger = logging.getLogger(__name__)

class FederalRegisterAPIClient(BaseAPIClient):
    """Client for Federal Register API"""
    
    def test_connection(self) -> bool:
        """Test Federal Register API connection"""
        try:
            result = self.search_documents("tariff", max_results=1)
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"Federal Register API connection test failed: {e}")
            return False
    
    @cache_result(ttl=1800)  # Cache for 30 minutes
    def search_documents(
        self,
        query: str,
        start_date: str = "",
        end_date: str = "",
        agencies: List[str] = None,
        document_type: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Search Federal Register for trade and tariff-related documents"""
        
        # Sanitize inputs
        query = sanitize_input(query)
        start_date = sanitize_input(start_date)
        end_date = sanitize_input(end_date)
        document_type = sanitize_input(document_type)
        
        if not query:
            return {"status": "error", "error": "Query cannot be empty"}
        
        url = "documents.json"
        
        params = {
            "conditions[term]": query,
            "per_page": min(max_results, 100),  # API limit
            "order": "newest"
        }
        
        if start_date:
            params["conditions[publication_date][gte]"] = start_date
        if end_date:
            params["conditions[publication_date][lte]"] = end_date
        if agencies:
            params["conditions[agencies][]"] = agencies
        if document_type:
            params["conditions[type]"] = document_type
        
        result = self._make_request(url, params=params)
        
        if result["success"]:
            documents = result["data"].get("results", [])
            
            # Process documents
            processed_docs = []
            for doc in documents:
                processed_docs.append({
                    "title": doc.get("title", ""),
                    "abstract": doc.get("abstract", ""),
                    "publication_date": doc.get("publication_date", ""),
                    "type": doc.get("type", ""),
                    "agencies": [agency.get("name", "") for agency in doc.get("agencies", [])],
                    "pdf_url": doc.get("pdf_url", ""),
                    "html_url": doc.get("html_url", ""),
                    "document_number": doc.get("document_number", ""),
                    "page_length": doc.get("page_length", 0),
                    "citation": doc.get("citation", "")
                })
            
            return {
                "status": "success",
                "query": query,
                "total_results": result["data"].get("count", 0),
                "documents_returned": len(processed_docs),
                "documents": processed_docs,
                "search_params": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "agencies": agencies,
                    "document_type": document_type,
                    "max_results": max_results
                }
            }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
    
    def get_recent_tariff_announcements(self, days_back: int = 30) -> Dict[str, Any]:
        """Get recent tariff and trade-related announcements from Federal Register"""
        
        if days_back < 1 or days_back > 365:
            return {"status": "error", "error": "Days back must be between 1 and 365"}
        
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        # Search for tariff-related terms
        tariff_results = self.search_documents(
            query="tariff OR duty OR import OR trade",
            start_date=start_date,
            end_date=end_date,
            agencies=["commerce-department", "treasury-department", "ustr"],
            max_results=50
        )
        
        if tariff_results["status"] == "success":
            # Filter and categorize results
            announcements = {
                "tariff_changes": [],
                "trade_policies": [],
                "other_trade_actions": []
            }
            
            for doc in tariff_results["documents"]:
                title_lower = doc["title"].lower()
                
                if any(term in title_lower for term in ["tariff", "duty", "rate"]):
                    announcements["tariff_changes"].append(doc)
                elif any(term in title_lower for term in ["trade agreement", "preference", "quota"]):
                    announcements["trade_policies"].append(doc)
                else:
                    announcements["other_trade_actions"].append(doc)
            
            return {
                "status": "success",
                "search_period": f"{start_date} to {end_date}",
                "total_documents": len(tariff_results["documents"]),
                "categorized_announcements": announcements,
                "summary": {
                    "tariff_changes": len(announcements["tariff_changes"]),
                    "trade_policies": len(announcements["trade_policies"]),
                    "other_actions": len(announcements["other_trade_actions"])
                }
            }
        else:
            return tariff_results
    
    def search_by_agency(
        self,
        agency: str,
        query: str = "",
        days_back: int = 30
    ) -> Dict[str, Any]:
        """Search documents by specific agency"""
        
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        return self.search_documents(
            query=query or "tariff OR trade",
            start_date=start_date,
            end_date=end_date,
            agencies=[agency],
            max_results=20
        )
    
    def get_document_details(self, document_number: str) -> Dict[str, Any]:
        """Get detailed information about a specific document"""
        
        if not document_number:
            return {"status": "error", "error": "Document number is required"}
        
        url = f"documents/{document_number}.json"
        
        result = self._make_request(url)
        
        if result["success"]:
            doc = result["data"]
            return {
                "status": "success",
                "document": {
                    "title": doc.get("title", ""),
                    "abstract": doc.get("abstract", ""),
                    "publication_date": doc.get("publication_date", ""),
                    "type": doc.get("type", ""),
                    "agencies": [agency.get("name", "") for agency in doc.get("agencies", [])],
                    "pdf_url": doc.get("pdf_url", ""),
                    "html_url": doc.get("html_url", ""),
                    "document_number": doc.get("document_number", ""),
                    "page_length": doc.get("page_length", 0),
                    "citation": doc.get("citation", ""),
                    "full_text": doc.get("full_text", ""),
                    "topics": doc.get("topics", []),
                    "regulation_id_numbers": doc.get("regulation_id_numbers", [])
                }
            }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
