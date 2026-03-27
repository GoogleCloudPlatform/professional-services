# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

"""
This module allows users to define custom Python functions (tools) that the Agent can invoke.
Any function decorated with `@tool` will be automatically exposed to the Gemini model.
"""

from typing import Callable

# Registry to hold the tool definitions and implementations
REGISTRY = {}


def tool(func: Callable):
    """
    Decorator to register a function as a tool for the Agent.
    """
    REGISTRY[func.__name__] = func
    return func


def get_available_custom_tools():
    """
    Returns the dictionary of registered custom tools.
    """
    return REGISTRY


@tool
def search_browser_state(query: str, context_lines: int = 5) -> str:
    """
    [DEPRECATED] Search the recently captured browser state for a keyword.
    NOTE: Users should prefer setting 'reflection_strategy: INJECT' in benchmark YAML
    which automatically provides relevant context without requiring a tool call.

    Args:
        query: The string to search for (case-insensitive).
        context_lines: Number of lines before and after the match to include (default 5).
    """
    import os

    run_dir = os.environ.get("RUN_DIR", "/tmp")
    file_path = os.path.join(run_dir, "browser_state.json")
    if not os.path.exists(file_path):
        return f"Error: No recent browser state capture found at {file_path}. The state is only captured after repeated failures."

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.splitlines()
        query = query.lower()

        matches = []
        for i, line in enumerate(lines):
            if query in line.lower():
                matches.append(i)

        if not matches:
            return f"No matches found for {query} in the current browser state."

        # Extract matches with context, avoiding overlaps
        results = []
        last_end = -1

        for i, match_idx in enumerate(matches):
            start = max(0, match_idx - context_lines)
            end = min(len(lines), match_idx + context_lines + 1)

            # If this overlaps with the previous match, just extend the previous block
            if start <= last_end:
                if results and results[-1] == "...\n":
                    results.pop()
                start = last_end
            else:
                if i > 0:
                    results.append("...\n")
                results.append(f"--- Match {i + 1} ---\n")

            for j in range(start, end):
                prefix = "> " if j == match_idx else "  "
                results.append(f"{prefix}{lines[j]}\n")

            last_end = end

            # Limit total output to avoid token bloat even from search
            if len("".join(results)) > 4000:
                results.append(
                    "...[TRUNCATED: Too many matches. Try a more specific query.]\n"
                )
                break

        return "".join(results)

    except Exception as e:
        return f"Failed to search browser state: {e}"


@tool
def finish(status: str, result_data: dict = None) -> str:
    """
    Signals that the agent has completed its task or encountered an insurmountable error.

    This is the explicitly designated mechanism for terminating the execution loop. It must be called
    when the final objective has been achieved, or when the agent determines it cannot proceed.

    Args:
        status: The final outcome of the task. Must be exactly "success" or "error".
        result_data: An optional dictionary containing the final extracted data or error details.
                     For example: {"shipment_plan_id": "123"} or {"error_reason": "Timeout"}.

    Returns:
        A structured string read by the core execution loop to gracefully terminate.
    """
    import json

    if status not in ("success", "error"):
        return "Error: Invalid status. Must be exactly 'success' or 'error'."

    try:
        # Ensure result_data is serializable to prevent runtime exceptions in the tool response
        data_str = json.dumps(result_data) if result_data else "{}"
        return f"TASK_FINISHED_{status.upper()}: {data_str}"
    except (TypeError, ValueError) as e:
        return f"Error: result_data could not be serialized to JSON. {e}"


@tool
def double_click_at(x: int, y: int) -> str:
    """
    Double clicks at the specified x, y coordinates (0-1000 scale).
    """
    pass
