#!/usr/bin/env python3
"""
Intelligent Chat Handler V2 - LLM-Driven Tool Selection
Uses OpenAI function calling to let the LLM decide everything
"""
import logging
import json
from typing import Dict, Any, List, Optional
from tool_catalog import TOOL_CATALOG
from utils import (
    count_message_tokens,
    get_model_context_limit,
    estimate_tokens_remaining,
    truncate_messages_to_fit
)

logger = logging.getLogger(__name__)

class IntelligentChatHandlerV2:
    """LLM-driven chat handler using native function calling"""

    def __init__(self, openai_client, available_tools: Dict[str, Any]):
        """
        Initialize the LLM-driven chat handler

        Args:
            openai_client: OpenAIAPIClient instance
            available_tools: Dictionary of available MCP tools with handlers
        """
        self.openai_client = openai_client
        self.available_tools = available_tools

        # Check if OpenAI is available
        if not openai_client or not hasattr(openai_client, 'client') or not openai_client.client:
            raise ValueError("OpenAI client is required for LLM-driven chat")

        logger.info("Initialized LLM-driven chat handler")

    def _convert_tools_to_openai_format(self) -> List[Dict[str, Any]]:
        """
        Convert MCP tool catalog to OpenAI function calling format

        Returns:
            List of tool definitions in OpenAI format
        """
        openai_tools = []

        for tool_name, tool_info in TOOL_CATALOG.items():
            # Only include tools that are actually available
            if tool_name not in self.available_tools:
                continue

            # Build parameter schema
            properties = {}
            required = []

            for param_name, param_info in tool_info.get("parameters", {}).items():
                properties[param_name] = {
                    "type": param_info.get("type", "string"),
                    "description": param_info.get("description", "")
                }

                # Add enum/options if available
                if "options" in param_info:
                    properties[param_name]["enum"] = param_info["options"]

                # Add default if available
                if "default" in param_info:
                    properties[param_name]["default"] = param_info["default"]

                # Track required parameters
                if param_info.get("required", False):
                    required.append(param_name)

            # Create OpenAI function definition
            function_def = {
                "type": "function",
                "function": {
                    "name": tool_name,
                    "description": f"{tool_info['description']}. Use when: {', '.join(tool_info.get('when_to_use', []))}",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required
                    }
                }
            }

            openai_tools.append(function_def)

        logger.info(f"Converted {len(openai_tools)} tools to OpenAI format")
        return openai_tools

    def _execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Execute a single tool

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments

        Returns:
            Tool execution result
        """
        if tool_name not in self.available_tools:
            return {"error": f"Tool {tool_name} not found"}

        try:
            tool = self.available_tools[tool_name]
            result = tool["handler"](arguments)
            logger.info(f"Executed {tool_name} successfully")
            return result
        except Exception as e:
            logger.error(f"Error executing {tool_name}: {e}")
            return {"error": str(e)}

    def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]] = None,
        max_iterations: int = 10,  # Balanced limit to prevent long execution times
        max_total_tools: int = 8,   # Hard limit on total tools called
        max_context_tokens: Optional[int] = None,  # Maximum tokens for context
        preserve_recent_messages: int = 3  # Number of recent messages to preserve when truncating
    ) -> Dict[str, Any]:
        """
        Process a user message with LLM-driven tool selection

        Args:
            user_message: The user's message
            conversation_history: Optional conversation history
            max_iterations: Max number of tool calling iterations
            max_total_tools: Hard limit on total number of tools called
            max_context_tokens: Maximum tokens for context (if None, uses model default)
            preserve_recent_messages: Number of recent messages to preserve when truncating

        Returns:
            Dictionary with response and execution details including token usage
        """
        if conversation_history is None:
            conversation_history = []

        # Build messages for OpenAI
        messages = [
            {
                "role": "system",
                "content": """You are a helpful assistant for trade and tariff analysis.

You have access to specialized tools that can:
- Search the web and news for current information
- Get stock market data and financial information
- Access government economic data (BEA, Census, USITC)
- Retrieve official policy documents and announcements

