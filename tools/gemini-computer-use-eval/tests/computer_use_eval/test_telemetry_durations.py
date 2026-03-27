# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from computer_use_eval.core.gemini_agent import GeminiAgent
from google.genai import types


@pytest.mark.asyncio
async def test_granular_telemetry_timings():
    """
    Verify that GeminiAgent.run_task includes granular timing telemetry
    for each phase of the loop.
    """
    agent = GeminiAgent()

    # Mock environment
    env = AsyncMock()
    env.page.on = MagicMock()
    # Use valid base64
    env.get_screenshot.return_value = b"ZmFrZV9iYXNlNjQ="
    env.get_active_element_info.return_value = {}
    env.get_page_url.return_value = "http://test.com"

    # Mock predict to return one action then stop
    mock_response = MagicMock()
    mock_response.candidates = [
        MagicMock(
            content=types.Content(
                role="model",
                parts=[
                    types.Part(
                        function_call=types.FunctionCall(
                            name="click_at", args={"x": 1, "y": 2}
                        )
                    )
                ],
            )
        )
    ]
    mock_response.usage_metadata = MagicMock(
        prompt_token_count=10, candidates_token_count=5
    )

    mock_stop_response = MagicMock()
    mock_stop_response.candidates = [
        MagicMock(content=types.Content(role="model", parts=[types.Part(text="Done")]))
    ]
    mock_stop_response.usage_metadata = MagicMock(
        prompt_token_count=10, candidates_token_count=5
    )

    agent._predict = AsyncMock(side_effect=[mock_response, mock_stop_response])

    # Mock ToolExecutor
    from computer_use_eval.core.base import ActionExecutionResult

    with patch("computer_use_eval.core.gemini_agent.ToolExecutor") as mock_executor_cls:
        mock_executor = MagicMock()
        mock_executor_cls.return_value = mock_executor
        mock_executor.execute_bundle = AsyncMock(
            return_value=(
                [
                    ActionExecutionResult(
                        action_id="mock_id",
                        action_name="click_at",
                        result_data={"status": "ok"},
                        safety_acknowledged=False,
                    )
                ],
                0.05,  # total_mw_time
            )
        )
        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor.executor = mock_inner

        result = await agent.run_task("goal", env)

        assert result.success is True

        # Check for telemetry in metadata
        metadata = result.metadata
        assert "step_details" in metadata

        step_1 = metadata["step_details"][0]
        assert "durations" in step_1
        durations = step_1["durations"]

        # Verify specific phases are measured
        assert "observation" in durations
        assert "prediction" in durations
        assert "execution" in durations

        # Durations should be floats (seconds or ms)
        assert isinstance(durations["observation"], float)
        assert isinstance(durations["prediction"], float)
        assert isinstance(durations["execution"], float)
