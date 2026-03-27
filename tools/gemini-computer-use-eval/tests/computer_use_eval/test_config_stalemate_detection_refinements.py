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
def mock_env_with_aria():
    env = MagicMock()
    env.page = MagicMock()
    # Mock get_aria_snapshot to return a constant tree
    env.get_aria_snapshot = AsyncMock(return_value="<tree>Same</tree>")
    env.console_logs = []

    mock_tool_executor = MagicMock()
    mock_action_executor = MagicMock()
    mock_tool_executor.executor = mock_action_executor
    env.executor = mock_tool_executor

    def get_action_mock(name):
        action = MagicMock()
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


@pytest.mark.asyncio
async def test_stagnation_once_per_turn(mock_env_with_aria):
    mw = StalemateDetectionMiddleware(mock_env_with_aria, goal="Goal")

    # Simulate first action in turn
    await mw.start_turn()
    await mw.before_action("click_at", {"x": 100, "y": 100})
    await mw.after_action("click_at", {"x": 100, "y": 100}, {"status": "ok"})

    assert mw.stagnation_counter == 1

    # Simulate second action in SAME turn (no start_turn call)
    await mw.before_action("click_at", {"x": 200, "y": 200})
    await mw.after_action("click_at", {"x": 200, "y": 200}, {"status": "ok"})

    # Should NOT have incremented
    assert mw.stagnation_counter == 1

    # Simulate new turn
    await mw.start_turn()
    await mw.before_action("click_at", {"x": 300, "y": 300})
    await mw.after_action("click_at", {"x": 300, "y": 300}, {"status": "ok"})

    # Should HAVE incremented
    assert mw.stagnation_counter == 2


@pytest.mark.asyncio
async def test_stagnation_ignored_actions(mock_env_with_aria):
    mw = StalemateDetectionMiddleware(mock_env_with_aria, goal="Goal")

    # Action: wait_5_seconds (ignored)
    await mw.start_turn()
    await mw.before_action("wait_5_seconds", {})
    await mw.after_action("wait_5_seconds", {}, {"status": "ok"})
    assert mw.stagnation_counter == 0

    # Action: open_web_browser (ignored)
    await mw.start_turn()
    await mw.before_action("open_web_browser", {})
    await mw.after_action("open_web_browser", {}, {"status": "ok"})
    assert mw.stagnation_counter == 0

    # Action: hover_at (ignored)
    await mw.start_turn()
    await mw.before_action("hover_at", {"x": 1, "y": 1})
    await mw.after_action("hover_at", {"x": 1, "y": 1}, {"status": "ok"})
    assert mw.stagnation_counter == 0
