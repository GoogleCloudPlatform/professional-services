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
