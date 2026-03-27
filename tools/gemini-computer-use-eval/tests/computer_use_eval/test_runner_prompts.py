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
from unittest.mock import AsyncMock, patch
from computer_use_eval.prompts import DEFAULT_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_runner_uses_default_prompt_when_none_provided():
    """
    Verify that SessionFactory uses DEFAULT_SYSTEM_PROMPT when config has no system_prompt.
    """
    config = {
        "agent": {},  # No system_prompt
        "task": {
            "goal": "Do something"
        },
    }

    with patch("computer_use_eval.core.session_factory.PlaywrightEnv"), \
         patch("computer_use_eval.core.session_factory.GeminiAgent") as mock_agent_cls, \
         patch("computer_use_eval.core.session_factory.genai.Client"), \
         patch("computer_use_eval.core.session_factory.ContextPipelineFactory"):
        mock_agent_instance = AsyncMock()
        mock_agent_cls.return_value = mock_agent_instance

        from computer_use_eval.core.session_factory import SessionFactory

        SessionFactory.create_session((1000, 1000),
                                      config=config,
                                      run_id="run_id",
                                      video_output_path="path")

        call_kwargs = mock_agent_cls.call_args.kwargs
        assert call_kwargs["system_prompt"] == DEFAULT_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_runner_respects_full_override():
    """
    Verify that SessionFactory uses ONLY the custom prompt if provided (no {{DEFAULT}}).
    """
    custom = "You are a custom agent."
    config = {
        "agent": {
            "system_prompt": custom
        },
        "task": {
            "goal": "Do something"
        }
    }

    with patch("computer_use_eval.core.session_factory.PlaywrightEnv"), \
         patch("computer_use_eval.core.session_factory.GeminiAgent") as mock_agent_cls, \
         patch("computer_use_eval.core.session_factory.genai.Client"), \
         patch("computer_use_eval.core.session_factory.ContextPipelineFactory"):
        mock_agent_instance = AsyncMock()
        mock_agent_cls.return_value = mock_agent_instance

        from computer_use_eval.core.session_factory import SessionFactory

        SessionFactory.create_session((1000, 1000),
                                      config=config,
                                      run_id="run_id",
                                      video_output_path="path")

        call_kwargs = mock_agent_cls.call_args.kwargs
        assert call_kwargs["system_prompt"] == custom
        assert DEFAULT_SYSTEM_PROMPT not in call_kwargs["system_prompt"]


@pytest.mark.asyncio
async def test_runner_supports_extension_substitution():
    """
    Verify that SessionFactory substitutes {{DEFAULT}} with DEFAULT_SYSTEM_PROMPT.
    """
    custom = "PREAMBLE\n\n{{DEFAULT}}\n\nPOSTSCRIPT"
    config = {
        "agent": {
            "system_prompt": custom
        },
        "task": {
            "goal": "Do something"
        }
    }

    with patch("computer_use_eval.core.session_factory.PlaywrightEnv"), \
         patch("computer_use_eval.core.session_factory.GeminiAgent") as mock_agent_cls, \
         patch("computer_use_eval.core.session_factory.genai.Client"), \
         patch("computer_use_eval.core.session_factory.ContextPipelineFactory"):
        mock_agent_instance = AsyncMock()
        mock_agent_cls.return_value = mock_agent_instance

        from computer_use_eval.core.session_factory import SessionFactory

        SessionFactory.create_session((1000, 1000),
                                      config=config,
                                      run_id="run_id",
                                      video_output_path="path")

        call_kwargs = mock_agent_cls.call_args.kwargs
        prompt = call_kwargs["system_prompt"]

        assert "PREAMBLE" in prompt
        assert DEFAULT_SYSTEM_PROMPT in prompt
        assert "POSTSCRIPT" in prompt
        assert "{{DEFAULT}}" not in prompt


def test_default_prompt_components():
    """
    Verify that the DEFAULT_SYSTEM_PROMPT contains the new Gemini 3.0 Flash
    required components (Spatial Awareness, Visual Delta Verification)
    and does not contain the deprecated wait_5_seconds instruction.
    """
    assert "SPATIAL AWARENESS" in DEFAULT_SYSTEM_PROMPT
    assert "VISUAL DELTA VERIFICATION" in DEFAULT_SYSTEM_PROMPT
    assert "wait_5_seconds" not in DEFAULT_SYSTEM_PROMPT
    assert "NO EXPLICIT WAITS" in DEFAULT_SYSTEM_PROMPT
