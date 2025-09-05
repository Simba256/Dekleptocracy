"""
BEA (Bureau of Economic Analysis) API client
"""
import logging
from typing import Dict, Any, List, Optional
from .base_api import BaseAPIClient
from ..utils import cache_result, validate_year

logger = logging.getLogger(__name__)

class BEAAPIClient(BaseAPIClient):
    """Client for BEA API"""
    
    def test_connection(self) -> bool:
        """Test BEA API connection"""
        try:
            result = self.get_datasets()
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"BEA API connection test failed: {e}")
            return False
    
    @cache_result(ttl=3600)  # Cache for 1 hour
    def get_datasets(self) -> Dict[str, Any]:
        """Get list of available BEA datasets"""
        params = {
            "UserID": self.api_key,
            "method": "GETDATASETLIST",
            "ResultFormat": "JSON"
        }
        
        result = self._make_request("", params=params)
        
        if result["success"]:
            data = result["data"]
            datasets = data.get("BEAAPI", {}).get("Results", {}).get("Dataset", [])
            return {
                "status": "success",
                "datasets": datasets,
                "total_count": len(datasets)
            }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
    
    @cache_result(ttl=1800)  # Cache for 30 minutes
    def get_data(
        self, 
        dataset_name: str, 
        table_name: str, 
        frequency: str = "A", 
        year: str = "2023"
    ) -> Dict[str, Any]:
        """Get BEA economic data for specific dataset and table"""
        
        # Validate inputs
        if not validate_year(year):
            return {"status": "error", "error": f"Invalid year: {year}"}
        
        if frequency not in ["A", "Q", "M"]:
            return {"status": "error", "error": f"Invalid frequency: {frequency}"}
        
        params = {
            "UserID": self.api_key,
            "method": "GetData",
            "DatasetName": dataset_name,
            "TableName": table_name,
            "Frequency": frequency,
            "Year": year,
            "ResultFormat": "JSON"
        }
        
        result = self._make_request("", params=params)
        
        if result["success"]:
            data = result["data"].get("BEAAPI", {}).get("Results", {})
            return {
                "status": "success",
                "dataset": dataset_name,
                "table": table_name,
                "data": data.get("Data", []),
                "metadata": {
                    "frequency": frequency,
                    "year": year,
                    "notes": data.get("Notes", []),
                    "total_records": len(data.get("Data", []))
                }
            }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
    
    def analyze_gdp_by_industry(self, year: str = "2023") -> Dict[str, Any]:
        """Analyze GDP by industry from BEA data"""
        gdp_data = self.get_data("NIPA", "T70205", "A", year)
        
        if gdp_data["status"] == "error":
            return gdp_data
        
        # Process and analyze the data
        industries = []
        for item in gdp_data["data"]:
            if "DataValue" in item and item["DataValue"] != "":
                try:
                    value = float(item["DataValue"].replace(",", ""))
                    industries.append({
                        "line_description": item.get("LineDescription", ""),
                        "value_billions": value,
                        "time_period": item.get("TimePeriod", "")
                    })
                except (ValueError, TypeError):
                    continue
        
        # Sort by value descending
        industries.sort(key=lambda x: x["value_billions"], reverse=True)
        
        # Calculate totals and identify trade-sensitive sectors
        total_gdp = sum(ind["value_billions"] for ind in industries)
        trade_sensitive_keywords = ["manufacturing", "agriculture", "mining", "trade", "transportation"]
        
        trade_sensitive_sectors = [
            ind for ind in industries 
            if any(keyword in ind["line_description"].lower() for keyword in trade_sensitive_keywords)
        ]
        
        return {
            "status": "success",
            "year": year,
            "total_industries": len(industries),
            "top_10_industries": industries[:10],
            "analysis": {
                "largest_sector": industries[0] if industries else None,
                "total_gdp": total_gdp,
                "trade_sensitive_sectors": trade_sensitive_sectors,
                "trade_sensitive_percentage": (sum(s["value_billions"] for s in trade_sensitive_sectors) / total_gdp * 100) if total_gdp > 0 else 0
            }
        }
    
    def get_regional_data(self, table_name: str, year: str = "2023") -> Dict[str, Any]:
        """Get regional economic data"""
        return self.get_data("Regional", table_name, "A", year)
    
    def get_international_trade_data(self, table_name: str, year: str = "2023") -> Dict[str, Any]:
        """Get international trade accounts data"""
        return self.get_data("ITA", table_name, "A", year)
