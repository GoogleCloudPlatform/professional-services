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
"""Unit tests for interactions.py."""

import json
import tempfile
from pathlib import Path
from unittest import mock

import pandas as pd
import pytest

from agent_eval.core.interactions import (
    InteractionRunner,
    _unified_row_to_question,
    filter_questions_by_metadata,
    get_golden_questions,
    parse_metadata_filters,
    parse_state_variables,
    process_single_question,
)

# ── 1. Helper Parsing Tests ──────────────────────────────────────────────────


def test_parse_metadata_filters():
    assert parse_metadata_filters(None) == {}
    assert parse_metadata_filters([]) == {}

    filter_strings = ["category:travel,leisure", "difficulty:easy"]
    expected = {
        "category": ["travel", "leisure"],
        "difficulty": ["easy"],
    }
    assert parse_metadata_filters(filter_strings) == expected

    # Test duplicate keys appending values
    duplicate_filters = ["category:travel", "category:leisure"]
    expected_dup = {"category": ["travel", "leisure"]}
    assert parse_metadata_filters(duplicate_filters) == expected_dup

    # Test invalid format (missing colon)
    invalid_filters = ["category_invalid"]
    assert parse_metadata_filters(invalid_filters) == {}


def test_parse_state_variables():
    assert parse_state_variables(None) == {}
    assert parse_state_variables([]) == {}

    state_strings = ["user_id:123", "theme:dark"]
    expected = {
        "user_id": "123",
        "theme": "dark",
    }
    assert parse_state_variables(state_strings) == expected

    # Test invalid format (missing colon)
    invalid_states = ["invalid_state"]
    assert parse_state_variables(invalid_states) == {}


# ── 2. Row Adapter Tests ─────────────────────────────────────────────────────


def test_unified_row_to_question():
    # Case A: Nested reference data (canonical)
    row_nested = {
        "id": "q1",
        "prompt": "hello",
        "reference_data": {
            "expected_behavior": "greet",
            "expected_facts": ["fact1"],
        },
        "metadata": {"category": "test"},
        "agents_evaluated": ["agent_a"],
    }
    expected_nested = {
        "id": "q1",
        "user_inputs": ["hello"],
        "metadata": {"category": "test"},
        "reference_data": {
            "expected_behavior": "greet",
            "expected_facts": ["fact1"],
        },
        "agents_evaluated": ["agent_a"],
        "metrics": None,
    }
    assert _unified_row_to_question(row_nested, default_id="def_id") == expected_nested

    # Test with custom metrics targeted
    row_with_metrics = row_nested.copy()
    row_with_metrics["metrics"] = ["metric1", "metric2"]
    expected_with_metrics = expected_nested.copy()
    expected_with_metrics["metrics"] = ["metric1", "metric2"]
    assert _unified_row_to_question(row_with_metrics, default_id="def_id") == expected_with_metrics

    # Case B: Top-level expected_* keys (legacy merge)
    row_legacy_top = {
        "prompt": "hello",
        "expected_response": "hi there",
        "expected_facts": ["fact1"],
    }
    result_legacy_top = _unified_row_to_question(row_legacy_top, default_id="def_id")
    assert result_legacy_top["id"] == "def_id"
    assert result_legacy_top["reference_data"] == {
        "expected_response": "hi there",
        "expected_facts": ["fact1"],
    }

    # Case C: String reference key (legacy string fallback)
    row_legacy_str = {
        "prompt": "hello",
        "reference": "hello string reference",
    }
    result_legacy_str = _unified_row_to_question(row_legacy_str, default_id="def_id")
    assert result_legacy_str["reference_data"] == {
        "expected_response": "hello string reference",
    }


# ── 3. Golden Questions Loading Tests ────────────────────────────────────────


def test_get_golden_questions_jsonl():
    # Seed a temp dataset.jsonl containing both single-turn and multi-turn rows
    single_turn_row = {
        "id": "q_single",
        "prompt": "single turn prompt",
    }
    multi_turn_row = {
        "id": "q_multi",
        "prompt": "multi turn prompt",
        "conversation_plan": ["step 1", "step 2"],
    }

    with tempfile.TemporaryDirectory() as td:
        dataset_path = Path(td) / "dataset.jsonl"
        with dataset_path.open("w") as f:
            f.write(json.dumps(single_turn_row) + "\n")
            f.write(json.dumps(multi_turn_row) + "\n")

        # Load golden questions (should skip multi-turn rows)
        questions = get_golden_questions(str(dataset_path))
        assert len(questions) == 1
        assert questions[0]["id"] == "q_single"
        assert questions[0]["user_inputs"] == ["single turn prompt"]


