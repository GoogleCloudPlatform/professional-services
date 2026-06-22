# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
Deterministic metrics for evaluating agent execution success.

These metrics provide objective pass/fail measurements by analyzing trace data
and session state, without requiring LLM-as-judge evaluation.
"""

import json
from typing import Any

# Pricing per 1K tokens (standard tier, prompts <= 200k tokens)
# Format: {model_substring: (input_price_per_1k, output_price_per_1k)}
# Source: https://cloud.google.com/vertex-ai/generative-ai/pricing (April 2026)
MODEL_PRICING = {
    # Gemini 3.1 (Current)
    "gemini-3.1-pro": (0.002, 0.012),  # $2.00 / $12.00 per 1M
    "gemini-3.1-flash-lite": (0.00025, 0.0015),  # $0.25 / $1.50 per 1M
    # Gemini 3 (Flash still active, Pro shut down 2026-03-09)
    "gemini-3-flash": (0.0005, 0.003),  # $0.50 / $3.00 per 1M
    "gemini-3-pro": (0.002, 0.012),  # $2.00 / $12.00 per 1M (legacy)
    # Gemini 2.5 (sunsetting 2026-06-17)
    "gemini-2.5-pro": (0.00125, 0.01),  # $1.25 / $10.00 per 1M
    "gemini-2.5-flash": (0.0003, 0.0025),  # $0.30 / $2.50 per 1M
    # Gemini 2.0 (deprecated, sunsetting 2026-06-01)
    "gemini-2.0-flash": (0.00015, 0.0006),  # $0.15 / $0.60 per 1M
    "default": (0.0005, 0.003),  # Fallback to Flash-tier pricing
}


def calculate_token_usage(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Informational metric: Track token usage and estimated cost based on the specific model used.
    """
    total_prompt_tokens = 0
    total_completion_tokens = 0
    total_cached_tokens = 0
    total_tokens = 0
    llm_calls = 0
    total_cost = 0.0
    models_used = set()

    if not session_trace:
        return 0.0, "No trace data available for token usage calculation", {}

    for span in session_trace:
        attributes = span.get("attributes", {})

        # Identify model (handle None values)
        model_name = attributes.get("gen_ai.request.model") or "default"
        model_name = model_name.lower() if isinstance(model_name, str) else "default"

        # Check for LLM response with usage metadata
        llm_response = attributes.get("gcp.vertex.agent.llm_response")
        if llm_response:
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                usage = response_data.get("usage_metadata", {})

                if usage:
                    llm_calls += 1
                    models_used.add(model_name)

                    p_tokens = usage.get("prompt_token_count") or 0
                    c_tokens = usage.get("candidates_token_count") or 0
                    ch_tokens = usage.get("cached_content_token_count") or 0
                    t_tokens = usage.get("total_token_count") or 0

                    total_prompt_tokens += p_tokens
                    total_completion_tokens += c_tokens
                    total_cached_tokens += ch_tokens
                    # Some models report 0 for total_token_count;
                    # fall back to prompt + completion when that happens
                    total_tokens += t_tokens if t_tokens else (p_tokens + c_tokens)

                    # Match model pricing
                    pricing = MODEL_PRICING["default"]
                    for known_model, prices in MODEL_PRICING.items():
                        if known_model in model_name:
                            pricing = prices
                            break

                    # Cost calculation (simplified: ignoring cache discount for now to keep it safe upper bound,
                    # or strictly following list price for active tokens)
                    call_cost = (p_tokens / 1000 * pricing[0]) + (
                        c_tokens / 1000 * pricing[1]
                    )
                    # Note: Cached tokens usually have a separate (lower) pricing tier.
                    # For this metric, we currently only sum cost for active prompt/completion tokens.

                    total_cost += call_cost

            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    explanation = (
        f"Usage: {llm_calls} LLM calls using {list(models_used)}. "
        f"Tokens: {total_tokens} ({total_prompt_tokens}p + {total_completion_tokens}c + {total_cached_tokens}ch). "
        f"Cost: ${total_cost:.6f}"
    )

    details = {
        "llm_calls": llm_calls,
        "models_used": list(models_used),
        "total_tokens": total_tokens,
        "prompt_tokens": total_prompt_tokens,
        "completion_tokens": total_completion_tokens,
        "cached_tokens": total_cached_tokens,
        "estimated_cost_usd": total_cost,
    }

    return total_cost, explanation, details


