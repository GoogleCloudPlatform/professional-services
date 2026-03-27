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
async def test_thinking_config_injected_for_gemini_3():
    mock_client = MagicMock()
    agent = GeminiAgent(model_name="gemini-3.0-flash", client=mock_client)

    # Mock response to avoid parsing errors
    mock_response = MagicMock(spec=types.GenerateContentResponse)
    mock_response.usage_metadata = None
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    await agent._predict([types.Content(role="user", parts=[types.Part(text="hi")])])

    # Check the call args
    _, kwargs = mock_client.aio.models.generate_content.call_args
    config = kwargs["config"]

    assert config.thinking_config is not None
    assert config.thinking_config.include_thoughts is True


@pytest.mark.asyncio
async def test_thinking_config_NOT_injected_for_gemini_2():
    mock_client = MagicMock()
    agent = GeminiAgent(model_name="gemini-2.5-flash", client=mock_client)

    mock_response = MagicMock(spec=types.GenerateContentResponse)
    mock_response.usage_metadata = None
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    await agent._predict([types.Content(role="user", parts=[types.Part(text="hi")])])

    _, kwargs = mock_client.aio.models.generate_content.call_args
    config = kwargs["config"]

    assert not hasattr(config, "thinking_config") or config.thinking_config is None
