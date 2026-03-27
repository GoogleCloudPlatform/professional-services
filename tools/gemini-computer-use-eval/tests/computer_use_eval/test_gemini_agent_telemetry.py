# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from computer_use_eval.core.gemini_agent import GeminiAgent


@pytest.mark.asyncio
async def test_agent_telemetry_captures_granular_timings():
    # Setup mocks
    mock_env = AsyncMock()
    mock_env.page.on = MagicMock()
    # "base64_image" is not valid base64 (length 12 is ok but padding might be off)
    # Use a simple valid base64 string: "Zm9v" is "foo"
    mock_env.get_screenshot.return_value = b"Zm9v"
    mock_env.get_active_element_info.return_value = {}
    mock_env.get_page_url.return_value = "http://test.com"

    # Mock client and response
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_candidate = MagicMock()
    mock_content = MagicMock()
    mock_content.role = "model"  # Fix Pydantic validation

    # Setup candidate content with function call
    mock_part = MagicMock()
    mock_part.function_call.name = "click_at"
    mock_part.function_call.args = {"x": 100, "y": 200}
    mock_content.parts = [mock_part]
    mock_candidate.content = mock_content
    mock_response.candidates = [mock_candidate]

    # Mock _predict to return response
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    # Mock ToolExecutor
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor") as MockExecutor:
        mock_executor_instance = MagicMock()
        from computer_use_eval.core.base import ActionExecutionResult

        mock_executor_instance.execute_bundle = AsyncMock(
            return_value=(
                [
                    ActionExecutionResult(
                        action_id="mock_id_123",
                        action_name="click_at",
                        result_data={"status": "success"},
                        safety_acknowledged=False,
                    )
                ],
                0.05,
            )
        )

        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor_instance.executor = mock_inner
        MockExecutor.return_value = mock_executor_instance

        # Initialize agent
        agent = GeminiAgent(client=mock_client)

        # Override _predict to avoid complex mocking of retry logic if needed,
        # but here we mock client so it should be fine.
        # Actually _predict calls client.models.generate_content.
        # We need to ensure _extract_actions returns our action
        # OR mock _predict to return the response we built.
        # Let's mock _predict directly to be safe and simple
        agent._predict = AsyncMock(return_value=mock_response)

        # Run task for 1 step
        # We need to make sure loop runs at least once.
        # agent.run_task loops while step < max_steps.
        # We can set max_steps=1 via settings, or just let it run once and return.
        # To make it stop, we can have _extract_actions return empty list on second call?
        # Or just check the result after 1 step.
        # But run_task is a loop.
        # We can mock _predict to return actions first time, then empty list second time.

        # Setup _predict side effects
        empty_response = MagicMock()
        empty_response.candidates = []
        agent._predict.side_effect = [mock_response, empty_response]

        result = await agent.run_task("goal", mock_env)

        # Verify step_details
        assert result.metadata is not None
        step_details = result.metadata.get("step_details", [])
        assert len(step_details) > 0

        first_step = step_details[0]
        durations = first_step.get("durations", {})

        # Check for standard keys
        assert "observation" in durations or "post_observation" in durations
        assert "prediction" in durations
        assert "execution" in durations

        # Check for NEW granular keys (this should fail initially)
        assert "action_durations" in durations
        action_durations = durations["action_durations"]
        assert isinstance(action_durations, list)
        assert len(action_durations) == 1
        assert action_durations[0]["name"] == "click_at"
        assert "duration" in action_durations[0]
        assert action_durations[0]["duration"] > 0
