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
"""Unit tests for converged CLI verbs: grade, generate, compare, optimize."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest import mock

import pytest
from click.testing import CliRunner

from agent_eval.cli.main import cli


def test_cli_help_displays_converged_commands():
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "generate" in result.output
    assert "grade" in result.output
    assert "compare" in result.output
    assert "optimize" in result.output
    assert "simulate" not in cli.commands
    assert "interact" not in cli.commands
    assert "evaluate" not in cli.commands


def test_grade_alias_invokes_evaluate_logic():
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        dummy_trace = root / "dataset.jsonl"
        dummy_trace.write_text('{"session_id": "s1", "prompt": "hi", "response": "hello"}\n')
        dummy_config = root / "eval_config.yaml"
        dummy_config.write_text("metrics: {}\n")

        with mock.patch("agent_eval.core.evaluator.Evaluator.evaluate") as mock_eval:
            mock_eval.return_value = None
            result = runner.invoke(
                cli,
                [
                    "grade",
                    "--traces",
                    str(dummy_trace),
                    "--eval-config",
                    str(dummy_config),
                    "--results-dir",
                    str(root / "results"),
                ],
                env={"GOOGLE_CLOUD_PROJECT": "test-project-123"},
            )
            assert result.exit_code == 0
            assert mock_eval.called


def test_generate_simulate_and_live_dispatch():
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "agent.py").write_text("# agent\n")

        # Test live dispatch
        with mock.patch("agent_eval.cli.commands.generate.interact") as mock_interact:
            result = runner.invoke(
                cli,
                ["generate", "--mode", "live", "--base-url", "http://localhost:8080", "--agent-dir", str(root)],
            )
            assert result.exit_code == 0

        # Test simulate dispatch
        with mock.patch("agent_eval.cli.commands.generate.simulate") as mock_sim:
            result = runner.invoke(
                cli,
                ["generate", "--mode", "simulate", "--agent-dir", str(root)],
            )
            assert result.exit_code == 0


def test_compare_command_calculates_deltas():
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        cand_dir = root / "candidate"
        base_dir = root / "baseline"
        cand_dir.mkdir()
        base_dir.mkdir()

        cand_summary = {
            "overall_summary": {
                "llm_based_metrics": {
                    "accuracy": {"average": 0.90},
                    "clarity": {"average": 0.85},
                },
                "deterministic_metrics": {
                    "total_tokens": 500,
                },
            }
        }
        base_summary = {
            "overall_summary": {
                "llm_based_metrics": {
                    "accuracy": {"average": 0.80},
                    "clarity": {"average": 0.85},
                },
                "deterministic_metrics": {
                    "total_tokens": 600,
                },
            }
        }

        (cand_dir / "eval_summary.json").write_text(json.dumps(cand_summary))
        (base_dir / "eval_summary.json").write_text(json.dumps(base_summary))

        out_md = root / "comparison.md"
        result = runner.invoke(cli, ["compare", str(cand_dir), str(base_dir), "--output-file", str(out_md)])
        assert result.exit_code == 0
        assert "accuracy" in result.output
        assert "+0.10" in result.output
        assert out_md.exists()
        assert "+0.10" in out_md.read_text()


def test_optimize_command_validation():
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "agent.py").write_text("# agent\n")
        (root / "eval_config.yaml").write_text("metrics: {}\n")

        result = runner.invoke(
            cli,
            [
                "optimize",
                "--agent-dir",
                str(root),
                "--config",
                str(root / "eval_config.yaml"),
                "--iterations",
                "3",
            ],
        )
        assert result.exit_code == 0
        assert "GEPA Prompt Evolutionary" in result.output
