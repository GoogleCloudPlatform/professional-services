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
"""agent-eval Python SDK."""

from __future__ import annotations

import asyncio
import contextlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from google.cloud import storage
from pydantic import BaseModel, ConfigDict, Field

from agent_eval.core.analyzer import Analyzer
from agent_eval.core.converters import write_jsonl
from agent_eval.core.evaluator import Evaluator, get_project_id
from agent_eval.core.html_report import generate_html_report
from agent_eval.core.kfp_pipeline import compile_pipeline, submit_pipeline_job
from agent_eval.core.path_resolver import agent_project_root, find_eval_dir
from agent_eval.core.schema import EvaluationSummary
from agent_eval.core.simulation import run_simulation_in_process

logger = logging.getLogger("agent_eval.sdk")


class EvaluationResult(BaseModel):
    """The result of an evaluation run."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool
    failed_metrics: list[str]
    metrics: dict[str, float]
    summary: EvaluationSummary
    raw_results: pd.DataFrame
    threshold_failures: list[dict[str, Any]] = Field(default_factory=list)


async def run_evaluation(
    agent_dir: Path | str,
    eval_dir: Path | str | None = None,
    run_id: str | None = None,
    location: str | None = None,
    run_analysis: bool = False,
    generate_html: bool = False,
    model: str = "gemini-3.1-pro-preview",
    gcs_dest: str | None = None,
    pipeline: bool = False,
    runner_image: str | None = None,
    agent_url: str | None = None,
    agent_name: str | None = None,
) -> EvaluationResult:
    """Run an evaluation (either locally in-process or on Vertex AI Pipelines).

    Args:
        agent_dir: Path to the agent project directory.
        eval_dir: Optional path to the eval folder. If omitted, resolved from agent_dir.
        run_id: Optional run identifier (timestamp-based if omitted).
        location: Vertex AI location (e.g. us-central1).
        run_analysis: Whether to run Gemini-based analysis on the results.
        generate_html: Whether to generate the HTML report.
        model: Model to use for analysis.
        gcs_dest: Optional GCS destination URI for managed Vertex AI pipelines.
        pipeline: Whether to orchestrate the entire flow on Vertex AI Pipelines.
        runner_image: Docker image containing agent-eval for the KFP steps.
        agent_url: The remote agent endpoint URL (required if pipeline=True).
        agent_name: The name of the agent application (required if pipeline=True).

    Returns:
        EvaluationResult containing the metrics and pass/fail status.
    """
    agent_dir = Path(agent_dir).resolve()
    eval_dir = Path(eval_dir).resolve() if eval_dir else find_eval_dir(agent_dir)

    # 1. Resolve run_id and output dirs

    if not run_id:
        run_id = f"sdk_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    results_dir = eval_dir / "results" / run_id
    raw_dir = results_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    if pipeline:
        import os

        if not gcs_dest:
            raise ValueError(
                "gcs_dest must be provided when running on Vertex AI Pipelines (pipeline=True)."
            )
        if not agent_url:
            raise ValueError(
                "agent_url must be provided when running on Vertex AI Pipelines (pipeline=True)."
            )
        if not agent_name:
            raise ValueError(
                "agent_name must be provided when running on Vertex AI Pipelines (pipeline=True)."
            )
        if not runner_image:
            raise ValueError(
                "runner_image must be provided when running on Vertex AI Pipelines (pipeline=True)."
            )

        # A. Staging local files to GCS
        logger.info(
            f"Staging evaluation dataset and metrics to GCS bucket: {gcs_dest}..."
        )
        storage_client = storage.Client()

        # Parse GCS destination
        gcs_dest_clean = gcs_dest.rstrip("/")
        bucket_name, blob_prefix = gcs_dest_clean.replace("gs://", "").split("/", 1)
        bucket = storage_client.bucket(bucket_name)

        # Upload dataset.jsonl
        dataset_path = eval_dir / "dataset.jsonl"
        if not dataset_path.exists():
            raise FileNotFoundError(f"Evaluation dataset not found at {dataset_path}")
        dataset_gcs_blob = f"{blob_prefix}/staging/dataset.jsonl"
        dataset_gcs_path = f"gs://{bucket_name}/{dataset_gcs_blob}"
        bucket.blob(dataset_gcs_blob).upload_from_filename(str(dataset_path))
        logger.info(f"Uploaded dataset to {dataset_gcs_path}")

        # Upload metric_definitions.json
        metrics_path = eval_dir / "metrics" / "metric_definitions.json"
        if not metrics_path.exists():
            raise FileNotFoundError(f"Metric definitions not found at {metrics_path}")
        metrics_gcs_blob = f"{blob_prefix}/staging/metric_definitions.json"
        metrics_gcs_path = f"gs://{bucket_name}/{metrics_gcs_blob}"
        bucket.blob(metrics_gcs_blob).upload_from_filename(str(metrics_path))
        logger.info(f"Uploaded metrics to {metrics_gcs_path}")

        # B. Compile Pipeline locally
        import tempfile

        temp_dir = Path(tempfile.mkdtemp())
        pipeline_yaml_path = temp_dir / "pipeline.yaml"
        compile_pipeline(output_path=pipeline_yaml_path, runner_image=runner_image)

        # C. Submit and execute pipeline job on Vertex AI
        project_id = get_project_id()
        if not project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is not set.")

        loc = location or "us-central1"

        logger.info("Submitting pipeline run to Vertex AI...")
        await asyncio.to_thread(
            submit_pipeline_job,
            project_id=project_id,
            location=loc,
            pipeline_yaml_path=pipeline_yaml_path,
            gcs_dest=gcs_dest_clean,
            dataset_gcs_path=dataset_gcs_path,
            metrics_gcs_path=metrics_gcs_path,
            agent_url=agent_url,
            agent_name=agent_name,
            wait=True,
        )

        # Cleanup temp pipeline file
        pipeline_yaml_path.unlink(missing_ok=True)
        temp_dir.rmdir()

        # D. Download final results from GCS to local results_dir
        logger.info("Pipeline run finished. Downloading evaluation summary...")
        eval_summary_path = results_dir / "eval_summary.json"

        summary_gcs_blob = f"{blob_prefix}/eval_summary.json"
        bucket.blob(summary_gcs_blob).download_to_filename(str(eval_summary_path))
        logger.info(f"Downloaded evaluation summary to {eval_summary_path}")

        # Download raw CSV to local raw_dir so downstream code can load it
        logger.info("Downloading raw evaluation CSV records...")
        blobs = storage_client.list_blobs(bucket_name, prefix=f"{blob_prefix}/details/")
        for blob in blobs:
            if blob.name.endswith(".csv"):
                local_csv_name = os.path.basename(blob.name)
                local_csv_path = raw_dir / local_csv_name
                blob.download_to_filename(str(local_csv_path))
                logger.info(f"Downloaded raw CSV to {local_csv_path}")

    else:
        # 2. Run simulation in process
        logger.info("Starting simulation...")
        project_root = agent_project_root(agent_dir)
        dataset_path = eval_dir / "dataset.jsonl"
        try:
            records = await run_simulation_in_process(
                agent_dir=agent_dir,
                project_root=project_root,
                dataset_path=dataset_path,
            )
        except Exception:
            logger.exception("Simulation failed")
            raise

        if not records:
            logger.warning("No interactions collected.")
            return EvaluationResult(
                success=True,
                failed_metrics=[],
                metrics={},
                summary={},
                raw_results=pd.DataFrame(),
            )

        sim_output = raw_dir / "processed_interaction_sim.jsonl"
        write_jsonl(records, str(sim_output))
        interaction_files = [sim_output]

        # 3. Verify metric definitions exist
        metrics_path = eval_dir / "metrics" / "metric_definitions.json"
        if not metrics_path.exists():
            raise FileNotFoundError(f"Metric definitions not found at {metrics_path}")

        # 4. Evaluate
        logger.info("Evaluating interactions...")
        eval_config = {
            "location": location,
            "gcs_dest": gcs_dest,
        }
        evaluator = Evaluator(eval_config)
        await evaluator.evaluate(
            interaction_files=interaction_files,
            metrics_files=[metrics_path],
            results_dir=results_dir,
        )

    # Read the summary to get failed metrics from evaluator runtime
    eval_summary_path = results_dir / "eval_summary.json"
    if not eval_summary_path.exists():
        raise FileNotFoundError(f"Evaluation summary not found at {eval_summary_path}")
    summary = EvaluationSummary.model_validate_json(
        eval_summary_path.read_text(encoding="utf-8")
    )

    evaluator_failed_metrics = summary.overall_summary.failed_metrics
    failed_metric_names = []
    for fm in evaluator_failed_metrics:
        if isinstance(fm, dict):
            failed_metric_names.append(fm.get("metric", "unknown"))
        else:
            failed_metric_names.append(str(fm))

    # Load raw CSV to return in result
    csv_files = list(raw_dir.glob("evaluation_results_*.csv"))
    latest_csv = None
    results_df = pd.DataFrame()
    if csv_files:
        latest_csv = max(csv_files, key=lambda p: p.stat().st_mtime)
        with contextlib.suppress(pd.errors.EmptyDataError):
            results_df = pd.read_csv(latest_csv)

    # 5. Optional Analysis (Gemini)
    if run_analysis:
        logger.info("Running Gemini analysis...")
        try:
            config = {
                "results_dir": str(results_dir),
                "agent_dir": str(agent_dir),
                "model": model,
                "location": location,
            }
            analyzer = Analyzer(config)
            await analyzer.run()
        except Exception:
            logger.exception("Analysis failed")

    # 6. Optional HTML Report
    if generate_html:
        logger.info("Generating HTML report...")
        try:
            await asyncio.to_thread(generate_html_report, results_dir=results_dir)
        except Exception:
            logger.exception("Report generation failed")

    # 7. Extract metrics and check thresholds
    metrics_summary = {}
    threshold_failures = []
    llm_based_metrics = summary.overall_summary.llm_based_metrics

    for metric_name, data in llm_based_metrics.items():
        avg = data.average
        metrics_summary[metric_name] = avg

        threshold = data.threshold
        if threshold is not None and avg < threshold:
            threshold_failures.append(
                {
                    "metric": metric_name,
                    "average": avg,
                    "threshold": threshold,
                }
            )

    # success means no evaluator crashes/errors AND no threshold failures
    success = (len(failed_metric_names) == 0) and (len(threshold_failures) == 0)

    return EvaluationResult(
        success=success,
        failed_metrics=failed_metric_names,
        metrics=metrics_summary,
        summary=summary,
        raw_results=results_df,
        threshold_failures=threshold_failures,
    )


def run_evaluation_sync(
    agent_dir: Path | str,
    eval_dir: Path | str | None = None,
    run_id: str | None = None,
    location: str | None = None,
    run_analysis: bool = False,
    generate_html: bool = False,
    model: str = "gemini-3.1-pro-preview",
    gcs_dest: str | None = None,
    pipeline: bool = False,
    runner_image: str | None = None,
    agent_url: str | None = None,
    agent_name: str | None = None,
) -> EvaluationResult:
    """Synchronous wrapper for run_evaluation.

    Args:
        agent_dir: Path to the agent project directory.
        eval_dir: Optional path to the eval folder. If omitted, resolved from agent_dir.
        run_id: Optional run identifier (timestamp-based if omitted).
        location: Vertex AI location (e.g. us-central1).
        run_analysis: Whether to run Gemini-based analysis on the results.
        generate_html: Whether to generate the HTML report.
        model: Model to use for analysis.
        gcs_dest: Optional GCS destination URI for managed Vertex AI pipelines.
        pipeline: Whether to orchestrate the entire flow on Vertex AI Pipelines.
        runner_image: Docker image containing agent-eval for the KFP steps.
        agent_url: The remote agent endpoint URL (required if pipeline=True).
        agent_name: The name of the agent application (required if pipeline=True).

    Returns:
        EvaluationResult containing the metrics and pass/fail status.
    """
    return asyncio.run(
        run_evaluation(
            agent_dir=agent_dir,
            eval_dir=eval_dir,
            run_id=run_id,
            location=location,
            run_analysis=run_analysis,
            generate_html=generate_html,
            model=model,
            gcs_dest=gcs_dest,
            pipeline=pipeline,
            runner_image=runner_image,
            agent_url=agent_url,
            agent_name=agent_name,
        )
    )
