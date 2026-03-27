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
import time
from unittest.mock import AsyncMock, MagicMock
from computer_use_eval.actions import ActionExecutor
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.mark.asyncio
async def test_action_executor_overhead():
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.page = AsyncMock()
    # Mock mouse/keyboard
    env.page.mouse.move = AsyncMock()
    env.page.mouse.click = AsyncMock()
    env.page.keyboard.type = AsyncMock()

    # Measure instantiation time
    start_init = time.perf_counter()
    executor = ActionExecutor()
    init_duration = time.perf_counter() - start_init

    # Measure execution dispatch time (mocking the actual action to be instant)
    args = {"x": 500, "y": 500}

    start_exec = time.perf_counter()
    await executor.execute(env, "click_at", args)
    exec_duration = time.perf_counter() - start_exec

    print(f"\nActionExecutor Init: {init_duration * 1000:.4f}ms")
    print(f"ActionExecutor Dispatch: {exec_duration * 1000:.4f}ms")

    # Assertions to ensure it's fast enough (e.g. < 1ms dispatch)
    assert exec_duration < 0.005  # 5ms limit for dispatch overhead