PERFORMANCE OPTIMIZATION (Critical for Speed):

**Each iteration takes 30-60 seconds due to network + processing overhead.**
**Minimize iterations by calling multiple tools in parallel when possible!**

TARGET STRATEGY:
- Simple queries: 1-2 tools in ONE iteration
- Complex queries: 2-4 tools per iteration, 2-3 iterations total

RULES FOR FAST RESPONSES:
1. **Call 2-3 complementary tools per iteration** (in parallel) when you know what you need
2. **Don't wait to see results before calling related tools** - call them together!
3. **Hard stop at 8 tools total**
4. **Evaluate results between iterations** - if you have enough, stop
5. **If first tool fails, try 1-2 alternative approaches in next iteration**

ITERATION PLANNING:

For SIMPLE queries (e.g., "Tesla stock"):
Iteration 1: Call get_stock_info AND get_stock_history together → DONE
Total: 1 iteration, 2 tools, ~45 seconds

For COMPLEX queries (e.g., "US-China-India trade"):
Iteration 1: Call get_trade_policy_news(US) AND search_news("US China India trade 2025") together
Iteration 2: If need more depth → Call 1-2 additional complementary tools
Total: 2 iterations, 3-4 tools, ~90-120 seconds

CRITICAL EFFICIENCY TIPS:
✅ GOOD: Call stock_info AND stock_history in ONE call
✅ GOOD: Call trade_policy_news AND search_news in ONE call
✅ GOOD: Call 2-3 different tool types that provide complementary data

❌ BAD: Call stock_info, wait, then call stock_history (wastes an iteration!)
❌ BAD: Call one search, wait, call another search (wastes an iteration!)
❌ BAD: Call tools one at a time when you know you need multiple

Remember: Each iteration costs 30-60 seconds. Bundle related tools together!

RESPONSE FORMATTING GUIDELINES:

**Always provide well-structured, readable responses:**

1. **Use Clear Sections with Headers**
   - Start with a brief summary (2-3 sentences)
   - Break information into logical sections with **bold headers**
   - Use ## for main sections, ### for subsections

2. **Use Bullet Points and Lists**
   - Break down complex information into bullet points
   - Use numbered lists for sequential information
   - Keep individual points concise (1-2 lines max)

3. **Highlight Key Information**
   - Use **bold** for important numbers, dates, and key facts
   - Use *italics* for emphasis on trends or insights
   - Put critical takeaways at the top or in a dedicated section

4. **Structure Complex Data**
   - Use tables for comparing multiple items (use markdown tables)
   - Group related information together
   - Use line breaks to separate sections

5. **Be Specific and Cite Sources**
   - Include specific numbers with units (e.g., "$500 billion", "45% tariff")
   - Cite sources when mentioning data (e.g., "According to US Census Bureau...")
   - Include dates for time-sensitive information

FORMATTING EXAMPLES:

For stock queries:
## Tesla Stock Performance

**Current Status:** Trading at $452.75, up 9.8% from last month

### Key Metrics
- **Current Price:** $452.75
- **Market Cap:** $1.51 trillion
- **P/E Ratio:** 308
- **52-Week Range:** $214.25 - $488.54

### Recent Trend
*Past month:* Strong upward momentum with...

For trade queries:
## US-China-India Trade Relations

**Summary:** Trade dynamics between these three nations are being reshaped by recent tariff changes and shifting supply chains.

### US-China Trade
- **Current Status:** Tensions easing with recent trade deal
- **Key Development:** Tariffs reduced from 100% to 47%
- **Volume:** Remains largest bilateral trade relationship

### US-India Trade
- **Trend:** Growing rapidly as companies diversify
- **Key Sectors:** IT services, pharmaceuticals, electronics
- **Challenge:** India faces 50% tariffs from US

### India-China Trade
- **Status:** Large trade deficit for India
- **Recent News:** Chinese goods re-entering Indian markets after 4-year stall

