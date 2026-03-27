# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from contextlib import nullcontext
from computer_use_eval import runner
from computer_use_eval.core.base import AgentResult


@pytest.fixture
def mock_env():
    """Provides a mock PlaywrightEnv."""
    env = AsyncMock()
    env.get_video_path.return_value = "/tmp/fake_video.webm"
    env.start = AsyncMock()
    env.stop = AsyncMock()
    return env


@pytest.fixture
def mock_agent():
    """Provides a mock GeminiAgent."""
    agent = AsyncMock()
    agent.run_task.return_value = AgentResult(
        success=True, steps=1, retries=0, history=[], metadata={}
    )
    return agent


@pytest.fixture
def mock_judges():
    """Mocks all judge components."""
    with patch("computer_use_eval.runner.AssertionJudge") as MockDetJudge, \
         patch("computer_use_eval.runner.LLMLogJudge") as MockLogJudge, \
         patch("computer_use_eval.runner.VideoJudge") as MockVideoJudge:
        # Make the evaluate methods awaitable
        MockDetJudge.return_value.evaluate = AsyncMock(return_value={"score": 1.0})
        MockLogJudge.return_value.evaluate = AsyncMock(
            return_value={
                "summary": "Test Summary",
                "fail_why": "None",
                "errors": [],
                "fix_prompt": "None",
            }
        )
        MockVideoJudge.return_value.evaluate = AsyncMock(return_value={"score": 1.0})

        yield {
            "det": MockDetJudge.return_value,
            "log": MockLogJudge.return_value,
            "video": MockVideoJudge.return_value,
        }


@pytest.mark.asyncio
async def test_run_single_resolution_success(mock_env, mock_agent, mock_judges):
    """Tests a successful run of a single resolution."""
    config = {"task": {"goal": "test"}}

    with patch("computer_use_eval.runner.SessionFactory.create_session", return_value=(mock_env, mock_agent, nullcontext())), \
         patch("os.path.exists", return_value=True):
        result = await runner.run_single_resolution(1280, 720, config, "run1", "/tmp")

        mock_env.start.assert_awaited_once()
        mock_agent.run_task.assert_awaited_once()
        mock_judges["det"].evaluate.assert_awaited_once()
        mock_judges["log"].evaluate.assert_awaited_once()
        mock_judges["video"].evaluate.assert_awaited_once()
        mock_env.stop.assert_awaited_once()
        assert result["success"] is True


@pytest.mark.asyncio
async def test_run_single_resolution_agent_fails(mock_env, mock_agent, mock_judges):
    """Tests a run where the agent fails."""
    # Correctly set the metadata in the AgentResult
    mock_agent.run_task.return_value = AgentResult(
        success=False, steps=1, retries=0, history=[], metadata={"error": "failed"}
    )
    config = {"task": {"goal": "test"}}

    with patch("computer_use_eval.runner.SessionFactory.create_session", return_value=(mock_env, mock_agent, nullcontext())):
        result = await runner.run_single_resolution(1280, 720, config, "run1", "/tmp")

        assert result["success"] is False
        # Correctly check for the error key in the metadata
        assert result["metadata"]["error"] == "failed"


@pytest.mark.asyncio
async def test_runner_external_file_resolution(tmp_path):
    """
    Verifies that the runner resolves keys ending in '_file'
    by loading content relative to the benchmark YAML.
    """
    # 1. Create a prompt file
    prompt_file = tmp_path / "system.md"
    prompt_file.write_text("EXTERNALLY LOADED PROMPT", encoding="utf-8")

    # 2. Create a benchmark YAML referencing it
    benchmark_yaml = tmp_path / "benchmark.yaml"
    config = {
        "name": "External File Test",
        "agent": {
            "model": "test-model",
            "system_prompt_file": "system.md",
            "max_steps": 1,
        },
        "task": {"start_url": "about:blank", "goal": "Do nothing"},
        "environment": {"headless": True},
    }

    import yaml

    benchmark_yaml.write_text(yaml.dump(config), encoding="utf-8")

    # 3. Mock dependencies to avoid real execution overhead
    with patch("computer_use_eval.runner.SessionFactory.create_session") as mock_session_factory, \
         patch("computer_use_eval.runner.AssertionJudge"), \
         patch("computer_use_eval.runner.LLMLogJudge"), \
         patch("computer_use_eval.runner.VideoJudge"):
        # Setup mocks
        mock_env = AsyncMock()
        mock_agent_instance = AsyncMock()
        mock_agent_instance.run_task = AsyncMock(
            return_value=MagicMock(
                success=True, history=[], metadata={}, steps=1, retries=0
            )
        )
        mock_agent_instance.client = MagicMock()  # For Judge init

        mock_session_factory.return_value = (
            mock_env,
            mock_agent_instance,
            nullcontext(),
        )

        # 4. Run the single resolution logic
        from computer_use_eval.runner import run_single_resolution

        # Verify that 'resolve_config_files' works when called on a real file structure.
        from computer_use_eval.utils import resolve_config_files

        loaded_config = yaml.safe_load(benchmark_yaml.read_text())
        resolved_config = resolve_config_files(loaded_config, str(tmp_path))

        # Assert resolution happened correctly
        assert resolved_config["agent"]["system_prompt"] == "EXTERNALLY LOADED PROMPT"
        assert "system_prompt_file" not in resolved_config["agent"]

        # Now pass this resolved config to the runner to ensure it doesn't crash
        await run_single_resolution(
            100,
            100,
            resolved_config,
            "test_run",
            str(tmp_path),
            model_name="test-model",
        )

        # Verify SessionFactory was called with the loaded prompt
        mock_session_factory.assert_called_once()
        # Verify the config passed to factory contains the prompt
        call_args = mock_session_factory.call_args[0]
        passed_config = call_args[1]
        assert passed_config["agent"]["system_prompt"] == "EXTERNALLY LOADED PROMPT"
