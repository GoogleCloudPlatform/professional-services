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

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

from agent_eval.core.evaluator import Evaluator
from agent_eval.core.path_resolver import agent_project_root, find_eval_dir
from agent_eval.core.simulation import run_simulation_in_process
from agent_eval.core.converters import write_jsonl
import asyncio
from agent_eval.core.analyzer import Analyzer
from agent_eval.core.html_report import generate_html_report

logger = logging.getLogger("agent_eval.sdk")


class EvaluationResult:
    """The result of an evaluation run."""

    def __init__(
        self,
        passed: bool,
        failed_metrics: List[str],
        metrics: Dict[str, float],
        summary: Dict[str, Any],
        raw_results: pd.DataFrame,
    ):
        self.passed = passed
        self.failed_metrics = failed_metrics
        self.metrics = metrics
        self.summary = summary
        self.raw_results = raw_results

    def __repr__(self) -> str:
        return (
            f"EvaluationResult(passed={self.passed}, "
            f"failed_metrics={self.failed_metrics}, "
            f"metrics={self.metrics})"
        )


def run_evaluation(
    agent_dir: Path | str,
    eval_dir: Optional[Path | str] = None,
    run_id: Optional[str] = None,
    location: Optional[str] = None,
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
    if eval_dir:
        eval_dir = Path(eval_dir).resolve()
    else:
        eval_dir = find_eval_dir(agent_dir)

    # 1. Resolve run_id and output dirs
    from datetime import datetime

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
        records = asyncio.run(
            run_simulation_in_process(
                agent_dir=agent_dir,
                project_root=project_root,
                dataset_path=dataset_path,
            )
        )
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
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
    evaluator.evaluate(
        interaction_files=interaction_files,
        metrics_files=[metrics_path],
        results_dir=results_dir,
    )

    # Read the summary to get failed metrics from evaluator runtime
    eval_summary_path = results_dir / "eval_summary.json"
    if not eval_summary_path.exists():
        raise FileNotFoundError(f"Evaluation summary not found at {eval_summary_path}")
    with open(eval_summary_path, "r") as f:
        summary_data = json.load(f)

    evaluator_failed_metrics = summary_data.get("overall_summary", {}).get(
        "failed_metrics", []
    )
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
        try:
            results_df = pd.read_csv(latest_csv)
        except pd.errors.EmptyDataError:
            pass

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
            analyzer.run()
        except Exception as e:
            logger.error(f"Analysis failed: {e}")

    # 6. Optional HTML Report
    if generate_html:
        logger.info("Generating HTML report...")
        try:
            generate_html_report(results_dir=results_dir)
        except Exception as e:
            logger.error(f"Report generation failed: {e}")

    # 7. Extract metrics
    metrics_summary = {}
    overall_summary = summary_data.get("overall_summary", {})
    llm_based_metrics = overall_summary.get("llm_based_metrics", {})

    for metric_name, data in llm_based_metrics.items():
        avg = data.get("average")
        if avg is not None:
            metrics_summary[metric_name] = avg

    # passed means no evaluator crashes/errors
    passed = len(failed_metric_names) == 0

    return EvaluationResult(
        passed=passed,
        failed_metrics=failed_metric_names,
        metrics=metrics_summary,
        summary=summary_data,
        raw_results=results_df,
    )
