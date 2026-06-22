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
import ast
import json
import logging
from typing import Any

import pandas as pd
from google.genai import types as genai_types
from vertexai import types

logger = logging.getLogger("agent_eval")


def robust_json_loads(x: Any) -> dict | list | str | None:
    """Safely parse a JSON string, returning None for invalid or empty inputs.

    Falls back on ``ast.literal_eval`` for Python-repr forms that survive a
    CSV roundtrip (pandas writes ``{'k': 'v'}`` with single quotes; json
    rejects those but literal_eval accepts).
    """
    if x is None:
        return None
    if isinstance(x, (dict, list)):
        return x
    if not isinstance(x, str) or not x:
        return None
    try:
        return json.loads(x)
    except (json.JSONDecodeError, TypeError):
        pass
    try:
        parsed = ast.literal_eval(x)
        if isinstance(parsed, (dict, list)):
            return parsed
    except (ValueError, SyntaxError, MemoryError):
        pass
    return x


# ---------------------------------------------------------------------------
# Reference resolution
# ---------------------------------------------------------------------------

# Conventional field names for the "expected" output, ordered by how
# strongly each one signals the canonical reference. Add domain-specific
# names here as new agent patterns appear.
_REFERENCE_FIELD_PRIORITY: list[str] = [
    "expected_response",
    "expected_behavior",
    "expected_output",
    "expected_answer",
    "ground_truth",
    "reference",
    "gold_response",
]


def _stringify_reference_value(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, (dict, list)):
        try:
            return json.dumps(val, ensure_ascii=False)
        except (TypeError, ValueError):
            return str(val)
    return str(val)


def extract_reference_text(
    reference_data: Any,
    preferred_field: str | None = None,
) -> str:
    """Resolve a reference string from a reference_data dict.

    Lookup order:
      1. The explicit `preferred_field` from the metric's `reference_field` setting
      2. Any field in `_REFERENCE_FIELD_PRIORITY` that has a non-empty value
      3. Concatenate all populated string-like fields as `key: value` pairs
         so the judge model still has SOMETHING to compare against

    The dict-fallback (step 3) is what makes this resilient — users can put
    arbitrary domain-specific fields in `reference_data` (e.g. `expected_docs`,
    `expected_tool_calls`, `expected_citations`) and they will still reach
    the metric judge.
    """
    if not isinstance(reference_data, dict) or not reference_data:
        return ""

    if preferred_field:
        val = reference_data.get(preferred_field)
        text = _stringify_reference_value(val)
        if text.strip():
            return text

    for field in _REFERENCE_FIELD_PRIORITY:
        val = reference_data.get(field)
        text = _stringify_reference_value(val)
        if text.strip():
            return text

    parts: list[str] = []
    for k, v in reference_data.items():
        text = _stringify_reference_value(v)
        if text.strip():
            parts.append(f"{k}: {text}")
    return "\n".join(parts)


def reference_field_candidates() -> list[str]:
    """Return the conventional reference field names (read-only copy)."""
    return list(_REFERENCE_FIELD_PRIORITY)


