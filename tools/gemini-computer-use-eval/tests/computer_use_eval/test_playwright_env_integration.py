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
import os
from unittest.mock import MagicMock, patch, AsyncMock
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from PIL import Image


@pytest.mark.asyncio
async def test_perception_engine_integration():
    # patch PerceptionService and async_playwright
    with patch.dict(os.environ, {"ENABLE_PERCEPTION_ENGINE": "true"}), \
         patch("computer_use_eval.browser.perception.ScreenBuffer") as MockBuffer, \
         patch("computer_use_eval.browser.playwright_env.async_playwright") as MockPlaywright:
        # Setup mocks
        mock_buffer_instance = MockBuffer.return_value
        # Mock get_latest_frame to return a red image
        mock_buffer_instance.get_latest_frame.return_value = Image.new(
            "RGB", (100, 100), color="red"
        )

        # Setup Playwright mocks
        mock_playwright_cm = MockPlaywright.return_value
        mock_playwright_obj = AsyncMock()
        mock_playwright_cm.start = AsyncMock(return_value=mock_playwright_obj)

        mock_browser = AsyncMock()
        mock_playwright_obj.chromium.launch.return_value = mock_browser
        mock_context = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        mock_page = AsyncMock()
        mock_page.set_default_timeout = MagicMock()
        mock_page.set_default_navigation_timeout = MagicMock()
        mock_page.on = MagicMock()
        mock_context.new_page.return_value = mock_page

        # Initialize
        env = PlaywrightEnv(headless=True)

        # Verify perception_service initialization
        assert env.perception_service is not None
        assert env.perception_service.screen_buffer is not None

        # Start
        await env.start()
        mock_buffer_instance.start.assert_called_once()

        # Use 'env.page' mock to verify calls
        env.page = mock_page

        # Get Screenshot (Primary Path)
        screenshot_bytes = await env.get_screenshot()

        # Verify it used the buffer
        mock_buffer_instance.get_latest_frame.assert_called_once_with(
            wait_for_stability=False
        )
        assert len(screenshot_bytes) > 0

        # Verify fallback was NOT called
        mock_page.screenshot.assert_not_called()

        # Stop
        await env.stop()
        mock_buffer_instance.stop.assert_called_once()


@pytest.mark.asyncio
async def test_perception_engine_fallback():
    with patch.dict(os.environ, {"ENABLE_PERCEPTION_ENGINE": "true"}), \
         patch("computer_use_eval.browser.perception.ScreenBuffer") as MockBuffer, \
         patch("computer_use_eval.browser.playwright_env.async_playwright") as MockPlaywright:
        # Setup: Buffer returns None (failed capture)
        mock_buffer_instance = MockBuffer.return_value
        mock_buffer_instance.get_latest_frame.return_value = None

        # Setup Playwright mocks
        mock_playwright_cm = MockPlaywright.return_value
        mock_playwright_obj = AsyncMock()
        mock_playwright_cm.start = AsyncMock(return_value=mock_playwright_obj)

        mock_browser = AsyncMock()
        mock_playwright_obj.chromium.launch.return_value = mock_browser

        mock_context = AsyncMock()
        mock_browser.new_context.return_value = mock_context

        mock_page = AsyncMock()
        mock_page.set_default_timeout = MagicMock()
        mock_page.set_default_navigation_timeout = MagicMock()
        mock_page.on = MagicMock()
        mock_context.new_page.return_value = mock_page
        # Mock standard screenshot return
        mock_page.screenshot.return_value = b"fallback_bytes"

        env = PlaywrightEnv(headless=True)
        await env.start()

        # Need to ensure env.page is set
        env.page = mock_page

        # Get Screenshot (Fallback Path)
        screenshot_bytes = await env.get_screenshot()

        # Verify fallback WAS called
        mock_page.screenshot.assert_called()
        assert screenshot_bytes == b"fallback_bytes"


@pytest.mark.asyncio
async def test_highlight_click():
    from computer_use_eval.actions import ClickAction

    with patch(
        "computer_use_eval.browser.playwright_env.async_playwright"
    ) as MockPlaywright:
        mock_playwright_cm = MockPlaywright.return_value
        mock_playwright_obj = AsyncMock()
        mock_playwright_cm.start = AsyncMock(return_value=mock_playwright_obj)

        mock_browser = AsyncMock()
        mock_playwright_obj.chromium.launch.return_value = mock_browser
        mock_context = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        mock_page = AsyncMock()
        mock_page.set_default_timeout = MagicMock()
        mock_page.set_default_navigation_timeout = MagicMock()
        mock_page.on = MagicMock()
        mock_page.wait_for_timeout = AsyncMock()
        mock_context.new_page.return_value = mock_page

        # Mock PerceptionService so we don't need mss.
        with patch("computer_use_eval.browser.playwright_env.PerceptionService"):
            env = PlaywrightEnv(headless=True)
            await env.start()
            env.page = mock_page

            # Execute click via ClickAction
            action = ClickAction()
            await action.execute(env, {"x": 100, "y": 200})

            # Verify highlight injected
            mock_page.evaluate.assert_called()
            # Verify it was the highlight script (check partial string)
            args, _ = mock_page.evaluate.call_args
            assert "document.createElement('div')" in args[0]

            # Verify click happened
            # (100, 200) normalized on 1440x900 -> (144, 180)
            mock_page.mouse.click.assert_called_with(144, 180)
