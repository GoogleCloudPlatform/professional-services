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
"""Smoke tests: verify the package installs, imports, and wires up correctly."""

import importlib
import json
import tempfile
from pathlib import Path

from click.testing import CliRunner


def test_package_importable():
    """The top-level package must be importable."""
    mod = importlib.import_module("agent_eval")
    assert mod is not None


def test_core_modules_importable():
    """Every core module must import without errors."""
    modules = [
        "agent_eval.core.config",
        "agent_eval.core.agent_client",
        "agent_eval.core.converters",
        "agent_eval.core.data_mapper",
        "agent_eval.core.deterministic_metrics",
        "agent_eval.core.evaluator",
        "agent_eval.core.analyzer",
        "agent_eval.core.gemini_prompt_builder",
        "agent_eval.core.interactions",
        "agent_eval.core.processor",
    ]
    for name in modules:
        mod = importlib.import_module(name)
        assert mod is not None, f"Failed to import {name}"


def test_cli_importable():
    """The CLI entry point must be importable."""
    from agent_eval.cli.main import main

    assert callable(main)


def test_config_defaults():
    """Config should load with sensible defaults even without env vars."""
    from agent_eval.core.config import CONFIG

    assert CONFIG.GOOGLE_CLOUD_LOCATION == "us-central1"
    assert CONFIG.MAX_RETRIES == 3
    assert CONFIG.MAX_WORKERS == 4
    assert CONFIG.COL_PROMPT == "prompt"


def test_cli_version():
    """--version flag should print version string."""
    from agent_eval.cli.main import cli

    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "agent-eval v" in result.output


def test_cli_help_lists_all_commands():
    """All commands must appear in --help output."""
    from agent_eval.cli.main import cli

    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    for cmd in [
            "init", "interact", "evaluate", "analyze", "convert",
            "create-dataset"
    ]:
        assert cmd in result.output, f"Command '{cmd}' missing from --help"


def test_init_creates_eval_structure():
    """agent-eval init --auto-approve should scaffold the eval/ folder."""
    from agent_eval.cli.main import cli

    runner = CliRunner()
    with tempfile.TemporaryDirectory() as tmpdir:
        result = runner.invoke(cli, [
            "init",
            "--target-dir",
            tmpdir,
            "--agent-name",
            "test_agent",
            "--mode",
            "both",
            "-y",
        ])
        assert result.exit_code == 0

        # Phase D: unified layout at <project_root>/tests/eval/. No more
        # eval/scenarios/ or eval/eval_data/ split — multi-turn rows live
        # in dataset.jsonl and simulate.py projects them at runtime.
        eval_dir = Path(tmpdir) / "tests" / "eval"
        assert (eval_dir / "metrics" / "metric_definitions.json").exists()
        assert (eval_dir / "dataset.jsonl").exists()

        # Session inputs are now embedded per-row in dataset.jsonl, not
        # in a separate session_input.json file.
        rows = [
            json.loads(line)
            for line in (eval_dir / "dataset.jsonl").read_text().splitlines()
            if line.strip()
        ]
        assert rows, "scaffold must seed at least one starter row"
        first_session = next(
            (r["session_inputs"] for r in rows if r.get("session_inputs")),
            None)
        assert first_session is not None and first_session[
            "app_name"] == "test_agent"

        metrics = json.loads(
            (eval_dir / "metrics" / "metric_definitions.json").read_text())
        assert "general_quality" in metrics["metrics"]
