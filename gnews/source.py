import requests
from datetime import datetime, timedelta


def fetch_gnews_articles(
    query: str,
    country: str = "us",
    lang: str = "en",
    max_results: int = 10,
    api_key: str = None,
    days_back: int = 7,
):
    """
    Fetch articles from GNews API.
    """
    if not api_key:
        raise ValueError("API key is required")
    url = "https://gnews.io/api/v4/search"
    date_from = (datetime.utcnow() - timedelta(days=days_back)).isoformat("T") + "Z"
    params = {
        "q": query,
        "country": country,
        "lang": lang,
        "max": max_results,
        "from": date_from,
        "sortby": "publishedAt",
        "apikey": api_key,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"GNews API error: {response.status_code} {response.text}")
