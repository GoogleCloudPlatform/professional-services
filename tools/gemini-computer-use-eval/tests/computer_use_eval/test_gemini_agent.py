# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

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