def convert_interactions_to_events(val: Any, sub_agent_trace: Any = None) -> list[dict]:
    """
    Converts tool interactions and agent text responses into Vertex AI SDK Event dictionaries.

    Includes both tool events (function_call, function_response) and text response events
    from sub_agent_trace for complete conversation context.

    Returns dictionaries instead of Event objects because:
    1. Pandas DataFrames serialize Event objects to __repr__ strings when passed to SDK
    2. The SDK's _FlattenEvalDataConverter validates dicts via Event.model_validate()
    3. This ensures proper Event reconstruction on the SDK side
    """
    interactions = robust_json_loads(val)
    if not isinstance(interactions, list):
        interactions = []

    # Parse sub_agent_trace for text responses
    text_responses = []
    if sub_agent_trace:
        trace = robust_json_loads(sub_agent_trace)
        if isinstance(trace, list):
            for item in trace:
                if isinstance(item, dict) and item.get("text_response"):
                    text_responses.append(
                        {
                            "text": item["text_response"],
                            "timestamp": item.get("timestamp", 0),
                            "agent": item.get("agent_name", "model"),
                        }
                    )

    events = []

    # If we have text responses with timestamps, interleave with tool events
    # Otherwise, just process tool interactions
    if text_responses:
        # Add text responses as model events
        # Since tool_interactions don't have timestamps, add text responses first
        # then tool events (this approximates the conversation flow)
        for tr in text_responses:
            text_part = genai_types.Part.from_text(text=tr["text"])
            text_content = genai_types.Content(role="model", parts=[text_part])
            text_event = types.evals.Event(content=text_content, author="model")
            events.append(text_event.model_dump(mode="json", exclude_none=True))

    # Add tool call and response events
    for item in interactions:
        tool_name = item.get("tool_name")
        args = item.get("input_arguments", {})
        response = item.get("output_result", {})

        # Ensure args is a dict (SDK requirement)
        if not isinstance(args, dict):
            args = {"value": args} if args else {}

        # Ensure response is a dict (SDK requirement)
        if not isinstance(response, dict):
            response = {"result": response} if response else {}

        # 1. Tool Call Event (Model generated) - as dict for SDK validation
        fc_part = genai_types.Part.from_function_call(name=tool_name, args=args)
        model_content = genai_types.Content(role="model", parts=[fc_part])
        model_event = types.evals.Event(content=model_content, author="model")
        events.append(model_event.model_dump(mode="json", exclude_none=True))

        # 2. Tool Response Event (System provided) - as dict for SDK validation
        fr_part = genai_types.Part.from_function_response(
            name=tool_name, response=response
        )
        tool_content = genai_types.Content(role="tool", parts=[fr_part])
        tool_event = types.evals.Event(content=tool_content, author="tool")
        events.append(tool_event.model_dump(mode="json", exclude_none=True))

    return events


def build_conversation_history(user_inputs: Any, sub_agent_trace: Any) -> list[dict]:
    """
    Builds conversation_history for multi-turn metrics from user_inputs and sub_agent_trace.

    Returns a list of Content dicts with role (user/model) and parts.
    This is used as a fallback when conversation_history is not pre-generated.
    """
    # Parse user_inputs
    if isinstance(user_inputs, str):
        parsed_inputs = robust_json_loads(user_inputs)
        if isinstance(parsed_inputs, list):
            user_inputs = parsed_inputs
        else:
            user_inputs = [user_inputs] if user_inputs else []
    elif not isinstance(user_inputs, list):
        user_inputs = []

    # Parse sub_agent_trace
    trace = robust_json_loads(sub_agent_trace) if sub_agent_trace else []
    if not isinstance(trace, list):
        trace = []

    text_responses = [
        t.get("text_response", "")
        for t in trace
        if isinstance(t, dict) and t.get("text_response")
    ]

    conversation_history = []
    # Build conversation pairs (user input -> model response)
    # The last user input is the "prompt", so exclude it from history
    for i, user_input in enumerate(user_inputs[:-1] if len(user_inputs) > 1 else []):
        # Add user turn
        conversation_history.append(
            {"role": "user", "parts": [{"text": str(user_input)}]}
        )
        # Add corresponding model response if available
        if i < len(text_responses):
            conversation_history.append(
                {"role": "model", "parts": [{"text": text_responses[i]}]}
            )

    return conversation_history


def get_nested_value(row_val: Any, path: str) -> Any:
    """
    Retrieves a value from a nested dictionary using a dot-separated path.
    Example: path="root:state_variables.customer_profile"
    """
    # 1. Strip the root prefix (e.g., "extracted_data:")
    suffix = path.split(":", 1)[1] if ":" in path else path

    # 2. Split by dot for traversal
    parts = suffix.split(".")

    curr = row_val
    for p in parts:
        if isinstance(curr, dict):
            curr = curr.get(p)
        else:
            return None
    return curr


