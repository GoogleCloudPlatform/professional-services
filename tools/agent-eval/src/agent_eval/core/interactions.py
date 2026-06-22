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
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from agent_eval.core.agent_client import AgentClient, LocalAgentClient

logger = logging.getLogger("agent_eval.interactions")


def get_golden_questions(filepath: str) -> list[dict[str, Any]]:
    """Loads single-turn questions from either the unified ``dataset.jsonl``
    or a legacy ``golden_dataset.json``.

    Unified ``dataset.jsonl`` is the new source of truth (one file across
    all paths — interact, simulate, agent-engine). Multi-turn rows are
    skipped because ``interact`` is single-turn DIY; multi-turn rows belong
    to ``simulate``. Legacy ``golden_dataset.json`` keeps loading until a
    project migrates.
    """
    p = filepath if isinstance(filepath, str) else str(filepath)
    if p.endswith(".jsonl"):
        from agent_eval.core.dataset_io import is_single_turn, read_dataset

        if not Path(p).exists():
            raise FileNotFoundError(f"Dataset file not found at '{p}'") from None
        rows = read_dataset(p)
        questions: list[dict[str, Any]] = []
        skipped_multi_turn = 0
        for i, row in enumerate(rows):
            if not is_single_turn(row):
                skipped_multi_turn += 1
                continue
            questions.append(_unified_row_to_question(row, default_id=f"row_{i:03d}"))
        if skipped_multi_turn:
            logger.info(
                "interact: skipping %d multi-turn row(s) — those are scored "
                "by `agent-eval simulate`. Use single-turn rows for interact.",
                skipped_multi_turn,
            )
        return questions

    try:
        with Path(p).open() as f:
            data = json.load(f)
            # Legacy: support both 'questions' (consolidated) and 'golden_questions' (source)
            return data.get("questions") or data.get("golden_questions", [])
    except FileNotFoundError:
        raise FileNotFoundError(f"Questions file not found at '{p}'") from None


def _unified_row_to_question(row: dict[str, Any], *, default_id: str) -> dict[str, Any]:
    """Adapt a unified ``dataset.jsonl`` row to the legacy ``question_data``
    shape ``process_single_question`` consumes (``user_inputs``, ``id``,
    ``metadata``, ``reference_data``, ``agents_evaluated``).

    Bridges the unified-source-of-truth refactor without disturbing the
    rest of the interact pipeline. Once the pipeline natively understands
    unified rows, this adapter goes away.
    """
    prompt = row.get("prompt") or ""
    user_inputs = [prompt] if prompt else []

    metadata = dict(row.get("metadata") or {})

    # Rebuild reference_data, preserving the canonical nested shape from
    # dataset.jsonl. Three input shapes are supported:
    #   1. NESTED (canonical):  row["reference_data"] = {expected_behavior: ..., expected_facts: ...}
    #   2. TOP-LEVEL (legacy):  row["expected_response"], row["expected_facts"], ...
    #   3. STRING (legacy):     row["reference"] = "..."  → expected_response
    # Without this merge, custom_llm_judge metrics that rely on per-row
    # reference fields (e.g. dataset_mapping.reference.source_column =
    # "reference_data:expected_facts") silently get every row skipped at
    # evaluate time.
    reference_data: dict[str, Any] = {}
    nested_ref = row.get("reference_data")
    if isinstance(nested_ref, dict):
        reference_data.update(
            {k: v for k, v in nested_ref.items() if v not in (None, "", [])}
        )
    if row.get("reference"):
        reference_data.setdefault("expected_response", row["reference"])
    for k, v in row.items():
        if k.startswith("expected_") and v not in (None, "", []):
            reference_data[k] = v
    agents_evaluated = metadata.pop("agents_evaluated", None) or row.get(
        "agents_evaluated", []
    )

    return {
        "id": row.get("id") or default_id,
        "user_inputs": user_inputs,
        "metadata": metadata,
        "reference_data": reference_data,
        "agents_evaluated": agents_evaluated,
    }


def filter_questions_by_metadata(
    questions: list[dict[str, Any]], filters: dict[str, list[str]]
) -> list[dict[str, Any]]:
    """Filters questions based on metadata key-value pairs."""
    if not filters:
        return questions

    filtered_questions = []
    for question in questions:
        metadata = question.get("metadata", {})
        matches_all_filters = True
        for filter_key, filter_values in filters.items():
            # Check if metadata key exists and value is in the allowed list
            # We treat metadata values as strings for comparison
            if (
                filter_key not in metadata
                or str(metadata[filter_key]) not in filter_values
            ):
                matches_all_filters = False
                break
        if matches_all_filters:
            filtered_questions.append(question)
    return filtered_questions


