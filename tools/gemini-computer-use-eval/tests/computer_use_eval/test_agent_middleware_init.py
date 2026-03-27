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
from computer_use_eval.core.gemini_agent import GeminiAgent
from computer_use_eval.config import settings


@pytest.mark.asyncio
async def test_agent_initializes_stalemate_detection_middleware():
    mock_env = MagicMock()
    mock_env.get_screenshot = AsyncMock(return_value=b"screenshotbytes")

    original_val = settings.ENABLE_STALEMATE_DETECTION
    settings.ENABLE_STALEMATE_DETECTION = True
    try:
        with patch("computer_use_eval.core.gemini_agent.ToolExecutor") as MockExecutor:
            with patch("computer_use_eval.core.gemini_agent.genai.Client"):
                with patch(
                    "computer_use_eval.core.middleware.stalemate_detection.StalemateDetectionMiddleware",
                ) as MockStalemateDetection:
                    agent = GeminiAgent(reflection_strategy="NUDGE")

                    try:
                        await agent.run_task("goal", mock_env)
                    except Exception as e:
                        print(f"Exception caught: {e}")
                        pass
                    MockStalemateDetection.assert_called_once()

                    call_args = MockExecutor.call_args
                    if call_args:
                        kwargs = call_args[1]
                        middleware_list = kwargs.get("middleware", [])
                        mock_instance = MockStalemateDetection.return_value
                        assert mock_instance in middleware_list
    finally:
        settings.ENABLE_STALEMATE_DETECTION = original_val