---
*Sources: US Census Bureau, recent trade policy announcements*"""
            }
        ]

        # Add conversation history
        for msg in conversation_history:
            # Handle both dict and Pydantic objects
            if isinstance(msg, dict):
                messages.append({"role": msg["role"], "content": msg["content"]})
            else:
                messages.append({"role": msg.role, "content": msg.content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # PRE-FLIGHT VALIDATION: Check and manage context window size
        model = "gpt-5"  # Default model used in this handler
        max_completion_tokens = 4000  # Tokens to reserve for completion

        # Get token usage estimates
        token_estimate = estimate_tokens_remaining(
            messages=messages,
            model=model,
            max_completion_tokens=max_completion_tokens
        )

        # Track token metadata for response
        token_metadata = {
            "model": model,
            "context_limit": token_estimate['context_limit'],
            "initial_messages_tokens": token_estimate['messages_tokens'],
            "initial_utilization_percent": token_estimate['utilization_percent'],
            "truncation_occurred": False,
            "messages_removed": 0
        }

        logger.info(f"📊 Context Window Check:")
        logger.info(f"   - Model: {model}")
        logger.info(f"   - Context Limit: {token_estimate['context_limit']:,} tokens")
        logger.info(f"   - Current Usage: {token_estimate['messages_tokens']:,} tokens ({token_estimate['utilization_percent']}%)")
        logger.info(f"   - Reserved for Completion: {token_estimate['reserved_for_completion']:,} tokens")
        logger.info(f"   - Available: {token_estimate['available_for_completion']:,} tokens")

        # Check if we need to truncate
        if token_estimate['available_for_completion'] <= 0:
            logger.warning(f"⚠️  Context window nearly full - truncating conversation history")
            original_message_count = len(messages)

            # Truncate messages to fit within budget
            # Preserve system message and recent user/assistant exchanges
            messages = truncate_messages_to_fit(
                messages=messages,
                model=model,
                max_tokens=max_context_tokens,  # Use configurable limit if provided
                reserved_for_completion=max_completion_tokens,
                preserve_system=True,
                preserve_recent=preserve_recent_messages  # Use configurable value
            )

            # Re-calculate after truncation
            new_token_estimate = estimate_tokens_remaining(
                messages=messages,
                model=model,
                max_completion_tokens=max_completion_tokens
            )

            # Update metadata
            token_metadata["truncation_occurred"] = True
            token_metadata["messages_removed"] = original_message_count - len(messages)
            token_metadata["final_messages_tokens"] = new_token_estimate['messages_tokens']
            token_metadata["final_utilization_percent"] = new_token_estimate['utilization_percent']

            logger.info(f"✂️  Truncated: {original_message_count} → {len(messages)} messages")
            logger.info(f"   - New Usage: {new_token_estimate['messages_tokens']:,} tokens ({new_token_estimate['utilization_percent']}%)")
            logger.info(f"   - Available: {new_token_estimate['available_for_completion']:,} tokens")

        # Convert tools to OpenAI format
        tools = self._convert_tools_to_openai_format()

        # Track tool calls and results
        all_tool_calls = []
        all_tool_results = {}
        tool_call_signatures = set()  # Track unique tool+params combinations to prevent duplicates
        iterations = 0
        last_response_had_tool_calls = False

        while iterations < max_iterations:
            iterations += 1
            logger.info(f"LLM iteration {iterations}/{max_iterations}")

            try:
                # Call OpenAI with function calling
                response = self.openai_client.client.chat.completions.create(
                    model="gpt-5",
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",  # Let the model decide
                    max_completion_tokens=4000  # Increased from 2000 for tool calling phase
                )

                response_message = response.choices[0].message

                # Check if the model wants to call tools
                if response_message.tool_calls:
                    last_response_had_tool_calls = True
                    # Add assistant's response to messages
                    messages.append(response_message)

                    # Execute each tool call
                    for tool_call in response_message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments)

                        # Create signature to detect duplicates (tool name + sorted params)
                        tool_signature = f"{tool_name}:{json.dumps(tool_args, sort_keys=True)}"

                        # Check if this exact tool call was already made
                        if tool_signature in tool_call_signatures:
                            logger.warning(f"⚠️ DUPLICATE DETECTED: {tool_name} with same parameters - skipping execution, reusing previous result")
                            # Reuse existing result
                            result = all_tool_results.get(tool_name, {"status": "duplicate", "message": "This tool was already called with the same parameters"})

                            # Still acknowledge to GPT so it doesn't get confused
                            messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "name": tool_name,
                                "content": f"✓ {tool_name} already called with these parameters - using cached result"
                            })
                            continue

                        logger.info(f"🔧 GPT-5 calling: {tool_name}({json.dumps(tool_args)[:100]})")

                        # Execute the tool
                        result = self._execute_tool(tool_name, tool_args)
                        logger.info(f"✅ {tool_name} completed")

                        # Mark this signature as used
                        tool_call_signatures.add(tool_signature)

                        # Track for response
                        all_tool_calls.append({
                            "name": tool_name,
                            "arguments": tool_args,
                            "tool_call_id": tool_call.id
                        })
                        all_tool_results[tool_name] = result

                        # PHASE 1: Add minimal acknowledgment to avoid context overflow
                        # Don't add full results - we'll synthesize separately
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": tool_name,
                            "content": f"✓ {tool_name} completed successfully"
                        })

                        # Check if we've hit the hard limit on total tools
                        if len(all_tool_calls) >= max_total_tools:
                            logger.warning(f"⚠️ HARD LIMIT REACHED: {len(all_tool_calls)}/{max_total_tools} tools called - forcing synthesis")
                            last_response_had_tool_calls = True
                            # Break out of tool execution loop and force synthesis
                            break

                    # If we hit the tool limit, break out of iteration loop and synthesize
                    if len(all_tool_calls) >= max_total_tools:
                        logger.info(f"Tool limit reached. {len(all_tool_calls)} tools called. Forcing synthesis...")
                        break

                    # Continue loop to let LLM process results
                    continue

                else:
                    last_response_had_tool_calls = False
                    # No more tool calls - time for PHASE 2: Synthesis with actual data
                    logger.info(f"Tool calling phase complete. {len(all_tool_calls)} tools called. Starting synthesis phase...")

                    # If no tools were called, just return the response
                    if len(all_tool_calls) == 0:
                        final_response = response_message.content or "I don't have enough information to answer that question."
                        return {
                            "response": final_response,
                            "tool_calls": [],
                            "tool_results": {},
                            "iterations": iterations,
                            "tokens_used": response.usage.total_tokens if response.usage else 0,
                            "token_metadata": token_metadata
                        }

                    # PHASE 2: Create summaries of tool results for synthesis
                    synthesis_prompt = f"""Based on the {len(all_tool_calls)} tools you called, here are the results:

