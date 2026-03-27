# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from computer_use_eval.actions.mouse import DoubleClickAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.evaluation.judge import (
    VideoJudge,
    VideoJudgeResult,
    AssertionJudge,
    LLMLogJudge,
)
from computer_use_eval.utils import CoordinateScaler


@pytest.fixture
def mock_env():
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {"width": 1000, "height": 1000}
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = MagicMock()
    env.page.mouse = MagicMock()
    env.page.mouse.dblclick = AsyncMock()
    env.page.wait_for_load_state = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()

    # Mock context for multi-page support
    mock_page1 = MagicMock()
    mock_page1.video = MagicMock()
    mock_page1.video.path = AsyncMock(return_value="/tmp/video1.webm")

    mock_page2 = MagicMock()
    mock_page2.video = MagicMock()
    mock_page2.video.path = AsyncMock(return_value="/tmp/video2.webm")

    env.context = MagicMock()
    env.context.pages = [mock_page1, mock_page2]

    return env


class TestMultiTabSupport:
    @pytest.mark.asyncio
    async def test_double_click_action(self, mock_env):
        """DoubleClickAction should call mouse.dblclick with denormalized coordinates."""
        action = DoubleClickAction()
        args = {"x": 500, "y": 500}

        # We need to mock highlight_click as it's a method of BaseAction
        with patch.object(DoubleClickAction, "highlight_click", new_callable=AsyncMock):
            result = await action.execute(mock_env, args)

        mock_env.page.mouse.dblclick.assert_awaited_once_with(500, 500)
        assert result == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_get_all_video_paths(self, mock_env):
        """PlaywrightEnv.get_all_video_paths should return paths from all pages in context."""
        # Using the actual implementation logic since mock_env is a MagicMock
        paths = await PlaywrightEnv.get_all_video_paths(mock_env)
        assert len(paths) == 2
        assert "/tmp/video1.webm" in paths
        assert "/tmp/video2.webm" in paths

    @pytest.mark.asyncio
    async def test_video_judge_holistic_analysis(self):
        """VideoJudge should handle multiple video paths and send them in one request."""
        mock_client = MagicMock()
        judge = VideoJudge(mock_client)

        # Mock dependencies
        with (
            patch("os.path.exists", return_value=True),
            patch.object(
                VideoJudge, "_compress_video", side_effect=lambda x: x + "_compressed"
            ),
            patch("asyncio.sleep", new_callable=AsyncMock),
        ):
            # Setup mock for API Studio path (settings.API_KEY mock)
            from computer_use_eval.config import settings

            with patch.object(settings, "API_KEY", "fake-key"):
                mock_file = MagicMock()
                mock_file.state.name = "ACTIVE"
                mock_client.files.upload.return_value = mock_file
                mock_client.files.get.return_value = mock_file

                mock_response = MagicMock()
                mock_response.parsed = VideoJudgeResult(
                    success=True,
                    score=1.0,
                    reasoning="Holistic success",
                    ux="Great",
                    fail_cat="None",
                )
                mock_client.models.generate_content.return_value = mock_response

                criteria = {"task_goal": "Test goal"}
                video_paths = ["/tmp/v1.webm", "/tmp/v2.webm"]

                result = await judge.evaluate(None, criteria, video_paths=video_paths)

                assert result["success"] is True
                assert result["score"] == 1.0
                assert result["reasoning"] == "Holistic success"

                # Verify multiple files were uploaded
                assert mock_client.files.upload.call_count == 2

                # Verify generate_content was called with prompt + 2 files
                args, kwargs = mock_client.models.generate_content.call_args
                contents = kwargs.get("contents") or args[1]
                assert len(contents) == 3  # 1 prompt + 2 files

    @pytest.mark.asyncio
    async def test_assertion_judge_compatibility(self, mock_env):
        """AssertionJudge should accept video_paths even if it doesn't use them."""
        judge = AssertionJudge()
        criteria = {"assertions": []}
        # This should NOT raise TypeError
        result = await judge.evaluate(mock_env, criteria, video_paths=["/tmp/v1.webm"])
        assert "score" in result

    @pytest.mark.asyncio
    async def test_llm_log_judge_compatibility(self, mock_env):
        """LLMLogJudge should accept video_paths even if it doesn't use them."""
        mock_client = MagicMock()
        judge = LLMLogJudge(mock_client)

        # Mock successful LLM response
        mock_response = MagicMock()
        mock_response.text = (
            '{"summary": "ok", "fail_why": "None", "errors": [], "fix_prompt": "None"}'
        )
        mock_response.parsed = None
        mock_client.models.generate_content.return_value = mock_response

        turn = MagicMock()
        turn.role = "user"
        part = MagicMock()
        part.text = "test"
        turn.parts = [part]

        # This should NOT raise TypeError
        result = await judge.evaluate(
            mock_env, criteria={}, history=[turn], video_paths=["/tmp/v1.webm"]
        )
        assert "summary" in result
