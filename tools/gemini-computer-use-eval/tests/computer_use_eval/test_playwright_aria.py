# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

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
