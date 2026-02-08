"""
LDA (Lobbying Disclosure Act) API client
Provides access to Senate lobbying disclosure data including filings, contributions, and registrants.
API Documentation: https://lda.senate.gov/api/
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base_api import BaseAPIClient
from utils import cache_result

logger = logging.getLogger(__name__)

# Lobbying issue area codes (most common)
LOBBYING_ISSUES = {
    'TAX': 'Taxation/Internal Revenue Code',
    'TRD': 'Trade (Domestic & Foreign)',
    'BUD': 'Budget/Appropriations',
    'HCR': 'Health Issues',
    'ENG': 'Energy/Nuclear',
    'ENV': 'Environment/Superfund',
    'DEF': 'Defense',
    'FIN': 'Financial Institutions/Investments/Securities',
    'TRA': 'Transportation',
    'AGR': 'Agriculture',
    'LBR': 'Labor Issues/Antitrust/Workplace',
    'COM': 'Communications/Broadcasting/Radio/TV',
    'CPT': 'Computer Industry',
    'EDU': 'Education',
    'MMM': 'Medicare/Medicaid',
    'RET': 'Retirement',
    'INS': 'Insurance',
    'GOV': 'Government Issues',
    'IMM': 'Immigration',
    'BAN': 'Banking'
}


class LDAAPIClient(BaseAPIClient):
    """Client for Senate Lobbying Disclosure Act API"""

    def __init__(self, config):
        super().__init__(config)
        self.base_url = "https://lda.senate.gov/api/v1"

    def test_connection(self) -> bool:
        """Test LDA API connection"""
        try:
            result = self.get_filing_types()
            return result.get("status") == "success"
        except Exception as e:
            logger.error(f"LDA API connection test failed: {e}")
            return False

    def _make_lda_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make authenticated request to LDA API"""
        headers = {
            "Authorization": f"Token {self.api_key}",
            "Accept": "application/json"
        }
        result = self._make_request(endpoint, params=params, headers=headers)
        # _make_request returns {"success": True, "data": {...}} - extract the data
        if result.get("success") and result.get("data"):
            return result["data"]
        return None

    @cache_result(ttl=86400)  # Cache for 24 hours
    def get_filing_types(self) -> Dict[str, Any]:
        """Get list of filing types (for connection test)"""
        try:
            result = self._make_lda_request("/constants/filing/filingtypes/")
            if result:
                return {"status": "success", "data": result}
            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching filing types: {e}")
            return {"status": "error", "error": str(e)}

    def _parse_amount(self, value) -> float:
        """Parse income/expenses which can be string, float, or None"""
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value.replace(',', ''))
            except ValueError:
                return 0.0
        return 0.0

    @cache_result(ttl=3600)  # Cache for 1 hour
    def get_lobbying_filings(
        self,
        filing_year: Optional[int] = None,
        filing_type: str = "Q1",  # Q1, Q2, Q3, Q4 for quarterly reports with spending
        client_name: Optional[str] = None,
        registrant_name: Optional[str] = None,
        issue_code: Optional[str] = None,
        page_size: int = 25,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Get lobbying filings (LD-2 quarterly reports contain spending data)

        Args:
            filing_year: Year of filing (e.g., 2024)
            filing_type: Q1, Q2, Q3, Q4 for quarterly LD-2 reports (contain spending)
            client_name: Filter by client name
            registrant_name: Filter by lobbying firm name
            issue_code: Filter by issue area code (e.g., 'TAX', 'TRD')
            page_size: Results per page (max 25)
            page: Page number
        """
        try:
            params = {
                "filing_type": filing_type,
                "page_size": min(page_size, 25),
                "page": page
            }

            if filing_year:
                params["filing_year"] = filing_year
            if client_name:
                params["client_name"] = client_name
            if registrant_name:
                params["registrant_name"] = registrant_name
            if issue_code:
                params["general_issue_code"] = issue_code

            result = self._make_lda_request("/filings/", params=params)

            if result and "results" in result:
                filings = result.get("results", [])
                total_count = result.get("count", 0)

                # Calculate total spending from filings (income is stored as string)
                total_spending = 0
                for filing in filings:
                    income = self._parse_amount(filing.get("income"))
                    expenses = self._parse_amount(filing.get("expenses"))
                    total_spending += max(income, expenses)

                return {
                    "status": "success",
                    "data": {
                        "filings": filings,
                        "count": total_count,
                        "page": page,
                        "total_spending_this_page": total_spending
                    },
                    "source": "U.S. Senate Office of Public Records"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching lobbying filings: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_lobbying_totals_by_year(self, year: int) -> Dict[str, Any]:
        """
        Get aggregate lobbying spending totals for a given year
        Fetches from all quarters (Q1-Q4) and calculates totals
        """
        try:
            total_spending = 0
            total_filings = 0
            pages_fetched = 0
            quarters = ["Q1", "Q2", "Q3", "Q4"]
            max_pages_per_quarter = 20  # Limit API calls

            for quarter in quarters:
                page = 1
                while page <= max_pages_per_quarter:
                    params = {
                        "filing_year": year,
                        "filing_type": quarter,
                        "page_size": 25,
                        "page": page
                    }

                    result = self._make_lda_request("/filings/", params=params)

                    if not result or "results" not in result:
                        break

                    filings = result.get("results", [])
                    if not filings:
                        break

                    for filing in filings:
                        income = self._parse_amount(filing.get("income"))
                        expenses = self._parse_amount(filing.get("expenses"))
                        total_spending += max(income, expenses)
                        total_filings += 1

                    pages_fetched += 1

                    # Check if more pages exist
                    if not result.get("next"):
                        break

                    page += 1

            return {
                "status": "success",
                "data": {
                    "year": year,
                    "total_spending": total_spending,
                    "total_filings": total_filings,
                    "pages_fetched": pages_fetched,
                    "displayValue": f"${total_spending:,.0f}"
                },
                "source": "U.S. Senate Office of Public Records (LDA Filings)"
            }
        except Exception as e:
            logger.error(f"Error calculating lobbying totals: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_top_lobbying_clients(
        self,
        year: int,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Get top lobbying clients by spending for a given year
        """
        try:
            # Fetch filings from all quarters and aggregate by client
            client_spending = {}
            quarters = ["Q1", "Q2", "Q3", "Q4"]
            max_pages_per_quarter = 10

            for quarter in quarters:
                page = 1
                while page <= max_pages_per_quarter:
                    params = {
                        "filing_year": year,
                        "filing_type": quarter,
                        "page_size": 25,
                        "page": page
                    }

                    result = self._make_lda_request("/filings/", params=params)

                    if not result or "results" not in result:
                        break

                    filings = result.get("results", [])
                    if not filings:
                        break

                    for filing in filings:
                        client_name = filing.get("client", {}).get("name", "Unknown")
                        income = self._parse_amount(filing.get("income"))
                        expenses = self._parse_amount(filing.get("expenses"))
                        spending = max(income, expenses)

                        if client_name not in client_spending:
                            client_spending[client_name] = 0
                        client_spending[client_name] += spending

                    if not result.get("next"):
                        break

                    page += 1

            # Sort by spending and get top clients
            sorted_clients = sorted(
                client_spending.items(),
                key=lambda x: x[1],
                reverse=True
            )[:limit]

            top_clients = [
                {"name": name, "spending": spending, "displayValue": f"${spending:,.0f}"}
                for name, spending in sorted_clients
            ]

            return {
                "status": "success",
                "data": {
                    "year": year,
                    "top_clients": top_clients
                },
                "source": "U.S. Senate Office of Public Records (LDA Filings)"
            }
        except Exception as e:
            logger.error(f"Error fetching top lobbying clients: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_lobbying_by_issue(
        self,
        year: int,
        issue_code: str
    ) -> Dict[str, Any]:
        """
        Get lobbying spending for a specific issue area

        Args:
            year: Filing year
            issue_code: Issue code (e.g., 'TAX', 'TRD', 'HCR')
        """
        try:
            total_spending = 0
            total_filings = 0
            quarters = ["Q1", "Q2", "Q3", "Q4"]
            max_pages_per_quarter = 10

            for quarter in quarters:
                page = 1
                while page <= max_pages_per_quarter:
                    params = {
                        "filing_year": year,
                        "filing_type": quarter,
                        "general_issue_code": issue_code,
                        "page_size": 25,
                        "page": page
                    }

                    result = self._make_lda_request("/filings/", params=params)

                    if not result or "results" not in result:
                        break

                    filings = result.get("results", [])
                    if not filings:
                        break

                    for filing in filings:
                        income = self._parse_amount(filing.get("income"))
                        expenses = self._parse_amount(filing.get("expenses"))
                        total_spending += max(income, expenses)
                        total_filings += 1

                    if not result.get("next"):
                        break

                    page += 1

            issue_name = LOBBYING_ISSUES.get(issue_code, issue_code)

            return {
                "status": "success",
                "data": {
                    "year": year,
                    "issue_code": issue_code,
                    "issue_name": issue_name,
                    "total_spending": total_spending,
                    "total_filings": total_filings,
                    "displayValue": f"${total_spending:,.0f}"
                },
                "source": "U.S. Senate Office of Public Records (LDA Filings)"
            }
        except Exception as e:
            logger.error(f"Error fetching lobbying by issue: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=86400)  # Cache 24 hours
    def get_contributions(
        self,
        filing_year: Optional[int] = None,
        contributor_name: Optional[str] = None,
        page_size: int = 25,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Get LD-203 contribution reports (semi-annual)
        These show political contributions by lobbyists and PACs
        """
        try:
            params = {
                "page_size": min(page_size, 25),
                "page": page
            }

            if filing_year:
                params["filing_year"] = filing_year
            if contributor_name:
                params["contributor_name"] = contributor_name

            result = self._make_lda_request("/contributions/", params=params)

            if result and "results" in result:
                return {
                    "status": "success",
                    "data": {
                        "contributions": result.get("results", []),
                        "count": result.get("count", 0),
                        "page": page
                    },
                    "source": "U.S. Senate Office of Public Records (LD-203 Filings)"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching contributions: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=3600)
    def get_registrants(
        self,
        name: Optional[str] = None,
        page_size: int = 25,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Get registered lobbying organizations
        """
        try:
            params = {
                "page_size": min(page_size, 25),
                "page": page
            }

            if name:
                params["name"] = name

            result = self._make_lda_request("/registrants/", params=params)

            if result and "results" in result:
                return {
                    "status": "success",
                    "data": {
                        "registrants": result.get("results", []),
                        "count": result.get("count", 0),
                        "page": page
                    },
                    "source": "U.S. Senate Office of Public Records"
                }

            return {"status": "error", "error": "No data returned"}
        except Exception as e:
            logger.error(f"Error fetching registrants: {e}")
            return {"status": "error", "error": str(e)}
