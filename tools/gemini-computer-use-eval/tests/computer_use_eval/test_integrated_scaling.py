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
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.actions import ClickAction


@pytest.mark.asyncio
async def test_integrated_coordinate_scaling():
    # 1440x900 resolution
    env = PlaywrightEnv(resolution=(1440, 900))
    # Mocking page and mouse
    env.page = MagicMock()
    env.page.mouse = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()
    env.page.evaluate = AsyncMock()  # For highlight_click

    action = ClickAction()
    # 500, 500 normalized should be 720, 450 absolute
    await action.execute(env, {"x": 500, "y": 500})

    env.page.mouse.click.assert_called_once_with(720, 450)


@pytest.mark.asyncio
async def test_click_action_scaling():
    # 1440x900 resolution
    env = PlaywrightEnv(resolution=(1440, 900))
    env.page = MagicMock()
    env.page.mouse = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()
    env.page.evaluate = AsyncMock()

    action = ClickAction()
    # x: 0.25 * 1440 = 360, y: 0.75 * 900 = 675
    await action.execute(env, {"x": 250, "y": 750})
    env.page.mouse.click.assert_called_once_with(360, 675)