def test_get_golden_questions_legacy_json():
    legacy_data = {
        "questions": [
            {"id": "ql1", "user_inputs": ["legacy prompt 1"]},
            {"id": "ql2", "user_inputs": ["legacy prompt 2"]},
        ]
    }
    with tempfile.TemporaryDirectory() as td:
        questions_path = Path(td) / "questions.json"
        with questions_path.open("w") as f:
            json.dump(legacy_data, f)

        questions = get_golden_questions(str(questions_path))
        assert len(questions) == 2
        assert questions[0]["id"] == "ql1"
        assert questions[1]["id"] == "ql2"


def test_get_golden_questions_file_not_found():
    with pytest.raises(FileNotFoundError, match="Questions file not found"):
        get_golden_questions("non_existent_file.json")
    with pytest.raises(FileNotFoundError, match="Dataset file not found"):
        get_golden_questions("non_existent_file.jsonl")


# ── 4. Metadata Filtering Tests ──────────────────────────────────────────────


def test_filter_questions_by_metadata():
    questions = [
        {"id": "q1", "metadata": {"category": "travel", "difficulty": "easy"}},
        {"id": "q2", "metadata": {"category": "finance", "difficulty": "hard"}},
        {"id": "q3", "metadata": {"category": "travel", "difficulty": "hard"}},
    ]

    # Empty filters should return all questions
    assert filter_questions_by_metadata(questions, {}) == questions

    # Filter by single key
    filter_travel = {"category": ["travel"]}
    filtered_travel = filter_questions_by_metadata(questions, filter_travel)
    assert len(filtered_travel) == 2
    assert {q["id"] for q in filtered_travel} == {"q1", "q3"}

    # Filter by multiple keys (AND logic)
    filter_complex = {"category": ["travel"], "difficulty": ["hard"]}
    filtered_complex = filter_questions_by_metadata(questions, filter_complex)
    assert len(filtered_complex) == 1
    assert filtered_complex[0]["id"] == "q3"

    # Filter with multiple allowed values (OR logic within key)
    filter_or = {"difficulty": ["easy", "hard"]}
    filtered_or = filter_questions_by_metadata(questions, filter_or)
    assert len(filtered_or) == 3


# ── 5. Single Question Execution Tests ───────────────────────────────────────


@pytest.mark.anyio
async def test_process_single_question_success():
    question_data = {
        "id": "q1",
        "user_inputs": ["hello turn 1", "hello turn 2"],
        "metadata": {"category": "test"},
        "reference_data": {"expected_behavior": "greet"},
        "agents_evaluated": ["my-agent"],
    }

    mock_client = mock.MagicMock()
    mock_client.base_url = "http://localhost:8080"
    mock_client.app_name = "my-agent"
    mock_client.user_id = "eval_user"
    mock_client.create_session.return_value = "session_abc"
    mock_client.run_interaction = mock.AsyncMock()

    state_vars = {"debug": "true"}

    result = await process_single_question(
        question_data=question_data,
        agent_client=mock_client,
        run_id=1,
        user_ldap="sergiovidiella",
        state_vars=state_vars,
    )

    # Verify return dictionary values
    assert json.loads(result["status"]) == {"boolean": "success"}
    assert result["run_id"] == 1
    assert result["question_id"] == "q1"
    assert json.loads(result["agents_evaluated"]) == ["my-agent"]
    assert json.loads(result["user_inputs"]) == ["hello turn 1", "hello turn 2"]
    assert json.loads(result["question_metadata"]) == {"category": "test"}
    assert result["session_id"] == "session_abc"
    assert result["base_url"] == "http://localhost:8080"
    assert result["app_name"] == "my-agent"
    assert result["ADK_USER_ID"] == "eval_user"
    assert result["USER"] == "sergiovidiella"
    assert json.loads(result["reference_data"]) == {"expected_behavior": "greet"}

    # Verify mock interactions were called
    mock_client.create_session.assert_called_once_with(debug="true")
    assert mock_client.run_interaction.call_count == 2
    mock_client.run_interaction.assert_has_calls(
        [
            mock.call("session_abc", "hello turn 1"),
            mock.call("session_abc", "hello turn 2"),
        ]
    )


@pytest.mark.anyio
async def test_process_single_question_failure():
    question_data = {
        "id": "q1",
        "user_inputs": ["hello"],
    }

    mock_client = mock.MagicMock()
    mock_client.base_url = "http://localhost:8080"
    mock_client.app_name = "my-agent"
    mock_client.user_id = "eval_user"
    mock_client.create_session.side_effect = Exception("Connection Refused")

    result = await process_single_question(
        question_data=question_data,
        agent_client=mock_client,
        run_id=1,
        user_ldap="sergiovidiella",
        state_vars={},
    )

    # Verify failed response dictionary structure
    status = json.loads(result["status"])
    assert status["boolean"] == "failed"
    assert "Connection Refused" in status["error_message"]
    assert result["session_id"] is None
    assert result["interaction_datetime"] is None
    assert result["question_id"] == "q1"


