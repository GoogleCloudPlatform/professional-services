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
"""Data loading and transformation for the agent-eval dashboard.

This module has NO dependency on Gradio or Plotly — it uses only
standard library + pandas (a core agent-eval dependency).  This means
the CLI can safely import it to check for available runs without
requiring the heavy dashboard extras.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from agent_eval.core.analyzer import LOWER_IS_BETTER, _is_lower_better


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class RunInfo:
    """Metadata and metrics for a single evaluation run."""

    run_id: str                                        # folder name
    experiment_id: str                                 # from eval_summary
    run_type: str
    timestamp: datetime
    timestamp_str: str                                 # ISO formatted
    git_info: dict[str, Any]                           # {commit, branch, dirty}
    deterministic_metrics: dict[str, float]            # flattened
    llm_metrics: dict[str, dict[str, Any]]             # name -> {average, score_range}
    per_question_summary: list[dict[str, Any]]
    folder_path: Path
    has_analysis: bool                                 # gemini_analysis.md exists


# ---------------------------------------------------------------------------
# Discovery & loading
# ---------------------------------------------------------------------------

def discover_runs(results_dir: Path) -> list[RunInfo]:
    """Scan *results_dir* for sub-directories that contain an ``eval_summary.json``.

    Returns a list of :class:`RunInfo` sorted by timestamp (oldest first),
    so the first element is the natural baseline candidate.
    """
    if not results_dir.is_dir():
        return []

    runs: list[RunInfo] = []
    for subdir in sorted(results_dir.iterdir()):
        if not subdir.is_dir():
            continue
        summary_path = subdir / "eval_summary.json"
        if summary_path.exists():
            run = load_run(summary_path)
            if run is not None:
                runs.append(run)

    runs.sort(key=lambda r: r.timestamp)
    return runs


def load_run(summary_path: Path) -> RunInfo | None:
    """Parse a single ``eval_summary.json`` into a :class:`RunInfo`."""
    try:
        data = json.loads(summary_path.read_text())
    except (json.JSONDecodeError, OSError):
        return None

    interaction_dt = data.get("interaction_datetime")
    if not interaction_dt:
        return None

    try:
        dt_obj = datetime.fromisoformat(interaction_dt)
    except ValueError:
        return None

    overall = data.get("overall_summary", {})

    # Deterministic metrics are already flat in eval_summary.json
    det_metrics: dict[str, float] = {}
    for key, val in overall.get("deterministic_metrics", {}).items():
        if isinstance(val, (int, float)):
            det_metrics[key] = float(val)

    # LLM metrics: keep {average, score_range}
    llm_metrics: dict[str, dict[str, Any]] = {}
    for name, info in overall.get("llm_based_metrics", {}).items():
        if isinstance(info, dict) and "average" in info:
            llm_metrics[name] = {
                "average": float(info["average"]),
                "score_range": info.get("score_range", {}),
            }

    # Per-question: extract only scores (skip bulky input/output text)
    per_q: list[dict[str, Any]] = []
    for entry in data.get("per_question_summary", []):
        slim: dict[str, Any] = {
            "question_id": entry.get("question_id", ""),
            "source_type": entry.get("source_type", ""),
        }
        for mname, mdata in entry.get("llm_metrics", {}).items():
            if isinstance(mdata, dict):
                slim[mname] = mdata.get("score")
        for mname, mval in entry.get("deterministic_metrics", {}).items():
            if isinstance(mval, (int, float)):
                slim[mname] = mval
        per_q.append(slim)

    folder = summary_path.parent
    return RunInfo(
        run_id=folder.name,
        experiment_id=data.get("experiment_id", folder.name),
        run_type=data.get("run_type", ""),
        timestamp=dt_obj,
        timestamp_str=interaction_dt,
        git_info=data.get("git_info", {}),
        deterministic_metrics=det_metrics,
        llm_metrics=llm_metrics,
        per_question_summary=per_q,
        folder_path=folder,
        has_analysis=(folder / "gemini_analysis.md").exists(),
    )


def load_analysis(run: RunInfo) -> str:
    """Return the contents of ``gemini_analysis.md`` for *run*, or ``""``."""
    path = run.folder_path / "gemini_analysis.md"
    if path.exists():
        return path.read_text()
    return ""


# ---------------------------------------------------------------------------
# DataFrames
# ---------------------------------------------------------------------------

def runs_to_overview_df(runs: list[RunInfo]) -> pd.DataFrame:
    """One row per run, every metric as a column.

    Deterministic metrics are included directly.
    LLM metrics use their ``.average`` value.
    Metadata columns: experiment_id, run_id, datetime, run_type,
    git_commit, git_branch, git_dirty.
    """
    rows: list[dict[str, Any]] = []
    for r in runs:
        row: dict[str, Any] = {
            "experiment_id": r.experiment_id,
            "run_id": r.run_id,
            "datetime": r.timestamp,
            "run_type": r.run_type,
            "git_commit": r.git_info.get("commit", "")[:8] if r.git_info.get("commit") else "",
            "git_branch": r.git_info.get("branch", ""),
            "git_dirty": r.git_info.get("dirty", False),
        }
        row.update(r.deterministic_metrics)
        for name, info in r.llm_metrics.items():
            row[name] = info["average"]
        rows.append(row)

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.sort_values("datetime").reset_index(drop=True)
    return df


def runs_to_per_question_df(
    runs: list[RunInfo],
    metric_name: str,
) -> pd.DataFrame:
    """Rows = question_ids, columns = run experiment_ids.

    Values are the score for *metric_name* in each question/run pair.
    """
    # Collect all question_ids across runs
    all_qids: list[str] = []
    seen: set[str] = set()
    for r in runs:
        for entry in r.per_question_summary:
            qid = entry.get("question_id", "")
            if qid and qid not in seen:
                all_qids.append(qid)
                seen.add(qid)

    if not all_qids:
        return pd.DataFrame()

    data: dict[str, dict[str, Any]] = {qid: {} for qid in all_qids}
    for r in runs:
        for entry in r.per_question_summary:
            qid = entry.get("question_id", "")
            score = entry.get(metric_name)
            if qid and score is not None:
                data[qid][r.run_id] = score

    df = pd.DataFrame.from_dict(data, orient="index")
    df.index.name = "question_id"
    return df


# ---------------------------------------------------------------------------
# Metric classification
# ---------------------------------------------------------------------------

def classify_metrics(
    det_names: list[str],
    llm_names: list[str],
) -> dict[str, list[str]]:
    """Group metrics into display categories.

    Returns ``{"Cost": [...], "Latency": [...], "Quality": [...], "Other": [...]}``.

    - **Cost**: starts with ``token_usage.``
    - **Latency**: starts with ``latency_metrics.``
    - **Quality**: all LLM-based metrics
    - **Other**: everything else (cache, thinking, tool, grounding, etc.)
    """
    groups: dict[str, list[str]] = {
        "Cost": [],
        "Latency": [],
        "Quality": list(llm_names),
        "Other": [],
    }
    for name in det_names:
        if name.startswith("token_usage."):
            groups["Cost"].append(name)
        elif name.startswith("latency_metrics."):
            groups["Latency"].append(name)
        else:
            groups["Other"].append(name)

    return groups


# ---------------------------------------------------------------------------
# Delta computation
# ---------------------------------------------------------------------------

def compute_delta(
    baseline_val: float,
    current_val: float,
    metric_name: str,
) -> dict[str, Any]:
    """Compute percentage change and classify direction.

    Returns ``{"pct_change": float, "direction": str, "is_improvement": bool}``.
    """
    if baseline_val == 0:
        return {"pct_change": 0.0, "direction": "neutral", "is_improvement": False}

    pct = ((current_val - baseline_val) / abs(baseline_val)) * 100.0

    if abs(pct) < 1.0:
        return {"pct_change": pct, "direction": "neutral", "is_improvement": False}

    lower_better = _is_lower_better(metric_name)
    is_improvement = (pct < 0) if lower_better else (pct > 0)

    return {
        "pct_change": pct,
        "direction": "improvement" if is_improvement else "regression",
        "is_improvement": is_improvement,
    }