def parse_metadata_filters(filter_strings: list[str] | None) -> dict[str, list[str]]:
    """Parses filter strings like 'key:val1,val2' into a dictionary."""
    filters = {}
    if not filter_strings:
        return filters
    for filter_string in filter_strings:
        if ":" not in filter_string:
            logger.warning(
                "Invalid filter format '%s'. Expected 'key:value1,value2'",
                filter_string,
            )
            continue
        key, values_str = filter_string.split(":", 1)
        values = [v.strip() for v in values_str.split(",")]
        if key in filters:
            filters[key].extend(values)
        else:
            filters[key] = values
    return filters


def parse_state_variables(state_var_strings: list[str] | None) -> dict[str, Any]:
    """Parses state variable strings like 'key:value' into a dictionary."""
    state_vars = {}
    if not state_var_strings:
        return state_vars
    for s in state_var_strings:
        if ":" not in s:
            logger.warning(
                "Invalid state variable format '%s'. Expected 'key:value'", s
            )
            continue
        key, value = s.split(":", 1)
        state_vars[key.strip()] = value.strip()
    return state_vars


async def process_single_question(
    question_data: dict[str, Any],
    agent_client: AgentClient,
    run_id: int,
    user_ldap: str,
    state_vars: dict[str, Any],
) -> dict[str, Any]:
    """
    Runs a single question against the agent.
    """
    user_inputs = question_data["user_inputs"]
    # Default `agents_evaluated` to the app we just hit. The unified
    # dataset.jsonl row schema does not carry this field, but the evaluator's
    # per-agent mask drops rows where it is empty — leaving us with a half
    # populated frame the Vertex SDK then crashes on. Mirrors what the sim
    # converter does in core/converters.py.
    agents_evaluated = question_data.get("agents_evaluated") or [agent_client.app_name]
    question_id = question_data["id"]
    question_metadata = question_data.get("metadata", {})
    reference_data = question_data.get("reference_data", {})

    logger.debug("Running question ID: %s (Run %d)...", question_id, run_id)

    try:
        interaction_datetime = datetime.now().isoformat()

        # Create session
        session_id = await asyncio.to_thread(agent_client.create_session, **state_vars)

        # Send all turns
        for turn in user_inputs:
            await asyncio.to_thread(agent_client.run_interaction, session_id, turn)

        return {
            "status": json.dumps({"boolean": "success"}),
            "run_id": run_id,
            "question_id": question_id,
            "agents_evaluated": json.dumps(agents_evaluated),
            "user_inputs": json.dumps(user_inputs),
            "question_metadata": json.dumps(question_metadata),
            "interaction_datetime": interaction_datetime,
            "session_id": session_id,
            "base_url": agent_client.base_url,
            "source_type": "interaction",
            "app_name": agent_client.app_name,
            "ADK_USER_ID": agent_client.user_id,
            "USER": user_ldap,
            "reference_data": json.dumps(reference_data),
        }

    except Exception as e:
        error_message = str(e)
        logger.error("Error in question %s: %s", question_id, error_message)
        return {
            "status": json.dumps({"boolean": "failed", "error_message": error_message}),
            "run_id": run_id,
            "question_id": question_id,
            "agents_evaluated": json.dumps(agents_evaluated),
            "user_inputs": json.dumps(user_inputs),
            "question_metadata": json.dumps(question_metadata),
            "interaction_datetime": None,
            "session_id": None,
            "base_url": agent_client.base_url,
            "source_type": "interaction",
            "app_name": agent_client.app_name,
            "ADK_USER_ID": agent_client.user_id,
            "USER": user_ldap,
            "reference_data": json.dumps(reference_data),
        }


class InteractionRunner:
    """
    Orchestrates the running of interactions for a set of questions.
    """

    def __init__(self, config: dict[str, Any], agent_instance: Any = None):
        self.config = config
        self.user_ldap = config.get("user") or os.environ.get("USER") or "unknown"
        if agent_instance is not None:
            self.agent_client = LocalAgentClient(
                agent_instance=agent_instance,
                app_name=config["app_name"],
                user_id=config.get("user_id", "eval_user"),
            )
        else:
            self.agent_client = AgentClient(
                base_url=config["base_url"],
                app_name=config["app_name"],
                user_id=config.get("user_id", "eval_user"),
            )

    async def run(self) -> pd.DataFrame:
        questions_file = self.config["questions_file"]
        all_questions = get_golden_questions(questions_file)

        # Filter
        filters = parse_metadata_filters(self.config.get("metadata_filters"))
        filtered_questions = filter_questions_by_metadata(all_questions, filters)

        # Limit
        num_questions = self.config.get("num_questions", -1)
        if num_questions != -1:
            filtered_questions = filtered_questions[:num_questions]

        state_vars = parse_state_variables(self.config.get("state_variables"))
        runs = self.config.get("runs", 1)

        logger.debug(
            "Starting execution for %d questions, %d runs each.",
            len(filtered_questions),
            runs,
        )

        tasks = []
        for q in filtered_questions:
            for r in range(1, runs + 1):
                tasks.append(
                    process_single_question(
                        q, self.agent_client, r, self.user_ldap, state_vars
                    )
                )

        results = await asyncio.gather(*tasks)
        return pd.DataFrame(results)