"""

                    for idx, call in enumerate(all_tool_calls, 1):
                        tool_name = call['name']
                        result = all_tool_results.get(tool_name, {})

                        # Use generous truncation to allow more data (increased from 150 to 3000)
                        result_str = json.dumps(result)
                        if len(result_str) > 3000:
                            result_str = result_str[:3000] + "..."

                        synthesis_prompt += f"{idx}. {tool_name}: {result_str}\n\n"

                    synthesis_prompt += f"""

Now, using ALL the information above, provide a comprehensive, well-structured answer to the user's original question: "{user_message}"

Be specific, cite data points, and synthesize the information into a coherent response."""

                    # Make final synthesis call with much higher token limit
                    logger.info(f"Making final synthesis call with tool result summaries... Prompt length: {len(synthesis_prompt)} chars")

                    final_messages = [
                        {"role": "system", "content": """You are a helpful assistant for trade and tariff analysis.

RESPONSE FORMATTING GUIDELINES:

**Always provide well-structured, readable responses using markdown:**

1. **Use Clear Sections with Headers**
   - Start with a brief summary (2-3 sentences)
   - Break information into logical sections with **bold headers**
   - Use ## for main sections, ### for subsections

2. **Use Bullet Points and Lists**
   - Break down complex information into bullet points
   - Use numbered lists for sequential information
   - Keep individual points concise (1-2 lines max)

