import os
import asyncio
from dotenv import load_dotenv
from source import fetch_gnews_articles

# Gemini integration
from google import genai

# MCP imports
from mcp.server import Server
from mcp.server.stdio import stdio_server

# Load environment variables
load_dotenv()

# API Keys - Use provided keys or fallback to environment variables
GNEWS_API_KEY = "afcc06e1baf1f551f5231cf621a210e4"
GEMINI_API_KEY = "AIzaSyD1tu-eIUXRjEVBBtC3GdnC--HzWe1Mxvc"

# Fallback to environment variables if needed
if not GNEWS_API_KEY:
    GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")  # Updated to working model
else:
    gemini_model = None

# Create MCP server
server = Server("gnews-gemini-mcp")

# -----------------------------
# TOOL 1: Get GNews Articles
# -----------------------------
@server.tool()
async def get_gnews(
    q: str,
    country: str = "us",
    lang: str = "en",
    max: int = 10,
    days_back: int = 7
) -> dict:
    """
    Fetch news articles using GNews API.
    """
    if not GNEWS_API_KEY:
        return {"error": "GNews API key not set in environment variable GNEWS_API_KEY."}

    try:
        data = fetch_gnews_articles(
            query=q,
            country=country,
            lang=lang,
            max_results=max,
            api_key=GNEWS_API_KEY,
            days_back=days_back,
        )
        return data
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# TOOL 2: Analyze News with Gemini
# -----------------------------
@server.tool()
async def analyze_news(
    query: str,
    country: str = "us",
    lang: str = "en",
    max: int = 10,
    days_back: int = 7
) -> dict:
    """
    Fetch news and analyze with Gemini.
    """
    if not GNEWS_API_KEY:
        return {"error": "GNews API key not set in environment variable GNEWS_API_KEY."}
    if not GEMINI_API_KEY or not gemini_model:
        return {"error": "Gemini API key not set in environment variable GEMINI_API_KEY."}

    try:
        news_data = fetch_gnews_articles(
            query=query,
            country=country,
            lang=lang,
            max_results=max,
            api_key=GNEWS_API_KEY,
            days_back=days_back,
        )
        articles = news_data.get("articles", [])
        if not articles:
            return {"error": "No news articles found."}

        # Combine titles and descriptions
        content = "\n".join([
            f"Title: {a.get('title', '')}\nDescription: {a.get('description', '')}" for a in articles
        ])

        gemini_response = gemini_model.generate_content(content)
        return {"analysis": gemini_response.text}
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# Run MCP server over stdio
# -----------------------------
async def main():
    async with stdio_server(server):
        await server.run()

if __name__ == "__main__":
    asyncio.run(main())
