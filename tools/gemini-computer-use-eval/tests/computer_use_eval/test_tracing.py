# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import os
import pytest
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.mark.asyncio
async def test_tracing_generation(tmp_path):
    """Verifies that Playwright tracing generates a zip file."""
    video_dir = str(tmp_path / "artifacts")
    os.makedirs(video_dir, exist_ok=True)

    env = PlaywrightEnv(headless=True, video_dir=video_dir, enable_tracing=True)

    await env.start()
    # Perform a simple action to generate some trace data
    await env.page.goto("about:blank")
    await env.stop()

    trace_path = os.path.join(video_dir, "trace.zip")
    assert os.path.exists(trace_path), f"Trace file not found at {trace_path}"
    assert os.path.getsize(trace_path) > 0, "Trace file is empty"