3. **Highlight Key Information**
   - Use **bold** for important numbers, dates, and key facts
   - Use *italics* for emphasis on trends or insights
   - Put critical takeaways at the top or in a dedicated section

4. **Structure Complex Data**
   - Use tables for comparing multiple items (use markdown tables)
   - Group related information together
   - Use line breaks to separate sections

5. **Be Specific and Cite Sources**
   - Include specific numbers with units (e.g., "$500 billion", "45% tariff")
   - Cite sources when mentioning data (e.g., "According to US Census Bureau...")
   - Include dates for time-sensitive information

FORMATTING EXAMPLES:

For stock queries:
## Tesla Stock Performance

**Current Status:** Trading at $452.75, up 9.8% from last month

### Key Metrics
- **Current Price:** $452.75
- **Market Cap:** $1.51 trillion
- **P/E Ratio:** 308
- **52-Week Range:** $214.25 - $488.54

### Recent Trend
*Past month:* Strong upward momentum with...

For trade queries:
## US-China-India Trade Relations

**Summary:** Trade dynamics between these three nations are being reshaped by recent tariff changes and shifting supply chains.

### US-China Trade
- **Current Status:** Tensions easing with recent trade deal
- **Key Development:** Tariffs reduced from 100% to 47%
- **Volume:** Remains largest bilateral trade relationship

### US-India Trade
- **Trend:** Growing rapidly as companies diversify
- **Key Sectors:** IT services, pharmaceuticals, electronics
- **Challenge:** India faces 50% tariffs from US

### India-China Trade
- **Status:** Large trade deficit for India
- **Recent News:** Chinese goods re-entering Indian markets after 4-year stall

---
*Sources: US Census Bureau, recent trade policy announcements*

Now, synthesize the tool results provided into a comprehensive, well-formatted answer."""},
                        {"role": "user", "content": synthesis_prompt}
                    ]

                    # Validate synthesis message size
                    synthesis_token_estimate = estimate_tokens_remaining(
                        messages=final_messages,
                        model=model,
                        max_completion_tokens=16000
                    )

                    logger.info(f"📊 Synthesis Phase Context Check:")
                    logger.info(f"   - Messages: {synthesis_token_estimate['messages_tokens']:,} tokens ({synthesis_token_estimate['utilization_percent']}%)")
                    logger.info(f"   - Available for Response: {synthesis_token_estimate['available_for_completion']:,} tokens")

                    # If synthesis prompt is too large, truncate tool results more aggressively
                    if synthesis_token_estimate['available_for_completion'] < 8000:
                        logger.warning(f"⚠️  Synthesis prompt is large - using shorter tool result summaries")

                        # Rebuild synthesis prompt with shorter summaries
                        synthesis_prompt = f"""Based on the {len(all_tool_calls)} tools you called, here are the results:

"""
                        # Use much shorter truncation (1000 instead of 3000)
                        for idx, call in enumerate(all_tool_calls, 1):
                            tool_name = call['name']
                            result = all_tool_results.get(tool_name, {})
                            result_str = json.dumps(result)
                            if len(result_str) > 1000:
                                result_str = result_str[:1000] + "..."
                            synthesis_prompt += f"{idx}. {tool_name}: {result_str}\n\n"

                        synthesis_prompt += f"""

Now, using ALL the information above, provide a comprehensive, well-structured answer to the user's original question: "{user_message}"

