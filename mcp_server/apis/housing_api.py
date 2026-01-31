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
            "Content-Type": "application/json",
            "Accept": "application/json"  # HUD API requires this header
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

            # Handle non-JSON responses
            if isinstance(data, str):
                return {"status": "error", "error": f"Invalid API response: {data[:200]}"}

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

    # =========================================================================
    # INCOME LIMITS API
    # =========================================================================

    @cache_result(ttl=86400)
    def get_state_income_limits(
        self,
        state_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get Income Limits data for a state.
        Income limits determine eligibility for HUD housing programs.

        Args:
            state_name: Full state name
            year: Fiscal year (defaults to current)

        Returns:
            Dict with income limits by category
        """
        state_code = STATE_ABBREV.get(state_name)
        if not state_code:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        if not year:
            current_year = datetime.now().year
            year = str(current_year)

        endpoint = f"il/statedata/{state_code}"
        params = {"year": year}

        result = self._make_hud_request(endpoint, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "HUD API request failed")}

        try:
            data = result["data"]

            if isinstance(data, dict) and data.get("error"):
                return {"status": "error", "error": data.get("error")}

            # Process income limits data
            if isinstance(data, list) and len(data) > 0:
                # Average across all areas in state
                median_incomes = []
                low_incomes = []
                very_low_incomes = []
                extremely_low_incomes = []

                for entry in data:
                    if entry.get("median_income"):
                        median_incomes.append(float(str(entry["median_income"]).replace(",", "").replace("$", "")))
                    if entry.get("l50_1"):  # 50% of median (very low income) for 1-person
                        very_low_incomes.append(float(str(entry["l50_1"]).replace(",", "").replace("$", "")))
                    if entry.get("l80_1"):  # 80% of median (low income) for 1-person
                        low_incomes.append(float(str(entry["l80_1"]).replace(",", "").replace("$", "")))
                    if entry.get("l30_1"):  # 30% of median (extremely low) for 1-person
                        extremely_low_incomes.append(float(str(entry["l30_1"]).replace(",", "").replace("$", "")))

                avg_median = sum(median_incomes) / len(median_incomes) if median_incomes else None

                return {
                    "status": "success",
                    "state": state_name,
                    "state_code": state_code,
                    "year": year,
                    "median_income": avg_median,
                    "displayValue": f"${avg_median:,.0f}" if avg_median else "N/A",
                    "avg_low_income_limit": sum(low_incomes) / len(low_incomes) if low_incomes else None,
                    "avg_very_low_income_limit": sum(very_low_incomes) / len(very_low_incomes) if very_low_incomes else None,
                    "avg_extremely_low_income_limit": sum(extremely_low_incomes) / len(extremely_low_incomes) if extremely_low_incomes else None,
                    "areas_count": len(data),
                    "source": "HUD",
                    "note": "Area Median Income (AMI) averaged across all areas in state"
                }
            else:
                return {"status": "error", "error": "No income limits data available"}

        except Exception as e:
            logger.error(f"Error processing HUD Income Limits data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=86400)
    def get_affordability_analysis(
        self,
        state_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Calculate housing affordability metrics for a state.
        Combines FMR and Income Limits to show affordability.

        Args:
            state_name: Full state name
            year: Fiscal year

        Returns:
            Dict with affordability analysis
        """
        # Get FMR data
        fmr_result = self.get_state_fmr(state_name, year)
        if fmr_result.get("status") != "success":
            return {"status": "error", "error": "Could not get FMR data"}

        # Get Income Limits data
        income_result = self.get_state_income_limits(state_name, year)
        if income_result.get("status") != "success":
            return {"status": "error", "error": "Could not get income limits data"}

        try:
            monthly_rent = fmr_result.get("value", 0)
            annual_rent = monthly_rent * 12
            median_income = income_result.get("median_income", 0)

            # Calculate affordability metrics
            # HUD considers housing affordable if it costs <= 30% of income
            income_needed_for_affordable = (annual_rent / 0.30) if annual_rent else 0
            rent_as_percent_of_median = (annual_rent / median_income * 100) if median_income else 0

            # Is median income household rent-burdened?
            is_affordable_for_median = rent_as_percent_of_median <= 30

            # Income needed to afford
            hourly_wage_needed = income_needed_for_affordable / 2080  # 40hr/week * 52 weeks

            return {
                "status": "success",
                "state": state_name,
                "year": year or str(datetime.now().year),
                "monthly_rent_2br": monthly_rent,
                "annual_rent_2br": annual_rent,
                "median_income": median_income,
                "rent_as_percent_of_median": round(rent_as_percent_of_median, 1),
                "income_needed_for_affordable": round(income_needed_for_affordable, 0),
                "hourly_wage_needed": round(hourly_wage_needed, 2),
                "is_affordable_for_median": is_affordable_for_median,
                "displayValue": f"{rent_as_percent_of_median:.0f}% of median income",
                "affordability_status": "Affordable" if is_affordable_for_median else "Cost-burdened",
                "source": "HUD (FMR + Income Limits)",
                "note": "Housing is considered affordable if it costs ≤30% of household income"
            }

        except Exception as e:
            logger.error(f"Error calculating affordability: {e}")
            return {"status": "error", "error": str(e)}

    # =========================================================================
    # CHAS (Comprehensive Housing Affordability Strategy) API
    # =========================================================================

    @cache_result(ttl=86400 * 7)  # Cache for 7 days - CHAS data updates infrequently
    def get_state_chas(
        self,
        state_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get CHAS data for a state.
        CHAS provides detailed housing affordability statistics.

        Args:
            state_name: Full state name
            year: Data year (CHAS data is typically 5-year estimates)

        Returns:
            Dict with CHAS housing affordability data
        """
        state_fips = STATE_FIPS.get(state_name)
        if not state_fips:
            return {"status": "error", "error": f"Unknown state: {state_name}"}

        # CHAS endpoint - state level
        endpoint = f"chas/statedata/{state_fips}"
        params = {}
        if year:
            params["year"] = year

        result = self._make_hud_request(endpoint, params)

        if not result["success"]:
            return {"status": "error", "error": result.get("error", "HUD CHAS API request failed")}

        try:
            data = result["data"]

            if isinstance(data, dict) and data.get("error"):
                return {"status": "error", "error": data.get("error")}

            # Process CHAS data
            if isinstance(data, list) and len(data) > 0:
                # Aggregate CHAS data across the state
                total_households = 0
                cost_burdened_renters = 0
                severely_cost_burdened_renters = 0
                cost_burdened_owners = 0
                total_renters = 0
                total_owners = 0

                for entry in data:
                    # CHAS has various tables - T1 through T18
                    # Key metrics we want:
                    # - Cost burden: spending >30% of income on housing
                    # - Severe cost burden: spending >50% of income on housing

                    if entry.get("T1_est"):  # Total households estimate
                        total_households += int(entry.get("T1_est", 0) or 0)
                    if entry.get("T9_est"):  # Renter cost burden
                        cost_burdened_renters += int(entry.get("T9_est", 0) or 0)
                    if entry.get("T10_est"):  # Owner cost burden
                        cost_burdened_owners += int(entry.get("T10_est", 0) or 0)

                # Calculate percentages
                renter_cost_burden_pct = (cost_burdened_renters / total_renters * 100) if total_renters > 0 else None
                owner_cost_burden_pct = (cost_burdened_owners / total_owners * 100) if total_owners > 0 else None

                return {
                    "status": "success",
                    "state": state_name,
                    "data_source": "CHAS",
                    "total_households": total_households,
                    "cost_burdened_renters": cost_burdened_renters,
                    "cost_burdened_owners": cost_burdened_owners,
                    "renter_cost_burden_percent": renter_cost_burden_pct,
                    "owner_cost_burden_percent": owner_cost_burden_pct,
                    "source": "HUD CHAS",
                    "note": "Cost burden = spending >30% of income on housing"
                }

            # If we don't get the detailed data, try to get summary
            return {
                "status": "success",
                "state": state_name,
                "raw_data": data,
                "source": "HUD CHAS"
            }

        except Exception as e:
            logger.error(f"Error processing HUD CHAS data: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=86400)
    def get_housing_summary(
        self,
        state_name: str,
        year: str = None
    ) -> Dict[str, Any]:
        """
        Get a comprehensive housing summary combining FMR, Income Limits, and affordability.
        This is the primary method for state reports.

        Args:
            state_name: Full state name
            year: Fiscal year

        Returns:
            Dict with comprehensive housing data
        """
        results = {
            "status": "success",
            "state": state_name,
            "year": year or str(datetime.now().year),
            "data": {}
        }

        # Get Fair Market Rent
        fmr = self.get_state_fmr(state_name, year)
        if fmr.get("status") == "success":
            results["data"]["fair_market_rent"] = {
                "value": fmr.get("value"),
                "displayValue": fmr.get("displayValue"),
                "by_bedroom": fmr.get("fmr_by_bedroom"),
                "source": "HUD FMR"
            }

        # Get FMR History for trends
        fmr_history = self.get_fmr_history(state_name, 5)
        if fmr_history.get("status") == "success":
            results["data"]["rent_trend"] = {
                "change": fmr_history.get("change"),
                "changeDisplay": fmr_history.get("changeDisplay"),
                "five_year_change": fmr_history.get("five_year_change"),
                "time_series": fmr_history.get("time_series"),
                "source": "HUD FMR"
            }

        # Get Income Limits
        income = self.get_state_income_limits(state_name, year)
        if income.get("status") == "success":
            results["data"]["income_limits"] = {
                "median_income": income.get("median_income"),
                "displayValue": income.get("displayValue"),
                "low_income_limit": income.get("avg_low_income_limit"),
                "very_low_income_limit": income.get("avg_very_low_income_limit"),
                "source": "HUD Income Limits"
            }

        # Get Affordability Analysis
        affordability = self.get_affordability_analysis(state_name, year)
        if affordability.get("status") == "success":
            results["data"]["affordability"] = {
                "rent_as_percent_of_median": affordability.get("rent_as_percent_of_median"),
                "income_needed": affordability.get("income_needed_for_affordable"),
                "hourly_wage_needed": affordability.get("hourly_wage_needed"),
                "is_affordable": affordability.get("is_affordable_for_median"),
                "status": affordability.get("affordability_status"),
                "displayValue": affordability.get("displayValue"),
                "source": "HUD (calculated)"
            }

        # Check if we have any data
        if not results["data"]:
            return {"status": "error", "error": "No housing data available"}

        results["source"] = "HUD"
        return results
