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


@pytest.mark.asyncio
async def test_get_aria_snapshot_exists():
    env = PlaywrightEnv()
    # Mock the page object
    env.page = MagicMock()
    env.page.accessibility = MagicMock()
    env.page.accessibility.snapshot = AsyncMock(return_value={
        "role": "root",
        "name": "Test Page"
    })

    # Check if the method exists and is callable
    assert hasattr(env, "get_aria_snapshot")
    result = await env.get_aria_snapshot()
    assert result is not None
