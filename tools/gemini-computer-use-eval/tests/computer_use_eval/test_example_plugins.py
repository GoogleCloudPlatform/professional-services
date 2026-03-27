# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

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
