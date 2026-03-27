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
import os
import tempfile
import sys
import importlib
from unittest.mock import patch, MagicMock, AsyncMock
from computer_use_eval.utils import load_custom_function
from computer_use_eval import runner


def test_load_custom_function_module():
    # Test loading a function from a standard module
    func = load_custom_function("math:sqrt")
    assert func(16) == 4.0


def test_load_custom_function_file():
    # Create a temporary python file
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
        f.write(b"def my_func(config):\n    return {'custom': 'value'}\n")
        f.flush()

        try:
            func = load_custom_function(f"{f.name}:my_func")
            result = func({})
            assert result == {"custom": "value"}
        finally:
            os.remove(f.name)


def test_load_custom_function_invalid_format():
    with pytest.raises(ValueError, match="Invalid import string format"):
        load_custom_function("invalid_format")


def test_load_custom_function_missing_file():
    with pytest.raises(FileNotFoundError):
        load_custom_function("missing_file.py:func")


def test_load_custom_function_missing_attr():
    with pytest.raises(AttributeError):
        load_custom_function("math:missing_func")


@pytest.mark.asyncio
async def test_runner_main_with_script():
    # Test that --script executes the custom function and merges the config
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
        f.write(b"""
def my_config_loader(config):
    return {
        "task": {"start_url": "https://custom.url"}
    }
""")
        f.flush()
        script_path = f.name

    with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as f:
        f.write(b"task:\n  start_url: https://default.url\n")
        f.flush()
        yaml_path = f.name

    try:
        args = [
            "--benchmark",
            yaml_path,
            "--script",
            f"{script_path}:my_config_loader",
            "--resolutions",
            "800x600",
        ]

        # We need to mock run_single_resolution to capture the resolved config
        captured_config = None

        async def mock_run(*args, **kwargs):
            nonlocal captured_config
            captured_config = args[2]  # config is 3rd argument
            return {
                "success": True,
                "judges": {
                    "assertion": {"score": 1.0},
                    "visual": {"score": 1.0},
                    "trace": {},
                },
            }

        with (
            patch("argparse._sys.argv", ["runner.py"] + args),
            patch(
                "computer_use_eval.runner.run_single_resolution", side_effect=mock_run
            ),
        ):
            await runner.main()

            assert captured_config is not None
            assert captured_config["task"]["start_url"] == "https://custom.url"

    finally:
        os.remove(script_path)
        os.remove(yaml_path)


@pytest.mark.asyncio
async def test_runner_main_with_custom_tools():
    # Test that custom tools are loaded and passed to the agent
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
        f.write(b"""
def my_cool_tool(x: int) -> int:
    '''Does something cool'''
    return x * 2
""")
        f.flush()
        script_path = f.name

    with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as f:
        f.write(
            f"""
agent:
  custom_tools:
    - "{script_path}:my_cool_tool"
""".encode()
        )
        f.flush()
        yaml_path = f.name

    try:
        args = ["--benchmark", yaml_path, "--resolutions", "800x600"]

        captured_tools = None

        # Mock SessionFactory to capture the tools
        def mock_create_session(*args, **kwargs):
            nonlocal captured_tools
            config = args[1]
            captured_tools = config.get("agent", {}).get("custom_tools", [])
            # We need to manually load them if we want to check the function objects
            # but here we just check if they are in the config for simplicity,
            # or we let the real factory run but mock the Agent return.

            mock_env = AsyncMock()
            mock_env.get_video_path = AsyncMock(return_value="/tmp/video.webm")
            mock_env.get_all_video_paths.return_value = ["/tmp/video.webm"]
            mock_env.headless = True
            mock_agent = AsyncMock()
            mock_agent.total_input_tokens = 0
            mock_agent.total_cached_tokens = 0
            mock_agent.total_output_tokens = 0
            mock_agent.safety_triggers = 0
            mock_agent.interventions = 0
            mock_agent.client = MagicMock()

            from computer_use_eval.core.base import AgentResult

            async def mock_run(*args, **kwargs):
                return AgentResult(
                    success=True, steps=1, retries=0, history=[], metadata={}
                )

            mock_agent.run_task = mock_run

            # Real loading logic for validation
            from computer_use_eval.utils import load_custom_function

            loaded_tools = [load_custom_function(t) for t in captured_tools]
            captured_tools = loaded_tools

            return mock_env, mock_agent, MagicMock()

        with (
            patch("argparse._sys.argv", ["runner.py"] + args),
            patch(
                "computer_use_eval.runner.SessionFactory.create_session",
                side_effect=mock_create_session,
            ),
            patch(
                "computer_use_eval.runner.AssertionJudge.evaluate",
                new_callable=AsyncMock,
            ) as mock_det,
            patch(
                "computer_use_eval.runner.LLMLogJudge.evaluate", new_callable=AsyncMock
            ) as mock_log,
            patch(
                "computer_use_eval.runner.VideoJudge.evaluate", new_callable=AsyncMock
            ) as mock_vid,
        ):
            mock_det.return_value = {"score": 1.0}
            mock_log.return_value = {}
            mock_vid.return_value = {"score": 1.0}

            await runner.main()

            assert captured_tools is not None
            assert len(captured_tools) == 1
            assert captured_tools[0].__name__ == "my_cool_tool"
            assert captured_tools[0](5) == 10

    finally:
        os.remove(script_path)
        os.remove(yaml_path)


