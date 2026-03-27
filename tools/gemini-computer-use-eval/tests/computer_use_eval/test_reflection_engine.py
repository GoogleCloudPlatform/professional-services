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

import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from collections import deque
from computer_use_eval.reflection import ReflectionEngine


@pytest.mark.asyncio
async def test_reflection_engine_aria():
    mock_page = AsyncMock()
    mock_page.evaluate.return_value = {
        "role": "root",
        "children": [{"role": "button", "name": "Submit"}],
    }

    engine = ReflectionEngine(mock_page, deque())

    snapshot = await engine.get_aria_snapshot()
    assert "root" in snapshot
    assert "Submit" in snapshot


def test_reflection_engine_logs():
    mock_page = AsyncMock()
    logs = deque(maxlen=2)
    logs.append("[info] loaded")
    logs.append("[error] failed")

    engine = ReflectionEngine(mock_page, logs)

    output = engine.get_recent_console_logs()
    assert "loaded" in output
    assert "failed" in output


def test_extract_heuristic_context():
    engine = ReflectionEngine(AsyncMock(), deque())

    mock_tree = {
        "role": "group",
        "children": [
            {"role": "button", "name": "Submit Form", "value": ""},
            {"role": "button", "name": "Cancel", "value": ""},
            {"role": "input", "name": "Username", "value": "testuser"},
            {
                "role": "button",
                "name": "Submit Form",
                "value": "",
            },  # Duplicate to test set logic
        ],
    }
    tree_json = json.dumps(mock_tree)

    # Test finding a partial match
    result = engine.extract_heuristic_context(tree_json, ["submit"])
    assert "[button] 'Submit Form'" in result
    assert "Cancel" not in result

    # Test finding an input by value
    result = engine.extract_heuristic_context(tree_json, ["testuser"])
    assert "[input] 'Username' (value: testuser)" in result

    # Test deduplication (Submit Form should only appear once)
    result = engine.extract_heuristic_context(tree_json, ["submit"])
    assert result.count("Submit Form") == 1

    # Test empty or no match
    assert engine.extract_heuristic_context(tree_json, ["nonexistent"]) == ""
    assert engine.extract_heuristic_context(tree_json, []) == ""
    assert engine.extract_heuristic_context("invalid json", ["test"]) == ""


def test_extract_search_terms_filtering():
    engine = ReflectionEngine(AsyncMock(), deque())

    # Test filtering of navigational actions
    args = {"direction": "down", "magnitude": 500}
    terms = engine._extract_search_terms_from_args(args, "scroll_document")
    assert "down" not in terms
    assert len(terms) == 0

    # Test normal extraction
    args = {"text": "Login", "selector": "#login-btn"}
    terms = engine._extract_search_terms_from_args(args, "click")
    assert "Login" in terms
    assert "button" in terms  # Role expansion

    # Test history filtering
    history = [
        ("scroll_document", "{'direction': 'up'}"),
        ("wait_5_seconds", "{}"),
        ("click", "{'text': 'Submit'}"),
    ]
    terms = engine._extract_search_terms_from_history(history)
    assert "up" not in terms
    assert "Submit" in terms


@pytest.mark.asyncio
async def test_extract_llm_context_with_goal():
    mock_client = MagicMock()
    mock_aio_client = AsyncMock()
    mock_client.aio = mock_aio_client

    mock_response = MagicMock()
    mock_response.text = (
        '{"elements": [{"role": "link", "name": "Forgot Password", "value": ""}]}'
    )
    mock_aio_client.models.generate_content.return_value = mock_response

    # Initialize with goal
    engine = ReflectionEngine(
        AsyncMock(), deque(), client=mock_client, goal="Log into the portal"
    )

    result = await engine.extract_llm_context("{}", "stuck in scroll loop")

    assert "[link] 'Forgot Password'" in result

    # Verify the prompt contains the goal
    args, kwargs = mock_aio_client.models.generate_content.call_args
    prompt = kwargs["contents"]  # Assuming we pass it as string or content object
    assert "Log into the portal" in prompt


@pytest.mark.asyncio
async def test_extract_hybrid_context():
    engine = ReflectionEngine(AsyncMock(), deque())

    # Mock the internal methods
    engine.extract_heuristic_context = MagicMock()
    engine.extract_llm_context = AsyncMock()

    # Scenario 1: Heuristic works
    engine.extract_heuristic_context.return_value = "- [button] 'Found It'"
    res1 = await engine.extract_hybrid_context("{}", ["find"], "intent")
    assert res1 == "- [button] 'Found It'"
    engine.extract_llm_context.assert_not_called()

    # Scenario 2: Heuristic fails, falls back to LLM
    engine.extract_heuristic_context.return_value = ""
    engine.extract_llm_context.return_value = "- [button] 'LLM Found It'"
    res2 = await engine.extract_hybrid_context("{}", ["find"], "intent")
    assert res2 == "- [button] 'LLM Found It'"
    engine.extract_llm_context.assert_called_once()
