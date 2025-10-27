"""
OpenAI API client for GPT-5 content generation
"""
import logging
import os
from typing import Dict, Any, List, Optional

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

logger = logging.getLogger(__name__)

class OpenAIAPIClient:
    """Client for OpenAI API"""

    def __init__(self, api_key: str = None):
        """
        Initialize OpenAI client

        Args:
            api_key: OpenAI API key (optional, will use env var if not provided)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI package not installed. Install with: pip install openai")
            self.client = None
            return

        if not self.api_key:
            logger.warning("OpenAI API key not configured.")
            self.client = None
            return

        try:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def test_connection(self) -> bool:
        """Test OpenAI API connection"""
        if not self.client:
            return False

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            return bool(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI API connection test failed: {e}")
            return False

    def generate_content(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: str = "gpt-4"
    ) -> Dict[str, Any]:
        """
        Generate content using OpenAI GPT models

        Args:
            prompt: The prompt to generate content from
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation (0.0 to 2.0)
            model: Model to use (gpt-4, gpt-5, gpt-3.5-turbo, etc.)

        Returns:
            Dictionary with generated text
        """
        if not self.client:
            return {
                "status": "error",
                "error": "OpenAI client not available. Please configure API key.",
                "text": ""
            }

        try:
            # GPT-5 uses max_completion_tokens and doesn't support temperature
            params = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }

            if model.startswith("gpt-5") or model.startswith("o1"):
                params["max_completion_tokens"] = max_tokens
                # GPT-5/o1 don't support temperature parameter
            else:
                params["max_tokens"] = max_tokens
                params["temperature"] = temperature

            response = self.client.chat.completions.create(**params)

            content = response.choices[0].message.content

            return {
                "status": "success",
                "text": content or "",
                "model": model,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }

        except Exception as e:
            logger.error(f"OpenAI content generation failed: {e}")
            return {
                "status": "error",
                "error": f"Content generation failed: {str(e)}",
                "text": ""
            }

    def generate_with_tools(
        self,
        prompt: str,
        system_prompt: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: str = "gpt-4"
    ) -> Dict[str, Any]:
        """
        Generate content with system prompt support

        Args:
            prompt: The user prompt
            system_prompt: System instructions
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            model: Model to use (gpt-4, gpt-5, etc.)

        Returns:
            Dictionary with generated text
        """
        if not self.client:
            return {
                "status": "error",
                "error": "OpenAI client not available",
                "text": ""
            }

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            # GPT-5 uses max_completion_tokens and doesn't support temperature
            params = {
                "model": model,
                "messages": messages
            }

            if model.startswith("gpt-5") or model.startswith("o1"):
                params["max_completion_tokens"] = max_tokens
                # GPT-5/o1 don't support temperature parameter
            else:
                params["max_tokens"] = max_tokens
                params["temperature"] = temperature

            response = self.client.chat.completions.create(**params)

            content = response.choices[0].message.content

            return {
                "status": "success",
                "text": content or "",
                "model": model,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }

        except Exception as e:
            logger.error(f"OpenAI generation with tools failed: {e}")
            return {
                "status": "error",
                "error": f"Generation failed: {str(e)}",
                "text": ""
            }
