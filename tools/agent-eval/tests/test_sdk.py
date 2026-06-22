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
"""Tests for the agent-eval Python SDK."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest import mock

import pandas as pd
import pytest

from agent_eval import run_evaluation, run_evaluation_sync


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.sdk.run_simulation_in_process", autospec=True)
async def test_sdk_run_evaluation_success(
    mock_run_sim, mock_evaluator, mock_generate_html_report
):
    # Setup mocks
    mock_run_sim.return_value = [{"id": "case_0"}]

    async def fake_evaluate(interaction_files, metrics_files, results_dir):
        # Create dummy eval_summary.json without thresholds
        results_dir = Path(results_dir)
        summary_data = {
            "experiment_id": "test_run",
            "run_type": "test",
            "test_description": "test description",
            "interaction_datetime": "2026-06-18T12:00:00",
            "overall_summary": {
                "llm_based_metrics": {
                    "trajectory_accuracy": {
                        "average": 0.75,
                    },
                    "tool_use_quality": {
                        "average": 0.9,
                    },
                }
            },
        }
        with (results_dir / "eval_summary.json").open("w") as f:
            json.dump(summary_data, f)
        raw_dir = results_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        # Write dummy CSV
        df = pd.DataFrame([{"question_id": "case_0", "score": 1.0}])
        df.to_csv(raw_dir / "evaluation_results_20260101_000000.csv", index=False)

    mock_evaluator.return_value.evaluate.side_effect = fake_evaluate

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        # Create dummy agent project layout
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        eval_dir = tmp_path / "tests" / "eval"
        eval_dir.mkdir(parents=True)
        (eval_dir / "dataset.jsonl").touch()

        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").write_text("{}")

        # Run SDK evaluation
        result = await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
        )

        mock_evaluator.assert_called_once_with({"location": None, "gcs_dest": None})
        assert result.success is True
        assert result.failed_metrics == []
        assert result.metrics == {
            "trajectory_accuracy": 0.75,
            "tool_use_quality": 0.9,
        }


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.sdk.run_simulation_in_process", autospec=True)
async def test_sdk_run_evaluation_error_metric(
    mock_run_sim, mock_evaluator, mock_generate_html_report
):
    mock_run_sim.return_value = [{"id": "case_0"}]

    async def fake_evaluate(interaction_files, metrics_files, results_dir):
        results_dir = Path(results_dir)
        summary_data = {
            "experiment_id": "test_run",
            "run_type": "test",
            "test_description": "test description",
            "interaction_datetime": "2026-06-18T12:00:00",
            "overall_summary": {
                "llm_based_metrics": {
                    "trajectory_accuracy": {
                        "average": 0.9,
                    }
                },
                "failed_metrics": [
                    {"metric": "broken_metric", "exception_type": "ValueError"}
                ],
            },
        }
        with (results_dir / "eval_summary.json").open("w") as f:
            json.dump(summary_data, f)
        raw_dir = results_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        df = pd.DataFrame([{"question_id": "case_0", "score": 1.0}])
        df.to_csv(raw_dir / "evaluation_results_20260101_000000.csv", index=False)

    mock_evaluator.return_value.evaluate.side_effect = fake_evaluate

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()
        eval_dir = tmp_path / "tests" / "eval"
        eval_dir.mkdir(parents=True)
        (eval_dir / "dataset.jsonl").touch()
        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").write_text("{}")

        result = await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
        )

        mock_evaluator.assert_called_once_with({"location": None, "gcs_dest": None})
        assert result.success is False
        assert "broken_metric" in result.failed_metrics


@mock.patch("agent_eval.sdk.run_evaluation", new_callable=mock.AsyncMock)
def test_sdk_run_evaluation_sync(mock_run_eval):
    mock_result = mock.MagicMock()
    mock_run_eval.return_value = mock_result

    result = run_evaluation_sync(
        agent_dir="my_agent",
        run_id="test_run",
    )

    mock_run_eval.assert_called_once_with(
        agent_dir="my_agent",
        eval_dir=None,
        run_id="test_run",
        location=None,
        run_analysis=False,
        generate_html=False,
        model="gemini-3.1-pro-preview",
        gcs_dest=None,
    )
    assert result == mock_result


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.sdk.run_simulation_in_process", autospec=True)
async def test_sdk_run_evaluation_threshold_success(
    mock_run_sim, mock_evaluator, mock_generate_html_report
):
    mock_run_sim.return_value = [{"id": "case_0"}]

    async def fake_evaluate(interaction_files, metrics_files, results_dir):
        results_dir = Path(results_dir)
        summary_data = {
            "experiment_id": "test_run",
            "run_type": "test",
            "test_description": "test description",
            "interaction_datetime": "2026-06-18T12:00:00",
            "overall_summary": {
                "llm_based_metrics": {
                    "trajectory_accuracy": {
                        "average": 0.9,
                        "threshold": 0.8,
                    },
                    "tool_use_quality": {
                        "average": 0.8,
                        "threshold": 0.8,
                    },
                }
            },
        }
        with (results_dir / "eval_summary.json").open("w") as f:
            json.dump(summary_data, f)
        raw_dir = results_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        df = pd.DataFrame([{"question_id": "case_0", "score": 1.0}])
        df.to_csv(raw_dir / "evaluation_results_20260101_000000.csv", index=False)

    mock_evaluator.return_value.evaluate.side_effect = fake_evaluate

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        eval_dir = tmp_path / "tests" / "eval"
        eval_dir.mkdir(parents=True)
        (eval_dir / "dataset.jsonl").touch()

        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").write_text("{}")

        result = await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
        )

        mock_evaluator.assert_called_once_with({"location": None, "gcs_dest": None})
        assert result.success is True
        assert result.failed_metrics == []
        assert result.threshold_failures == []


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.sdk.run_simulation_in_process", autospec=True)
async def test_sdk_run_evaluation_threshold_failure(
    mock_run_sim, mock_evaluator, mock_generate_html_report
):
    mock_run_sim.return_value = [{"id": "case_0"}]

    async def fake_evaluate(interaction_files, metrics_files, results_dir):
        results_dir = Path(results_dir)
        summary_data = {
            "experiment_id": "test_run",
            "run_type": "test",
            "test_description": "test description",
            "interaction_datetime": "2026-06-18T12:00:00",
            "overall_summary": {
                "llm_based_metrics": {
                    "trajectory_accuracy": {
                        "average": 0.7,
                        "threshold": 0.8,
                    },
                    "tool_use_quality": {
                        "average": 0.9,
                        "threshold": 0.8,
                    },
                }
            },
        }
        with (results_dir / "eval_summary.json").open("w") as f:
            json.dump(summary_data, f)
        raw_dir = results_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        df = pd.DataFrame([{"question_id": "case_0", "score": 1.0}])
        df.to_csv(raw_dir / "evaluation_results_20260101_000000.csv", index=False)

    mock_evaluator.return_value.evaluate.side_effect = fake_evaluate

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        eval_dir = tmp_path / "tests" / "eval"
        eval_dir.mkdir(parents=True)
        (eval_dir / "dataset.jsonl").touch()

        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").write_text("{}")

        result = await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
        )

        mock_evaluator.assert_called_once_with({"location": None, "gcs_dest": None})
        assert result.success is False
        assert result.failed_metrics == []
        assert result.threshold_failures == [
            {
                "metric": "trajectory_accuracy",
                "average": 0.7,
                "threshold": 0.8,
            }
        ]
