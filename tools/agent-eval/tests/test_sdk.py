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


@pytest.mark.anyio
async def test_sdk_run_evaluation_pipeline_missing_args():
    """Verify that missing required arguments in pipeline mode raises ValueError."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        # 1. Missing gcs_dest
        with pytest.raises(ValueError, match="gcs_dest must be provided"):
            await run_evaluation(
                agent_dir=agent_dir,
                pipeline=True,
                runner_image="img",
                agent_url="url",
                agent_name="name",
            )

        # 2. Missing agent_url
        with pytest.raises(ValueError, match="agent_url must be provided"):
            await run_evaluation(
                agent_dir=agent_dir,
                pipeline=True,
                gcs_dest="gs://bucket",
                runner_image="img",
                agent_name="name",
            )

        # 3. Missing agent_name
        with pytest.raises(ValueError, match="agent_name must be provided"):
            await run_evaluation(
                agent_dir=agent_dir,
                pipeline=True,
                gcs_dest="gs://bucket",
                runner_image="img",
                agent_url="url",
            )

        # 4. Missing runner_image
        with pytest.raises(ValueError, match="runner_image must be provided"):
            await run_evaluation(
                agent_dir=agent_dir,
                pipeline=True,
                gcs_dest="gs://bucket",
                agent_url="url",
                agent_name="name",
            )


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.storage.Client")
async def test_sdk_run_evaluation_pipeline_missing_files(mock_storage_client):
    """Verify that missing local evaluation files raises FileNotFoundError."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        # A. Missing dataset.jsonl
        eval_dir_a = tmp_path / "eval_a"
        eval_dir_a.mkdir()
        metrics_dir = eval_dir_a / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").touch()

        with pytest.raises(FileNotFoundError, match="Evaluation dataset not found"):
            await run_evaluation(
                agent_dir=agent_dir,
                eval_dir=eval_dir_a,
                pipeline=True,
                gcs_dest="gs://bucket",
                runner_image="img",
                agent_url="url",
                agent_name="name",
            )

        # B. Missing metric_definitions.json
        eval_dir_b = tmp_path / "eval_b"
        eval_dir_b.mkdir()
        (eval_dir_b / "dataset.jsonl").touch()
        (eval_dir_b / "metrics").mkdir()

        with pytest.raises(FileNotFoundError, match="Metric definitions not found"):
            await run_evaluation(
                agent_dir=agent_dir,
                eval_dir=eval_dir_b,
                pipeline=True,
                gcs_dest="gs://bucket",
                runner_image="img",
                agent_url="url",
                agent_name="name",
            )


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.storage.Client")
@mock.patch("agent_eval.sdk.get_project_id")
async def test_sdk_run_evaluation_pipeline_missing_project_id(
    mock_get_project_id, mock_storage_client
):
    """Verify that missing GOOGLE_CLOUD_PROJECT raises ValueError."""
    mock_get_project_id.return_value = None

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        agent_dir = tmp_path / "my_agent"
        agent_dir.mkdir()
        (agent_dir / "agent.py").touch()

        eval_dir = tmp_path / "eval"
        eval_dir.mkdir()
        (eval_dir / "dataset.jsonl").touch()
        metrics_dir = eval_dir / "metrics"
        metrics_dir.mkdir()
        (metrics_dir / "metric_definitions.json").touch()

        with pytest.raises(
            ValueError, match="GOOGLE_CLOUD_PROJECT environment variable is not set"
        ):
            await run_evaluation(
                agent_dir=agent_dir,
                eval_dir=eval_dir,
                pipeline=True,
                gcs_dest="gs://bucket",
                runner_image="img",
                agent_url="url",
                agent_name="name",
            )


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.generate_html_report")
@mock.patch("agent_eval.sdk.get_project_id")
@mock.patch("agent_eval.sdk.submit_pipeline_job")
@mock.patch("agent_eval.sdk.compile_pipeline")
@mock.patch("agent_eval.sdk.storage.Client")
async def test_sdk_run_evaluation_pipeline_downloads_csv_files(
    mock_storage_client,
    mock_compile,
    mock_submit,
    mock_get_project_id,
    mock_generate_html_report,
):
    """Verify that raw CSV files are correctly downloaded from GCS details/ path."""
    mock_get_project_id.return_value = "test-project"

    # Mock storage client structure
    mock_client_inst = mock.MagicMock()
    mock_storage_client.return_value = mock_client_inst
    mock_bucket = mock.MagicMock()
    mock_client_inst.bucket.return_value = mock_bucket
    mock_blob = mock.MagicMock()
    mock_bucket.blob.return_value = mock_blob

    # Fake download for summary
    def fake_download_to_filename(dest_path):
        Path(dest_path).write_text(
            json.dumps(
                {
                    "experiment_id": "test_run",
                    "overall_summary": {"failed_metrics": [], "llm_based_metrics": {}},
                }
            )
        )

    mock_blob.download_to_filename.side_effect = fake_download_to_filename

    # Mock list_blobs to return 2 fake CSV blobs under details/
    mock_csv_blob_1 = mock.MagicMock()
    mock_csv_blob_1.name = "runs/run_01/details/evaluation_results_1.csv"
    mock_csv_blob_2 = mock.MagicMock()
    mock_csv_blob_2.name = "runs/run_01/details/evaluation_results_2.csv"
    mock_client_inst.list_blobs.return_value = [mock_csv_blob_1, mock_csv_blob_2]

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
        await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
            gcs_dest="gs://my-bucket/runs/run_01",
            pipeline=True,
            runner_image="img",
            agent_url="url",
            agent_name="name",
        )

        # Assertions: Verify both CSV blobs were downloaded
        expected_local_csv_1 = (
            eval_dir / "results" / "test_run" / "raw" / "evaluation_results_1.csv"
        )
        expected_local_csv_2 = (
            eval_dir / "results" / "test_run" / "raw" / "evaluation_results_2.csv"
        )

        mock_csv_blob_1.download_to_filename.assert_called_once_with(
            str(expected_local_csv_1)
        )
        mock_csv_blob_2.download_to_filename.assert_called_once_with(
            str(expected_local_csv_2)
        )


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.sdk.run_simulation_in_process")
async def test_sdk_run_evaluation_local_with_agent_instance(
    mock_run_sim, mock_evaluator_class
):
    # Setup mocks
    mock_run_sim.return_value = [{"converted": "record"}]

    mock_evaluator = mock.MagicMock()
    mock_evaluator.evaluate = mock.AsyncMock()
    mock_evaluator_class.return_value = mock_evaluator

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

        # Seed a dummy eval_summary.json to satisfy SDK loading
        results_dir = eval_dir / "results" / "test_run"
        results_dir.mkdir(parents=True)
        (results_dir / "eval_summary.json").write_text(
            '{"overall_summary": {"llm_based_metrics": {}, "failed_metrics": []}}'
        )

        mock_agent_instance = mock.MagicMock()

        # Run SDK evaluation in local mode, passing the agent_instance
        await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
            pipeline=False,
            agent_instance=mock_agent_instance,  # 👈 Pass the agent_instance!
        )

        # Verify that run_simulation_in_process was called with the agent_instance!
        mock_run_sim.assert_called_once_with(
            agent_dir=mock.ANY,
            project_root=mock.ANY,
            dataset_path=mock.ANY,
            agent_instance=mock_agent_instance,  # 👈 Assert passed down!
        )


