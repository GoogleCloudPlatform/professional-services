# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from computer_use_eval.core.gemini_agent import GeminiAgent
from google.genai import types


@pytest.mark.asyncio
async def test_action_sequence_logging_structure():
    """
    Verify that GeminiAgent.run_task logs detailed action sequences
    including names, arguments, and results in metadata.
    """
    agent = GeminiAgent()

    # Mock environment
    env = AsyncMock()
    env.page.on = MagicMock()
    env.get_screenshot.return_value = b"ZmFrZV9iYXNlNjQ="
    env.get_active_element_info.return_value = {"tagName": "BUTTON"}
    env.get_page_url.return_value = "http://test.com"

    # Mock predict to return a batch of 2 actions
    mock_response = MagicMock()
    mock_response.candidates = [
        MagicMock(content=types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="hover_at",
                                                            args={
                                                                "x": 1,
                                                                "y": 2
                                                            })),
                types.Part(function_call=types.FunctionCall(name="type_text_at",
                                                            args={
                                                                "x": 3,
                                                                "y": 4,
                                                                "text": "hi"
                                                            })),
            ],
        ))
    ]
    mock_response.usage_metadata = MagicMock(prompt_token_count=10,
                                             candidates_token_count=5)

    mock_stop_response = MagicMock()
    mock_stop_response.candidates = [
        MagicMock(
            content=types.Content(role="model", parts=[types.Part(
                text="Done")]))
    ]
    mock_stop_response.usage_metadata = MagicMock(prompt_token_count=10,
                                                  candidates_token_count=5)

    agent._predict = AsyncMock(side_effect=[mock_response, mock_stop_response])

    # Mock ToolExecutor
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor"
              ) as mock_executor_cls:
        mock_executor = MagicMock()
        mock_executor_cls.return_value = mock_executor

        from computer_use_eval.core.base import ActionExecutionResult

        mock_executor.execute_bundle = AsyncMock(return_value=(
            [
                ActionExecutionResult(
                    action_id="mock_id_1",
                    action_name="hover_at",
                    result_data={"status": "clicked"},
                    safety_acknowledged=False,
                ),
                ActionExecutionResult(
                    action_id="mock_id_2",
                    action_name="type_text_at",
                    result_data={
                        "status": "typed",
                        "bundled": True
                    },
                    safety_acknowledged=False,
                ),
            ],
            0.1,
        ))

        # is_terminal is sync, and nested inside executor.executor
        mock_inner_executor = MagicMock()
        mock_inner_executor.is_terminal.return_value = False
        mock_executor.executor = mock_inner_executor

        result = await agent.run_task("goal", env)

        # Check for structured action data in metadata
        metadata = result.metadata
        assert "step_details" in metadata

        step_1 = metadata["step_details"][0]
        actions_logged = step_1["actions"]

        assert len(actions_logged) == 2

        # Check first action details
        assert actions_logged[0]["name"] == "hover_at"
        assert actions_logged[0]["args"] == {"x": 1, "y": 2}
        assert actions_logged[0]["result"]["status"] == "clicked"

        # Check second action details
        assert actions_logged[1]["name"] == "type_text_at"
        assert actions_logged[1]["args"] == {"x": 3, "y": 4, "text": "hi"}
        assert actions_logged[1]["result"]["status"] == "typed"
