"""
HUD (Department of Housing and Urban Development) API client
Provides access to Fair Market Rents (FMR) data by state and metro area.
API Documentation: https://www.huduser.gov/portal/dataset/fmr-api.html
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base_api import BaseAPIClient
from utils import cache_result

logger = logging.getLogger(__name__)

# State abbreviations
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

# State FIPS codes
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


class HUDAPIClient(BaseAPIClient):
    """Client for HUD Fair Market Rents API"""

    def __init__(self, config):
        super().__init__(config)
        self.base_url = "https://www.huduser.gov/hudapi/public"

    def test_connection(self) -> bool:
        """Test HUD API connection"""
        try:
            result = self.get_state_fmr("California")
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"HUD API connection test failed: {e}")
            return False

    def _make_hud_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make a request to HUD API with proper headers"""
        headers = {
            "Authorization": f"Bearer {self.token or self.api_key}",
            "Content-Type": "application/json"
        }

        result = self._make_request(endpoint, params=params, headers=headers)
        return result

    @cache_result(ttl=86400)  # Cache for 24 hours - FMR data is updated annually
    def get_state_fmr(
        self,
        state_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get Fair Market Rent data for a state.
        Returns average/representative FMR for the state.

        Args:
            state_name: Full state name
            year: FMR fiscal year (defaults to current)

        Returns:
            Dict with FMR data
        """
        state_code = STATE_ABBREV.get(state_name)
        if not state_code:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # Default to current fiscal year
        if not year:
            current_year = datetime.now().year
            # FMR fiscal year starts October 1
            year = str(current_year + 1) if datetime.now().month >= 10 else str(current_year)

        # Get state-level FMR data
        endpoint = f"fmr/statedata/{state_code}"
        params = {"year": year}

        result = self._make_hud_request(endpoint, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "HUD API request failed")}

        try:
            data = result["data"]

            if isinstance(data, dict) and data.get("error"):
                return {"status": "error", "error": data.get("error")}

            # Data structure varies - handle different formats
            if isinstance(data, list) and len(data) > 0:
                fmr_data = data[0]
            elif isinstance(data, dict):
                fmr_data = data
            else:
                return {"status": "error", "error": "Unexpected data format from HUD"}

            # Extract FMR values for different bedroom counts
            # fmr_0 = efficiency, fmr_1 = 1BR, fmr_2 = 2BR, etc.
            fmr_values = {
                "efficiency": fmr_data.get("Efficiency", fmr_data.get("fmr_0")),
                "one_bedroom": fmr_data.get("One-Bedroom", fmr_data.get("fmr_1")),
                "two_bedroom": fmr_data.get("Two-Bedroom", fmr_data.get("fmr_2")),
                "three_bedroom": fmr_data.get("Three-Bedroom", fmr_data.get("fmr_3")),
                "four_bedroom": fmr_data.get("Four-Bedroom", fmr_data.get("fmr_4"))
            }

            # Use 2-bedroom as the standard reference
            two_br_fmr = fmr_values.get("two_bedroom")

            # Clean up values
            for key, value in fmr_values.items():
                if isinstance(value, str):
                    fmr_values[key] = float(value.replace(",", "").replace("$", ""))
                elif value is None:
                    fmr_values[key] = None

            two_br_value = fmr_values.get("two_bedroom")

            return {
                "status": "success",
                "state": state_name,
                "state_code": state_code,
                "year": year,
                "fmr_by_bedroom": fmr_values,
                "value": two_br_value,  # Primary value is 2BR
                "displayValue": f"${two_br_value:,.0f}/mo" if two_br_value else "N/A",
                "unit": "$/month",
                "metric": "Fair Market Rent (2BR)",
                "source": "HUD",
                "note": "Fair Market Rent is the 40th percentile of gross rents for standard quality units"
            }

        except Exception as e:
            logger.error(f"Error processing HUD FMR data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=86400)
    def get_county_fmr(
        self,
        state_name: str,
        county_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get Fair Market Rent data for a specific county.

        Args:
            state_name: Full state name
            county_name: County name
            year: FMR fiscal year

        Returns:
            Dict with county FMR data
        """
        state_fips = STATE_FIPS.get(state_name)
        if not state_fips:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        if not year:
            current_year = datetime.now().year
            year = str(current_year + 1) if datetime.now().month >= 10 else str(current_year)

        # HUD API endpoint for county data
        # Format: /fmr/data/{entity_id} where entity_id is FIPS code
        endpoint = f"fmr/statedata/{STATE_ABBREV.get(state_name)}"
        params = {"year": year}

        result = self._make_hud_request(endpoint, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "HUD API request failed")}

        try:
            data = result["data"]

            # Search for county in results
            if isinstance(data, list):
                for entry in data:
                    if county_name.lower() in str(entry.get("county_name", "")).lower():
                        return self._process_fmr_entry(entry, state_name, county_name, year)

            return {"status": "error", "error": f"County {county_name} not found in {state_name}"}

        except Exception as e:
            logger.error(f"Error processing HUD county FMR data: {e}")
            return {"status": "error", "error": str(e)}

    def _process_fmr_entry(
        self,
        entry: Dict,
        state_name: str,
        area_name: str,
        year: str
    ) -> Dict[str, Any]:
        """Process a single FMR entry"""
        fmr_values = {
            "efficiency": entry.get("Efficiency", entry.get("fmr_0")),
            "one_bedroom": entry.get("One-Bedroom", entry.get("fmr_1")),
            "two_bedroom": entry.get("Two-Bedroom", entry.get("fmr_2")),
            "three_bedroom": entry.get("Three-Bedroom", entry.get("fmr_3")),
            "four_bedroom": entry.get("Four-Bedroom", entry.get("fmr_4"))
        }

        # Clean values
        for key, value in fmr_values.items():
            if isinstance(value, str):
                fmr_values[key] = float(value.replace(",", "").replace("$", ""))

        two_br_value = fmr_values.get("two_bedroom")

        return {
            "status": "success",
            "state": state_name,
            "area": area_name,
            "year": year,
            "fmr_by_bedroom": fmr_values,
            "value": two_br_value,
            "displayValue": f"${two_br_value:,.0f}/mo" if two_br_value else "N/A",
            "source": "HUD"
        }

    @cache_result(ttl=86400)
    def get_metro_fmr(
        self,
        metro_code: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get Fair Market Rent data for a metropolitan area.

        Args:
            metro_code: CBSA code for the metro area
            year: FMR fiscal year

        Returns:
            Dict with metro FMR data
        """
        if not year:
            current_year = datetime.now().year
            year = str(current_year + 1) if datetime.now().month >= 10 else str(current_year)

        endpoint = f"fmr/data/{metro_code}"
        params = {"year": year}

        result = self._make_hud_request(endpoint, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "HUD API request failed")}

        try:
            data = result["data"]

            if isinstance(data, dict) and data.get("error"):
                return {"status": "error", "error": data.get("error")}

            # Process the data
            fmr_data = data[0] if isinstance(data, list) else data

            return self._process_fmr_entry(fmr_data, "", fmr_data.get("area_name", ""), year)

        except Exception as e:
            logger.error(f"Error processing HUD metro FMR data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=86400)
    def get_fmr_history(
        self,
        state_name: str,
        years: int = 5
    ) -> Dict[str, Any]:
        """
        Get historical FMR data for trend analysis.

        Args:
            state_name: Full state name
            years: Number of years of history to retrieve

        Returns:
            Dict with historical FMR data
        """
        state_code = STATE_ABBREV.get(state_name)
        if not state_code:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        current_year = datetime.now().year
        if datetime.now().month >= 10:
            current_year += 1

        history = []
        for i in range(years):
            year = str(current_year - i)
            result = self.get_state_fmr(state_name, year)

            if result.get("status") == "success":
                history.append({
                    "year": year,
                    "value": result.get("value"),
                    "fmr_by_bedroom": result.get("fmr_by_bedroom")
                })

        if not history:
            return {"status": "error", "error": "No historical data available"}

        # Sort chronologically
        history.sort(key=lambda x: x["year"])

        # Calculate change
        yoy_change = None
        if len(history) >= 2:
            latest = history[-1]["value"]
            previous = history[-2]["value"]
            if previous and previous != 0:
                yoy_change = ((latest - previous) / previous) * 100

        # Calculate 5-year change
        five_year_change = None
        if len(history) >= 5:
            latest = history[-1]["value"]
            five_years_ago = history[0]["value"]
            if five_years_ago and five_years_ago != 0:
                five_year_change = ((latest - five_years_ago) / five_years_ago) * 100

        latest_data = history[-1] if history else {}

        return {
            "status": "success",
            "state": state_name,
            "history": history,
            "value": latest_data.get("value"),
            "displayValue": f"${latest_data.get('value', 0):,.0f}/mo",
            "change": round(yoy_change, 2) if yoy_change else None,
            "changeDisplay": f"{yoy_change:+.1f}% YoY" if yoy_change else "N/A",
            "five_year_change": round(five_year_change, 2) if five_year_change else None,
            "five_year_change_display": f"{five_year_change:+.1f}% (5yr)" if five_year_change else "N/A",
            "time_series": [
                {
                    "date": h["year"],
                    "value": h["value"],
                    "label": f"FY {h['year']}"
                }
                for h in history if h.get("value")
            ],
            "source": "HUD"
        }

    @cache_result(ttl=86400)
    def get_national_fmr(self, year: str = None) -> Dict[str, Any]:
        """
        Get national average FMR for comparison.
        Note: HUD doesn't provide a national average directly,
        so we calculate an approximate average from major metros.

        Returns:
            Dict with estimated national FMR
        """
        # Major metro CBSA codes for sampling
        major_metros = [
            "35620",  # New York
            "31080",  # Los Angeles
            "16980",  # Chicago
            "19100",  # Dallas
            "26420",  # Houston
            "47900",  # Washington DC
            "33100",  # Miami
            "37980",  # Philadelphia
            "12060",  # Atlanta
            "38060",  # Phoenix
        ]

        values = []
        for metro in major_metros:
            result = self.get_metro_fmr(metro, year)
            if result.get("status") == "success" and result.get("value"):
                values.append(result["value"])

        if not values:
            return {"status": "error", "error": "Unable to calculate national average"}

        avg_value = sum(values) / len(values)

        return {
            "status": "success",
            "region": "National (est.)",
            "value": avg_value,
            "displayValue": f"${avg_value:,.0f}/mo",
            "note": "Estimated from major metropolitan areas",
            "source": "HUD"
        }
