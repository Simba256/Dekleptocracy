"""
FEC (Federal Election Commission) API client
Provides access to campaign finance data including contributions and committees.
API Documentation: https://api.open.fec.gov/developers/
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base_api import BaseAPIClient
from utils import cache_result

logger = logging.getLogger(__name__)

# Committee types
COMMITTEE_TYPES = {
    'C': 'Communication Cost',
    'D': 'Delegate Committee',
    'E': 'Electioneering Communication',
    'H': 'House',
    'I': 'Independent Expenditor (Person or Group)',
    'N': 'PAC - Nonqualified',
    'O': 'Independent Expenditure-Only (Super PACs)',
    'P': 'Presidential',
    'Q': 'PAC - Qualified',
    'S': 'Senate',
    'U': 'Single Candidate Independent Expenditure',
    'V': 'PAC with Non-Contribution Account - Nonqualified',
    'W': 'PAC with Non-Contribution Account - Qualified',
    'X': 'Party - Nonqualified',
    'Y': 'Party - Qualified',
    'Z': 'National Party Nonfederal Account'
}

# Industry/sector mapping (simplified)
EMPLOYER_SECTORS = {
    'RETIRED': 'Retired',
    'NOT EMPLOYED': 'Not Employed',
    'SELF-EMPLOYED': 'Self-Employed',
    'HOMEMAKER': 'Homemaker',
    'NONE': 'None Listed'
}


class FECAPIClient(BaseAPIClient):
    """Client for Federal Election Commission API"""

    def __init__(self, config):
        super().__init__(config)
        self.base_url = "https://api.open.fec.gov/v1"

    def test_connection(self) -> bool:
        """Test FEC API connection"""
        try:
            # Simple test with totals endpoint
            result = self.get_total_contributions(cycle=2024)
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"FEC API connection test failed: {e}")
            return False

    def _make_fec_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make authenticated request to FEC API"""
        if params is None:
            params = {}
        params["api_key"] = self.api_key
        return self._make_request(endpoint, params=params)

    @cache_result(ttl=3600)  # Cache for 1 hour
    def get_contributions_by_employer(
        self,
        employer: str,
        cycle: int = 2024,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Get itemized contributions aggregated by employer

        Args:
            employer: Employer name to search for
            cycle: Election cycle (even year, e.g., 2024)
            per_page: Results per page
        """
        try:
            params = {
                "employer": employer,
                "cycle": cycle,
                "per_page": per_page,
                "sort": "-total"
            }

            result = self._make_fec_request("/schedules/schedule_a/by_employer/", params=params)

            if result and "results" in result:
                employers = result.get("results", [])
                total = sum(emp.get("total", 0) for emp in employers)

                return {
                    "status": "success",
                    "data": {
                        "employer": employer,
                        "cycle": cycle,
                        "results": employers,
                        "total": total,
                        "displayValue": f"${total:,.0f}",
                        "count": result.get("pagination", {}).get("count", 0)
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching contributions by employer: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_top_employers(
        self,
        cycle: int = 2024,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """
        Get top employers by total contributions

        Args:
            cycle: Election cycle (even year)
            per_page: Number of top employers to return
        """
        try:
            params = {
                "cycle": cycle,
                "per_page": per_page,
                "sort": "-total"
            }

            result = self._make_fec_request("/schedules/schedule_a/by_employer/", params=params)

            if result and "results" in result:
                employers = result.get("results", [])

                # Filter out non-employer categories
                filtered = [
                    emp for emp in employers
                    if emp.get("employer", "").upper() not in EMPLOYER_SECTORS
                ]

                total_contributions = sum(emp.get("total", 0) for emp in filtered)

                return {
                    "status": "success",
                    "data": {
                        "cycle": cycle,
                        "top_employers": filtered[:20],
                        "total_contributions": total_contributions,
                        "displayValue": f"${total_contributions:,.0f}"
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching top employers: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_total_contributions(
        self,
        cycle: int = 2024
    ) -> Dict[str, Any]:
        """
        Get total individual contributions for an election cycle
        """
        try:
            # Get aggregate totals from schedule_a
            params = {
                "cycle": cycle,
                "per_page": 1,
                "sort": "-total"
            }

            result = self._make_fec_request("/schedules/schedule_a/by_employer/", params=params)

            if result and "pagination" in result:
                # The pagination shows total count
                # We need to sum across multiple pages or use totals endpoint
                total_count = result.get("pagination", {}).get("count", 0)

                # For a quick estimate, use the totals endpoint
                totals_result = self._make_fec_request("/totals/by_entity/", params={"cycle": cycle})

                total_receipts = 0
                if totals_result and "results" in totals_result:
                    for entity in totals_result.get("results", []):
                        total_receipts += entity.get("receipts", 0) or 0

                return {
                    "status": "success",
                    "data": {
                        "cycle": cycle,
                        "total_receipts": total_receipts,
                        "employer_count": total_count,
                        "displayValue": f"${total_receipts:,.0f}"
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching total contributions: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_committee_totals(
        self,
        committee_type: str = "Q",  # PAC - Qualified
        cycle: int = 2024,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Get committee totals by type

        Args:
            committee_type: Committee type code (Q=PAC, O=Super PAC, etc.)
            cycle: Election cycle
            per_page: Results per page
        """
        try:
            params = {
                "committee_type": committee_type,
                "cycle": cycle,
                "per_page": per_page,
                "sort": "-receipts"
            }

            result = self._make_fec_request("/committees/totals/", params=params)

            if result and "results" in result:
                committees = result.get("results", [])
                total_receipts = sum(c.get("receipts", 0) or 0 for c in committees)
                total_disbursements = sum(c.get("disbursements", 0) or 0 for c in committees)

                type_name = COMMITTEE_TYPES.get(committee_type, committee_type)

                return {
                    "status": "success",
                    "data": {
                        "cycle": cycle,
                        "committee_type": committee_type,
                        "committee_type_name": type_name,
                        "committees": committees,
                        "total_receipts": total_receipts,
                        "total_disbursements": total_disbursements,
                        "displayValue": f"${total_receipts:,.0f}"
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching committee totals: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_pac_contributions(
        self,
        cycle: int = 2024,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """
        Get total PAC contributions for a cycle
        Combines qualified and non-qualified PACs
        """
        try:
            total_pac_receipts = 0
            pac_types = ['Q', 'N', 'O', 'V', 'W']  # Various PAC types

            for pac_type in pac_types:
                params = {
                    "committee_type": pac_type,
                    "cycle": cycle,
                    "per_page": 100,
                    "sort": "-receipts"
                }

                result = self._make_fec_request("/committees/totals/", params=params)

                if result and "results" in result:
                    for committee in result.get("results", []):
                        total_pac_receipts += committee.get("receipts", 0) or 0

            return {
                "status": "success",
                "data": {
                    "cycle": cycle,
                    "total_pac_contributions": total_pac_receipts,
                    "displayValue": f"${total_pac_receipts:,.0f}"
                },
                "source": "Federal Election Commission"
            }
        except Exception as e:
            logger.error(f"Error fetching PAC contributions: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_candidate_totals(
        self,
        office: str = None,  # H=House, S=Senate, P=President
        cycle: int = 2024,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Get candidate fundraising totals

        Args:
            office: Office type (H, S, P) or None for all
            cycle: Election cycle
            per_page: Results per page
        """
        try:
            params = {
                "cycle": cycle,
                "per_page": per_page,
                "sort": "-receipts"
            }

            if office:
                params["office"] = office

            result = self._make_fec_request("/candidates/totals/", params=params)

            if result and "results" in result:
                candidates = result.get("results", [])
                total_receipts = sum(c.get("receipts", 0) or 0 for c in candidates)

                return {
                    "status": "success",
                    "data": {
                        "cycle": cycle,
                        "office": office,
                        "candidates": candidates,
                        "total_receipts": total_receipts,
                        "count": result.get("pagination", {}).get("count", 0),
                        "displayValue": f"${total_receipts:,.0f}"
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching candidate totals: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def search_committees(
        self,
        query: str,
        cycle: int = 2024,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Search for committees by name
        """
        try:
            params = {
                "q": query,
                "cycle": cycle,
                "per_page": per_page
            }

            result = self._make_fec_request("/committees/", params=params)

            if result and "results" in result:
                return {
                    "status": "success",
                    "data": {
                        "query": query,
                        "cycle": cycle,
                        "committees": result.get("results", []),
                        "count": result.get("pagination", {}).get("count", 0)
                    },
                    "source": "Federal Election Commission"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error searching committees: {e}")
            return {"status": "error", "error": str(e)}