def calculate_latency_metrics(
    session_trace: list[dict[str, Any]],
    latency_data: list[dict[str, Any]] | None = None,
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate latency metrics from the session trace.
    Returns the total latency score (seconds), but details contains granular breakdown.
    """
    total_latency = 0.0
    llm_latency = 0.0
    tool_latency = 0.0
    first_response_latency = None
    average_turn_latency = 0.0

    if not session_trace:
        return 0.0, "No trace data available for latency calculation", {}

    # Sort spans by start time to find the true beginning
    sorted_spans = sorted(
        [s for s in session_trace if s.get("start_time") is not None],
        key=lambda x: x["start_time"],
    )

    if not sorted_spans:
        return 0.0, "Trace data has no timestamps", {}

    root_start = sorted_spans[0]["start_time"]

    # Calculate Component Latencies from full trace
    max_end = 0
    for span in session_trace:
        start = span.get("start_time", 0)
        end = span.get("end_time", 0)
        max_end = max(max_end, end)
        duration = (end - start) / 1e9
        name = span.get("name", "")

        if name == "call_llm":
            llm_latency += duration
            # Proxy for Time to First Token: end of first LLM call
            if first_response_latency is None:
                first_response_latency = (end - root_start) / 1e9

        elif "tool_call" in name or "execute_tool" in name:
            tool_latency += duration

    # Calculate Total & Average Latency from high-level summary (latency_data)
    # This is preferred as it excludes user think time in multi-turn sessions.
    if latency_data:
        turn_latencies = []
        for item in latency_data:
            if item.get("name") == "invocation":
                turn_latencies.append(item.get("duration_seconds", 0))

        if turn_latencies:
            average_turn_latency = sum(turn_latencies) / len(turn_latencies)
            total_latency = sum(turn_latencies)

    # Fallback: Wall-clock duration from trace if latency_data is missing
    if total_latency == 0.0 and max_end > root_start:
        total_latency = (max_end - root_start) / 1e9  # nanoseconds to seconds

    explanation = (
        f"Total: {total_latency:.4f}s. "
        f"Avg Turn: {average_turn_latency:.4f}s. "
        f"LLM: {llm_latency:.4f}s, Tools: {tool_latency:.4f}s. "
        f"First Response: {first_response_latency if first_response_latency else 0:.4f}s"
    )

    details = {
        "total_latency_seconds": total_latency,
        "average_turn_latency_seconds": average_turn_latency,
        "llm_latency_seconds": llm_latency,
        "tool_latency_seconds": tool_latency,
        "time_to_first_response_seconds": first_response_latency,
    }

    return total_latency, explanation, details


def calculate_cache_efficiency(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate the efficiency of context caching.
    Returns the cache hit rate (percentage of potential prompt tokens that were cached).
    """
    total_prompt_tokens = 0
    total_cached_tokens = 0

    if not session_trace:
        return 0.0, "No trace data available for cache efficiency", {}

    for span in session_trace:
        attributes = span.get("attributes", {})
        llm_response = attributes.get("gcp.vertex.agent.llm_response")
        if llm_response:
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                usage = response_data.get("usage_metadata", {})
                if usage:
                    total_prompt_tokens += usage.get("prompt_token_count", 0)
                    total_cached_tokens += usage.get("cached_content_token_count", 0)
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    # Calculate hit rate
    # Note: 'prompt_token_count' in Gemini API usage metadata usually EXCLUDES cached tokens.
    # So total potential input = prompt_token_count + cached_content_token_count
    total_input_tokens = total_prompt_tokens + total_cached_tokens

    if total_input_tokens > 0:
        cache_hit_rate = total_cached_tokens / total_input_tokens
    else:
        cache_hit_rate = 0.0

    explanation = (
        f"Cache Hit Rate: {cache_hit_rate:.2%}. "
        f"Cached Tokens: {total_cached_tokens}. "
        f"Fresh Prompt Tokens: {total_prompt_tokens}."
    )

    details = {
        "cache_hit_rate": cache_hit_rate,
        "total_cached_tokens": total_cached_tokens,
        "total_fresh_prompt_tokens": total_prompt_tokens,
        "total_input_tokens": total_input_tokens,
    }

    return cache_hit_rate, explanation, details


def calculate_thinking_metrics(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate metrics related to the model's 'thinking' or reasoning process.
    Returns the reasoning ratio (thinking tokens / total output tokens).
    """
    total_thinking_tokens = 0
    total_candidate_tokens = 0
    turns_with_thinking = 0

    if not session_trace:
        return 0.0, "No trace data available for thinking metrics", {}

    for span in session_trace:
        attributes = span.get("attributes", {})
        llm_response = attributes.get("gcp.vertex.agent.llm_response")
        if llm_response:
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                usage = response_data.get("usage_metadata", {})
                if usage:
                    thoughts = usage.get("thoughts_token_count", 0)
                    # Note: In some API versions, candidates_token_count might exclude thoughts.
                    # We treat them as additive components of the total output.
                    candidates = usage.get("candidates_token_count", 0)

                    total_thinking_tokens += thoughts
                    total_candidate_tokens += candidates

                    if thoughts > 0:
                        turns_with_thinking += 1
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    total_output_tokens = total_thinking_tokens + total_candidate_tokens

    if total_output_tokens > 0:
        reasoning_ratio = total_thinking_tokens / total_output_tokens
    else:
        reasoning_ratio = 0.0

    explanation = (
        f"Reasoning Ratio: {reasoning_ratio:.2%}. "
        f"Thinking Tokens: {total_thinking_tokens}. "
        f"Standard Output Tokens: {total_candidate_tokens}. "
        f"Turns with Thinking: {turns_with_thinking}."
    )

    details = {
        "reasoning_ratio": reasoning_ratio,
        "total_thinking_tokens": total_thinking_tokens,
        "total_candidate_tokens": total_candidate_tokens,
        "total_output_tokens": total_output_tokens,
        "turns_with_thinking": turns_with_thinking,
    }

    return reasoning_ratio, explanation, details


def calculate_tool_utilization(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate statistics on tool usage frequency and diversity.
    Returns the total number of tool calls.
    """
    total_tool_calls = 0
    tool_counts = {}

    if not session_trace:
        return 0.0, "No trace data available for tool utilization", {}

    for span in session_trace:
        name = span.get("name", "")

        # Check for tool execution spans.
        # Standard ADK traces often use "execute_tool <ToolName>"
        if name.startswith("execute_tool ") or "tool_call" in name:
            tool_name = "unknown"
            if name.startswith("execute_tool "):
                tool_name = name.replace("execute_tool ", "").strip()
            elif "gen_ai.tool.name" in span.get("attributes", {}):
                tool_name = span["attributes"]["gen_ai.tool.name"]
            elif "tool.name" in span.get("attributes", {}):
                tool_name = span["attributes"]["tool.name"]

            total_tool_calls += 1
            tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1

    unique_tools_used = len(tool_counts)

    # Create a string representation of the tool breakdown
    breakdown_str = ", ".join([f"{k}: {v}" for k, v in tool_counts.items()])

    explanation = (
        f"Total Tool Calls: {total_tool_calls}. "
        f"Unique Tools: {unique_tools_used}. "
        f"Breakdown: [{breakdown_str}]"
    )

    details = {
        "total_tool_calls": total_tool_calls,
        "unique_tools_used": unique_tools_used,
        "tool_counts": tool_counts,
    }

    return float(total_tool_calls), explanation, details


def calculate_tool_success_rate(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate the success rate of tool executions by inspecting tool responses.
    Returns success rate (successful / total) as score.
    """
    total_calls = 0
    failed_calls = 0
    failed_tools = []

    if not session_trace:
        return 0.0, "No trace data available for tool success rate", {}

    for span in session_trace:
        name = span.get("name", "")
        attributes = span.get("attributes", {})

        # Identify tool execution spans
        is_tool = name.startswith("execute_tool ") or "tool_call" in name

        if is_tool:
            tool_response_str = attributes.get("gcp.vertex.agent.tool_response")
            if tool_response_str:
                total_calls += 1
                try:
                    # Parse the JSON response to check status
                    response = json.loads(tool_response_str)

                    # Common error patterns in ADK/JSON tools
                    is_error = False
                    if isinstance(response, dict) and (
                        response.get("status") == "error"
                        or "error" in response
                        or "error_message" in response
                    ):
                        is_error = True

                    if is_error:
                        failed_calls += 1
                        tool_name = name.replace("execute_tool ", "").strip()
                        failed_tools.append(tool_name)

                except (json.JSONDecodeError, TypeError):
                    # Malformed JSON in response could be considered a failure or ignored
                    pass

    if total_calls > 0:
        success_rate = (total_calls - failed_calls) / total_calls
    else:
        # If no tools were called, success rate is technically N/A, but 1.0 is a safe "no errors" default
        # Or 0.0 if we want to imply "no success possible".
        # For evaluation, 1.0 (no failures) usually makes more sense if no tools were attempted.
        # But to distinguish from "perfect execution", let's return 1.0 but note it.
        success_rate = 1.0

    explanation = (
        f"Success Rate: {success_rate:.2%}. "
        f"Total Calls: {total_calls}. "
        f"Failed Calls: {failed_calls}. "
        f"Failed Tools: {list(set(failed_tools))}"
    )

    details = {
        "tool_success_rate": success_rate,
        "total_tool_calls": total_calls,
        "failed_tool_calls": failed_calls,
        "failed_tools_list": failed_tools,
    }

    return success_rate, explanation, details


def calculate_grounding_utilization(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate the extent of grounding usage by inspecting LLM responses for groundingMetadata.
    Returns total grounding chunks (citations) as the score.
    """
    total_grounded_responses = 0
    total_grounding_chunks = 0
    total_llm_responses = 0

    if not session_trace:
        return 0.0, "No trace data available for grounding utilization", {}

    for span in session_trace:
        attributes = span.get("attributes", {})
        llm_response = attributes.get("gcp.vertex.agent.llm_response")

        if llm_response:
            total_llm_responses += 1
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                # Grounding metadata is usually at the top level or inside candidates
                # Standard Vertex AI response structure check
                grounding_metadata = response_data.get(
                    "groundingMetadata"
                ) or response_data.get("grounding_metadata")

                if not grounding_metadata:
                    # Check inside candidates if not at top level
                    candidates = response_data.get("candidates", [])
                    if candidates and isinstance(candidates, list):
                        first_candidate = candidates[0]
                        grounding_metadata = first_candidate.get(
                            "groundingMetadata"
                        ) or first_candidate.get("grounding_metadata")

                if grounding_metadata:
                    chunks = grounding_metadata.get(
                        "groundingChunks"
                    ) or grounding_metadata.get("grounding_chunks")
                    if chunks and isinstance(chunks, list) and len(chunks) > 0:
                        total_grounded_responses += 1
                        total_grounding_chunks += len(chunks)

            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    explanation = (
        f"Total Citations (Chunks): {total_grounding_chunks}. "
        f"Grounded Responses: {total_grounded_responses} / {total_llm_responses}."
    )

    details = {
        "total_grounding_chunks": total_grounding_chunks,
        "total_grounded_responses": total_grounded_responses,
        "total_llm_responses": total_llm_responses,
    }

    return float(total_grounding_chunks), explanation, details


def calculate_context_saturation(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate the maximum context saturation (max total tokens used in a single turn).
    Returns max_tokens as the score.
    """
    max_tokens = 0
    max_token_span = ""

    if not session_trace:
        return 0.0, "No trace data available for context saturation", {}

    for span in session_trace:
        attributes = span.get("attributes", {})
        llm_response = attributes.get("gcp.vertex.agent.llm_response")
        if llm_response:
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                usage = response_data.get("usage_metadata", {})
                if usage:
                    total = usage.get("total_token_count", 0)
                    if total > max_tokens:
                        max_tokens = total
                        max_token_span = span.get("name", "unknown")
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    explanation = (
        f"Max Context Used: {max_tokens} tokens. Peak occurred in: {max_token_span}."
    )

    details = {"max_total_tokens": max_tokens, "peak_usage_span": max_token_span}

    return float(max_tokens), explanation, details


def calculate_agent_handoffs(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Count the number of agent handoffs/invocations in the session.
    Returns total handoff events as the score.

    Captures:
    - Direct agent invocations (invoke_agent, agent_run)
    - Sub-agents called as tools (execute_tool *Agent, transfer_to_agent)
    """
    handoff_count = 0
    agents_invoked = set()

    if not session_trace:
        return 0.0, "No trace data available for agent handoffs", {}

    for span in session_trace:
        name = span.get("name", "")

        # Check for direct agent invocations
        if name.startswith(("invoke_agent ", "agent_run ")):
            agent_name = (
                name.replace("invoke_agent ", "").replace("agent_run ", "").strip()
            )
            handoff_count += 1
            agents_invoked.add(agent_name)

        # Check for sub-agents called as tools (e.g., "execute_tool IntakeAgent")
        elif name.startswith("execute_tool "):
            tool_name = name.replace("execute_tool ", "").strip()
            # Sub-agents typically end with "Agent" or are transfer_to_agent
            if tool_name.endswith("Agent") or tool_name == "transfer_to_agent":
                handoff_count += 1
                agents_invoked.add(tool_name)

    explanation = (
        f"Total Handoffs: {handoff_count}. "
        f"Unique Agents: {len(agents_invoked)}. "
        f"Agents: {list(agents_invoked)}"
    )

    details = {
        "total_handoffs": handoff_count,
        "unique_agents_count": len(agents_invoked),
        "agents_invoked_list": list(agents_invoked),
    }

    return float(handoff_count), explanation, details


def calculate_output_density(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Calculate the average number of output tokens per LLM call.
    Returns average output tokens as the score.
    """
    total_output_tokens = 0
    llm_calls = 0

    if not session_trace:
        return 0.0, "No trace data available for output density", {}

    for span in session_trace:
        attributes = span.get("attributes", {})

        # Check for LLM response with usage metadata
        llm_response = attributes.get("gcp.vertex.agent.llm_response")
        if llm_response:
            try:
                response_data = (
                    json.loads(llm_response)
                    if isinstance(llm_response, str)
                    else llm_response
                )
                usage = response_data.get("usage_metadata", {})

                # Check for output tokens in standard fields (candidates_token_count or output_token_count)
                output_tokens = 0
                if usage:
                    # 'candidates_token_count' is standard in Vertex AI
                    output_tokens = usage.get("candidates_token_count", 0)
                    if output_tokens == 0:
                        # Fallback for other providers
                        output_tokens = usage.get("output_token_count", 0) or usage.get(
                            "completion_tokens", 0
                        )

                if (
                    output_tokens > 0 or usage
                ):  # Count the call even if 0 output (edge case)
                    llm_calls += 1
                    total_output_tokens += output_tokens

            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    average_output_tokens = total_output_tokens / llm_calls if llm_calls > 0 else 0.0

    explanation = (
        f"Avg Output Tokens: {average_output_tokens:.2f}. "
        f"Total Output Tokens: {total_output_tokens}. "
        f"LLM Calls: {llm_calls}."
    )

    details = {
        "average_output_tokens": average_output_tokens,
        "total_output_tokens": total_output_tokens,
        "llm_calls_count": llm_calls,
    }

    return float(average_output_tokens), explanation, details


def calculate_sandbox_usage(
    session_trace: list[dict[str, Any]],
) -> tuple[float, str, dict[str, Any]]:
    """
    Count the number of tool calls related to sandbox/file system operations.
    Returns the total count as the score.
    """
    sandbox_ops_count = 0
    sandbox_tools_used = {}

    # Common keywords for sandbox/file operations
    sandbox_keywords = [
        "save_artifact",
        "load_artifact",
        "read_file",
        "write_file",
        "run_python_script",
        "execute_code",
        "save_to_file",
        "read_from_file",
    ]

    if not session_trace:
        return 0.0, "No trace data available for sandbox usage", {}

    for span in session_trace:
        name = span.get("name", "")

        # Check for tool execution spans
        if name.startswith("execute_tool ") or "tool_call" in name:
            tool_name = "unknown"
            if name.startswith("execute_tool "):
                tool_name = name.replace("execute_tool ", "").strip()
            elif "gen_ai.tool.name" in span.get("attributes", {}):
                tool_name = span["attributes"]["gen_ai.tool.name"]
            elif "tool.name" in span.get("attributes", {}):
                tool_name = span["attributes"]["tool.name"]

            # Check if tool matches sandbox keywords
            if any(keyword in tool_name.lower() for keyword in sandbox_keywords):
                sandbox_ops_count += 1
                sandbox_tools_used[tool_name] = sandbox_tools_used.get(tool_name, 0) + 1

    unique_ops_used = len(sandbox_tools_used)

    breakdown_str = ", ".join([f"{k}: {v}" for k, v in sandbox_tools_used.items()])

    explanation = (
        f"Total Sandbox Ops: {sandbox_ops_count}. "
        f"Unique Ops: {unique_ops_used}. "
        f"Breakdown: [{breakdown_str}]"
    )

    details = {
        "total_sandbox_ops": sandbox_ops_count,
        "unique_ops_used": unique_ops_used,
        "sandbox_tools_used": sandbox_tools_used,
    }

    return float(sandbox_ops_count), explanation, details


# Registry of all deterministic metrics
DETERMINISTIC_METRICS = {
    "token_usage": calculate_token_usage,
    "latency_metrics": calculate_latency_metrics,
    "cache_efficiency": calculate_cache_efficiency,
    "thinking_metrics": calculate_thinking_metrics,
    "tool_utilization": calculate_tool_utilization,
    "tool_success_rate": calculate_tool_success_rate,
    "grounding_utilization": calculate_grounding_utilization,
    "context_saturation": calculate_context_saturation,
    "agent_handoffs": calculate_agent_handoffs,
    "output_density": calculate_output_density,
    "sandbox_usage": calculate_sandbox_usage,
}


def evaluate_deterministic_metrics(
    session_state: dict[str, Any],
    session_trace: list[dict[str, Any]],
    agents_evaluated: list[str],
    question_metadata: dict[str, Any],
    metrics_to_run: list[str] | None = None,
    reference_data: dict[str, Any] | None = None,
    metric_definitions: dict[str, Any] | None = None,
    latency_data: list[dict[str, Any]] | None = None,
) -> dict[str, dict[str, Any]]:
    """
    Evaluate all specified deterministic metrics.
    """
    if metrics_to_run is None:
        metrics_to_run = list(DETERMINISTIC_METRICS.keys())

    results = {}
    for metric_name in metrics_to_run:
        if metric_name not in DETERMINISTIC_METRICS:
            continue

        metric_func = DETERMINISTIC_METRICS[metric_name]

        try:
            if metric_name == "latency_metrics":
                score, explanation, details = metric_func(
                    session_trace, latency_data=latency_data
                )
            else:
                score, explanation, details = metric_func(session_trace)

            results[metric_name] = {
                "score": score,
                "explanation": explanation,
                "details": details,
            }
        except Exception as e:
            results[metric_name] = {
                "score": 0.0,
                "explanation": f"Error evaluating metric {metric_name}: {e!s}",
            }

    return results
