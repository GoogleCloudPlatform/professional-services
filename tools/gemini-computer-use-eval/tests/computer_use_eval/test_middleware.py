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
from unittest.mock import AsyncMock, MagicMock
from computer_use_eval.tool_executor import ToolExecutor
from computer_use_eval.core.middleware import (
    ActionMiddleware,
    SafetyMiddleware,
    DialogMiddleware,
)


class MockMiddleware(ActionMiddleware):

    def __init__(self):
        self.before_called = False
        self.after_called = False

    async def before_action(self, name, args):
        self.before_called = True
        return name, args, True

    async def after_action(self, name, args, result):
        self.after_called = True
        result["mw_touched"] = True
        return result


@pytest.mark.asyncio
async def test_tool_executor_middleware_pipeline():
    mock_env = MagicMock()
    mock_env.page = None

    mw1 = MockMiddleware()
    mw2 = MockMiddleware()

    executor = ToolExecutor(mock_env, middleware=[mw1, mw2])

    # Mock a browser action so it doesn't actually try to run playwright
    executor.browser_action_executor.execute = AsyncMock(
        return_value={"status": "ok"})

    result, mw_dur = await executor.execute("click_at", {"x": 100, "y": 100})

    assert mw1.before_called is True
    assert mw2.before_called is True
    assert mw1.after_called is True
    assert mw2.after_called is True
    assert result["mw_touched"] is True


@pytest.mark.asyncio
async def test_safety_middleware():
    mw = SafetyMiddleware()

    # No safety decision
    res1 = await mw.after_action("click_at", {}, {"status": "ok"})
    assert "safety_acknowledgement" not in res1

    # Safety decision present
    args = {"safety_decision": {"decision": "require_confirmation"}}
    res2 = await mw.after_action("click_at", args, {"status": "ok"})
    assert res2["safety_acknowledgement"] == "true"


@pytest.mark.asyncio
async def test_dialog_middleware_interception():
    mock_env = MagicMock()
    mock_env.page = MagicMock()

    mw = DialogMiddleware(mock_env)

    # Simulate dialog event
    mock_dialog = MagicMock()
    mock_dialog.message = "Hello World"
    mock_dialog.type = "alert"
    mock_dialog.dismiss = AsyncMock()

    # Manually trigger the callback
    await mw._on_dialog(mock_dialog)

    assert mw.last_dialog_message == "Hello World"
    mock_dialog.dismiss.assert_called_once()

    # Verify after_action injects it
    result = await mw.after_action("click_at", {}, {"status": "ok"})
    assert result["browser_dialog"] == "Hello World"
    assert mw.last_dialog_message is None