@pytest.mark.asyncio
async def test_runner_hooks(tmp_path):
    # Test before_run, after_step, after_run hooks
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
        f.write(b"""
events = []

def my_before_run(config):
    events.append(("before_run", config.get("task", {}).get("goal")))

def my_after_step(step, history):
    events.append(("after_step", step))

def my_after_run(result):
    events.append(("after_run", result.get("success")))
""")
        f.flush()
        script_path = f.name

    with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as f:
        f.write(
            f"""
task:
  goal: "Hook test"
hooks:
  before_run: "{script_path}:my_before_run"
  after_step: "{script_path}:my_after_step"
  after_run: "{script_path}:my_after_run"
""".encode()
        )
        f.flush()
        yaml_path = f.name

    try:
        args = ["--benchmark", yaml_path, "--resolutions", "800x600"]

        # Mock SessionFactory to inject hook execution
        def mock_create_session_hooks(*args, **kwargs):
            config = args[1]
            hooks_config = config.get("hooks", {})

            # Load hooks like the real factory
            loaded_hooks = {}
            for k, v in hooks_config.items():
                loaded_hooks[k] = load_custom_function(v)

            mock_env = AsyncMock(**{"get_video_path.return_value": "/tmp/video.webm"})
            mock_env.get_all_video_paths.return_value = ["/tmp/video.webm"]
            mock_env.headless = True
            mock_agent = AsyncMock()
            mock_agent.total_input_tokens = 0
            mock_agent.total_cached_tokens = 0
            mock_agent.total_output_tokens = 0
            mock_agent.safety_triggers = 0
            mock_agent.interventions = 0
            mock_agent.client = MagicMock()

            async def mock_run(*args, **kwargs):
                from computer_use_eval.core.base import AgentResult

                # simulate a step hook
                if "after_step" in loaded_hooks:
                    loaded_hooks["after_step"](0, [])
                return AgentResult(
                    success=True, steps=1, retries=0, history=[], metadata={}
                )

            mock_agent.run_task = mock_run
            return mock_env, mock_agent, MagicMock()

        with (
            patch("argparse._sys.argv", ["runner.py"] + args),
            patch(
                "computer_use_eval.runner.SessionFactory.create_session",
                side_effect=mock_create_session_hooks,
            ),
            patch(
                "computer_use_eval.runner.AssertionJudge.evaluate",
                new_callable=AsyncMock,
            ) as mock_det,
            patch(
                "computer_use_eval.runner.LLMLogJudge.evaluate", new_callable=AsyncMock
            ) as mock_log,
            patch(
                "computer_use_eval.runner.VideoJudge.evaluate", new_callable=AsyncMock
            ) as mock_vid,
            patch("computer_use_eval.runner.settings.OUTPUT_DIR", str(tmp_path)),
        ):
            mock_det.return_value = {"score": 1.0}
            mock_log.return_value = {}
            mock_vid.return_value = {"score": 1.0}

            await runner.main()

            # Import the module dynamically to read 'events'
            sys.path.append(os.path.dirname(script_path))
            module_name = os.path.basename(script_path)[:-3]
            mod = importlib.import_module(module_name)
            events = mod.events

            assert len(events) == 3
            assert events[0] == ("before_run", "Hook test")
            assert events[1] == ("after_step", 0)
            assert events[2] == ("after_run", True)

    finally:
        os.remove(script_path)
        os.remove(yaml_path)