def map_dataset_columns(
    agent_df: pd.DataFrame,
    original_df: pd.DataFrame,
    mapping: dict[str, Any],
    metric_name: str,
    metric_tool_use_name: str = "TOOL_USE_QUALITY",
    is_managed_metric: bool = False,
) -> pd.DataFrame:
    """
    Maps columns from the raw agent DataFrame to the evaluation dataset based on the metric config.
    Handles nested JSON lookups and template formatting.

    Always adds default prompt/response columns if not explicitly mapped (SDK requires these).
    Additional columns from dataset_mapping are added for custom placeholders.
    """
    eval_dataset = pd.DataFrame(index=agent_df.index)

    SDK_LIST_FIELDS = {
        "tool_declarations",
        "conversation_history",
        "intermediate_events",
    }

    def normalize_input(x):
        if isinstance(x, list):
            if not x:
                return ""
            # Structured data (dicts) → valid JSON array
            # This handles tool_interactions, grounding context, etc.
            if any(isinstance(item, dict) for item in x):
                return json.dumps(x)
            # Simple values → newline-joined for template readability
            return "\n".join(str(item) for item in x)
        elif isinstance(x, dict):
            return json.dumps(x)
        return str(x) if x is not None else ""

    # Add default prompt/response for ALL LLM metrics
    # The SDK expects these standard columns to be present
    # Add 'prompt' if not explicitly mapped
    if "prompt" not in mapping:
        if "user_inputs" in agent_df.columns:
            inputs = agent_df["user_inputs"]
            # Normalize multi-turn lists into a single context string.
            eval_dataset["prompt"] = inputs.apply(
                lambda x: "\n".join(x)
                if isinstance(x, list)
                else str(x)
                if x is not None
                else ""
            )
        else:
            eval_dataset["prompt"] = ""

    # Add 'response' if not explicitly mapped
    if "response" not in mapping:
        response_col = None
        if "final_response" in agent_df.columns:
            response_col = agent_df["final_response"]
        elif "response" in agent_df.columns:
            response_col = agent_df["response"]
        elif "trace_summary" in agent_df.columns:
            response_col = agent_df["trace_summary"]

        if response_col is not None:
            # Convert dicts/lists to JSON strings for SDK compatibility
            def to_string(x):
                if isinstance(x, (dict, list)):
                    return json.dumps(x)
                return str(x) if x is not None else ""

            eval_dataset["response"] = response_col.apply(to_string)
        else:
            eval_dataset["response"] = ""

    for placeholder, details in mapping.items():
        if "source_column" in details:
            col_path = details["source_column"]
            transform = details.get("transform")  # e.g., "last_item"

            # 1. Try exact flattened name
            cands = [
                col_path.replace(":", "."),
                f"extracted_data.{col_path}",
                f"reference_data.{col_path}",
                col_path,
            ]
            source_col = next((c for c in cands if c in agent_df.columns), None)

            val_series = None
            if source_col:
                val_series = agent_df[source_col]
            else:
                # 2. Try nested lookup in dict columns
                root_key = col_path.split(":")[0] if ":" in col_path else None

                # First check agent_df for the root key (supports dict columns)
                if root_key and root_key in agent_df.columns:
                    val_series = agent_df[root_key].apply(
                        lambda x, col_path=col_path: get_nested_value(
                            x if isinstance(x, dict) else robust_json_loads(x), col_path
                        )
                    )
                # Then fall back to original_df
                elif root_key and root_key in original_df.columns:
                    val_series = original_df[root_key].apply(
                        lambda x, col_path=col_path: get_nested_value(
                            robust_json_loads(x), col_path
                        )
                    )

            if val_series is not None and transform == "last_item":
                # Extract last item from list (for multi-turn prompt extraction)
                def get_last_item(x):
                    if isinstance(x, list) and len(x) > 0:
                        return x[-1]
                    elif isinstance(x, str):
                        # Try parsing as JSON list
                        parsed = robust_json_loads(x)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            return parsed[-1]
                    return x if x is not None else ""

                val_series = val_series.apply(get_last_item)

            # Get default value if column not found
            default_value = details.get("default", "")

            if val_series is not None:
                # Special Case: Tool Interactions to Events
                # Agent metrics that require intermediate_events in Event format
                AGENT_METRICS_REQUIRING_EVENTS = {
                    "TOOL_USE_QUALITY",
                    "FINAL_RESPONSE_QUALITY",
                    "HALLUCINATION",
                    "tool_use_quality",
                    "final_response_quality",
                    "hallucination",
                    "agent_tool_use_quality",
                    "agent_hallucination",
                }
                is_agent_metric = metric_name.upper().replace("AGENT_", "") in {
                    m.upper().replace("AGENT_", "")
                    for m in AGENT_METRICS_REQUIRING_EVENTS
                }
                is_event_col = placeholder in ["intermediate_events", "tool_usage"]

                if is_agent_metric and is_event_col:
                    # Get sub_agent_trace for text response events
                    sub_agent_trace_series = None
                    if "extracted_data.sub_agent_trace" in agent_df.columns:
                        sub_agent_trace_series = agent_df[
                            "extracted_data.sub_agent_trace"
                        ]
                    elif "extracted_data" in original_df.columns:
                        sub_agent_trace_series = original_df["extracted_data"].apply(
                            lambda x: get_nested_value(
                                robust_json_loads(x), "extracted_data:sub_agent_trace"
                            )
                        )

                    if sub_agent_trace_series is not None:
                        # Pass both tool_interactions and sub_agent_trace
                        eval_dataset[placeholder] = pd.DataFrame(
                            {"tools": val_series, "trace": sub_agent_trace_series}
                        ).apply(
                            lambda row: convert_interactions_to_events(
                                row["tools"], row["trace"]
                            ),
                            axis=1,
                        )
                    else:
                        eval_dataset[placeholder] = val_series.apply(
                            convert_interactions_to_events
                        )
                else:
                    # Special handling for fields that need to stay as lists/objects
                    # These are passed directly to the SDK without string conversion
                    # Note: "history" is NOT included here - it needs to be converted to string
                    # for MULTI_TURN_CHAT_QUALITY template substitution ({history} placeholder)
                    if placeholder in SDK_LIST_FIELDS:
                        # Keep as list/object - SDK expects these as proper structures
                        def parse_if_needed(x):
                            if isinstance(x, str):
                                parsed = robust_json_loads(x)
                                return parsed if parsed is not None else []
                            return x if x is not None else []

                        eval_dataset[placeholder] = val_series.apply(parse_if_needed)
                    else:
                        # Robust Flattening for custom placeholders (Templates need strings)
                        eval_dataset[placeholder] = val_series.apply(normalize_input)
            else:
                # Column not found - check for special fallback cases
                if placeholder in ("conversation_history", "history"):
                    # Build conversation_history on-the-fly from user_inputs and sub_agent_trace
                    logger.info(
                        f"Building {placeholder} on-the-fly (column not found in processed data)"
                    )
                    user_inputs_series = agent_df.get(
                        "user_inputs", pd.Series([""] * len(agent_df))
                    )

                    # Get sub_agent_trace
                    sub_agent_trace_series = None
                    if "extracted_data.sub_agent_trace" in agent_df.columns:
                        sub_agent_trace_series = agent_df[
                            "extracted_data.sub_agent_trace"
                        ]
                    elif "extracted_data" in original_df.columns:
                        sub_agent_trace_series = original_df["extracted_data"].apply(
                            lambda x: get_nested_value(
                                robust_json_loads(x), "extracted_data:sub_agent_trace"
                            )
                        )

                    if sub_agent_trace_series is not None:
                        val_series = pd.DataFrame(
                            {
                                "inputs": user_inputs_series,
                                "trace": sub_agent_trace_series,
                            }
                        ).apply(
                            lambda row: build_conversation_history(
                                row["inputs"], row["trace"]
                            ),
                            axis=1,
                        )
                    else:
                        # No sub_agent_trace available, use empty history
                        val_series = pd.Series([[]] * len(agent_df))

                    if placeholder in SDK_LIST_FIELDS:
                        eval_dataset[placeholder] = val_series
                    else:
                        eval_dataset[placeholder] = val_series.apply(normalize_input)
                else:
                    # Use default value for other columns
                    logger.debug(
                        f"Column '{col_path}' not found for placeholder '{placeholder}', using default: '{default_value}'"
                    )
                    eval_dataset[placeholder] = default_value

        elif "template" in details:

            def format_template(row, details=details):
                template_vars = {}
                source_cols = details.get("source_columns", [])
                for sc in source_cols:
                    cands = [
                        sc.replace(":", "."),
                        f"extracted_data.{sc}",
                        f"reference_data.{sc}",
                        sc,
                    ]
                    found_sc = next(
                        (c for c in cands if c in row.index and row[c] is not None),
                        None,
                    )
                    val = row[found_sc] if found_sc else ""
                    # Serialize structured data to JSON for readable template output
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    template_vars[sc.replace(":", "_")] = val
                return (
                    details["template"].format(**template_vars)
                    if template_vars
                    else details["template"]
                )

            eval_dataset[placeholder] = agent_df.apply(format_template, axis=1)

    return eval_dataset
