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
            # GPT-5 uses Responses API, others use Chat Completions API
            if model.startswith("gpt-5") or model.startswith("o1"):
                # Try Responses API for GPT-5/o1 models
                try:
                    if not hasattr(self.client, 'responses'):
                        raise AttributeError("Responses API not available in this SDK version")

                    response = self.client.responses.create(
                        model=model,
                        input=prompt,
                        max_output_tokens=max_tokens
                    )

                    # Extract text from Responses API format
                    content = ""
                    if hasattr(response, 'output') and response.output:
                        for item in response.output:
                            if item.type == "message" and hasattr(item, 'content'):
                                for content_item in item.content:
                                    if hasattr(content_item, 'text'):
                                        content = content_item.text
                                        break
                                if content:
                                    break

                    tokens_used = response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0

                    return {
                        "status": "success",
                        "text": content or "",
                        "model": model,
                        "tokens_used": tokens_used
                    }
                except Exception as e:
                    # Fallback to gpt-4o-mini if GPT-5/Responses API fails
                    logger.warning(f"GPT-5 Responses API failed ({e}), falling back to gpt-4o-mini")
                    model = "gpt-4o-mini"

            # Use Chat Completions API for GPT-4 and earlier (and fallback)
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0

            return {
                "status": "success",
                "text": content or "",
                "model": model,
                "tokens_used": tokens_used
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
            # GPT-5 uses Responses API, others use Chat Completions API
            if model.startswith("gpt-5") or model.startswith("o1"):
                # Try Responses API for GPT-5/o1 models
                try:
                    if not hasattr(self.client, 'responses'):
                        raise AttributeError("Responses API not available in this SDK version")

                    # Combine system prompt and user prompt for Responses API
                    full_input = prompt
                    if system_prompt:
                        full_input = f"{system_prompt}\n\n{prompt}"

                    response = self.client.responses.create(
                        model=model,
                        input=full_input,
                        max_output_tokens=max_tokens
                    )

                    # Extract text from Responses API format
                    content = ""
                    if hasattr(response, 'output') and response.output:
                        for item in response.output:
                            if item.type == "message" and hasattr(item, 'content'):
                                for content_item in item.content:
                                    if hasattr(content_item, 'text'):
                                        content = content_item.text
                                        break
                                if content:
                                    break

                    tokens_used = response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0

                    return {
                        "status": "success",
                        "text": content or "",
                        "model": model,
                        "tokens_used": tokens_used
                    }
                except Exception as e:
                    # Fallback to gpt-4o-mini if GPT-5/Responses API fails
                    logger.warning(f"GPT-5 Responses API failed ({e}), falling back to gpt-4o-mini")
                    model = "gpt-4o-mini"

            # Use Chat Completions API for GPT-4 and earlier (and fallback)
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0

            return {
                "status": "success",
                "text": content or "",
                "model": model,
                "tokens_used": tokens_used
            }

        except Exception as e:
            logger.error(f"OpenAI generation with tools failed: {e}")
            return {
                "status": "error",
                "error": f"Generation failed: {str(e)}",
                "text": ""
            }