Be specific, cite data points, and synthesize the information into a coherent response."""

                        final_messages[1]["content"] = synthesis_prompt
                        logger.info(f"   - Reduced synthesis prompt to {len(synthesis_prompt)} chars")

                    synthesis_response = self.openai_client.client.chat.completions.create(
                        model="gpt-5",
                        messages=final_messages,
                        max_completion_tokens=16000  # Increased from 2000 to 16000
                    )

                    final_response = synthesis_response.choices[0].message.content
                    finish_reason = synthesis_response.choices[0].finish_reason if synthesis_response.choices else "unknown"

                    logger.info(f"Synthesis response - finish_reason: {finish_reason}, content length: {len(final_response) if final_response else 0}")

                    # Check for refusal
                    if hasattr(synthesis_response.choices[0].message, 'refusal') and synthesis_response.choices[0].message.refusal:
                        logger.error(f"GPT-5 refused synthesis: {synthesis_response.choices[0].message.refusal}")
                        final_response = f"GPT-5 refused to synthesize the response: {synthesis_response.choices[0].message.refusal}"

                    elif not final_response or final_response.strip() == "":
                        logger.error(f"Synthesis phase returned empty response. Finish reason: {finish_reason}")

                        # If still hitting length limit, try with even more aggressive truncation
                        if finish_reason == "length":
                            logger.warning("Hit length limit even in synthesis. Trying ultra-short summaries...")

                            # Ultra-short version with just tool names and minimal info
                            short_summary = f"Answer this based on data from {len(all_tool_calls)} tools:\n"
                            for idx, call in enumerate(all_tool_calls[:10], 1):  # Only first 10
                                short_summary += f"{idx}. {call['name']}\n"
                            if len(all_tool_calls) > 10:
                                short_summary += f"...and {len(all_tool_calls) - 10} more\n"
                            short_summary += f"\nQuestion: {user_message}\nProvide a brief answer."

                            retry_response = self.openai_client.client.chat.completions.create(
                                model="gpt-5",
                                messages=[{"role": "user", "content": short_summary}],
                                max_completion_tokens=8000  # Increased from 1000
                            )
                            final_response = retry_response.choices[0].message.content or "Unable to synthesize response due to context constraints."
                        else:
                            final_response = "I gathered comprehensive data but encountered an issue creating the final response."

                    logger.info(f"Synthesis complete. Response length: {len(final_response)}")

                    response_data = {
                        "response": final_response,
                        "tool_calls": all_tool_calls,
                        "tool_results": all_tool_results,
                        "iterations": iterations,
                        "tokens_used": response.usage.total_tokens + synthesis_response.usage.total_tokens if response.usage and synthesis_response.usage else 0,
                        "token_metadata": token_metadata
                    }

                    # Add flag if tool limit was reached
                    if len(all_tool_calls) >= max_total_tools:
                        response_data["tool_limit_reached"] = True

                    return response_data

            except Exception as e:
                logger.error(f"Error in LLM iteration {iterations}: {e}", exc_info=True)
                return {
                    "response": f"I encountered an error while processing your request: {str(e)}",
                    "tool_calls": all_tool_calls,
                    "tool_results": all_tool_results,
                    "iterations": iterations,
                    "error": str(e),
                    "token_metadata": token_metadata
                }

        # Max iterations reached - PHASE 2: Synthesize with actual data
        logger.warning(f"Max iterations ({max_iterations}) reached - making final synthesis call")

        try:
            if len(all_tool_calls) == 0:
                return {
                    "response": "I wasn't able to gather enough information to answer your question. Please try asking a more specific question.",
                    "tool_calls": [],
                    "tool_results": {},
                    "iterations": iterations,
                    "max_iterations_reached": True,
                    "token_metadata": token_metadata
                }

            # Create summaries of all tool results
            synthesis_prompt = f"""Based on the {len(all_tool_calls)} tools called, here are the results:

"""

            for idx, call in enumerate(all_tool_calls, 1):
                tool_name = call['name']
                result = all_tool_results.get(tool_name, {})

                # Use generous truncation (increased to 3000 chars)
                result_str = json.dumps(result)
                if len(result_str) > 3000:
                    result_str = result_str[:3000] + "..."

                synthesis_prompt += f"{idx}. {tool_name}: {result_str}\n\n"

            # Add note if we hit any limit
            limit_note = ""
            if len(all_tool_calls) >= max_total_tools:
                limit_note = f"\n\nIMPORTANT: The analysis was STOPPED at the {max_total_tools}-tool limit to ensure timely responses. Provide your best answer with the available data. Add a note: 'Note: Analysis limited to {len(all_tool_calls)} tools for efficiency. Ask follow-up questions for more details.'"
            elif last_response_had_tool_calls:
                limit_note = "\n\nIMPORTANT: The analysis reached the maximum iteration limit. There may be additional relevant information that wasn't explored. Please add a brief note at the end: 'Note: This analysis was limited by time constraints. Additional information may be available - feel free to ask follow-up questions for more specific details.'"

            synthesis_prompt += f"""

