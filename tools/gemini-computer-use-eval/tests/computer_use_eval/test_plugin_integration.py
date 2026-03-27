# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from computer_use_eval.runner import run_single_resolution


@pytest.mark.asyncio
async def test_plugin_integration_runner():
    """
    Verify that custom_actions from config are passed to run_task.
    """
    config = {
        "agent": {
            "custom_actions": {
                "my_tool": "pkg.MyClass"
            }
        },
        "task": {
            "goal": "test"
        },
    }

    with patch("computer_use_eval.runner.SessionFactory.create_session") as mock_factory, \
         patch("computer_use_eval.runner.AssertionJudge"), \
         patch("computer_use_eval.runner.LLMLogJudge"):
        mock_env = AsyncMock()
        mock_agent_instance = AsyncMock()
        mock_factory.return_value = (mock_env, mock_agent_instance, MagicMock())

        mock_agent_instance.run_task.return_value = MagicMock(success=True,
                                                              steps=1,
                                                              retries=0,
                                                              metadata={})
        mock_agent_instance.client = MagicMock()

        await run_single_resolution(1000, 1000, config, "run_id", "run_dir")

        # Verify run_task called with custom_actions
        mock_agent_instance.run_task.assert_awaited_once()
        call_kwargs = mock_agent_instance.run_task.call_args.kwargs
        assert call_kwargs["custom_actions"] == {"my_tool": "pkg.MyClass"}
