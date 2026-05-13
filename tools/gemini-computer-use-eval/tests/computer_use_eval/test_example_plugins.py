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
from examples.plugins.hello_world import HelloWorldAction
from examples.plugins.smart_scroll import ScrollToViewAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.utils import CoordinateScaler


@pytest.mark.asyncio
async def test_hello_world_action():
    action = HelloWorldAction()
    env = MagicMock(spec=PlaywrightEnv)

    result = await action.execute(env, {"message": "Test Message"})

    assert result["status"] == "ok"
    assert result["plugin_message"] == "Test Message"


@pytest.mark.asyncio
async def test_smart_scroll_action_success():
    action = ScrollToViewAction()
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = AsyncMock()

    # Mock evaluate to return True (element found and scrolled)
    env.page.evaluate.return_value = True

    result = await action.execute(env, {"x": 500, "y": 500})

    assert result["status"] == "ok"
    assert "Scrolled element" in result["message"]
    env.page.evaluate.assert_called_once()


@pytest.mark.asyncio
async def test_smart_scroll_action_no_page():
    action = ScrollToViewAction()
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = None

    result = await action.execute(env, {"x": 500, "y": 500})

    assert "error" in result
    assert result["error"] == "Page not available"