Now, using ALL the information above, provide a comprehensive, well-structured answer to the user's original question: "{user_message}"

Be specific, cite data points, and synthesize the information into a coherent response.{limit_note}"""

            # Final synthesis call with fresh context
            logger.info(f"Max iterations synthesis - Prompt length: {len(synthesis_prompt)} chars")

            final_messages = [
                {"role": "system", "content": "You are a helpful assistant. Synthesize the tool results provided into a comprehensive answer."},
                {"role": "user", "content": synthesis_prompt}
            ]

            final_response = self.openai_client.client.chat.completions.create(
                model="gpt-5",
                messages=final_messages,
                max_completion_tokens=16000  # Increased from 2000
            )

            final_text = final_response.choices[0].message.content
            finish_reason = final_response.choices[0].finish_reason if final_response.choices else "unknown"

            logger.info(f"Max iterations synthesis - finish_reason: {finish_reason}, content length: {len(final_text) if final_text else 0}")

            # If empty, try ultra-short version
            if not final_text or final_text.strip() == "":
                if finish_reason == "length":
                    logger.warning("Hit length limit in max iterations synthesis. Trying ultra-short version...")
                    short_summary = f"Answer based on {len(all_tool_calls)} tools: "
                    short_summary += ", ".join([call['name'] for call in all_tool_calls[:10]])
                    if len(all_tool_calls) > 10:
                        short_summary += f" +{len(all_tool_calls) - 10} more"
                    short_summary += f"\n\nQuestion: {user_message}"

                    retry_response = self.openai_client.client.chat.completions.create(
                        model="gpt-5",
                        messages=[{"role": "user", "content": short_summary}],
                        max_completion_tokens=8000  # Increased from 1000
                    )
                    final_text = retry_response.choices[0].message.content or "Unable to synthesize due to context limits."

            response_data = {
                "response": final_text or "I gathered comprehensive information but encountered an issue synthesizing the final response.",
                "tool_calls": all_tool_calls,
                "tool_results": all_tool_results,
                "iterations": iterations,
                "max_iterations_reached": True,
                "tokens_used": final_response.usage.total_tokens if final_response.usage else 0,
                "token_metadata": token_metadata
            }

            # Add flag if tool limit was reached
            if len(all_tool_calls) >= max_total_tools:
                response_data["tool_limit_reached"] = True

            return response_data
        except Exception as e:
            logger.error(f"Error in final synthesis: {e}", exc_info=True)

            # Even if synthesis fails, try to provide something useful
            tools_used = ", ".join([call['name'] for call in all_tool_calls[:5]])
            if len(all_tool_calls) > 5:
                tools_used += f" and {len(all_tool_calls) - 5} more"

            fallback_response = f"I gathered information from {len(all_tool_calls)} tools ({tools_used}), but encountered an issue creating the final response. "

            if last_response_had_tool_calls:
                fallback_response += "Additionally, the analysis reached the iteration limit and there may be more information to explore. "

            fallback_response += "Please try asking a more specific question or breaking your query into smaller parts."

            response_data = {
                "response": fallback_response,
                "tool_calls": all_tool_calls,
                "tool_results": all_tool_results,
                "iterations": iterations,
                "max_iterations_reached": True,
                "error": str(e),
                "token_metadata": token_metadata
            }

            # Add flag if tool limit was reached
            if len(all_tool_calls) >= max_total_tools:
                response_data["tool_limit_reached"] = True

            return response_data