@pytest.mark.anyio
@mock.patch("agent_eval.sdk.Evaluator")
@mock.patch("agent_eval.core.interactions.InteractionRunner")
async def test_sdk_run_evaluation_local_interact_with_agent_instance(
    mock_runner_class, mock_evaluator_class
):
    # Setup mocks
    mock_runner = mock.MagicMock()
    mock_runner.run = mock.AsyncMock()
    # Return a dummy dataframe containing the interaction results
    mock_runner.run.return_value = pd.DataFrame(
        [{"status": "success", "question_id": "q1", "response": "hello"}]
    )
    mock_runner_class.return_value = mock_runner

    mock_evaluator = mock.MagicMock()
    mock_evaluator.evaluate = mock.AsyncMock()
    mock_evaluator_class.return_value = mock_evaluator

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

        # Seed a dummy eval_summary.json to satisfy SDK loading
        results_dir = eval_dir / "results" / "test_run"
        results_dir.mkdir(parents=True)
        (results_dir / "eval_summary.json").write_text(
            '{"overall_summary": {"llm_based_metrics": {}, "failed_metrics": []}}'
        )

        mock_agent_instance = mock.MagicMock()

        # Run SDK evaluation in local mode, passing the agent_instance and mode="interact"!
        await run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id="test_run",
            pipeline=False,
            agent_instance=mock_agent_instance,
            mode="interact",  # 👈 Pass mode!
        )

        # Verify that InteractionRunner was instantiated with the agent_instance!
        mock_runner_class.assert_called_once_with(
            mock.ANY,
            agent_instance=mock_agent_instance,  # 👈 Assert passed down!
        )

        # Verify that InteractionRunner.run was awaited!
        mock_runner.run.assert_called_once()

        # Verify that the returned DataFrame was saved as a CSV in raw_dir!
        expected_csv_path = results_dir / "raw" / "evaluation_results_test_run.csv"
        assert expected_csv_path.exists()
        saved_df = pd.read_csv(expected_csv_path)
        assert len(saved_df) == 1
        assert saved_df.iloc[0]["question_id"] == "q1"
