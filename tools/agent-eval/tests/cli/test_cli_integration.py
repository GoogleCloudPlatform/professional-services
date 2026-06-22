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
"""CLI Integration tests for agent-eval commands."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest import mock

import pandas as pd
import pytest
from click.testing import CliRunner

from agent_eval.cli.commands.init import init
from agent_eval.cli.commands.run import run
from tests.cli.test_init import _env_for_init, _seed_local_agent


@mock.patch("agent_eval.core.metric_discovery.discover_managed_metrics")
def test_init_interactive_fallback_success(mock_discover):
    """Verify that interactive project initialization completes successfully.

    Forces the fallback path by making managed discovery fail, and mocks user prompt
    inputs to accept starter metrics.
    """
    # Force discovery to fail so it falls back to starter metrics
    mock_discover.side_effect = Exception("Vertex AI API not enabled in this project")

    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        _seed_local_agent(root)

        # Mock env check to skip gcloud checks
        with mock.patch(
            "agent_eval.cli.commands.init._verify_environment",
            return_value=None,
        ):
            # Run interactive init, sending empty newlines to select defaults
            result = runner.invoke(
                init,
                ["--target-dir", str(root)],
                input="\n\n\n",  # Select agent (1) -> Select mode (1) -> Toggle metrics (empty)
                env=_env_for_init(root),
                catch_exceptions=False,
            )

            assert result.exit_code == 0, result.output
            assert "Selecting your agent" in result.output
            assert "Select agent" in result.output
            assert "Choose interaction mode" in result.output
            assert "Toggle" in result.output

            # Verify files written to the discovered agent_dir (root / "app")
            assert (
                root / "app" / "tests" / "eval" / "metrics" / "metric_definitions.json"
            ).exists()
            assert (root / "app" / "tests" / "eval" / "dataset.jsonl").exists()


@pytest.mark.anyio
@mock.patch("agent_eval.core.metric_generator.generate_eval_data")
@mock.patch("agent_eval.core.metric_generator.generate_metric_definitions")
@mock.patch("agent_eval.core.metric_generator.analyze_agent_data")
@mock.patch("agent_eval.cli.commands.init._prompt_managed_metrics_selection")
@mock.patch("agent_eval.core.metric_discovery.discover_managed_metrics")
async def test_init_interactive_full_multistep_flow(
    mock_discover,
    mock_prompt_managed,
    mock_analyze,
    mock_gen_metrics,
    mock_gen_data,
):
    """Verify the full interactive multi-step AI-assisted wizard.

    Mocks managed metrics discovery, custom metric generation, and scenario
    generation, and simulates the complete stdin keyboard input sequence.
    """
    # 1. Mock managed metrics discovery
    mock_discover.return_value = {
        "general_quality": {
            "name": "GENERAL_QUALITY",
            "description": "Text quality.",
            "family": "adaptive_rubric",
        }
    }

    # 2. Mock checkbox picker selection
    mock_prompt_managed.return_value = {
        "general_quality": {
            "kind": "managed",
            "description": "Text quality.",
        }
    }

    # 3. Mock agent code analysis (no suggestions to avoid the suggestions prompt)
    mock_analyze.return_value = {
        "tools": [{"name": "search_web"}],
        "state_variables": {"current_user": "str"},
        "key_behaviors": ["answer questions concisely"],
        "suggested_state_variables": [],
    }

    # 4. Mock custom metric generation
    mock_gen_metrics.return_value = (
        {
            "general_quality": {
                "kind": "managed",
                "description": "Text quality.",
            },
            "custom_conciseness": {
                "kind": "custom_llm_judge",
                "description": "Score 1-5 for conciseness.",
                "dataset_mapping": {
                    "reference": {"source_column": "reference_data:expected_concise"}
                },
            },
        },
        "rationale for conciseness metric",
    )

    # 5. Mock evaluation test data generation
    mock_gen_data.return_value = {
        "scenarios": [{"steps": ["hello"]}],
        "golden_dataset": [
            {
                "prompt": "hello",
                "reference_data": {"expected_concise": "hi"},
            }
        ],
    }

    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        _seed_local_agent(root)

        # Mock env check to skip gcloud checks
        with mock.patch(
            "agent_eval.cli.commands.init._verify_environment",
            return_value=None,
        ):
            # Feed stdin inputs sequentially:
            # 1. Select agent (Enter -> 1)
            # 2. Select interaction mode (Enter -> 1)
            # 3. Focus priorities (Enter -> "")
            # 4. Custom metrics count (Enter -> 3)
            # 5. Accept generated metrics (Enter -> 1)
            # 6. Row count count (Enter -> 5)
            # 7. Test data focus priorities (Enter -> "")
            # 8. Accept generated test data (Enter -> 1)
            stdin_input = "\n\n\n\n\n\n\n\n"

            result = runner.invoke(
                init,
                ["--target-dir", str(root)],
                input=stdin_input,
                env=_env_for_init(root),
                catch_exceptions=False,
            )

            assert result.exit_code == 0, result.output
            assert "Selecting your agent" in result.output
            assert "Choose interaction mode" in result.output
            assert "Custom metrics" in result.output
            assert "Generating custom scoring rubrics" in result.output
            assert "Accept" in result.output
            assert "Creating test scenarios and sample queries" in result.output

            # Verify all files are written and correct under discovered agent_dir (root / "app")
            metrics_file = (
                root / "app" / "tests" / "eval" / "metrics" / "metric_definitions.json"
            )
            assert metrics_file.exists()
            metrics_data = json.loads(metrics_file.read_text())
            assert "general_quality" in metrics_data["metrics"]
            assert "custom_conciseness" in metrics_data["metrics"]

            assert (root / "app" / "tests" / "eval" / "dataset.jsonl").exists()


@mock.patch("agent_eval.cli.commands.run._run_simulate_phase")
@mock.patch("agent_eval.core.evaluator.Client")
@mock.patch("google.cloud.aiplatform.init")
def test_run_pipeline_success(
    mock_aiplatform_init, mock_client_class, mock_run_simulate
):
    """Verify that agent-eval run completes successfully in-process with mocks.

    Mocks out the simulation phase to write a pre-recorded mock trace,
    and mocks out the Vertex AI Gen AI SDK client to return mock scores.
    """

    # 1. Setup mock simulator behavior
    def side_effect_simulate(agent_name, agent_path, project_root, raw_dir, **kwargs):
        raw_dir.mkdir(parents=True, exist_ok=True)
        sim_output = raw_dir / "processed_interaction_sim.jsonl"
        mock_record = {
            "question_id": "q1",
            "agents_evaluated": ["app"],
            "user_inputs": ["hello"],
            "prompt": "hello",
            "response": "Hello! I am a helpful agent.",
            "extracted_data": {},
            "reference_data": {
                "expected_behavior": "The agent should greet the user politely.",
                "expected_concise": "hi",
            },
            "latency_data": {
                "total_time": 1.5,
                "steps": [{"step_time": 1.5}],
            },
            "session_trace": [
                {"name": "root", "start_time": 0, "end_time": 1500, "attributes": {}},
                {
                    "name": "execute_tool search_web",
                    "start_time": 200,
                    "end_time": 800,
                    "attributes": {"gen_ai.tool.name": "search_web"},
                },
            ],
            "final_session_state": {"events": []},
        }
        with open(sim_output, "w") as f:
            f.write(json.dumps(mock_record) + "\n")
        return True

    mock_run_simulate.side_effect = side_effect_simulate

    # 2. Setup mock Vertex Gen AI client
    mock_client = mock.MagicMock()
    mock_evaluate_result = mock.MagicMock()

    # metrics_table contains the mock scores and explanations
    mock_metrics_table = pd.DataFrame(
        {
            "general_quality/score": [4.0],
            "general_quality/explanation": ["Good"],
            "custom_conciseness/score": [5.0],
            "custom_conciseness/explanation": ["Very concise"],
        }
    )

    mock_evaluate_result.metrics_table = mock_metrics_table
    mock_client.evals.evaluate.return_value = mock_evaluate_result
    mock_client_class.return_value = mock_client

    runner = CliRunner()
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        _seed_local_agent(root)

        # We must seed the evaluation folder structure under root/app/
        eval_dir = root / "app" / "tests" / "eval"
        eval_dir.mkdir(parents=True, exist_ok=True)

        # Seed dataset.jsonl (with at least 1 row to trigger simulate)
        dataset_path = eval_dir / "dataset.jsonl"
        dataset_row = {
            "prompt": "hello",
            "reference_data": {
                "expected_behavior": "The agent should greet the user politely.",
                "expected_concise": "hi",
            },
        }
        with open(dataset_path, "w") as f:
            f.write(json.dumps(dataset_row) + "\n")

        # Seed metric_definitions.json
        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir(parents=True, exist_ok=True)
        metrics_path = metrics_dir / "metric_definitions.json"
        metrics_content = {
            "metrics": {
                "general_quality": {
                    "kind": "managed",
                    "description": "Text quality.",
                },
                "custom_conciseness": {
                    "kind": "custom_llm_judge",
                    "description": "Score 1-5 for conciseness.",
                    "criteria": {"conciseness": "The response must be concise."},
                    "rating_scores": {
                        "1": "Pass: response is concise.",
                        "0": "Fail: response is wordy.",
                    },
                    "dataset_mapping": {
                        "reference": {
                            "source_column": "reference_data:expected_concise"
                        }
                    },
                },
            }
        }
        with open(metrics_path, "w") as f:
            f.write(json.dumps(metrics_content, indent=2))

        # Mock env check to skip gcloud checks
        with mock.patch(
            "agent_eval.cli.commands.run._looks_headless",
            return_value=True,
        ):
            # Run the command in-process
            result = runner.invoke(
                run,
                [
                    "--agent-dir",
                    str(root / "app"),
                    "--in-process",
                    "--run-id",
                    "test-run",
                    "--no-dashboard",
                ],
                env=_env_for_init(root),
                catch_exceptions=False,
            )

            assert result.exit_code == 0, result.output
            assert "Simulate" in result.output
            assert "Evaluate" in result.output
            assert "Pipeline complete!" in result.output

            # Verify that results are written
            run_results_dir = eval_dir / "results" / "test-run"
            assert (run_results_dir / "report.html").exists()
            assert (run_results_dir / "eval_summary.json").exists()
