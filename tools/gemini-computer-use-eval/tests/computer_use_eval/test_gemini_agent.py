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

from unittest.mock import MagicMock
from computer_use_eval.core.gemini_agent import GeminiAgent
from computer_use_eval.config import settings
from computer_use_eval.safety import (
    InteractiveSafetyPolicy,
    AutoApproveSafetyPolicy,
)


def test_gemini_agent_dependency_injection():
    """Test that we can inject a mock client into GeminiAgent."""
    mock_client = MagicMock()

    # Initialize agent with injected client
    agent = GeminiAgent(
        system_prompt="Test System Prompt",
        model_name="test-model-1.0",
        client=mock_client,
    )

    # Verify the client is used
    assert agent.client == mock_client
    assert agent.model_version == "test-model-1.0"
    assert agent.system_prompt == "Test System Prompt"


def test_gemini_agent_default_init():
    """Test that default initialization still works (uses settings)."""
    # Mock settings.API_KEY to avoid warning/error if not set
    # (Though logic handles None gracefully by logging warning)

    agent = GeminiAgent()
    assert agent.model_version == settings.MODEL_NAME


def test_gemini_agent_safety_policy_injection():
    """Test that we can inject a custom safety policy."""
    policy = AutoApproveSafetyPolicy()
    agent = GeminiAgent(safety_policy=policy)

    assert agent.safety_policy == policy


def test_gemini_agent_default_safety_policy():
    """Test that the default safety policy matches the factory logic."""
    from computer_use_eval.safety import AutoApproveSafetyPolicy

    agent = GeminiAgent()
    if settings.HEADLESS_MODE:
        assert isinstance(agent.safety_policy, AutoApproveSafetyPolicy)
    else:
        assert isinstance(agent.safety_policy, InteractiveSafetyPolicy)
