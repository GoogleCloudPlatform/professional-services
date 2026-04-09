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
from unittest.mock import MagicMock, patch, AsyncMock
from contextlib import nullcontext
from computer_use_eval.runner import run_single_resolution


@pytest.mark.asyncio
async def test_runner_passes_config_to_agent():
    # Mock dependencies
    mock_env = MagicMock()
    mock_env.start = AsyncMock()
    mock_env.stop = AsyncMock()
    mock_env.get_video_path = AsyncMock(return_value="video.mp4")

    mock_agent = MagicMock()
    # Fix the object MagicMock can't be used in 'await' expression error
    mock_agent.run_task = AsyncMock(return_value=MagicMock(
        success=True, steps=1, retries=0, history=[], metadata={}))

    with patch("computer_use_eval.runner.SessionFactory.create_session",
               return_value=(mock_env, mock_agent,
                             nullcontext())) as mock_factory:
        config = {
            "task": {
                "goal": "test"
            },
            "agent": {
                "context": {
                    "reflection_strategy": "DOM_SEARCH"
                }
            },
            "environment": {},
        }

        await run_single_resolution(1280, 720, config, "run1", "/tmp", None,
                                    None)

        # Verify SessionFactory was initialized with correct context config
        _, kwargs = mock_factory.call_args
        # In the new implementation, we pass the raw config to the factory
        passed_config = mock_factory.call_args[0][1]
        assert passed_config["agent"]["context"][
            "reflection_strategy"] == "DOM_SEARCH"
