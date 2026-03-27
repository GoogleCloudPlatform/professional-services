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
from unittest.mock import MagicMock, AsyncMock
from computer_use_eval.core.middleware.stalemate_detection import (
    StalemateDetectionMiddleware,
)


@pytest.fixture
def mock_env():
    env = MagicMock()
    env.page = MagicMock()
    env.console_logs = []

    # Mock ToolExecutor and ActionExecutor for OCP-compliant middleware
    mock_tool_executor = MagicMock()
    mock_action_executor = MagicMock()
    mock_tool_executor.executor = mock_action_executor
    env.executor = mock_tool_executor

    def get_action_mock(name):
        action = MagicMock()
        # Mark typical passive actions as passive in the mock
        action.is_passive = name in [
            "scroll_document",
            "scroll_at",
            "wait_5_seconds",
            "mouse_move",
            "open_web_browser",
        ]
        return action

    mock_action_executor.get_action.side_effect = get_action_mock
    return env


@pytest.mark.asyncio
async def test_stalemate_detection_consecutive_failures(mock_env):
    mw = StalemateDetectionMiddleware(mock_env, goal="Task Goal")
    action = "click_at"
    args = {"x": 100, "y": 100}

    res1 = await mw.after_action(action, args, {"error": "Element not found"})
    assert "reflection_guidance" in res1
    assert "Retry attempt 1" in res1["reflection_guidance"]

    res2 = await mw.after_action(action, args, {"error": "Element not found again"})
    assert "Retry attempt 2" in res2["reflection_guidance"]

    res3 = await mw.after_action(action, args, {"status": "ok"})
    assert "reflection_guidance" not in res3

    res4 = await mw.after_action(action, args, {"error": "New error"})
    assert "Retry attempt 1" in res4["reflection_guidance"]


@pytest.mark.asyncio
async def test_stalemate_detection_tiered_thresholds(mock_env):
    mw = StalemateDetectionMiddleware(
        mock_env, goal="Task Goal", strict_threshold=3, loose_threshold=10
    )

    for i in range(1, 3):
        res = await mw.after_action("click_at", {}, {"error": "fail"})
        assert f"Retry attempt {i}" in res["reflection_guidance"]

    res = await mw.after_action("click_at", {}, {"error": "fail"})
    assert "Maximum retries (3) reached" in res["reflection_guidance"]

    mw = StalemateDetectionMiddleware(
        mock_env, goal="Task Goal", strict_threshold=3, loose_threshold=10
    )
    for i in range(1, 10):
        res = await mw.after_action("scroll_document", {}, {"error": "fail"})
        assert f"Retry attempt {i}" in res["reflection_guidance"]

    res = await mw.after_action("scroll_document", {}, {"error": "fail"})
    assert "Maximum retries (10) reached" in res["reflection_guidance"]


@pytest.mark.asyncio
async def test_stalemate_detection_action_loop_detection(mock_env):
    mw = StalemateDetectionMiddleware(mock_env, goal="Task Goal")
    action = "click_at"
    args = {"x": 10, "y": 10}

    # Stagnation: State A -> Action -> State A
    # The action is active (click_at), so it triggers stagnation counter
    mock_env.get_aria_snapshot = AsyncMock(return_value="State A")

    # Needs 3 stagnations to trigger warning
    for i in range(2):
        await mw.start_turn()
        await mw.before_action(action, args)
        res = await mw.after_action(action, args, {"status": "ok"})
        assert "stalemate_warning" not in res

    await mw.start_turn()
    await mw.before_action(action, args)
    res = await mw.after_action(action, args, {"status": "ok"})
    assert "stalemate_warning" in res
    assert "not reacted to your last 3 consecutive actions" in res["stalemate_warning"]


