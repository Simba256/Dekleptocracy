"""
FRED (Federal Reserve Economic Data) API client
Provides access to state GDP, personal income, and other economic indicators.
API Documentation: https://fred.stlouisfed.org/docs/api/fred/
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .base_api import BaseAPIClient
from utils import cache_result, validate_year

logger = logging.getLogger(__name__)

# State abbreviations for FRED series
STATE_ABBREV = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
}


class FREDAPIClient(BaseAPIClient):
    """Client for Federal Reserve Economic Data (FRED) API"""

    def __init__(self, config):
        super().__init__(config)
        self.base_url = "https://api.stlouisfed.org/fred"

    def test_connection(self) -> bool:
        """Test FRED API connection"""
        try:
            result = self.get_series_info("GDP")
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"FRED API connection test failed: {e}")
            return False

    @cache_result(ttl=3600)
    def get_series_info(self, series_id: str) -> Dict[str, Any]:
        """Get metadata about a FRED series"""
        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json"
        }

        result = self._make_request("series", params=params)

        if result["success"]:
            seriess = result["data"].get("seriess", [])
            if seriess:
                return {
                    "status": "success",
                    "series": seriess[0]
                }
            return {"status": "error", "error": "Series not found"}
        return {"status": "error", "error": result.get("error", "API request failed")}

    @cache_result(ttl=1800)  # Cache for 30 minutes
    def get_series_observations(
        self,
        series_id: str,
        observation_start: str = None,
        observation_end: str = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Get observations for a FRED series.

        Args:
            series_id: FRED series ID
            observation_start: Start date (YYYY-MM-DD)
            observation_end: End date (YYYY-MM-DD)
            limit: Maximum number of observations

        Returns:
            Dict with series observations and metadata
        """
        # Default to last 5 years if no dates specified
        if not observation_end:
            observation_end = datetime.now().strftime("%Y-%m-%d")
        if not observation_start:
            start_date = datetime.now() - timedelta(days=5*365)
            observation_start = start_date.strftime("%Y-%m-%d")

        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "observation_start": observation_start,
            "observation_end": observation_end,
            "sort_order": "desc",
            "limit": limit
        }

        result = self._make_request("series/observations", params=params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            observations = result["data"].get("observations", [])

            # Process observations
            processed = []
            for obs in observations:
                value = obs.get("value", ".")
                if value != ".":  # FRED uses "." for missing data
                    processed.append({
                        "date": obs.get("date"),
                        "value": float(value)
                    })

            # Sort chronologically
            processed.sort(key=lambda x: x["date"])

            # Calculate change
            yoy_change = None
            if len(processed) >= 2:
                latest = processed[-1]["value"]
                # Find value from approximately a year ago
                year_ago_idx = max(0, len(processed) - 5)  # Quarterly data
                year_ago = processed[year_ago_idx]["value"]
                if year_ago != 0:
                    yoy_change = ((latest - year_ago) / year_ago) * 100

            latest_value = processed[-1]["value"] if processed else None
            latest_date = processed[-1]["date"] if processed else None

            return {
                "status": "success",
                "series_id": series_id,
                "observations": processed,
                "value": latest_value,
                "latest_date": latest_date,
                "change": round(yoy_change, 2) if yoy_change else None,
                "changeDisplay": f"{yoy_change:+.1f}%" if yoy_change else "N/A",
                "time_series": [
                    {
                        "date": obs["date"],
                        "value": obs["value"],
                        "label": obs["date"][:7]  # YYYY-MM
                    }
                    for obs in processed[-12:]
                ],
                "source": "FRED"
            }

        except Exception as e:
            logger.error(f"Error processing FRED observations: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_state_gdp(self, state_name: str) -> Dict[str, Any]:
        """
        Get state GDP data.
        Series format: {STATE_ABBREV}NGSP (Nominal GDP)
        or {STATE_ABBREV}RGSP (Real GDP)

        Args:
            state_name: Full state name

        Returns:
            Dict with GDP data
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # Get nominal GDP
        series_id = f"{abbrev}NGSP"
        result = self.get_series_observations(series_id)

        if result["status"] == "success":
            result["state"] = state_name
            result["metric"] = "Nominal GDP"
            result["unit"] = "Millions of dollars"

            # Format display value
            if result.get("value"):
                value_billions = result["value"] / 1000
                result["displayValue"] = f"${value_billions:,.1f}B"
            else:
                result["displayValue"] = "N/A"

        return result

    @cache_result(ttl=3600)
    def get_state_personal_income(self, state_name: str) -> Dict[str, Any]:
        """
        Get state personal income per capita.
        Series format: {STATE_ABBREV}PCPI

        Args:
            state_name: Full state name

        Returns:
            Dict with personal income data
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        series_id = f"{abbrev}PCPI"
        result = self.get_series_observations(series_id)

        if result["status"] == "success":
            result["state"] = state_name
            result["metric"] = "Per Capita Personal Income"
            result["unit"] = "Dollars"

            if result.get("value"):
                result["displayValue"] = f"${result['value']:,.0f}"
            else:
                result["displayValue"] = "N/A"

        return result

    @cache_result(ttl=3600)
    def get_state_unemployment_rate(self, state_name: str) -> Dict[str, Any]:
        """
        Get state unemployment rate from FRED.
        Series format: {STATE_ABBREV}UR

        Args:
            state_name: Full state name

        Returns:
            Dict with unemployment rate
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        series_id = f"{abbrev}UR"
        result = self.get_series_observations(series_id)

        if result["status"] == "success":
            result["state"] = state_name
            result["metric"] = "Unemployment Rate"
            result["unit"] = "Percent"

            if result.get("value"):
                result["displayValue"] = f"{result['value']:.1f}%"
                # For unemployment, change is percentage point difference
                if result.get("change"):
                    result["changeDisplay"] = f"{result['change']:+.1f} pp"
            else:
                result["displayValue"] = "N/A"

        return result

    @cache_result(ttl=3600)
    def get_state_median_income(self, state_name: str) -> Dict[str, Any]:
        """
        Get state median household income.
        Series format: MEHOINUS{STATE_ABBREV}A646N

        Args:
            state_name: Full state name

        Returns:
            Dict with median income data
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        series_id = f"MEHOINUS{abbrev}A646N"
        result = self.get_series_observations(series_id)

        if result["status"] == "success":
            result["state"] = state_name
            result["metric"] = "Median Household Income"
            result["unit"] = "Dollars"

            if result.get("value"):
                result["displayValue"] = f"${result['value']:,.0f}"
            else:
                result["displayValue"] = "N/A"

        return result

    @cache_result(ttl=3600)
    def get_national_cpi(self) -> Dict[str, Any]:
        """Get national Consumer Price Index"""
        result = self.get_series_observations("CPIAUCSL")

        if result["status"] == "success":
            result["metric"] = "Consumer Price Index"
            result["displayValue"] = f"{result.get('value', 0):.1f}"

        return result

    @cache_result(ttl=3600)
    def get_national_gdp(self) -> Dict[str, Any]:
        """Get national GDP"""
        result = self.get_series_observations("GDP")

        if result["status"] == "success":
            result["metric"] = "Gross Domestic Product"
            result["unit"] = "Billions of dollars"

            if result.get("value"):
                result["displayValue"] = f"${result['value']:,.1f}B"
            else:
                result["displayValue"] = "N/A"

        return result

    @cache_result(ttl=1800)
    def get_series_data(
        self,
        series_id: str,
        observation_start: str = None,
        observation_end: str = None
    ) -> Dict[str, Any]:
        """
        Generic method to get any FRED series data.

        Args:
            series_id: Any valid FRED series ID
            observation_start: Optional start date
            observation_end: Optional end date

        Returns:
            Dict with series data
        """
        # Get series info first
        info = self.get_series_info(series_id)
        series_meta = info.get("series", {})

        # Get observations
        result = self.get_series_observations(series_id, observation_start, observation_end)

        if result["status"] == "success":
            result["title"] = series_meta.get("title", series_id)
            result["units"] = series_meta.get("units", "")
            result["frequency"] = series_meta.get("frequency", "")

        return result
