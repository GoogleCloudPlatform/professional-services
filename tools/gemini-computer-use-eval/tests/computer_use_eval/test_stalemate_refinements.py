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
    StalemateDetectionMiddleware,)


@pytest.fixture
def mock_env():
    env = MagicMock()
    env.page = MagicMock()
    env.console_logs = []
    # Mock viewport size for rounding logic if needed
    env.viewport_size = {"width": 1000, "height": 1000}

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
            "hover_at",
        ]
        return action

    mock_action_executor.get_action.side_effect = get_action_mock
    return env


def test_normalize_args_hitbox(mock_env):
    mw = StalemateDetectionMiddleware(mock_env)

    # Test click_at rounding
    args = {"x": 105, "y": 114}
    norm = mw._normalize_args("click_at", args)
    assert norm["x"] == 100
    assert norm["y"] == 120

    # Test hover_at rounding
    args = {"x": 9, "y": 21}
    norm = mw._normalize_args("hover_at", args)
    assert norm["x"] == 0
    assert norm["y"] == 20

    # FAILING CASES (Not yet implemented in code)

    # Test drag_and_drop rounding (both start and destination)
    args = {"x": 105, "y": 114, "destination_x": 505, "destination_y": 495}
    norm = mw._normalize_args("drag_and_drop", args)
    assert norm["x"] == 100
    assert norm["y"] == 120
    assert norm["destination_x"] == 500
    assert norm["destination_y"] == 500

    # Test scroll_at rounding
    args = {"x": 505, "y": 495, "direction": "down"}
    norm = mw._normalize_args("scroll_at", args)
    assert norm["x"] == 500
    assert norm["y"] == 500


def test_get_state_hash(mock_env):
    mw = StalemateDetectionMiddleware(mock_env)

    aria_1 = "<html><body>Button</body></html>"
    aria_2 = "<html><body>Button</body></html>"
    aria_3 = "<html><body>Link</body></html>"

    hash_1 = mw._get_state_hash(aria_1)
    hash_2 = mw._get_state_hash(aria_2)
    hash_3 = mw._get_state_hash(aria_3)

    assert hash_1 == hash_2
    assert hash_1 != hash_3
    assert len(hash_1) == 64  # SHA-256
    assert mw._get_state_hash("") == ""
    assert mw._get_state_hash(None) == ""


@pytest.mark.asyncio
async def test_micro_reflection_on_2nd_failure(mock_env):
    mw = StalemateDetectionMiddleware(mock_env)
    action = "click_at"
    args = {"x": 100, "y": 100}

    # 1st failure
    res1 = await mw.after_action(action, args, {"error": "timeout"})
    assert "Retry attempt 1" in res1["reflection_guidance"]
    assert ("System Note" not in res1["reflection_guidance"]
           )  # MICRO_REFLECTION not yet in 1st

    # 2nd failure - Should trigger Micro-Reflection
    res2 = await mw.after_action(action, args, {"error": "timeout"})
    assert "Retry attempt 2" in res2["reflection_guidance"]
    assert "<system_note>" in res2["reflection_guidance"]
    assert ("Your last action 'click_at' failed with error: 'timeout'"
            in res2["reflection_guidance"])


@pytest.mark.asyncio
async def test_state_stagnation_reset_on_change(mock_env):
    mw = StalemateDetectionMiddleware(mock_env)

    # Sequence of events: Same, Same, Change, Same
    mock_env.get_aria_snapshot = AsyncMock(side_effect=[
        "State A",
        "State A",  # 1st action (pre=A, post=A) -> count=1
        "State A",
        "State A",  # 2nd action (pre=A, post=A) -> count=2
        "State A",
        "State B",  # 3rd action (pre=A, post=B) -> count=0 (RESET)
        "State B",
        "State B",  # 4th action (pre=B, post=B) -> count=1
    ])

    action = "click_at"
    args = {"x": 100, "y": 100}

    # 1st action
    await mw.start_turn()
    await mw.before_action(action, args)
    await mw.after_action(action, args, {"status": "ok"})
    assert mw.stagnation_counter == 1

    # 2nd action
    await mw.start_turn()
    await mw.before_action(action, args)
    await mw.after_action(action, args, {"status": "ok"})
    assert mw.stagnation_counter == 2

    # 3rd action - Progress! Reset.
    await mw.start_turn()
    await mw.before_action(action, args)
    await mw.after_action(action, args, {"status": "ok"})
    assert mw.stagnation_counter == 0

    # 4th action - Stagnation again
    await mw.start_turn()
    await mw.before_action(action, args)
    await mw.after_action(action, args, {"status": "ok"})
    assert mw.stagnation_counter == 1


@pytest.mark.asyncio
async def test_state_stagnation_zero_delta(mock_env):
    mw = StalemateDetectionMiddleware(mock_env)

    # Setup mock env to return same Aria tree
    mock_env.get_aria_snapshot = AsyncMock(return_value="<html>STABLE</html>")

    action = "click_at"

    # 1st Zero Delta
    await mw.start_turn()
    await mw.before_action(action, {"x": 100, "y": 100})
    res1 = await mw.after_action(action, {"x": 100, "y": 100}, {"status": "ok"})
    assert mw.stagnation_counter == 1
    assert "stalemate_warning" not in res1

    # 2nd Zero Delta
    await mw.start_turn()
    await mw.before_action(action, {"x": 100, "y": 200})
    res2 = await mw.after_action(action, {"x": 100, "y": 200}, {"status": "ok"})
    assert mw.stagnation_counter == 2
    assert "stalemate_warning" not in res2

    # 3rd Zero Delta - STALEMATE!
    await mw.start_turn()
    await mw.before_action(action, {"x": 100, "y": 300})
    res3 = await mw.after_action(action, {"x": 100, "y": 300}, {"status": "ok"})
    assert "stalemate_warning" in res3
    assert "State Stagnation Detected" in res3["stalemate_warning"]
    assert mw.stagnation_counter == 0  # Reset after warning
