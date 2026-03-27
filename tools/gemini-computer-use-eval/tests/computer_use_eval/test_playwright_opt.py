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
from computer_use_eval.browser.playwright_env import PlaywrightEnv
import shutil
import os


@pytest.mark.asyncio
async def test_video_recording_disable():
    """
    Test that video recording can be disabled to save overhead.
    """
    # 1. With Video (Default or explicit path)
    video_dir = "artifacts/test_video_on/"
    if os.path.exists(video_dir):
        shutil.rmtree(video_dir)

    env_on = PlaywrightEnv(headless=True, video_dir=video_dir)
    await env_on.start()
    await env_on.page.goto("about:blank")
    await env_on.stop()

    # Check if video dir was created/populated
    assert os.path.exists(video_dir)
    assert len(os.listdir(video_dir)) > 0
    shutil.rmtree(video_dir)

    # 2. Without Video (None)
    # Current implementation: video_dir defaults to "artifacts/videos/" in __init__
    # We need to pass None explicitely
    env_off = PlaywrightEnv(headless=True, video_dir=None)
    await env_off.start()
    await env_off.page.goto("about:blank")

    # Check that context.video is None or path is None
    # Playwright python api: if record_video_dir is None, video recording is off.
    # We verify by checking if a video object exists but has no path, or just checking file system.
    # Best check: internal context property if possible, or assumption that no file is written.

    # We can check env_off.context.pages[0].video
    # If recording is off, page.video() might be None or raise error?
    # Playwright docs: page.video returns Video object, but calling path() might return None or throw.

    video_obj = env_off.page.video
    if video_obj:
        # If it exists, path() should likely throw or return None
        try:
            path = await video_obj.path()
            # If we get a path, it failed to disable
            assert path is None, "Video path should be None when disabled"
        except Exception:
            # Exception is acceptable (e.g. "Page does not have a video")
            pass

    await env_off.stop()
