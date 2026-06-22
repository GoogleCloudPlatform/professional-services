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
        pipeline=False,
        runner_image=None,
        agent_url=None,
        agent_name=None,
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


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.get_project_id")
@mock.patch("agent_eval.sdk.submit_pipeline_job")
@mock.patch("agent_eval.sdk.compile_pipeline")
@mock.patch("agent_eval.sdk.storage.Client")
async def test_sdk_run_evaluation_pipeline_success(
    mock_storage_client,
    mock_compile,
    mock_submit,
    mock_get_project_id,
    mock_generate_html_report,
):
    # Setup mocks
    mock_get_project_id.return_value = "test-project"

    # Mock storage client structure
    mock_client_inst = mock.MagicMock()
    mock_storage_client.return_value = mock_client_inst
    mock_bucket = mock.MagicMock()
    mock_client_inst.bucket.return_value = mock_bucket
    mock_blob = mock.MagicMock()
    mock_bucket.blob.return_value = mock_blob

    # Sinks a fake summary JSON on GCS download
    def fake_download_to_filename(dest_path):
        Path(dest_path).write_text(
            json.dumps(
                {
                    "experiment_id": "test_run",
                    "overall_summary": {
                        "failed_metrics": [],
                        "llm_based_metrics": {
                            "trajectory_accuracy": {
                                "average": 0.85,
                                "threshold": 0.7,
                            }
                        },
                    },
                }
            )
        )

    mock_blob.download_to_filename.side_effect = fake_download_to_filename

    # Mock list_blobs to return no raw CSVs (empty details)
    mock_client_inst.list_blobs.return_value = []

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        eval_dir = tmp_path / "tests" / "eval"
        eval_dir.mkdir(parents=True)
        (eval_dir / "dataset.jsonl").write_text("{}")

        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").write_text("{}")

        # Run SDK evaluation on pipeline
        result = await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
            gcs_dest="gs://my-bucket/runs/run_01",
            pipeline=True,
            runner_image="gcr.io/my-project/agent-eval:latest",
            agent_url="http://my-agent/run",
            agent_name="my_agent_app",
        )

        # Assertions
        assert result.success is True
        assert result.failed_metrics == []
        assert result.metrics == {"trajectory_accuracy": 0.85}
        assert result.threshold_failures == []

        # Verify pipeline helpers were called correctly
        mock_compile.assert_called_once()
        mock_submit.assert_called_once_with(
            project_id="test-project",
            location="us-central1",
            pipeline_yaml_path=mock.ANY,
            gcs_dest="gs://my-bucket/runs/run_01",
            dataset_gcs_path="gs://my-bucket/runs/run_01/staging/dataset.jsonl",
            metrics_gcs_path="gs://my-bucket/runs/run_01/staging/metric_definitions.json",
            agent_url="http://my-agent/run",
            agent_name="my_agent_app",
            wait=True,
        )
