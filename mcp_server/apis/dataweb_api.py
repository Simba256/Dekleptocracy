"""
USITC DataWeb API client
"""
import logging
from typing import Dict, Any, List, Optional
from .base_api import BaseAPIClient
from ..utils import cache_result, validate_hts_code, validate_year

logger = logging.getLogger(__name__)

class DataWebAPIClient(BaseAPIClient):
    """Client for USITC DataWeb API"""
    
    def test_connection(self) -> bool:
        """Test DataWeb API connection"""
        try:
            # Try a simple query to test connection
            result = self.search_trade_data(
                commodity_code="87032300",
                country_codes=["CN"],
                start_year="2023",
                end_year="2023"
            )
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"DataWeb API connection test failed: {e}")
            return False
    
    @cache_result(ttl=1800)  # Cache for 30 minutes
    def search_trade_data(
        self,
        commodity_code: str = "",
        country_codes: List[str] = None,
        start_year: str = "2023",
        end_year: str = "2023",
        trade_flow: str = "Import"
    ) -> Dict[str, Any]:
        """Search USITC DataWeb for detailed trade statistics"""
        
        # Validate inputs
        if commodity_code and not validate_hts_code(commodity_code):
            return {"status": "error", "error": f"Invalid commodity code: {commodity_code}"}
        
        if not validate_year(start_year) or not validate_year(end_year):
            return {"status": "error", "error": "Invalid year range"}
        
        if trade_flow not in ["Import", "Export", "Re-export"]:
            return {"status": "error", "error": f"Invalid trade flow: {trade_flow}"}
        
        url = "api/v2/report2/runReport"
        
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {self.token}"
        }
        
        # Build query structure based on USITC DataWeb API format
        query = {
            "aggregateBy": ["TradeFlow", "Partner", "Commodity"],
            "dataSelection": {
                "dataAvailability": {
                    "tradeFlows": [trade_flow],
                    "partner": country_codes if country_codes else ["all"],
                    "commodity": [commodity_code] if commodity_code else ["all"],
                    "maxAvailableYear": end_year,
                    "timePeriod": "Annual",
                    "years": [start_year] if start_year == end_year else [start_year, end_year]
                }
            }
        }
        
        result = self._make_request(url, method="POST", json_data=query, headers=headers)
        
        if result["success"]:
            data = result["data"]
            tables = data.get("dto", {}).get("tables", [])
            
            if tables:
                table_data = tables[0]
                return {
                    "status": "success",
                    "query_params": {
                        "commodity_code": commodity_code,
                        "countries": country_codes,
                        "years": f"{start_year}-{end_year}",
                        "trade_flow": trade_flow
                    },
                    "data_summary": {
                        "total_records": len(table_data.get("row_groups", [{}])[0].get("rowsNew", [])),
                        "columns": [
                            col["label"] 
                            for group in table_data.get("column_groups", []) 
                            for col in group.get("columns", [])
                        ],
                        "sample_data": table_data.get("row_groups", [{}])[0].get("rowsNew", [])[:5]
                    },
                    "raw_data": table_data
                }
            else:
                return {
                    "status": "success", 
                    "message": "No data found for specified criteria",
                    "query_params": {
                        "commodity_code": commodity_code,
                        "countries": country_codes,
                        "years": f"{start_year}-{end_year}",
                        "trade_flow": trade_flow
                    }
                }
        else:
            return {
                "status": "error",
                "error": result["error"]
            }
    
    def analyze_trade_anomalies(
        self, 
        hts_code: str, 
        country_code: str, 
        years: List[str] = None
    ) -> Dict[str, Any]:
        """Analyze trade data for potential anomalies or suspicious patterns"""
        
        if not validate_hts_code(hts_code):
            return {"status": "error", "error": f"Invalid HTS code: {hts_code}"}
        
        if years is None:
            years = ["2022", "2023"]
        
        # Validate all years
        for year in years:
            if not validate_year(year):
                return {"status": "error", "error": f"Invalid year: {year}"}
        
        trade_data = []
        
        for year in years:
            yearly_data = self.search_trade_data(
                commodity_code=hts_code,
                country_codes=[country_code.upper()],
                start_year=year,
                end_year=year
            )
            
            if yearly_data["status"] == "success":
                trade_data.append({
                    "year": year,
                    "data": yearly_data
                })
        
        # Perform anomaly analysis
        anomalies = {
            "volume_changes": [],
            "value_changes": [],
            "unit_value_anomalies": []
        }
        
        if len(trade_data) >= 2:
            # Compare consecutive years for unusual changes
            for i in range(1, len(trade_data)):
                prev_year = trade_data[i-1]
                curr_year = trade_data[i]
                
                # Calculate percentage changes
                prev_records = prev_year["data"].get("data_summary", {}).get("total_records", 0)
                curr_records = curr_year["data"].get("data_summary", {}).get("total_records", 0)
                
                if prev_records > 0:
                    volume_change = ((curr_records - prev_records) / prev_records) * 100
                    
                    anomalies["volume_changes"].append({
                        "from_year": prev_year["year"],
                        "to_year": curr_year["year"],
                        "volume_change_percent": round(volume_change, 2),
                        "is_anomaly": abs(volume_change) > 50  # Flag changes > 50%
                    })
        
        return {
            "status": "success",
            "product": hts_code,
            "country": country_code,
            "analysis_period": years,
            "anomalies_detected": anomalies,
            "data_points": len(trade_data),
            "trade_data": trade_data
        }
    
    def get_country_list(self) -> Dict[str, Any]:
        """Get list of available countries"""
        # This would typically call a DataWeb endpoint for country codes
        # For now, return a static list of common trading partners
        return {
            "status": "success",
            "countries": [
                {"code": "CN", "name": "China"},
                {"code": "MX", "name": "Mexico"},
                {"code": "CA", "name": "Canada"},
                {"code": "JP", "name": "Japan"},
                {"code": "KR", "name": "South Korea"},
                {"code": "DE", "name": "Germany"},
                {"code": "VN", "name": "Vietnam"},
                {"code": "IN", "name": "India"},
                {"code": "GB", "name": "United Kingdom"},
                {"code": "FR", "name": "France"}
            ]
        }
