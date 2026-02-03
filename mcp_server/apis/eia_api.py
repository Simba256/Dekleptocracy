"""
EIA (Energy Information Administration) API client
Provides access to electricity prices, natural gas prices, and gasoline prices by state.
API Documentation: https://www.eia.gov/opendata/documentation.php
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .base_api import BaseAPIClient
from utils import cache_result, validate_year

logger = logging.getLogger(__name__)

# State abbreviations for EIA
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

# PADD regions for gasoline prices (Petroleum Administration for Defense Districts)
STATE_TO_PADD = {
    # PADD 1 - East Coast
    'Connecticut': '1', 'Delaware': '1', 'Florida': '1', 'Georgia': '1',
    'Maine': '1', 'Maryland': '1', 'Massachusetts': '1', 'New Hampshire': '1',
    'New Jersey': '1', 'New York': '1', 'North Carolina': '1', 'Pennsylvania': '1',
    'Rhode Island': '1', 'South Carolina': '1', 'Vermont': '1', 'Virginia': '1',
    'West Virginia': '1', 'District of Columbia': '1',
    # PADD 2 - Midwest
    'Illinois': '2', 'Indiana': '2', 'Iowa': '2', 'Kansas': '2', 'Kentucky': '2',
    'Michigan': '2', 'Minnesota': '2', 'Missouri': '2', 'Nebraska': '2',
    'North Dakota': '2', 'Ohio': '2', 'Oklahoma': '2', 'South Dakota': '2',
    'Tennessee': '2', 'Wisconsin': '2',
    # PADD 3 - Gulf Coast
    'Alabama': '3', 'Arkansas': '3', 'Louisiana': '3', 'Mississippi': '3',
    'New Mexico': '3', 'Texas': '3',
    # PADD 4 - Rocky Mountain
    'Colorado': '4', 'Idaho': '4', 'Montana': '4', 'Utah': '4', 'Wyoming': '4',
    # PADD 5 - West Coast
    'Alaska': '5', 'Arizona': '5', 'California': '5', 'Hawaii': '5',
    'Nevada': '5', 'Oregon': '5', 'Washington': '5'
}

PADD_NAMES = {
    '1': 'East Coast',
    '2': 'Midwest',
    '3': 'Gulf Coast',
    '4': 'Rocky Mountain',
    '5': 'West Coast'
}


class EIAAPIClient(BaseAPIClient):
    """Client for Energy Information Administration (EIA) API"""

    def __init__(self, config):
        super().__init__(config)
        self.base_url = "https://api.eia.gov/v2"

    def test_connection(self) -> bool:
        """Test EIA API connection"""
        try:
            result = self.get_electricity_prices_by_state("California")
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"EIA API connection test failed: {e}")
            return False

    def _make_eia_request(self, route: str, params: Dict = None) -> Dict[str, Any]:
        """Make a request to EIA API v2"""
        if params is None:
            params = {}

        params["api_key"] = self.api_key

        result = self._make_request(route, params=params)
        return result

    @cache_result(ttl=3600)
    def get_electricity_prices_by_state(
        self,
        state_name: str,
        sector: str = "RES"  # RES=Residential, COM=Commercial, IND=Industrial
    ) -> Dict[str, Any]:
        """
        Get electricity prices for a state by sector.

        Args:
            state_name: Full state name
            sector: Sector code (RES, COM, IND, ALL)

        Returns:
            Dict with electricity price data
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # EIA v2 endpoint for electricity prices
        # Route: electricity/retail-sales/data (must include /data suffix)
        route = "electricity/retail-sales/data"

        params = {
            "frequency": "monthly",
            "data[0]": "price",
            "facets[stateid][]": abbrev,
            "facets[sectorid][]": sector,
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 24  # Last 24 months
        }

        result = self._make_eia_request(route, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "EIA API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            response = result["data"].get("response", {})
            data_points = response.get("data", [])

            if not data_points:
                return {"status": "error", "error": "No electricity price data available"}

            # Process data points
            processed = []
            for point in data_points:
                price = point.get("price")
                if price is not None:
                    processed.append({
                        "period": point.get("period"),
                        "value": float(price),
                        "unit": "cents/kWh"
                    })

            # Sort chronologically
            processed.sort(key=lambda x: x["period"])

            latest = processed[-1] if processed else None
            latest_value = latest["value"] if latest else None

            # Calculate YoY change
            yoy_change = None
            if len(processed) >= 13:
                current = processed[-1]["value"]
                year_ago = processed[-13]["value"]
                if year_ago != 0:
                    yoy_change = ((current - year_ago) / year_ago) * 100

            return {
                "status": "success",
                "state": state_name,
                "sector": sector,
                "data": processed,
                "value": latest_value,
                "displayValue": f"{latest_value:.2f} cents/kWh" if latest_value else "N/A",
                "change": round(yoy_change, 2) if yoy_change else None,
                "changeDisplay": f"{yoy_change:+.1f}%" if yoy_change else "N/A",
                "changeDirection": "up" if yoy_change and yoy_change > 0 else "down" if yoy_change and yoy_change < 0 else "neutral",
                "time_series": [
                    {
                        "date": p["period"],
                        "value": p["value"],
                        "label": p["period"]
                    }
                    for p in processed[-12:]
                ],
                "source": "EIA"
            }

        except Exception as e:
            logger.error(f"Error processing EIA electricity data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=1800)  # Cache for 30 min - gas prices are volatile
    def get_gasoline_prices_by_region(
        self,
        state_name: str = None,
        padd_region: str = None
    ) -> Dict[str, Any]:
        """
        Get gasoline prices by PADD region.
        Note: EIA provides regional gas prices, not state-level.

        Args:
            state_name: Full state name (will map to PADD region)
            padd_region: Direct PADD region code (1-5)

        Returns:
            Dict with gasoline price data
        """
        # Determine PADD region
        if state_name:
            padd = STATE_TO_PADD.get(state_name)
            if not padd:
                return {"status": "error", "error": f"Unknown state: {state_name}"}
        elif padd_region:
            padd = padd_region
        else:
            padd = "US"  # National average

        # EIA v2 endpoint for petroleum prices
        route = "petroleum/pri/gnd/data"

        params = {
            "frequency": "weekly",
            "data[0]": "value",
            "facets[product][]": "EPMR",  # Regular gasoline
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 60  # Last 60 weeks (need 53+ for YoY calculation)
        }

        if padd != "US":
            params["facets[duoarea][]"] = f"R{padd}0"  # Regional PADD code format

        result = self._make_eia_request(route, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "EIA API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            response = result["data"].get("response", {})
            data_points = response.get("data", [])

            if not data_points:
                return {"status": "error", "error": "No gasoline price data available"}

            # Process data points
            processed = []
            for point in data_points:
                value = point.get("value")
                if value is not None:
                    processed.append({
                        "period": point.get("period"),
                        "value": float(value),
                        "unit": "$/gallon"
                    })

            processed.sort(key=lambda x: x["period"])

            latest = processed[-1] if processed else None
            latest_value = latest["value"] if latest else None

            # Calculate YoY change (compare to same week last year)
            yoy_change = None
            if len(processed) >= 53:
                current = processed[-1]["value"]
                year_ago = processed[-53]["value"]
                if year_ago != 0:
                    yoy_change = ((current - year_ago) / year_ago) * 100

            region_name = PADD_NAMES.get(padd, "National")

            return {
                "status": "success",
                "state": state_name,
                "region": region_name,
                "padd": padd,
                "data": processed,
                "value": latest_value,
                "displayValue": f"${latest_value:.2f}/gal" if latest_value else "N/A",
                "change": round(yoy_change, 2) if yoy_change else None,
                "changeDisplay": f"{yoy_change:+.1f}%" if yoy_change else "N/A",
                "changeDirection": "up" if yoy_change and yoy_change > 0 else "down" if yoy_change and yoy_change < 0 else "neutral",
                "time_series": [
                    {
                        "date": p["period"],
                        "value": p["value"],
                        "label": p["period"]
                    }
                    for p in processed[-12:]  # Last 12 weeks
                ],
                "source": "EIA"
            }

        except Exception as e:
            logger.error(f"Error processing EIA gasoline data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_natural_gas_prices_by_state(
        self,
        state_name: str,
        sector: str = "RES"  # RES=Residential, COM=Commercial
    ) -> Dict[str, Any]:
        """
        Get natural gas prices for a state.

        Args:
            state_name: Full state name
            sector: Sector code (RES, COM)

        Returns:
            Dict with natural gas price data
        """
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # EIA v2 endpoint for natural gas prices
        route = "natural-gas/pri/sum/data"

        params = {
            "frequency": "monthly",
            "data[0]": "value",
            "facets[duoarea][]": f"S{abbrev}",
            "facets[process][]": f"PRS",  # Residential price
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 24
        }

        result = self._make_eia_request(route, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "EIA API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            response = result["data"].get("response", {})
            data_points = response.get("data", [])

            if not data_points:
                return {"status": "error", "error": "No natural gas price data available"}

            processed = []
            for point in data_points:
                value = point.get("value")
                if value is not None:
                    processed.append({
                        "period": point.get("period"),
                        "value": float(value),
                        "unit": "$/Mcf"
                    })

            processed.sort(key=lambda x: x["period"])

            latest = processed[-1] if processed else None
            latest_value = latest["value"] if latest else None

            yoy_change = None
            if len(processed) >= 13:
                current = processed[-1]["value"]
                year_ago = processed[-13]["value"]
                if year_ago != 0:
                    yoy_change = ((current - year_ago) / year_ago) * 100

            return {
                "status": "success",
                "state": state_name,
                "sector": sector,
                "data": processed,
                "value": latest_value,
                "displayValue": f"${latest_value:.2f}/Mcf" if latest_value else "N/A",
                "change": round(yoy_change, 2) if yoy_change else None,
                "changeDisplay": f"{yoy_change:+.1f}%" if yoy_change else "N/A",
                "changeDirection": "up" if yoy_change and yoy_change > 0 else "down" if yoy_change and yoy_change < 0 else "neutral",
                "time_series": [
                    {
                        "date": p["period"],
                        "value": p["value"],
                        "label": p["period"]
                    }
                    for p in processed[-12:]
                ],
                "source": "EIA"
            }

        except Exception as e:
            logger.error(f"Error processing EIA natural gas data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_national_electricity_price(self, sector: str = "RES") -> Dict[str, Any]:
        """Get national average electricity price for comparison"""
        route = "electricity/retail-sales/data"

        params = {
            "frequency": "monthly",
            "data[0]": "price",
            "facets[stateid][]": "US",
            "facets[sectorid][]": sector,
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 24
        }

        result = self._make_eia_request(route, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "EIA API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            response = result["data"].get("response", {})
            data_points = response.get("data", [])

            if not data_points:
                return {"status": "error", "error": "No national electricity data available"}

            processed = []
            for point in data_points:
                price = point.get("price")
                if price is not None:
                    processed.append({
                        "period": point.get("period"),
                        "value": float(price)
                    })

            processed.sort(key=lambda x: x["period"])
            latest = processed[-1] if processed else None

            return {
                "status": "success",
                "region": "National",
                "value": latest["value"] if latest else None,
                "displayValue": f"{latest['value']:.2f} cents/kWh" if latest else "N/A",
                "source": "EIA"
            }

        except Exception as e:
            logger.error(f"Error getting national electricity price: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=1800)
    def get_national_gasoline_price(self) -> Dict[str, Any]:
        """Get national average gasoline price for comparison"""
        route = "petroleum/pri/gnd/data"

        params = {
            "frequency": "weekly",
            "data[0]": "value",
            "facets[product][]": "EPMR",
            "facets[duoarea][]": "NUS",  # National US
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 52
        }

        result = self._make_eia_request(route, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "EIA API request failed")}

        try:
            # Handle case where API returns non-JSON response
            if not isinstance(result["data"], dict):
                return {"status": "error", "error": f"Invalid API response: {str(result['data'])[:200]}"}

            response = result["data"].get("response", {})
            data_points = response.get("data", [])

            if not data_points:
                return {"status": "error", "error": "No national gas price data"}

            latest = data_points[0] if data_points else None
            latest_value = float(latest["value"]) if latest and latest.get("value") else None

            return {
                "status": "success",
                "region": "National",
                "value": latest_value,
                "displayValue": f"${latest_value:.2f}/gal" if latest_value else "N/A",
                "source": "EIA"
            }

        except Exception as e:
            logger.error(f"Error getting national gas price: {e}")
            return {"status": "error", "error": str(e)}
