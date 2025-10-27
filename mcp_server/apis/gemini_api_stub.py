"""
Stub for Gemini API when google.generativeai is not installed
"""
import logging
from typing import Dict, Any, List, Optional
from .base_api import BaseAPIClient

logger = logging.getLogger(__name__)

class GeminiAPIClient(BaseAPIClient):
    """Stub client for Gemini AI API when package is not installed"""

    def __init__(self, config):
        super().__init__(config)
        logger.warning("Google Generative AI package not installed. Gemini features disabled.")
        self.model = None

    def test_connection(self) -> bool:
        """Test Gemini API connection"""
        logger.warning("Gemini API not available - google-generativeai not installed")
        return False

    def analyze_text(self, text: str, prompt: str) -> Dict[str, Any]:
        """Analyze text with Gemini"""
        return {
            "status": "error",
            "error": "Gemini API not available. Install google-generativeai package.",
            "data": None
        }

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        return {
            "status": "error",
            "error": "Gemini API not available. Install google-generativeai package.",
            "sentiment": "unknown"
        }

    def summarize_text(self, text: str, max_length: int = 200) -> Dict[str, Any]:
        """Summarize text"""
        return {
            "status": "error",
            "error": "Gemini API not available. Install google-generativeai package.",
            "summary": None
        }

    def translate_text(self, text: str, target_language: str) -> Dict[str, Any]:
        """Translate text"""
        return {
            "status": "error",
            "error": "Gemini API not available. Install google-generativeai package.",
            "translation": None
        }