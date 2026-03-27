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
from unittest.mock import AsyncMock, MagicMock, patch
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.tool_executor import ToolExecutor
from computer_use_eval.core.base import Action


@pytest.mark.asyncio
@patch("computer_use_eval.browser.playwright_env.async_playwright")
async def test_block_heavy_resources(mock_ap):
    mock_playwright = AsyncMock()
    mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

    mock_browser = AsyncMock()
    mock_playwright.chromium.launch.return_value = mock_browser

    mock_context = AsyncMock()
    mock_browser.new_context.return_value = mock_context

    mock_page = AsyncMock()
    mock_page.set_default_timeout = MagicMock()
    mock_page.set_default_navigation_timeout = MagicMock()
    mock_page.on = MagicMock()
    mock_context.new_page.return_value = mock_page

    env = PlaywrightEnv(block_heavy_resources=True)
    await env.start()

    # Verify that page.route was called to block resources
    mock_page.route.assert_called_once()
    args, _ = mock_page.route.call_args
    assert "**/*.{png,jpg,jpeg,webp,gif,svg,woff,woff2,mp3,mp4}" in args[0]

    # Silence un-awaited mocked coroutines
    mock_page.set_default_timeout.return_value = None
    mock_page.set_default_navigation_timeout.return_value = None
    mock_page.on.return_value = None


@pytest.mark.asyncio
@patch("computer_use_eval.browser.playwright_env.async_playwright")
async def test_enable_mutation_observer(mock_ap):
    mock_playwright = AsyncMock()
    mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

    mock_browser = AsyncMock()
    mock_playwright.chromium.launch.return_value = mock_browser

    mock_context = AsyncMock()
    mock_browser.new_context.return_value = mock_context

    mock_page = AsyncMock()
    mock_page.set_default_timeout = MagicMock()
    mock_page.set_default_navigation_timeout = MagicMock()
    mock_page.on = MagicMock()
    mock_context.new_page.return_value = mock_page

    env = PlaywrightEnv(enable_mutation_observer=True)
    await env.start()

    # Verify that add_init_script was called to inject the observer
    mock_context.add_init_script.assert_called_once()
    args, _ = mock_context.add_init_script.call_args
    assert "MutationObserver" in args[0]

    # Silence un-awaited mocked coroutines
    mock_page.set_default_timeout.return_value = None
    mock_page.set_default_navigation_timeout.return_value = None
    mock_page.on.return_value = None
    assert "window.ui_changed = false" in args[0]


@pytest.mark.asyncio
async def test_tool_executor_uses_mutation_observer():
    env = PlaywrightEnv(enable_mutation_observer=True)
    env.page = AsyncMock()
    env.perception_service = MagicMock()

    # Simulate first evaluate call (reset) returning None, second (check at i=1) returning True (mutation detected)
    env.page.evaluate.side_effect = [None, True]

    executor = ToolExecutor(env)
    executor.execute = AsyncMock(return_value=({"status": "ok"}, 0.05))

    action1 = Action(id="id_1", name="click_at", args={"target": "button1"})
    action2 = Action(id="id_2", name="type_text_at", args={"target": "button2"})

    results, _ = await executor.execute_bundle([action1, action2])

    # First action executes fine, second action gets cancelled because window.ui_changed evaluated to True
    assert len(results) == 2
    assert results[0].result_data["status"] == "ok"
    assert results[1].result_data["error"] == "CANCELLED_BY_PERCEPTION_GUARD"
