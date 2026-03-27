# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import os
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from google.genai import types
from computer_use_eval.core.gemini_agent import GeminiAgent


@pytest.fixture
def mock_env():
    """Provides a mock PlaywrightEnv."""
    env = MagicMock()
    # Mock get_screenshot to return bytes as it does in actual PlaywrightEnv
    env.get_screenshot = AsyncMock(return_value=b"fake_screenshot_bytes")
    env.get_page_url = AsyncMock(return_value="http://mock.url")
    env.get_active_element_info = AsyncMock(return_value={"tagName": "BODY"})
    env.viewport_size = {"width": 1440, "height": 900}
    return env


@pytest.fixture
def mock_genai_client():
    """Provides a mock genai.Client."""
    client = MagicMock()
    return client


@pytest.mark.asyncio
async def test_run_task_saves_screenshots_to_disk(
    mock_env, mock_genai_client, tmp_path, monkeypatch
):
    """Test that the agent saves screenshots to disk when RUN_DIR is set."""
    # Set the RUN_DIR environment variable to our temporary test path
    run_dir = str(tmp_path / "test_run")
    monkeypatch.setenv("RUN_DIR", run_dir)

    agent = GeminiAgent(client=mock_genai_client)

    # Mock the model to return a single 'click' action
    mock_response = MagicMock()
    mock_part = MagicMock()
    mock_part.function_call = types.FunctionCall(
        name="click_at", args={"x": 500, "y": 500}
    )
    mock_candidate = MagicMock()
    mock_candidate.content.parts = [mock_part]
    mock_response.candidates = [mock_candidate]
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response
    )

    # We patch _predict so we don't have to deal with the real genai API call logic
    agent._predict = AsyncMock(return_value=mock_response)

    # Mock the executor to return a success status
    with patch(
        "computer_use_eval.core.gemini_agent.ToolExecutor", new_callable=MagicMock
    ) as MockExecutor:
        mock_executor_instance = MockExecutor.return_value

        from computer_use_eval.core.base import ActionExecutionResult

        mock_result = ActionExecutionResult(
            action_id="mock_id",
            action_name="click_at",
            result_data={"status": "ok"},
            safety_acknowledged=False,
        )
        mock_executor_instance.execute_bundle = AsyncMock(
            return_value=([mock_result], 0.05)
        )
        mock_inner = MagicMock()
        mock_inner.is_terminal.return_value = False
        mock_executor_instance.browser_action_executor = mock_inner

        # Set max_steps to 1 so the loop completes after one full turn
        with patch.object(agent, "max_steps", 1):
            await agent.run_task("test goal", mock_env)

            # Assertions
            images_dir = os.path.join(run_dir, "images", "1440x900")
            assert os.path.exists(images_dir)

            # Check that initial screenshot was saved
            initial_screenshot_path = os.path.join(images_dir, "step_0_initial.png")
            assert os.path.exists(initial_screenshot_path)
            with open(initial_screenshot_path, "rb") as f:
                assert f.read() == b"fake_screenshot_bytes"

            # Check that post-action screenshot was saved (step_1_post.png)
            post_screenshot_path = os.path.join(images_dir, "step_1_post.png")
            assert os.path.exists(post_screenshot_path)
            with open(post_screenshot_path, "rb") as f:
                assert f.read() == b"fake_screenshot_bytes"
