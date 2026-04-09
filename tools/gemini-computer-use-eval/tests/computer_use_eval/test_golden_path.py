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
from unittest.mock import AsyncMock, patch, MagicMock
from computer_use_eval.core.gemini_agent import GeminiAgent
from computer_use_eval.core.base import Action


@pytest.mark.asyncio
async def test_golden_path_execution():
    """
    Verify that GeminiAgent executes actions from golden_path if provided,
    bypassing the model prediction.
    """
    golden_path = [
        Action(name="click_at", args={
            "x": 10,
            "y": 20
        }),
        Action(name="type_text_at", args={
            "x": 10,
            "y": 20,
            "text": "hello"
        }),
    ]

    agent = GeminiAgent()
    # Mock _predict to ensure it's NOT called
    agent._predict = AsyncMock()

    # Mock ToolExecutor
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor"
              ) as mock_executor_cls:
        from computer_use_eval.core.base import ActionExecutionResult

        mock_executor = MagicMock()
        mock_executor_cls.return_value = mock_executor
        mock_executor.execute_bundle = AsyncMock(side_effect=[
            (
                [
                    ActionExecutionResult(
                        action_id="mock_id_1",
                        action_name="click_at",
                        result_data={"status": "ok"},
                        safety_acknowledged=False,
                    )
                ],
                0.05,
            ),
            (
                [
                    ActionExecutionResult(
                        action_id="mock_id_2",
                        action_name="type_text_at",
                        result_data={"status": "ok"},
                        safety_acknowledged=False,
                    )
                ],
                0.05,
            ),
        ])
        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor.executor = mock_inner

        # Mock Environment
        env = AsyncMock()
        env.page.on = MagicMock()
        # "fake_base64" encoded: ZmFrZV9iYXNlNjQ=
        env.get_screenshot.return_value = b"ZmFrZV9iYXNlNjQ="
        env.get_active_element_info.return_value = {}
        env.get_page_url.return_value = "http://test.com"

        # Run task with golden_path
        await agent.run_task("goal", env, golden_path=golden_path)

        # Verify _predict was NOT called
        agent._predict.assert_not_called()

        # Verify executor was called with golden path actions
        assert mock_executor.execute_bundle.call_count == 2

        # Check first call
        call1 = mock_executor.execute_bundle.call_args_list[0]
        # args[0] is the list of Actions
        assert call1[0][0][0].name == "click_at"
        assert call1[0][0][0].args == {"x": 10, "y": 20}

        # Check second call
        call2 = mock_executor.execute_bundle.call_args_list[1]
        assert call2[0][0][0].name == "type_text_at"
        assert call2[0][0][0].args == {"x": 10, "y": 20, "text": "hello"}