# ── 6. InteractionRunner Orchestrator Tests ──────────────────────────────────


@pytest.mark.anyio
@mock.patch("agent_eval.core.interactions.AgentClient")
async def test_interaction_runner_full_orchestration(mock_agent_client_class):
    mock_client = mock.MagicMock()
    mock_client.app_name = "my-agent"
    mock_client.create_session.return_value = "session_1"
    mock_client.run_interaction = mock.AsyncMock()
    mock_agent_client_class.return_value = mock_client

    # Seed questions dataset
    dataset_rows = [
        {"id": "q1", "prompt": "prompt 1", "metadata": {"difficulty": "easy"}},
        {"id": "q2", "prompt": "prompt 2", "metadata": {"difficulty": "hard"}},
    ]
    with tempfile.TemporaryDirectory() as td:
        dataset_path = Path(td) / "dataset.jsonl"
        with dataset_path.open("w") as f:
            for row in dataset_rows:
                f.write(json.dumps(row) + "\n")

        config = {
            "base_url": "http://localhost:8080",
            "app_name": "my-agent",
            "questions_file": str(dataset_path),
            "metadata_filters": ["difficulty:easy"],  # should filter out q2
            "state_variables": ["debug:true"],
            "runs": 2,  # run q1 twice
            "user": "sergiovidiella",
        }

        runner = InteractionRunner(config)
        df = await runner.run()

        # Verify that it returns a pandas DataFrame
        assert isinstance(df, pd.DataFrame)

        # We expect 2 rows because q1 is run twice, and q2 was filtered out
        assert len(df) == 2
        assert list(df["question_id"]) == ["q1", "q1"]
        assert list(df["run_id"]) == [1, 2]
        assert list(df["session_id"]) == ["session_1", "session_1"]

        # Verify state variables were parsed and passed to session creation
        mock_client.create_session.assert_has_calls(
            [
                mock.call(debug="true"),
                mock.call(debug="true"),
            ]
        )

        # Verify run_interaction was called for prompt 1 in both runs
        mock_client.run_interaction.assert_has_calls(
            [
                mock.call("session_1", "prompt 1"),
                mock.call("session_1", "prompt 1"),
            ]
        )


@pytest.mark.anyio
async def test_interaction_runner_local_with_agent_instance():
    # 1. Setup mock agent_instance with async run_async generator
    mock_agent_instance = mock.MagicMock()

    async def mock_run_async(inv_context):
        # Yield a telemetry event and a final response event
        mock_event_1 = mock.MagicMock()
        mock_event_1.is_final_response.return_value = False
        yield mock_event_1

        mock_event_2 = mock.MagicMock()
        mock_event_2.is_final_response.return_value = True
        mock_event_2.output = "Hello, local user!"
        yield mock_event_2

    mock_agent_instance.run_async.side_effect = mock_run_async

    # 2. Seed a temporary dataset file
    dataset_row = {
        "id": "q1",
        "prompt": "prompt 1",
        "kind": "single_turn",
        "reference_data": {"expected_response": "Hello, local user!"},
    }
    with tempfile.TemporaryDirectory() as td:
        dataset_path = Path(td) / "dataset.jsonl"
        with dataset_path.open("w") as f:
            f.write(json.dumps(dataset_row) + "\n")

        config = {
            "app_name": "my-agent",
            "questions_file": str(dataset_path),
            "base_url": "local://in-process",
            "runs": 1,
            "user": "sergiovidiella",
        }

        # 3. Instantiate InteractionRunner passing the agent_instance!
        runner = InteractionRunner(config, agent_instance=mock_agent_instance)

        # Verify it instantiated LocalAgentClient!
        from agent_eval.core.agent_client import LocalAgentClient

        assert isinstance(runner.agent_client, LocalAgentClient)

        # 4. Run!
        df = await runner.run()

        # 5. Assertions
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 1
        assert df.iloc[0]["question_id"] == "q1"
        assert df.iloc[0]["app_name"] == "my-agent"

        session_id = df.iloc[0]["session_id"]
        assert "local_session_" in session_id

        # Verify response was stored in the session state events!
        session_state = runner.agent_client.get_session_state(session_id)
        assert len(session_state["events"]) == 2
        assert (
            session_state["events"][1]["content"]["parts"][0]["text"]
            == "Hello, local user!"
        )

        # Verify run_async was called on our mock_agent_instance
        mock_agent_instance.run_async.assert_called_once()
