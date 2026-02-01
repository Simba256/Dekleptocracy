"""
BEA (Bureau of Economic Analysis) API client
"""
import logging
from typing import Dict, Any, List, Optional
from .base_api import BaseAPIClient
from utils import cache_result, validate_year

logger = logging.getLogger(__name__)

# State FIPS codes for BEA Regional data requests
STATE_FIPS = {
    'Alabama': '01000', 'Alaska': '02000', 'Arizona': '04000', 'Arkansas': '05000',
    'California': '06000', 'Colorado': '08000', 'Connecticut': '09000', 'Delaware': '10000',
    'District of Columbia': '11000', 'Florida': '12000', 'Georgia': '13000', 'Hawaii': '15000',
    'Idaho': '16000', 'Illinois': '17000', 'Indiana': '18000', 'Iowa': '19000',
    'Kansas': '20000', 'Kentucky': '21000', 'Louisiana': '22000', 'Maine': '23000',
    'Maryland': '24000', 'Massachusetts': '25000', 'Michigan': '26000', 'Minnesota': '27000',
    'Mississippi': '28000', 'Missouri': '29000', 'Montana': '30000', 'Nebraska': '31000',
    'Nevada': '32000', 'New Hampshire': '33000', 'New Jersey': '34000', 'New Mexico': '35000',
    'New York': '36000', 'North Carolina': '37000', 'North Dakota': '38000', 'Ohio': '39000',
    'Oklahoma': '40000', 'Oregon': '41000', 'Pennsylvania': '42000', 'Rhode Island': '44000',
    'South Carolina': '45000', 'South Dakota': '46000', 'Tennessee': '47000', 'Texas': '48000',
    'Utah': '49000', 'Vermont': '50000', 'Virginia': '51000', 'Washington': '53000',
    'West Virginia': '54000', 'Wisconsin': '55000', 'Wyoming': '56000'
}

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

    @cache_result(ttl=3600)
    def get_state_gdp(self, state_name: str) -> Dict[str, Any]:
        """
        Get state GDP data from BEA Regional dataset.
        TableName: SAGDP2 (GDP by state)
        LineCode: 1 (All industry total)

        Args:
            state_name: Full state name (e.g., 'California')

        Returns:
            Dict with status, value, displayValue, change, time_series
        """
        if state_name not in STATE_FIPS:
            return {
                "status": "error",
                "error": f"Unknown state: {state_name}. Use full state name like 'California'."
            }

        geo_fips = STATE_FIPS[state_name]

        params = {
            "UserID": self.api_key,
            "method": "GetData",
            "DatasetName": "Regional",
            "TableName": "SAGDP2",
            "LineCode": "1",
            "GeoFips": geo_fips,
            "Year": "LAST5",
            "ResultFormat": "JSON"
        }

        result = self._make_request("", params=params)

        if not result["success"]:
            return {
                "status": "error",
                "error": result.get("error", "BEA API request failed")
            }

        try:
            data = result["data"].get("BEAAPI", {}).get("Results", {}).get("Data", [])

            if not data:
                return {
                    "status": "error",
                    "error": f"No GDP data found for {state_name}"
                }

            # Sort data by time period (year) descending
            # GDP data uses TimePeriod format like "2023"
            sorted_data = sorted(data, key=lambda x: x.get("TimePeriod", "0"), reverse=True)

            # Get latest value
            latest = sorted_data[0]
            latest_value_str = latest.get("DataValue", "").replace(",", "")

            if not latest_value_str or latest_value_str == "(NA)":
                return {
                    "status": "error",
                    "error": f"GDP data not available for {state_name}"
                }

            # GDP is in millions of dollars
            latest_value = float(latest_value_str)
            latest_year = latest.get("TimePeriod", "")

            # Calculate year-over-year change if previous year exists
            change = None
            change_display = ""
            change_direction = "neutral"

            if len(sorted_data) >= 2:
                prev = sorted_data[1]
                prev_value_str = prev.get("DataValue", "").replace(",", "")
                if prev_value_str and prev_value_str != "(NA)":
                    prev_value = float(prev_value_str)
                    if prev_value > 0:
                        change = ((latest_value - prev_value) / prev_value) * 100
                        change_display = f"{change:+.1f}%"
                        change_direction = "up" if change > 0 else "down" if change < 0 else "neutral"

            # Format display value (convert millions to billions)
            value_billions = latest_value / 1000
            display_value = f"${value_billions:,.1f}B"

            # Build time series for charts
            time_series = []
            for item in reversed(sorted_data):  # Oldest to newest
                val_str = item.get("DataValue", "").replace(",", "")
                if val_str and val_str != "(NA)":
                    try:
                        val = float(val_str) / 1000  # Convert to billions
                        year = item.get("TimePeriod", "")
                        time_series.append({
                            "date": f"{year}-01-01",
                            "value": val,
                            "label": f"${val:,.1f}B"
                        })
                    except (ValueError, TypeError):
                        continue

            return {
                "status": "success",
                "state": state_name,
                "value": value_billions,
                "displayValue": display_value,
                "change": change,
                "changeDisplay": change_display,
                "changeDirection": change_direction,
                "unit": "billions USD",
                "period": latest_year,
                "time_series": time_series,
                "source": "BEA Regional (SAGDP2)",
                "data": sorted_data
            }

        except Exception as e:
            logger.error(f"Error processing BEA GDP data for {state_name}: {e}")
            return {
                "status": "error",
                "error": f"Error processing GDP data: {str(e)}"
            }

    @cache_result(ttl=3600)
    def get_state_personal_income(self, state_name: str) -> Dict[str, Any]:
        """
        Get state per capita personal income from BEA Regional dataset.
        TableName: SAINC1 (Personal Income Summary)
        LineCode: 3 (Per capita personal income)

        Args:
            state_name: Full state name (e.g., 'California')

        Returns:
            Dict with status, value, displayValue, change, time_series
        """
        if state_name not in STATE_FIPS:
            return {
                "status": "error",
                "error": f"Unknown state: {state_name}. Use full state name like 'California'."
            }

        geo_fips = STATE_FIPS[state_name]

        params = {
            "UserID": self.api_key,
            "method": "GetData",
            "DatasetName": "Regional",
            "TableName": "SAINC1",
            "LineCode": "3",
            "GeoFips": geo_fips,
            "Year": "LAST5",
            "ResultFormat": "JSON"
        }

        result = self._make_request("", params=params)

        if not result["success"]:
            return {
                "status": "error",
                "error": result.get("error", "BEA API request failed")
            }

        try:
            data = result["data"].get("BEAAPI", {}).get("Results", {}).get("Data", [])

            if not data:
                return {
                    "status": "error",
                    "error": f"No personal income data found for {state_name}"
                }

            # Sort data by time period (year) descending
            sorted_data = sorted(data, key=lambda x: x.get("TimePeriod", "0"), reverse=True)

            # Get latest value
            latest = sorted_data[0]
            latest_value_str = latest.get("DataValue", "").replace(",", "")

            if not latest_value_str or latest_value_str == "(NA)":
                return {
                    "status": "error",
                    "error": f"Personal income data not available for {state_name}"
                }

            # Per capita income is in dollars
            latest_value = float(latest_value_str)
            latest_year = latest.get("TimePeriod", "")

            # Calculate year-over-year change if previous year exists
            change = None
            change_display = ""
            change_direction = "neutral"

            if len(sorted_data) >= 2:
                prev = sorted_data[1]
                prev_value_str = prev.get("DataValue", "").replace(",", "")
                if prev_value_str and prev_value_str != "(NA)":
                    prev_value = float(prev_value_str)
                    if prev_value > 0:
                        change = ((latest_value - prev_value) / prev_value) * 100
                        change_display = f"{change:+.1f}%"
                        change_direction = "up" if change > 0 else "down" if change < 0 else "neutral"

            # Format display value
            display_value = f"${latest_value:,.0f}"

            # Build time series for charts
            time_series = []
            for item in reversed(sorted_data):  # Oldest to newest
                val_str = item.get("DataValue", "").replace(",", "")
                if val_str and val_str != "(NA)":
                    try:
                        val = float(val_str)
                        year = item.get("TimePeriod", "")
                        time_series.append({
                            "date": f"{year}-01-01",
                            "value": val,
                            "label": f"${val:,.0f}"
                        })
                    except (ValueError, TypeError):
                        continue

            return {
                "status": "success",
                "state": state_name,
                "value": latest_value,
                "displayValue": display_value,
                "change": change,
                "changeDisplay": change_display,
                "changeDirection": change_direction,
                "unit": "USD/year",
                "period": latest_year,
                "time_series": time_series,
                "source": "BEA Regional (SAINC1)",
                "data": sorted_data
            }

        except Exception as e:
            logger.error(f"Error processing BEA personal income data for {state_name}: {e}")
            return {
                "status": "error",
                "error": f"Error processing personal income data: {str(e)}"
            }
