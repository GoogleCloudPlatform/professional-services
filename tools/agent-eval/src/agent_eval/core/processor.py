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
import asyncio
import json
import logging
from typing import Any

import pandas as pd

from agent_eval.core.agent_client import AgentClient

logger = logging.getLogger("agent_eval.processor")


async def enrich_single_interaction(
    row: pd.Series, results_dir: str | None = None, skip_traces: bool = False
) -> pd.Series:
    """
    Enriches a single interaction row with session state and trace data.
    """
    # Create a copy to avoid SettingWithCopy warnings if row is part of a dataframe slice
    row = row.copy()

    session_id = row["session_id"]

    # Skip processing if session_id is missing (failed interaction)
    if pd.isna(session_id) or not session_id:
        row["missing_information"] = json.dumps(
            {"boolean": True, "details": "No session ID"}
        )
        return row

    base_url = row["base_url"]
    app_name = row["app_name"]
    user_id = row["ADK_USER_ID"]

    row["missing_information"] = json.dumps({"boolean": False})

    try:
        # Check previous status
        status_str = row.get("status", "{}")
        # Handle potential single quotes from string representation
        if isinstance(status_str, str):
            status_str = status_str.replace("'", '"')
        status = json.loads(status_str)

        if status.get("boolean") == "failed":
            row["missing_information"] = json.dumps(
                {"boolean": True, "details": "Interaction marked as failed"}
            )
            return row

        agent_client = AgentClient(
            base_url=base_url, app_name=app_name, user_id=user_id
        )

        # 1. Get Final Session State
        final_session_state = await asyncio.to_thread(
            agent_client.get_session_state, session_id
        )
        row["final_session_state"] = json.dumps(final_session_state)

        # 2. Get Session Trace (optional)
        session_trace = None
        if not skip_traces:
            try:
                session_trace = await asyncio.to_thread(
                    agent_client.get_session_trace, session_id
                )
            except RuntimeError as e:
                logger.warning("Could not retrieve trace for %s: %s", session_id, e)

        # 3. Process Trace Data
        if not session_trace:
            if not skip_traces:
                row["missing_information"] = json.dumps(
                    {"boolean": True, "details": "Trace missing"}
                )
            row["latency_data"] = None
            row["trace_summary"] = None
            row["session_trace"] = None
        else:
            analyzed_trace = AgentClient.analyze_trace_and_extract_spans(session_trace)
            row["latency_data"] = json.dumps(
                AgentClient.get_latency_from_spans(analyzed_trace)
            )
            row["trace_summary"] = json.dumps(
                AgentClient.get_agent_trajectory(analyzed_trace)
            )
            row["session_trace"] = json.dumps(session_trace)

        # 4. Extract Derived Data
        extracted_data = {
            "state_variables": {},
            "tool_interactions": [],
            "sub_agent_trace": [],
        }

        # State Variables
        state = final_session_state.get("state", {})
        if state:
            extracted_data["state_variables"] = state
            # Flatten for easy access (legacy support)
            extracted_data.update(state)

        # Tool Interactions
        extracted_data["tool_interactions"] = AgentClient.get_tool_interactions(
            final_session_state
        )

        # Sub-agent Trace (Text)
        sub_agent_trace = AgentClient.get_sub_agent_trace(final_session_state)
        extracted_data["sub_agent_trace"] = sub_agent_trace

        # Build conversation_history for multi-turn metrics
        # Format: List of Content dicts with role (user/model) and parts
        user_inputs = row.get("user_inputs", [])
        if isinstance(user_inputs, str):
            try:
                user_inputs = json.loads(user_inputs)
            except (json.JSONDecodeError, TypeError):
                user_inputs = [user_inputs] if user_inputs else []

        conversation_history = []
        # Interleave user inputs and model responses
        # sub_agent_trace has: {"text_response": "...", "agent_name": "...", "timestamp": ...}
        text_responses = [
            t.get("text_response", "")
            for t in sub_agent_trace
            if t.get("text_response")
        ]

        # Build conversation pairs (user input -> model response)
        # The last user input is the "prompt", so exclude it from history
        for i, user_input in enumerate(
            user_inputs[:-1] if len(user_inputs) > 1 else []
        ):
            # Add user turn
            conversation_history.append(
                {"role": "user", "parts": [{"text": user_input}]}
            )
            # Add corresponding model response if available
            if i < len(text_responses):
                conversation_history.append(
                    {"role": "model", "parts": [{"text": text_responses[i]}]}
                )

        extracted_data["conversation_history"] = conversation_history

        row["extracted_data"] = json.dumps(extracted_data)

        # Extract final_response (last agent text response) for response_correctness metric
        final_response = ""
        if sub_agent_trace:
            for turn in reversed(sub_agent_trace):
                if turn.get("text_response"):
                    final_response = turn["text_response"]
                    break
        row["final_response"] = final_response

        # Build Gemini batch format for SDK auto-parsing (required for managed metrics)
        # Build contents from user_inputs and text_responses
        contents = []
        for i, user_input in enumerate(user_inputs):
            contents.append({"role": "user", "parts": [{"text": user_input}]})
            if i < len(text_responses):
                contents.append(
                    {"role": "model", "parts": [{"text": text_responses[i]}]}
                )

        row["request"] = json.dumps({"contents": contents})
        row["response"] = json.dumps(
            {
                "candidates": [
                    {"content": {"role": "model", "parts": [{"text": final_response}]}}
                ]
            }
        )

    except Exception as e:
        logger.error("Error enriching session %s: %s", session_id, e)
        row["missing_information"] = json.dumps({"boolean": True, "details": str(e)})
        # Ensure columns exist even on error
        for col in [
            "final_session_state",
            "session_trace",
            "latency_data",
            "extracted_data",
        ]:
            if col not in row:
                row[col] = None

    return row


class InteractionProcessor:
    """
    Orchestrates the enrichment of interaction logs with traces and state.
    """

    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.results_dir = config.get("results_dir")
        self.skip_traces = config.get("skip_traces", False)

    async def process(self, interaction_df: pd.DataFrame) -> pd.DataFrame:
        logger.debug("Processing %d interactions...", len(interaction_df))
        if self.skip_traces:
            logger.debug("Skipping trace retrieval.")

        tasks = [
            enrich_single_interaction(row, self.results_dir, self.skip_traces)
            for _, row in interaction_df.iterrows()
        ]

        enriched_rows = await asyncio.gather(*tasks)
        return pd.DataFrame(enriched_rows)
