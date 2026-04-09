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
from unittest.mock import patch, AsyncMock
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.mark.asyncio
async def test_standard_local_execution_no_cdp():
    """
    Ensures that when no CDP URL is provided, PlaywrightEnv launches a local browser.
    """
    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_ap:
        mock_playwright = AsyncMock()
        mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

        # Mock local launch
        mock_browser = AsyncMock()
        mock_playwright.chromium.launch = AsyncMock(return_value=mock_browser)

        env = PlaywrightEnv(cdp_url=None)
        await env.start()

        # Verify local launch was called
        mock_playwright.chromium.launch.assert_called_once()
        # Verify connect_over_cdp was NOT called
        mock_playwright.chromium.connect_over_cdp.assert_not_called()

        await env.stop()


@pytest.mark.asyncio
async def test_sandbox_connection_routing():
    """
    Ensures that when a CDP URL is provided, PlaywrightEnv connects via CDP.
    """
    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_ap:
        mock_playwright = AsyncMock()
        mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

        # Mock CDP connection
        mock_browser = AsyncMock()
        mock_playwright.chromium.connect_over_cdp = AsyncMock(
            return_value=mock_browser)

        cdp_url = "ws://test-sandbox:9222"
        cdp_headers = {"Authorization": "Bearer test-token"}

        env = PlaywrightEnv(cdp_url=cdp_url, cdp_headers=cdp_headers)
        await env.start()

        # Verify connect_over_cdp was called with correct args
        mock_playwright.chromium.connect_over_cdp.assert_called_once_with(
            cdp_url, headers=cdp_headers)
        # Verify local launch was NOT called
        mock_playwright.chromium.launch.assert_not_called()

        await env.stop()


@pytest.mark.asyncio
async def test_sandbox_fail_fast_behavior():
    """
    RED PHASE: Ensures that if connection to the sandbox fails, the system
    crashes immediately instead of falling back to local.
    """
    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_ap:
        mock_playwright = AsyncMock()
        mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

        # Simulate a connection failure (e.g., Timeout or Auth Error)
        mock_playwright.chromium.connect_over_cdp.side_effect = Exception(
            "Connection Refused")

        env = PlaywrightEnv(cdp_url="ws://broken-sandbox")

        with pytest.raises(Exception) as excinfo:
            await env.start()

        assert "Connection Refused" in str(excinfo.value)
        # CRITICAL: Verify it did NOT attempt to launch local Chromium
        mock_playwright.chromium.launch.assert_not_called()


@pytest.mark.asyncio
async def test_teardown_reliability():
    """
    Ensures that teardown is idempotent and closes all resources.
    """
    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_ap:
        mock_playwright = AsyncMock()
        mock_ap.return_value.start = AsyncMock(return_value=mock_playwright)

        mock_browser = AsyncMock()
        mock_context = AsyncMock()
        mock_page = AsyncMock()

        mock_playwright.chromium.launch.return_value = mock_browser
        mock_browser.new_context.return_value = mock_context
        mock_context.new_page.return_value = mock_page

        env = PlaywrightEnv()
        await env.start()
        await env.stop()

        # Verify closures
        mock_context.close.assert_called_once()
        mock_browser.close.assert_called_once()
        mock_playwright.stop.assert_called_once()

        # Second call to stop should do nothing
        await env.stop()
        mock_context.close.assert_called_once()
