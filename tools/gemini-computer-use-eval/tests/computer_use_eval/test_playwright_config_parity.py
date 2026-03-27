# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.mark.asyncio
async def test_playwright_default_config_parity():
    """
    Verify that PlaywrightEnv defaults align with qa-order-entry-v2.py
    for performance parity.
    """
    # Target values from qa-order-entry-v2.py
    TARGET_VIEWPORT = {"width": 1440, "height": 900}
    TARGET_TIMEOUT = 60000
    TARGET_SLOW_MO = 0

    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_playwright:
        mock_playwright_obj = MagicMock()
        mock_playwright_obj.stop = AsyncMock()
        mock_playwright.return_value.start = AsyncMock(
            return_value=mock_playwright_obj)

        mock_browser_type = AsyncMock()
        mock_playwright_obj.chromium = mock_browser_type
        mock_browser = AsyncMock()
        mock_browser_type.launch.return_value = mock_browser
        mock_context = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        mock_page = AsyncMock()
        # set_default_timeout is synchronous
        mock_page.set_default_timeout = MagicMock()
        mock_page.set_default_navigation_timeout = MagicMock()
        mock_page.on = MagicMock()
        mock_context.new_page.return_value = mock_page

        # Initialize env with NO explicit overrides to test defaults
        env = PlaywrightEnv()

        await env.start()

        # Verify Launch Args - expect slow_mo to be 0 by default now
        mock_browser_type.launch.assert_called_once()
        launch_kwargs = mock_browser_type.launch.call_args.kwargs

        # Current implementation is 500, we want 0. This assertion should fail.
        assert launch_kwargs.get("slow_mo") == TARGET_SLOW_MO, (
            f"Expected slow_mo={TARGET_SLOW_MO}, got {launch_kwargs.get('slow_mo')}"
        )

        # Verify Viewport - Current implementation is (1280, 720), we want (1400, 900). This assertion should fail.
        mock_browser.new_context.assert_called_once()
        context_kwargs = mock_browser.new_context.call_args.kwargs
        assert context_kwargs["viewport"] == TARGET_VIEWPORT, (
            f"Expected viewport={TARGET_VIEWPORT}, got {context_kwargs.get('viewport')}"
        )

        # Verify Timeouts - Current implementation doesn't set them. These assertions should fail.
        mock_page.set_default_timeout.assert_called_with(TARGET_TIMEOUT)
        mock_page.set_default_navigation_timeout.assert_called_with(
            TARGET_TIMEOUT)

        await env.stop()
