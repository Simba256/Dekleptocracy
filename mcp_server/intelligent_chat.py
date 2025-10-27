#!/usr/bin/env python3
"""
Intelligent Chat Handler with Tool Selection
Uses Gemini API with tool catalog to intelligently select and call MCP tools
"""
import logging
import json
from typing import Dict, Any, List, Optional
from tool_catalog import get_tool_selection_prompt, TOOL_CATALOG

logger = logging.getLogger(__name__)

class IntelligentChatHandler:
    """Handles intelligent chat with automatic tool selection and calling"""

    def __init__(self, gemini_client, available_tools: Dict[str, Any], openai_client=None):
        """
        Initialize the intelligent chat handler

        Args:
            gemini_client: GeminiAPIClient instance (optional)
            available_tools: Dictionary of available MCP tools with handlers
            openai_client: OpenAIAPIClient instance (optional, preferred over Gemini)
        """
        self.gemini_client = gemini_client
        self.openai_client = openai_client
        self.available_tools = available_tools
        self.system_prompt = get_tool_selection_prompt()

        # Determine which AI client to use
        if openai_client and hasattr(openai_client, 'client') and openai_client.client:
            self.ai_client = openai_client
            self.ai_type = "openai"
            logger.info("Using OpenAI for response generation")
        elif gemini_client and hasattr(gemini_client, 'model') and gemini_client.model:
            self.ai_client = gemini_client
            self.ai_type = "gemini"
            logger.info("Using Gemini for response generation")
        else:
            self.ai_client = None
            self.ai_type = "fallback"
            logger.warning("No AI client available, using fallback responses")

    def _extract_tool_calls_from_response(self, response: str) -> List[Dict[str, Any]]:
        """
        Extract tool calls from the AI's response

        Args:
            response: The AI's text response

        Returns:
            List of tool calls with name and parameters
        """
        tool_calls = []

        # Look for tool mentions in the response
        # Format: tool_name(param1=value1, param2=value2)
        response_lower = response.lower()

        for tool_name in self.available_tools.keys():
            if tool_name in response_lower:
                # Basic parameter extraction
                params = {}

                # Get tool info from catalog
                tool_info = TOOL_CATALOG.get(tool_name, {})
                param_specs = tool_info.get("parameters", {})

                # Try to extract parameters from context
                if "stock" in response_lower or "company" in response_lower:
                    # Look for stock symbols
                    symbols = ["TSLA", "AAPL", "MSFT", "F", "X", "GM"]
                    for symbol in symbols:
                        if symbol.lower() in response_lower:
                            params["symbol"] = symbol
                            break

                if "sector" in response_lower or "industry" in response_lower:
                    sectors = ["technology", "automotive", "retail", "steel", "manufacturing"]
                    for sector in sectors:
                        if sector in response_lower:
                            params["sector"] = sector
                            break

                # Add defaults for required parameters
                for param_name, param_info in param_specs.items():
                    if param_info.get("required") and param_name not in params:
                        if "default" in param_info:
                            params[param_name] = param_info["default"]

                tool_calls.append({
                    "name": tool_name,
                    "parameters": params
                })

        return tool_calls

    def _analyze_user_intent(self, user_message: str) -> Dict[str, Any]:
        """
        Analyze user message to determine intent and appropriate tools

        Args:
            user_message: The user's message

        Returns:
            Dictionary with intent analysis and suggested tools
        """
        message_lower = user_message.lower()
        intent = {
            "primary_intent": "unknown",
            "suggested_tools": [],
            "extracted_entities": {}
        }

        # Detect primary intent
        if any(word in message_lower for word in ["news", "latest", "recent", "what's happening"]):
            intent["primary_intent"] = "news_query"

            if "tariff" in message_lower or "trade" in message_lower:
                intent["suggested_tools"].append("search_news")
                intent["suggested_tools"].append("get_trade_news")
            else:
                intent["suggested_tools"].append("search_news")

        elif any(word in message_lower for word in ["stock", "share", "price", "market"]):
            intent["primary_intent"] = "market_query"

            if "index" in message_lower or "dow" in message_lower or "s&p" in message_lower:
                intent["suggested_tools"].append("get_market_indices")
            elif "sector" in message_lower or "industry" in message_lower:
                intent["suggested_tools"].append("search_stocks_by_sector")
            else:
                intent["suggested_tools"].append("get_stock_info")

        elif any(word in message_lower for word in ["tariff", "duty", "import", "export"]):
            intent["primary_intent"] = "tariff_query"
            intent["suggested_tools"].append("search_tariff_info")
            intent["suggested_tools"].append("search_news")

        elif any(word in message_lower for word in ["trade policy", "trade agreement", "policy"]):
            intent["primary_intent"] = "policy_query"
            intent["suggested_tools"].append("get_trade_policy_news")
            intent["suggested_tools"].append("get_recent_tariff_announcements")

        elif any(word in message_lower for word in ["gdp", "economy", "economic"]):
            intent["primary_intent"] = "economic_query"
            intent["suggested_tools"].append("get_bea_datasets")

        else:
            intent["primary_intent"] = "general_query"
            intent["suggested_tools"].append("search_web")

        # Extract entities
        # Stock symbols and company names
        import re

        # Map common company names to stock symbols
        company_to_symbol = {
            "tesla": "TSLA",
            "apple": "AAPL",
            "microsoft": "MSFT",
            "amazon": "AMZN",
            "google": "GOOGL",
            "alphabet": "GOOGL",
            "meta": "META",
            "facebook": "META",
            "nvidia": "NVDA",
            "ford": "F",
            "gm": "GM",
            "general motors": "GM",
            "us steel": "X",
            "toyota": "TM",
            "volkswagen": "VWAGY",
            "bmw": "BMWYY",
            "netflix": "NFLX",
            "disney": "DIS",
            "walmart": "WMT",
            "target": "TGT",
            "costco": "COST",
        }

        # First check for company names
        for company, symbol in company_to_symbol.items():
            if company in message_lower:
                intent["extracted_entities"]["stock_symbols"] = [symbol]
                intent["extracted_entities"]["company_name"] = company.title()
                break

        # Then check for explicit stock symbols (all caps, 1-5 letters)
        if "stock_symbols" not in intent["extracted_entities"]:
            stock_pattern = r'\b[A-Z]{1,5}\b'
            potential_symbols = re.findall(stock_pattern, user_message)
            if potential_symbols:
                intent["extracted_entities"]["stock_symbols"] = potential_symbols

        # Countries
        countries = ["US", "USA", "China", "EU", "Europe", "Canada", "Mexico", "Japan"]
        for country in countries:
            if country.lower() in message_lower:
                intent["extracted_entities"]["country"] = country
                break

        # Commodities/sectors
        commodities = ["steel", "aluminum", "semiconductor", "automotive", "technology", "agriculture"]
        for commodity in commodities:
            if commodity in message_lower:
                intent["extracted_entities"]["commodity"] = commodity
                break

        return intent

    def _execute_tools(self, tool_calls: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute a list of tool calls

        Args:
            tool_calls: List of tool calls with name and parameters

        Returns:
            Dictionary mapping tool names to results
        """
        results = {}

        for tool_call in tool_calls:
            tool_name = tool_call["name"]
            params = tool_call["parameters"]

            if tool_name not in self.available_tools:
                results[tool_name] = {"error": f"Tool {tool_name} not found"}
                continue

            try:
                tool = self.available_tools[tool_name]
                result = tool["handler"](params)
                results[tool_name] = result
            except Exception as e:
                logger.error(f"Error executing {tool_name}: {e}")
                results[tool_name] = {"error": str(e)}

        return results

    def _generate_fallback_response(self, user_message: str, tool_results: Dict[str, Any]) -> str:
        """
        Generate a fallback response when Gemini is unavailable

        Args:
            user_message: The user's query
            tool_results: Results from executed tools

        Returns:
            Formatted response string
        """
        response_parts = [f"Based on your question about '{user_message}', here's what I found:\n"]

        if not tool_results:
            return "I understood your question but couldn't gather information at this time. Please try again."

        for tool_name, result in tool_results.items():
            if isinstance(result, dict) and result.get("status") == "success":
                response_parts.append(f"\n**{tool_name.replace('_', ' ').title()}:**")

                # Handle different result types
                if "results" in result:
                    items = result["results"]
                    if isinstance(items, list) and len(items) > 0:
                        response_parts.append(f"Found {len(items)} results.")
                        # Show first 3 items
                        for i, item in enumerate(items[:3], 1):
                            if isinstance(item, dict):
                                title = item.get("title", item.get("name", "Item"))
                                snippet = item.get("snippet", item.get("description", ""))
                                response_parts.append(f"{i}. {title}")
                                if snippet:
                                    response_parts.append(f"   {snippet[:150]}...")

                elif "indices" in result:
                    indices = result["indices"]
                    response_parts.append("Market Indices:")
                    for idx in indices[:4]:
                        symbol = idx.get("symbol", "")
                        price = idx.get("price", 0)
                        change = idx.get("change_percent", 0)
                        response_parts.append(f"- {symbol}: ${price:.2f} ({change:+.2f}%)")

                elif "symbol" in result:
                    # Stock info
                    response_parts.append(f"Stock: {result.get('symbol')}")
                    response_parts.append(f"Price: ${result.get('price', 0):.2f}")
                    response_parts.append(f"Market Cap: ${result.get('market_cap', 0):,.0f}")
                    response_parts.append(f"52-Week Range: ${result.get('fifty_two_week_low', 0):.2f} - ${result.get('fifty_two_week_high', 0):.2f}")

                elif "datasets" in result:
                    datasets = result["datasets"]
                    response_parts.append(f"Found {len(datasets)} datasets available.")

            elif isinstance(result, dict) and "error" in result:
                response_parts.append(f"\n**{tool_name}:** Error - {result['error']}")

        return "\n".join(response_parts)

    def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Process a user message with intelligent tool selection

        Args:
            user_message: The user's message
            conversation_history: Optional conversation history

        Returns:
            Dictionary with response and tool usage information
        """
        if conversation_history is None:
            conversation_history = []

        # Step 1: Analyze user intent
        intent = self._analyze_user_intent(user_message)
        logger.info(f"Detected intent: {intent['primary_intent']}")
        logger.info(f"Suggested tools: {intent['suggested_tools']}")

        # Step 2: Build tool calls based on intent
        tool_calls = []
        for tool_name in intent["suggested_tools"]:
            if tool_name not in self.available_tools:
                continue

            # Build parameters based on extracted entities
            params = {}
            tool_info = TOOL_CATALOG.get(tool_name, {})

            # Map entities to parameters
            if "stock_symbols" in intent["extracted_entities"] and "symbol" in tool_info.get("parameters", {}):
                params["symbol"] = intent["extracted_entities"]["stock_symbols"][0]

            if "country" in intent["extracted_entities"] and "country" in tool_info.get("parameters", {}):
                params["country"] = intent["extracted_entities"]["country"]

            if "commodity" in intent["extracted_entities"]:
                if "topic" in tool_info.get("parameters", {}):
                    params["topic"] = intent["extracted_entities"]["commodity"]
                elif "sector" in tool_info.get("parameters", {}):
                    params["sector"] = intent["extracted_entities"]["commodity"]

            # Add default query for search tools
            if tool_name in ["search_web", "search_news", "search_tariff_info"]:
                if "query" in tool_info.get("parameters", {}) and "query" not in params:
                    params["query"] = user_message[:100]  # Use part of user message

            tool_calls.append({
                "name": tool_name,
                "parameters": params
            })

        # Step 3: Execute tools
        tool_results = {}
        if tool_calls:
            logger.info(f"Executing {len(tool_calls)} tools")
            tool_results = self._execute_tools(tool_calls)

        # Step 4: Generate response using Gemini
        # Build context for Gemini
        context_parts = [self.system_prompt]

        if tool_results:
            context_parts.append("\n\n## Tool Execution Results:\n")
            for tool_name, result in tool_results.items():
                # Truncate large results
                result_str = str(result)[:500]
                context_parts.append(f"\n### {tool_name}:\n{result_str}")

        context_parts.append(f"\n\n## User Question:\n{user_message}")
        context_parts.append("\n\nProvide a comprehensive answer based on the tool results above. Cite specific data points and sources when available.")

        full_context = "\n".join(context_parts)

        # Step 4: Generate response using AI (OpenAI/Gemini) or fallback
        if not self.ai_client:
            logger.info("No AI client available, using fallback")
            response_text = self._generate_fallback_response(user_message, tool_results)
        else:
            try:
                logger.info(f"Calling {self.ai_type.upper()} API for response generation...")

                if self.ai_type == "openai":
                    # Use OpenAI GPT-5
                    ai_response = self.ai_client.generate_with_tools(
                        prompt=full_context,
                        system_prompt="You are a helpful assistant for trade and tariff analysis. Provide clear, concise answers based on the tool results provided.",
                        max_tokens=2000,
                        temperature=0.7,
                        model="gpt-5"
                    )
                else:
                    # Use Gemini
                    ai_response = self.ai_client.generate_content(
                        prompt=full_context,
                        max_tokens=1000
                    )

                logger.info(f"{self.ai_type.upper()} response status: {ai_response.get('status')}")

                if ai_response.get("status") == "error":
                    logger.error(f"{self.ai_type.upper()} API error: {ai_response.get('error')}")
                    response_text = self._generate_fallback_response(user_message, tool_results)
                else:
                    response_text = ai_response.get("text", "")
                    if not response_text:
                        logger.warning(f"{self.ai_type.upper()} returned empty response, using fallback")
                        response_text = self._generate_fallback_response(user_message, tool_results)

            except Exception as e:
                logger.error(f"Error generating AI response: {e}", exc_info=True)
                response_text = self._generate_fallback_response(user_message, tool_results)

        return {
            "response": response_text,
            "intent": intent,
            "tools_used": [call["name"] for call in tool_calls],
            "tool_results": tool_results,
            "tool_calls": tool_calls
        }
