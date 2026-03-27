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


@pytest.fixture
def mock_playwright_setup():
    with patch("computer_use_eval.browser.playwright_env.async_playwright"
              ) as mock_pw:
        mock_pw_instance = MagicMock()
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # Setup AsyncMocks for awaitable methods
        mock_pw.return_value.start = AsyncMock(return_value=mock_pw_instance)
        mock_pw_instance.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_pw_instance.chromium.connect_over_cdp = AsyncMock(
            return_value=mock_browser)
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_context.new_page = AsyncMock(return_value=mock_page)

        # Setup page methods used in start() fingerprinting
        mock_page.evaluate = AsyncMock(side_effect=[
            "Mozilla/5.0",  # User agent
            {
                "w": 1280,
                "h": 720,
                "devicePixelRatio": 1
            },  # Viewport/DPR
        ])
        mock_page.wait_for_load_state = AsyncMock()
        mock_page.screenshot = AsyncMock(return_value=b"fake_image")
        mock_page.wait_for_timeout = (
            AsyncMock())  # Ensure wait_for_timeout is an AsyncMock
        mock_page.click = AsyncMock()  # Ensure click is an AsyncMock
        mock_page.mouse.click = AsyncMock(
        )  # Ensure mouse.click is an AsyncMock

        # Setup cleanup methods
        mock_context.close = AsyncMock()
        mock_browser.close = AsyncMock()
        mock_pw_instance.stop = AsyncMock()

        yield {
            "pw": mock_pw,
            "pw_instance": mock_pw_instance,
            "browser": mock_browser,
            "context": mock_context,
            "page": mock_page,
        }


@pytest.mark.asyncio
async def test_playwright_env_start_local(mock_playwright_setup):
    env = PlaywrightEnv(headless=True)
    await env.start()

    setup = mock_playwright_setup
    setup["pw_instance"].chromium.launch.assert_called_once()
    assert env.page == setup["page"]


@pytest.mark.asyncio
async def test_playwright_env_start_remote(mock_playwright_setup):
    headers = {"Auth": "Token"}
    env = PlaywrightEnv(cdp_url="ws://remote", cdp_headers=headers)
    await env.start()

    setup = mock_playwright_setup
    setup["pw_instance"].chromium.connect_over_cdp.assert_called_with(
        "ws://remote", headers=headers)


@pytest.mark.asyncio
async def test_playwright_env_stop(mock_playwright_setup):
    env = PlaywrightEnv()
    await env.start()
    await env.stop()

    setup = mock_playwright_setup
    setup["context"].close.assert_called_once()
    setup["browser"].close.assert_called_once()
    setup["pw_instance"].stop.assert_called_once()


@pytest.mark.asyncio
async def test_playwright_env_context_manager(mock_playwright_setup):
    async with PlaywrightEnv() as env:
        await env.start()
        assert env.page == mock_playwright_setup["page"]

    setup = mock_playwright_setup
    setup["context"].close.assert_called_once()
    setup["browser"].close.assert_called_once()
    setup["pw_instance"].stop.assert_called_once()


@pytest.mark.asyncio
async def test_get_state(mock_playwright_setup):
    env = PlaywrightEnv()
    await env.start()

    setup = mock_playwright_setup
    setup["page"].screenshot = AsyncMock(return_value=b"fake_image_data")
    setup["page"].url = "http://test.com"
    setup["page"].title = AsyncMock(return_value="Test Title")

    state = await env.get_state()

    assert state["url"] == "http://test.com"
    assert state["title"] == "Test Title"
    assert "screenshot" in state
    assert len(state["screenshot"]) > 0


@pytest.mark.asyncio
async def test_get_active_element_info(mock_playwright_setup):
    env = PlaywrightEnv()
    await env.start()

    setup = mock_playwright_setup
    expected_info = {"tagName": "INPUT", "id": "search"}
    setup["page"].evaluate = AsyncMock(return_value=expected_info)

    info = await env.get_active_element_info()

    assert info == expected_info
    setup["page"].evaluate.assert_called_once()
