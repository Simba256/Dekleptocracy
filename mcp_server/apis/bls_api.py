"""
BLS (Bureau of Labor Statistics) API client
Provides access to CPI, unemployment, and wage data by state and region.
API Documentation: https://www.bls.gov/developers/api_signature_v2.htm
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base_api import BaseAPIClient
from utils import cache_result, validate_year

logger = logging.getLogger(__name__)

# State FIPS codes for unemployment data
STATE_FIPS = {
    'Alabama': '01', 'Alaska': '02', 'Arizona': '04', 'Arkansas': '05',
    'California': '06', 'Colorado': '08', 'Connecticut': '09', 'Delaware': '10',
    'Florida': '12', 'Georgia': '13', 'Hawaii': '15', 'Idaho': '16',
    'Illinois': '17', 'Indiana': '18', 'Iowa': '19', 'Kansas': '20',
    'Kentucky': '21', 'Louisiana': '22', 'Maine': '23', 'Maryland': '24',
    'Massachusetts': '25', 'Michigan': '26', 'Minnesota': '27', 'Mississippi': '28',
    'Missouri': '29', 'Montana': '30', 'Nebraska': '31', 'Nevada': '32',
    'New Hampshire': '33', 'New Jersey': '34', 'New Mexico': '35', 'New York': '36',
    'North Carolina': '37', 'North Dakota': '38', 'Ohio': '39', 'Oklahoma': '40',
    'Oregon': '41', 'Pennsylvania': '42', 'Rhode Island': '44', 'South Carolina': '45',
    'South Dakota': '46', 'Tennessee': '47', 'Texas': '48', 'Utah': '49',
    'Vermont': '50', 'Virginia': '51', 'Washington': '53', 'West Virginia': '54',
    'Wisconsin': '55', 'Wyoming': '56', 'District of Columbia': '11'
}

# BLS region codes for CPI
BLS_REGIONS = {
    'Northeast': 'CUUR0100SA0',
    'Midwest': 'CUUR0200SA0',
    'South': 'CUUR0300SA0',
    'West': 'CUUR0400SA0',
    'US': 'CUUR0000SA0'
}

# State to BLS region mapping
STATE_TO_REGION = {
    'Connecticut': 'Northeast', 'Maine': 'Northeast', 'Massachusetts': 'Northeast',
    'New Hampshire': 'Northeast', 'Rhode Island': 'Northeast', 'Vermont': 'Northeast',
    'New Jersey': 'Northeast', 'New York': 'Northeast', 'Pennsylvania': 'Northeast',
    'Illinois': 'Midwest', 'Indiana': 'Midwest', 'Michigan': 'Midwest',
    'Ohio': 'Midwest', 'Wisconsin': 'Midwest', 'Iowa': 'Midwest',
    'Kansas': 'Midwest', 'Minnesota': 'Midwest', 'Missouri': 'Midwest',
    'Nebraska': 'Midwest', 'North Dakota': 'Midwest', 'South Dakota': 'Midwest',
    'Delaware': 'South', 'Florida': 'South', 'Georgia': 'South',
    'Maryland': 'South', 'North Carolina': 'South', 'South Carolina': 'South',
    'Virginia': 'South', 'District of Columbia': 'South', 'West Virginia': 'South',
    'Alabama': 'South', 'Kentucky': 'South', 'Mississippi': 'South',
    'Tennessee': 'South', 'Arkansas': 'South', 'Louisiana': 'South',
    'Oklahoma': 'South', 'Texas': 'South',
    'Arizona': 'West', 'Colorado': 'West', 'Idaho': 'West',
    'Montana': 'West', 'Nevada': 'West', 'New Mexico': 'West',
    'Utah': 'West', 'Wyoming': 'West', 'Alaska': 'West',
    'California': 'West', 'Hawaii': 'West', 'Oregon': 'West', 'Washington': 'West'
}


class BLSAPIClient(BaseAPIClient):
    """Client for Bureau of Labor Statistics API"""

    def __init__(self, config):
        super().__init__(config)
        # BLS API v2 requires registration key for higher rate limits
        self.base_url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

    def test_connection(self) -> bool:
        """Test BLS API connection"""
        try:
            result = self.get_cpi_data('CUUR0000SA0', '2023', '2023')
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"BLS API connection test failed: {e}")
            return False

    def _make_bls_request(self, series_ids: List[str], start_year: str, end_year: str) -> Dict[str, Any]:
        """Make a request to BLS API with proper formatting"""
        payload = {
            "seriesid": series_ids,
            "startyear": start_year,
            "endyear": end_year,
            "registrationkey": self.api_key
        }

        # BLS API uses POST for data retrieval
        result = self._make_request("", method="POST", json_data=payload)
        return result

    @cache_result(ttl=3600)  # Cache for 1 hour
    def get_cpi_data(
        self,
        series_id: str,
        start_year: str = None,
        end_year: str = None
    ) -> Dict[str, Any]:
        # Default to last 3 years of data (need 13+ months for YoY calculation)
        if not end_year:
            end_year = str(datetime.now().year)
        if not start_year:
            start_year = str(int(end_year) - 2)
        """
        Get Consumer Price Index data from BLS.

        Args:
            series_id: BLS series ID (e.g., 'CUUR0000SA0' for US CPI)
            start_year: Start year for data
            end_year: End year for data

        Returns:
            Dict with CPI data and calculated changes
        """
        if not validate_year(start_year) or not validate_year(end_year):
            return {"status": "error", "error": "Invalid year range"}

        result = self._make_bls_request([series_id], start_year, end_year)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "API request failed")}

        try:
            data = result["data"]
            # Handle case where API returns non-JSON response
            if not isinstance(data, dict):
                return {"status": "error", "error": f"Invalid API response: {str(data)[:200]}"}

            if data.get("status") != "REQUEST_SUCCEEDED":
                return {"status": "error", "error": data.get("message", "BLS request failed")}

            series_data = data.get("Results", {}).get("series", [])
            if not series_data:
                return {"status": "error", "error": "No data returned from BLS"}

            series = series_data[0]
            data_points = series.get("data", [])

            # Process data points
            processed_data = []
            for point in data_points:
                processed_data.append({
                    "year": point.get("year"),
                    "period": point.get("period"),
                    "periodName": point.get("periodName"),
                    "value": float(point.get("value", 0)),
                    "footnotes": point.get("footnotes", [])
                })

            # Sort by year and period
            processed_data.sort(key=lambda x: (x["year"], x["period"]))

            # Calculate year-over-year change
            yoy_change = None
            if len(processed_data) >= 13:  # Need at least 13 months for YoY
                latest = processed_data[-1]["value"]
                year_ago = processed_data[-13]["value"] if len(processed_data) >= 13 else processed_data[0]["value"]
                yoy_change = ((latest - year_ago) / year_ago) * 100

            return {
                "status": "success",
                "series_id": series_id,
                "data": processed_data,
                "latest_value": processed_data[-1]["value"] if processed_data else None,
                "yoy_change": round(yoy_change, 2) if yoy_change is not None else None,
                "yoy_change_display": f"{yoy_change:+.1f}%" if yoy_change is not None else "N/A",
                "time_series": [
                    {
                        "date": f"{p['year']}-{p['period'].replace('M', '')}",
                        "value": p["value"],
                        "label": f"{p['periodName']} {p['year']}"
                    }
                    for p in processed_data[-12:]  # Last 12 months
                ],
                "source": "BLS"
            }

        except Exception as e:
            logger.error(f"Error processing BLS CPI data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_unemployment_by_state(
        self,
        state_name: str,
        start_year: str = None,
        end_year: str = None
    ) -> Dict[str, Any]:
        # Default to last 3 years of data (need 13+ months for YoY calculation)
        if not end_year:
            end_year = str(datetime.now().year)
        if not start_year:
            start_year = str(int(end_year) - 2)
        """
        Get unemployment rate for a specific state.

        Args:
            state_name: Full state name (e.g., 'California')
            start_year: Start year
            end_year: End year

        Returns:
            Dict with unemployment data and trends
        """
        fips = STATE_FIPS.get(state_name)
        if not fips:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # LAUS series format: LASST{FIPS}0000000000003 for unemployment rate (21 chars total)
        series_id = f"LASST{fips}0000000000003"

        result = self._make_bls_request([series_id], start_year, end_year)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "API request failed")}

        try:
            data = result["data"]
            # Handle case where API returns non-JSON response
            if not isinstance(data, dict):
                return {"status": "error", "error": f"Invalid API response: {str(data)[:200]}"}

            if data.get("status") != "REQUEST_SUCCEEDED":
                return {"status": "error", "error": data.get("message", "BLS request failed")}

            series_data = data.get("Results", {}).get("series", [])
            if not series_data:
                return {"status": "error", "error": "No data returned from BLS"}

            series = series_data[0]
            data_points = series.get("data", [])

            processed_data = []
            for point in data_points:
                # Handle "-" which means data unavailable
                raw_value = point.get("value", 0)
                if raw_value == "-" or raw_value is None:
                    continue  # Skip unavailable data points
                processed_data.append({
                    "year": point.get("year"),
                    "period": point.get("period"),
                    "periodName": point.get("periodName"),
                    "value": float(raw_value)
                })

            processed_data.sort(key=lambda x: (x["year"], x["period"]))

            # Calculate change from year ago
            yoy_change = None
            if len(processed_data) >= 13:
                latest = processed_data[-1]["value"]
                year_ago = processed_data[-13]["value"]
                yoy_change = latest - year_ago  # Percentage point change

            latest_value = processed_data[-1]["value"] if processed_data else None

            return {
                "status": "success",
                "state": state_name,
                "series_id": series_id,
                "data": processed_data,
                "value": latest_value,
                "displayValue": f"{latest_value:.1f}%" if latest_value else "N/A",
                "change": round(yoy_change, 2) if yoy_change is not None else None,
                "changeDisplay": f"{yoy_change:+.1f} pp" if yoy_change is not None else "N/A",
                "changeDirection": "up" if yoy_change is not None and yoy_change > 0 else "down" if yoy_change is not None and yoy_change < 0 else "neutral",
                "time_series": [
                    {
                        "date": f"{p['year']}-{p['period'].replace('M', '')}",
                        "value": p["value"],
                        "label": f"{p['periodName']} {p['year']}"
                    }
                    for p in processed_data[-12:]
                ],
                "source": "BLS LAUS"
            }

        except Exception as e:
            logger.error(f"Error processing BLS unemployment data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_average_wages_by_state(
        self,
        state_name: str,
        start_year: str = None,
        end_year: str = None
    ) -> Dict[str, Any]:
        # Default to last 2 years of data
        if not end_year:
            end_year = str(datetime.now().year)
        if not start_year:
            start_year = str(int(end_year) - 1)

        """
        Get average weekly wages by state from QCEW data.
        Note: QCEW data is quarterly and has some lag.

        Args:
            state_name: Full state name
            start_year: Start year
            end_year: End year

        Returns:
            Dict with wage data
        """
        fips = STATE_FIPS.get(state_name)
        if not fips:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # QCEW series for average weekly wages: ENU{FIPS}00010 (all industries)
        series_id = f"ENU{fips}00010"

        result = self._make_bls_request([series_id], start_year, end_year)

        if not result["success"]:
            # QCEW might not be available for all states via API
            return {"status": "error", "error": "Wage data not available via API for this state"}

        try:
            data = result["data"]
            if data.get("status") != "REQUEST_SUCCEEDED":
                return {"status": "error", "error": data.get("message", "BLS request failed")}

            series_data = data.get("Results", {}).get("series", [])
            if not series_data:
                return {"status": "error", "error": "No wage data returned"}

            series = series_data[0]
            data_points = series.get("data", [])

            processed_data = []
            for point in data_points:
                # Handle "-" which means data unavailable
                raw_value = point.get("value", 0)
                if raw_value == "-" or raw_value is None:
                    continue  # Skip unavailable data points
                processed_data.append({
                    "year": point.get("year"),
                    "period": point.get("period"),
                    "periodName": point.get("periodName"),
                    "value": float(raw_value)
                })

            processed_data.sort(key=lambda x: (x["year"], x["period"]))

            latest_value = processed_data[-1]["value"] if processed_data else None

            # Calculate YoY change
            yoy_change = None
            if len(processed_data) >= 5:  # Quarterly data, need 5 quarters for YoY
                latest = processed_data[-1]["value"]
                year_ago = processed_data[-5]["value"] if len(processed_data) >= 5 else processed_data[0]["value"]
                yoy_change = ((latest - year_ago) / year_ago) * 100

            return {
                "status": "success",
                "state": state_name,
                "series_id": series_id,
                "data": processed_data,
                "value": latest_value,
                "displayValue": f"${latest_value:,.0f}/week" if latest_value else "N/A",
                "change": round(yoy_change, 2) if yoy_change is not None else None,
                "changeDisplay": f"{yoy_change:+.1f}%" if yoy_change is not None else "N/A",
                "time_series": [
                    {
                        "date": f"{p['year']}-Q{p['period'].replace('Q', '')}",
                        "value": p["value"],
                        "label": f"Q{p['period'].replace('Q', '')} {p['year']}"
                    }
                    for p in processed_data[-8:]  # Last 8 quarters
                ],
                "source": "BLS QCEW"
            }

        except Exception as e:
            logger.error(f"Error processing BLS wage data: {e}")
            return {"status": "error", "error": str(e)}

    def get_regional_cpi_for_state(
        self,
        state_name: str,
        start_year: str = None,
        end_year: str = None
    ) -> Dict[str, Any]:
        """
        Get CPI data for the region containing a state.
        BLS provides CPI at regional level, not state level.

        Args:
            state_name: Full state name
            start_year: Start year (defaults to current year - 1)
            end_year: End year (defaults to current year)

        Returns:
            Dict with regional CPI data
        """
        region = STATE_TO_REGION.get(state_name)
        if not region:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        series_id = BLS_REGIONS.get(region, BLS_REGIONS['US'])

        result = self.get_cpi_data(series_id, start_year, end_year)

        if result["status"] == "success":
            result["state"] = state_name
            result["region"] = region

        return result

    def get_national_cpi(
        self,
        start_year: str = None,
        end_year: str = None
    ) -> Dict[str, Any]:
        """Get national CPI data for comparison"""
        return self.get_cpi_data(BLS_REGIONS['US'], start_year, end_year)
