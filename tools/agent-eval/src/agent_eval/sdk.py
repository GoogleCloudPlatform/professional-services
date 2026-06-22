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
from pydantic import BaseModel, ConfigDict, Field

from agent_eval.core.analyzer import Analyzer
from agent_eval.core.converters import write_jsonl
from agent_eval.core.evaluator import Evaluator
from agent_eval.core.html_report import generate_html_report
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
) -> EvaluationResult:
    """Run an evaluation in-process.

    Args:
        agent_dir: Path to the agent project directory.
        eval_dir: Optional path to the eval folder. If omitted, resolved from agent_dir.
        run_id: Optional run identifier (timestamp-based if omitted).
        location: Vertex AI location (e.g. us-central1).
        run_analysis: Whether to run Gemini-based analysis on the results.
        generate_html: Whether to generate the HTML report.
        model: Model to use for analysis.

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
            passed=True,
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
    evaluator = Evaluator(location=location)
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
        )
    )
