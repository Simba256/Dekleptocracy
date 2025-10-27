#!/usr/bin/env python3
"""
Intelligent Chat Handler V2 - LLM-Driven Tool Selection
Uses OpenAI function calling to let the LLM decide everything
"""
import logging
import json
from typing import Dict, Any, List, Optional
from tool_catalog import TOOL_CATALOG

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
        max_iterations: int = 20  # Increased to allow GPT-5 to be thorough
    ) -> Dict[str, Any]:
        """
        Process a user message with LLM-driven tool selection

        Args:
            user_message: The user's message
            conversation_history: Optional conversation history
            max_iterations: Max number of tool calling iterations

        Returns:
            Dictionary with response and execution details
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

When a user asks a question:
1. Analyze what information is needed
2. Use the appropriate tools to gather that information
3. Provide a comprehensive, well-structured answer based on the tool results
4. Cite specific data points and sources when available

Be proactive in using multiple tools when they provide complementary information.
For example, when asked about a company and tariffs, use both stock info tools AND search tools."""
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

        # Convert tools to OpenAI format
        tools = self._convert_tools_to_openai_format()

        # Track tool calls and results
        all_tool_calls = []
        all_tool_results = {}
        iterations = 0

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
                    # Add assistant's response to messages
                    messages.append(response_message)

                    # Execute each tool call
                    for tool_call in response_message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments)

                        logger.info(f"🔧 GPT-5 calling: {tool_name}({json.dumps(tool_args)[:100]})")

                        # Execute the tool
                        result = self._execute_tool(tool_name, tool_args)
                        logger.info(f"✅ {tool_name} completed")

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

                    # Continue loop to let LLM process results
                    continue

                else:
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
                            "tokens_used": response.usage.total_tokens if response.usage else 0
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
                        {"role": "system", "content": "You are a helpful assistant. Synthesize the tool results provided into a comprehensive answer."},
                        {"role": "user", "content": synthesis_prompt}
                    ]

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

                    return {
                        "response": final_response,
                        "tool_calls": all_tool_calls,
                        "tool_results": all_tool_results,
                        "iterations": iterations,
                        "tokens_used": response.usage.total_tokens + synthesis_response.usage.total_tokens if response.usage and synthesis_response.usage else 0
                    }

            except Exception as e:
                logger.error(f"Error in LLM iteration {iterations}: {e}", exc_info=True)
                return {
                    "response": f"I encountered an error while processing your request: {str(e)}",
                    "tool_calls": all_tool_calls,
                    "tool_results": all_tool_results,
                    "iterations": iterations,
                    "error": str(e)
                }

        # Max iterations reached - PHASE 2: Synthesize with actual data
        logger.warning(f"Max iterations ({max_iterations}) reached - making final synthesis call")

        try:
            if len(all_tool_calls) == 0:
                return {
                    "response": "I wasn't able to gather enough information to answer your question.",
                    "tool_calls": [],
                    "tool_results": {},
                    "iterations": iterations,
                    "max_iterations_reached": True
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

            synthesis_prompt += f"""

Now, using ALL the information above, provide a comprehensive, well-structured answer to the user's original question: "{user_message}"

Be specific, cite data points, and synthesize the information into a coherent response."""

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

            return {
                "response": final_text or "I gathered comprehensive information but encountered an issue synthesizing the final response.",
                "tool_calls": all_tool_calls,
                "tool_results": all_tool_results,
                "iterations": iterations,
                "max_iterations_reached": True,
                "tokens_used": final_response.usage.total_tokens if final_response.usage else 0
            }
        except Exception as e:
            logger.error(f"Error in final synthesis: {e}")
            return {
                "response": "I gathered information but encountered an issue synthesizing the final response. Please try asking a more specific question.",
                "tool_calls": all_tool_calls,
                "tool_results": all_tool_results,
                "iterations": iterations,
                "max_iterations_reached": True,
                "error": str(e)
            }
