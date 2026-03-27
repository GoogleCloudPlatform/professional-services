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
from computer_use_eval.actions import TypeAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.utils import CoordinateScaler


@pytest.mark.asyncio
async def test_smart_type_time_input():
    """
    Verify that TypeAction detects time inputs (HH:MM) and uses the robust
    handling logic: JS clear -> type digits only.
    """
    action = TypeAction()
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = MagicMock()
    env.page.mouse = MagicMock()
    env.page.mouse.click = AsyncMock()
    env.page.keyboard = MagicMock()
    env.page.keyboard.type = AsyncMock()
    env.page.evaluate = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()

    args = {"x": 500, "y": 500, "text": "12:30"}

    await action.execute(env, args)

    # Verify behavior for time input:
    # 1. Click (part of standard type, but we might override)
    # 2. Evaluate JS to clear
    # 3. Click again
    # 4. Type digits "1230"

    # Check if page.evaluate was called with the JS clearing script
    env.page.evaluate.assert_called()
    call_args = env.page.evaluate.call_args
    assert "document.elementFromPoint" in call_args[0][0]
    assert "el.value = ''" in call_args[0][0]

    # Check if page.keyboard.type was called with digits only
    env.page.keyboard.type.assert_called_with("1230", delay=80)


@pytest.mark.asyncio
async def test_standard_type_input():
    """
    Verify that normal text falls back to direct page interaction.
    """
    action = TypeAction()
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = MagicMock()
    env.page.mouse = MagicMock()
    env.page.mouse.click = AsyncMock()
    env.page.keyboard = MagicMock()
    env.page.keyboard.type = AsyncMock()
    env.page.keyboard.press = AsyncMock()
    env.page.evaluate = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()

    args = {"x": 500, "y": 500, "text": "Hello World"}

    await action.execute(env, args)

    # Verify direct page interaction
    env.page.mouse.click.assert_called()
    env.page.keyboard.type.assert_called_with("Hello World", delay=20)
