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
from computer_use_eval.core.gemini_agent import GeminiAgent
from google.genai import types


@pytest.mark.asyncio
async def test_agent_result_includes_thinking_tokens():
    mock_client = MagicMock()
    # Use a model name that triggers Gemini 3 logic
    agent = GeminiAgent(model_name="gemini-3.0-flash", client=mock_client)

    # Mock response with usage_metadata containing thinking_token_count
    mock_response = MagicMock()
    mock_response.usage_metadata.prompt_token_count = 100
    mock_response.usage_metadata.candidates_token_count = 50
    # Add thinking_token_count to the mock
    mock_response.usage_metadata.thinking_token_count = 30

    mock_candidate = MagicMock()
    mock_candidate.content.parts = [types.Part(text="Final answer.")]
    mock_response.candidates = [mock_candidate]

    mock_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response)

    # Mock env
    mock_env = MagicMock()
    mock_env.get_screenshot = AsyncMock(return_value=b"img")
    mock_env.get_active_element_info = AsyncMock(return_value={})
    mock_env.get_page_url = AsyncMock(return_value="url")

    # Run task - it should finish immediately because the mock returns text but no actions
    agent.max_steps = 5
    result = await agent.run_task("test goal", mock_env)

    assert result.thinking_tokens == 30
    assert result.metadata["total_thinking_tokens"] == 30
    assert result.metadata["total_input_tokens"] == 100
    assert result.metadata["total_output_tokens"] == 50
