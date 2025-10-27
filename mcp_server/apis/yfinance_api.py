"""
YFinance API client for financial and market data
"""
import logging
from typing import Dict, Any, List, Optional
import yfinance as yf
from datetime import datetime, timedelta
from utils import cache_result

logger = logging.getLogger(__name__)

class YFinanceAPIClient:
    """Client for Yahoo Finance API"""

    def __init__(self):
        """Initialize YFinance client (no API key needed)"""
        pass

    def test_connection(self) -> bool:
        """Test YFinance API connection"""
        try:
            ticker = yf.Ticker("AAPL")
            info = ticker.info
            return bool(info)
        except Exception as e:
            logger.error(f"YFinance API connection test failed: {e}")
            return False

    @cache_result(ttl=300)  # Cache for 5 minutes
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """Get comprehensive stock information"""
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info

            return {
                "status": "success",
                "symbol": symbol.upper(),
                "data": {
                    "name": info.get("longName", "N/A"),
                    "sector": info.get("sector", "N/A"),
                    "industry": info.get("industry", "N/A"),
                    "current_price": info.get("currentPrice", info.get("regularMarketPrice", "N/A")),
                    "market_cap": info.get("marketCap", "N/A"),
                    "pe_ratio": info.get("trailingPE", "N/A"),
                    "dividend_yield": info.get("dividendYield", "N/A"),
                    "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
                    "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
                    "volume": info.get("volume", "N/A"),
                    "avg_volume": info.get("averageVolume", "N/A"),
                    "description": info.get("longBusinessSummary", "N/A")[:500]
                }
            }
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=300)
    def get_stock_history(self, symbol: str, period: str = "1mo") -> Dict[str, Any]:
        """Get historical stock data

        Args:
            symbol: Stock ticker symbol
            period: Valid periods: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period=period)

            if hist.empty:
                return {"status": "error", "error": "No data available"}

            # Convert to list of dictionaries
            data = []
            for date, row in hist.iterrows():
                data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"])
                })

            return {
                "status": "success",
                "symbol": symbol.upper(),
                "period": period,
                "data": data[-30:]  # Last 30 days max
            }
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {e}")
            return {"status": "error", "error": str(e)}

    @cache_result(ttl=600)
    def search_stocks_by_sector(self, sector: str, limit: int = 10) -> Dict[str, Any]:
        """Get stocks in a specific sector (simplified)"""
        # Common stocks by sector for trade/tariff analysis
        sector_stocks = {
            "technology": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "INTC", "AMD", "CSCO"],
            "automotive": ["TSLA", "F", "GM", "TM", "HMC"],
            "retail": ["WMT", "AMZN", "TGT", "COST", "HD"],
            "agriculture": ["ADM", "BG", "DE", "CTVA"],
            "manufacturing": ["CAT", "GE", "BA", "HON", "MMM"],
            "steel": ["X", "NUE", "STLD", "CLF"],
            "energy": ["XOM", "CVX", "COP", "SLB"]
        }

        sector_lower = sector.lower()
        symbols = sector_stocks.get(sector_lower, [])

        if not symbols:
            return {"status": "error", "error": f"Sector '{sector}' not found"}

        results = []
        for symbol in symbols[:limit]:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                results.append({
                    "symbol": symbol,
                    "name": info.get("longName", symbol),
                    "price": info.get("currentPrice", "N/A"),
                    "change_percent": info.get("regularMarketChangePercent", "N/A")
                })
            except:
                continue

        return {
            "status": "success",
            "sector": sector,
            "stocks": results
        }

    @cache_result(ttl=300)
    def get_market_indices(self) -> Dict[str, Any]:
        """Get major market indices"""
        indices = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones",
            "^IXIC": "NASDAQ",
            "^RUT": "Russell 2000"
        }

        results = []
        for symbol, name in indices.items():
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                hist = ticker.history(period="1d")

                if not hist.empty:
                    latest = hist.iloc[-1]
                    results.append({
                        "name": name,
                        "symbol": symbol,
                        "value": round(latest["Close"], 2),
                        "change": round(info.get("regularMarketChange", 0), 2),
                        "change_percent": round(info.get("regularMarketChangePercent", 0), 2)
                    })
            except:
                continue

        return {
            "status": "success",
            "indices": results,
            "timestamp": datetime.now().isoformat()
        }
