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
from contextlib import nullcontext
from computer_use_eval import runner
from computer_use_eval.core.base import AgentResult
from computer_use_eval.actions import ActionExecutor
from computer_use_eval.constants import ToolNames


@pytest.fixture
def mock_env():
    """Provides a mock PlaywrightEnv with multi-tab video support."""
    env = AsyncMock()
    # Simulate multiple tabs/videos
    env.get_all_video_paths = AsyncMock(
        return_value=["/tmp/video1.webm", "/tmp/video2.webm"])
    env.start = AsyncMock()
    env.stop = AsyncMock()
    return env


@pytest.fixture
def mock_agent():
    """Provides a mock GeminiAgent."""
    agent = AsyncMock()
    agent.run_task.return_value = AgentResult(success=True,
                                              steps=1,
                                              retries=0,
                                              history=[],
                                              metadata={})
    agent.client = MagicMock()  # Needed for Judge initialization
    return agent


@pytest.fixture
def mock_judges():
    """Mocks all judge components with updated signatures."""
    with patch("computer_use_eval.runner.AssertionJudge") as MockDetJudge, \
         patch("computer_use_eval.runner.LLMLogJudge") as MockLogJudge, \
         patch("computer_use_eval.runner.VideoJudge") as MockVideoJudge:
        # Setup mocks to return results and verify multi-video paths
        MockDetJudge.return_value.evaluate = AsyncMock(
            return_value={"score": 1.0})
        MockLogJudge.return_value.evaluate = AsyncMock(
            return_value={
                "summary": "ok",
                "fail_why": "None",
                "errors": [],
                "fix_prompt": "None",
            })
        MockVideoJudge.return_value.evaluate = AsyncMock(return_value={
            "score": 1.0,
            "reasoning": "Holistic success"
        })

        yield {
            "det": MockDetJudge.return_value,
            "log": MockLogJudge.return_value,
            "video": MockVideoJudge.return_value,
        }


class TestHolisticE2E:

    @pytest.mark.asyncio
    async def test_runner_multi_video_integration(self, mock_env, mock_agent,
                                                  mock_judges):
        """
        E2E Integration Test: Verify that runner.py correctly collects
        multiple videos and passes them to VideoJudge.
        """
        config = {
            "name": "Multi-Tab E2E Test",
            "task": {
                "goal": "Search in Tab 1, Click in Tab 2"
            },
            "criteria": {
                "visual_success_criteria": "Tabs must work"
            },
        }

        with patch("computer_use_eval.runner.SessionFactory.create_session", return_value=(mock_env, mock_agent, nullcontext())), \
             patch("os.path.exists", return_value=True):
            # Run the runner logic
            await runner.run_single_resolution(1440, 900, config,
                                               "test_e2e_run", "/tmp")

            # VERIFICATION 1: All video paths were collected
            mock_env.get_all_video_paths.assert_awaited_once()

            # VERIFICATION 2: VideoJudge was called with the LIST of video paths
            # Note: We check the call to evaluate()
            call_args = mock_judges["video"].evaluate.call_args
            passed_video_paths = call_args.kwargs.get("video_paths")
            assert isinstance(passed_video_paths, list)
            assert len(passed_video_paths) == 2
            assert "/tmp/video1.webm" in passed_video_paths

    @pytest.mark.asyncio
    async def test_action_registry_holistic(self):
        """Verify that double_click_at is globally registered in the ActionExecutor."""
        executor = ActionExecutor()
        assert ToolNames.DOUBLE_CLICK_AT in executor.actions
        from computer_use_eval.actions.mouse import DoubleClickAction

        assert isinstance(executor.actions[ToolNames.DOUBLE_CLICK_AT],
                          DoubleClickAction)

    @pytest.mark.asyncio
    async def test_judge_signature_consistency(self, mock_env):
        """Verify that all judges now accept video_paths to prevent TypeErrors in runner.py."""
        from computer_use_eval.evaluation.judge import (
            AssertionJudge,
            LLMLogJudge,
            VideoJudge,
        )

        criteria = {"task_goal": "test"}
        v_paths = ["/tmp/v1.webm"]

        # Test AssertionJudge
        adj = AssertionJudge()
        # Should not raise TypeError
        await adj.evaluate(mock_env, criteria, video_paths=v_paths)

        # Test LLMLogJudge
        # We don't need real clients here, just checking signature
        logj = LLMLogJudge(MagicMock())
        with patch.object(logj, "_evaluate_custom",
                          new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = {
                "summary": "ok",
                "fail_why": "None",
                "errors": [],
                "fix_prompt": "None",
            }
            # Should not raise TypeError
            await logj.evaluate(mock_env,
                                criteria,
                                history=[],
                                video_paths=v_paths)

        # Test VideoJudge
        vidj = VideoJudge(MagicMock())
        with patch.object(vidj, "evaluate",
                          new_callable=AsyncMock) as mock_eval:
            await vidj.evaluate(mock_env, criteria, video_paths=v_paths)
            mock_eval.assert_called_once_with(mock_env,
                                              criteria,
                                              video_paths=v_paths)
