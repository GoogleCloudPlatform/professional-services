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
from computer_use_eval.core.session_factory import SessionFactory


@pytest.mark.asyncio
async def test_factory_video_disable():
    """
    Test that SessionFactory respects enable_video=False.
    """
    # 1. Enabled (Default)
    config_on = {"environment": {"enable_video": True}}
    env, _, _ = SessionFactory.create_session(
        (1280, 720),
        config=config_on,
        run_id="test_video_enabled",
        video_output_path="/tmp/",
    )
    assert env.video_dir is not None

    # 2. Disabled
    config_off = {"environment": {"enable_video": False}}
    env_off, _, _ = SessionFactory.create_session(
        (1280, 720),
        config=config_off,
        run_id="test_video_disabled",
        video_output_path="/tmp/",
    )
    assert env_off.video_dir is None
