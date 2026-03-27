# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from google.genai import types
from computer_use_eval.core.gemini_agent import GeminiAgent


@pytest.fixture
def mock_env():
    """Provides a mock PlaywrightEnv."""

    env = MagicMock()

    env.get_screenshot = AsyncMock(return_value=b"fake screenshot")

    env.get_page_url = AsyncMock(return_value="http://mock.url")

    env.get_active_element_info = AsyncMock(return_value={"tagName": "BODY"})

    return env


@pytest.fixture
def mock_genai_client():
    """Provides a mock genai.Client."""
    client = MagicMock()
    return client


@pytest.mark.asyncio
async def test_run_task_single_step_success(mock_env, mock_genai_client):
    """Test a single successful turn of the agent loop."""
    agent = GeminiAgent(client=mock_genai_client)

    # Mock the model to return a single 'click' action
    mock_response = MagicMock()
    mock_part = MagicMock()
    mock_part.function_call = types.FunctionCall(name="click_at",
                                                 args={
                                                     "x": 500,
                                                     "y": 500
                                                 })
    mock_candidate = MagicMock()
    mock_candidate.content.parts = [mock_part]
    mock_response.candidates = [mock_candidate]
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response)

    # Mock the executor to return a success status
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor",
               new_callable=MagicMock) as MockExecutor:
        mock_executor_instance = MockExecutor.return_value
        mock_executor_instance.execute_bundle = AsyncMock(
            return_value=[("mock_id", "click_at", {
                "status": "ok"
            }, False)])

        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor_instance.executor = mock_inner

        # Patch _predict to return the mock response and avoid infinite loop
        agent._predict = AsyncMock(return_value=mock_response)

        # We expect run_task to loop, so we'll patch MAX_STEPS to 1 for this test
        with patch.object(agent, "max_steps", 1):
            result = await agent.run_task("test goal", mock_env)

            # Assertions
            agent._predict.assert_called_once()
            mock_executor_instance.execute_bundle.assert_awaited_once()
            assert (result.success
                    is False)  # Since it hits MAX_STEPS without a text response


@pytest.mark.asyncio
async def test_run_task_model_finishes(mock_env, mock_genai_client):
    """Test the case where the model finishes by returning text instead of an action."""
    agent = GeminiAgent(client=mock_genai_client)

    # Mock the model to return a text response
    mock_response = MagicMock()
    mock_part = MagicMock()
    mock_part.function_call = None
    mock_part.text = "Task complete"
    mock_candidate = MagicMock()
    mock_candidate.content.parts = [mock_part]
    mock_response.candidates = [mock_candidate]
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response)

    result = await agent.run_task("test goal", mock_env)

    # Assertions
    assert result.success is True
    assert result.metadata["final_message"] == "Task complete"


@pytest.mark.asyncio
async def test_run_task_handles_unknown_tool(mock_env, mock_genai_client):
    """Test that the agent handles and reports an unknown tool call from the model."""
    agent = GeminiAgent(client=mock_genai_client)

    mock_response = MagicMock()
    mock_candidate = MagicMock()
    mock_candidate.content = types.Content(
        role="model",
        parts=[
            types.Part(function_call=types.FunctionCall(
                name="unknown_tool", args={}, id="mock_id"))
        ],
    )
    mock_response.candidates = [mock_candidate]
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response)

    from computer_use_eval.core.base import ActionExecutionResult

    with patch("computer_use_eval.core.gemini_agent.ToolExecutor",
               new_callable=MagicMock) as MockExecutor:
        mock_executor_instance = MockExecutor.return_value
        mock_executor_instance.execute_bundle = AsyncMock(return_value=(
            [
                ActionExecutionResult(
                    action_id="mock_id",
                    action_name="unknown_tool",
                    result_data={"error": "Unknown tool: unknown_tool"},
                    safety_acknowledged=False,
                )
            ],
            0.05,
        ))
        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor_instance.executor = mock_inner

        # Ensure run_task loop terminates after 1 step
        agent._predict = AsyncMock(
            side_effect=[mock_response, MagicMock(candidates=[])])

        with patch.object(agent, "max_steps", 1):
            result = await agent.run_task("test goal", mock_env)

            assert result.success is False
            assert ("unknown_tool" == agent.history_manager.get_full_history()
                    [-1].parts[0].function_response.name)