@pytest.mark.asyncio
async def test_stalemate_detection_cyclic_detection(mock_env):
    mw = StalemateDetectionMiddleware(mock_env, goal="Task Goal")

    # Cycle: State B -> A -> B -> A -> B
    mock_env.get_aria_snapshot = AsyncMock()
    mock_env.get_aria_snapshot.side_effect = [
        "State A",
        "State B",  # Turn 1
        "State B",
        "State A",  # Turn 2
        "State A",
        "State B",  # Turn 3
        "State B",
        "State A",  # Turn 4
        "State A",
        "State B",  # Turn 5
    ]

    actions = [
        ("type_text", {"text": "foo"}),  # Turn 1: ends in B
        ("click", {}),  # Turn 2: ends in A
        ("type_text", {"text": "bar"}),  # Turn 3: ends in B
        ("click", {}),  # Turn 4: ends in A
        ("type_text", {"text": "baz"}),  # Turn 5: ends in B (3rd occurrence of B)
    ]

    for i in range(4):
        name, args = actions[i]
        await mw.start_turn()
        await mw.before_action(name, args)
        res = await mw.after_action(name, args, {"status": "ok"})
        assert "stalemate_warning" not in res

    # Turn 5: ends in State B (3rd occurrence). Cycle detected!
    name, args = actions[4]
    await mw.start_turn()
    await mw.before_action(name, args)
    res = await mw.after_action(name, args, {"status": "ok"})

    assert "stalemate_warning" in res
    assert "loop of 2" in res["stalemate_warning"]


@pytest.mark.asyncio
async def test_stalemate_detection_auto_inject_on_failure(mock_env):
    mw = StalemateDetectionMiddleware(
        mock_env,
        reflection_strategy="AUTO_INJECT_HEURISTIC",
        goal="Find the login button",
        client=MagicMock(),
        strict_threshold=3,
    )

    mw.reflection_engine = MagicMock()
    mw.reflection_engine.get_aria_snapshot = AsyncMock(return_value="{}")
    mw.reflection_engine.get_recent_console_logs = MagicMock(return_value="")
    mw.reflection_engine.get_context_for_failure = AsyncMock(
        return_value="- [button] 'Mocked Element'"
    )
    mock_env.get_aria_snapshot = AsyncMock(return_value="{}")

    action = "click"
    args = {"text": "Submit"}

    await mw.after_action(action, args, {"error": "fail"})
    await mw.after_action(action, args, {"error": "fail"})
    res = await mw.after_action(action, args, {"error": "fail"})

    assert "reflection_guidance" in res
    assert "<page_context>" in res["reflection_guidance"]
    assert "[button] 'Mocked Element'" in res["reflection_guidance"]

    mw.reflection_engine.get_context_for_failure.assert_called_once_with(
        "AUTO_INJECT_HEURISTIC",
        "{}",
        action,
        args,
        "fail",
        mock_env.current_reasoning,
    )


@pytest.mark.asyncio
async def test_stalemate_detection_auto_inject_on_loop(mock_env):
    mw = StalemateDetectionMiddleware(
        mock_env,
        reflection_strategy="AUTO_INJECT_LLM",
        goal="Scroll to bottom",
        client=MagicMock(),
    )

    mw.reflection_engine = MagicMock()
    mw.reflection_engine.get_aria_snapshot = AsyncMock(return_value="{}")
    mw.reflection_engine.get_recent_console_logs = MagicMock(return_value="")
    mw.reflection_engine.get_context_for_loop = AsyncMock(
        return_value="- [link] 'Smart Target'"
    )

    action = "click_at"
    args = {"x": 10, "y": 10}

    # Cycle: A -> B -> A -> B -> A
    mock_env.get_aria_snapshot = AsyncMock()
    mock_env.get_aria_snapshot.side_effect = [
        "State A",
        "State B",  # Turn 1
        "State B",
        "State A",  # Turn 2
        "State A",
        "State B",  # Turn 3
        "State B",
        "State A",  # Turn 4
        "State A",
        "State B",  # Turn 5
    ]

    for i in range(4):
        await mw.start_turn()
        await mw.before_action(action, args)
        res = await mw.after_action(action, args, {"status": "ok"})

    await mw.start_turn()
    await mw.before_action(action, args)
    res = await mw.after_action(action, args, {"status": "ok"})
    assert "stalemate_warning" in res
    assert "<page_context>" in res["stalemate_warning"]
    assert "[link] 'Smart Target'" in res["stalemate_warning"]

    mw.reflection_engine.get_context_for_loop.assert_called_once()
