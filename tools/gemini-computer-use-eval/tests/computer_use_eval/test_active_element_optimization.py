# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from computer_use_eval.core.gemini_agent import GeminiAgent
from google.genai import types


@pytest.mark.asyncio
async def test_active_element_polling_optimization():
    """
    Verify that get_active_element_info is called only once per turn,
    even if multiple actions are executed.
    """
    agent = GeminiAgent()

    # Mock environment
    env = AsyncMock()
    env.page.on = MagicMock()
    # "fake_base64" encoded: ZmFrZV9iYXNlNjQ=
    env.get_screenshot.return_value = b"ZmFrZV9iYXNlNjQ="
    env.get_active_element_info.return_value = {"tagName": "INPUT"}
    env.get_page_url.return_value = "http://test.com"

    # Mock predict to return 2 actions
    mock_response = MagicMock()
    mock_response.candidates = [
        MagicMock(content=types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="click_at",
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
    mock_response.usage_metadata = None
    agent._predict = AsyncMock(return_value=mock_response)

    # Mock ToolExecutor
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor"
              ) as mock_executor_cls:
        mock_executor = MagicMock()
        mock_executor_cls.return_value = mock_executor
        from computer_use_eval.core.base import ActionExecutionResult

        mock_executor.execute_bundle = AsyncMock(return_value=(
            [
                ActionExecutionResult(
                    action_id="mock_1",
                    action_name="click_at",
                    result_data={"status": "ok"},
                    safety_acknowledged=False,
                ),
                ActionExecutionResult(
                    action_id="mock_2",
                    action_name="type_text_at",
                    result_data={"status": "ok"},
                    safety_acknowledged=False,
                ),
            ],
            0.1,
        ))
        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor.executor = mock_inner

        # Run one turn (limit to 1 step via max_steps override in settings if needed,
        # or just let it finish if no actions are returned in 2nd turn)

        # Second call to predict returns no actions to terminate loop
        mock_stop_response = MagicMock()
        mock_stop_response.candidates = [
            MagicMock(content=types.Content(role="model",
                                            parts=[types.Part(text="Done")]))
        ]
        mock_stop_response.usage_metadata = None
        agent._predict.side_effect = [mock_response, mock_stop_response]

        await agent.run_task("goal", env)

        # Verify get_active_element_info was called only ONCE during the first turn
        # (It should be called once per turn that has actions)
        assert env.get_active_element_info.call_count == 1
        assert env.get_page_url.call_count == 1
