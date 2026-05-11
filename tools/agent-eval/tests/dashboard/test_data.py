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
"""Tests for the dashboard data layer (no Gradio dependency needed)."""

import json
from datetime import datetime
from pathlib import Path

import pandas as pd
import pytest

from agent_eval.dashboard.data import (
    RunInfo,
    classify_metrics,
    compute_delta,
    discover_runs,
    load_analysis,
    load_run,
    runs_to_overview_df,
    runs_to_per_question_df,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_eval_summary(
    experiment_id: str = "test-exp",
    run_type: str = "baseline",
    interaction_datetime: str = "2026-01-15T10:00:00",
    det_metrics: dict | None = None,
    llm_metrics: dict | None = None,
    per_question: list | None = None,
    git_info: dict | None = None,
) -> dict:
    """Build a minimal eval_summary.json payload."""
    if per_question is None:
        per_question = [
            {
                "question_id": "q1",
                "source_type": "interaction",
                "llm_metrics": {
                    "general_quality": {
                        "score": 4.0
                    }
                },
                "deterministic_metrics": {
                    "token_usage.total_tokens": 750
                },
            },
            {
                "question_id": "q2",
                "source_type": "interaction",
                "llm_metrics": {
                    "general_quality": {
                        "score": 4.4
                    }
                },
                "deterministic_metrics": {
                    "token_usage.total_tokens": 750
                },
            },
        ]

    return {
        "experiment_id":
            experiment_id,
        "run_type":
            run_type,
        "interaction_datetime":
            interaction_datetime,
        "git_info":
            git_info or {
                "commit": "abc123def456",
                "branch": "main",
                "dirty": False
            },
        "overall_summary": {
            "deterministic_metrics":
                det_metrics or {
                    "token_usage.total_tokens": 1500,
                    "token_usage.estimated_cost_usd": 0.005,
                    "latency_metrics.total_latency_seconds": 3.2,
                },
            "llm_based_metrics":
                llm_metrics or {
                    "general_quality": {
                        "average": 4.2,
                        "score_range": {
                            "min": 1,
                            "max": 5
                        }
                    },
                },
        },
        "per_question_summary":
            per_question,
    }


def _write_run(results_dir: Path,
               run_name: str,
               summary: dict,
               analysis: str = "") -> Path:
    """Write an eval_summary.json (and optional analysis) to a run subfolder."""
    run_dir = results_dir / run_name
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "eval_summary.json").write_text(json.dumps(summary, indent=2))
    if analysis:
        (run_dir / "gemini_analysis.md").write_text(analysis)
    return run_dir


# ---------------------------------------------------------------------------
# discover_runs
# ---------------------------------------------------------------------------


class TestDiscoverRuns:

    def test_empty_dir(self, tmp_path):
        assert discover_runs(tmp_path) == []

    def test_nonexistent_dir(self, tmp_path):
        assert discover_runs(tmp_path / "nope") == []

    def test_single_run(self, tmp_path):
        _write_run(tmp_path, "run1", _make_eval_summary())
        runs = discover_runs(tmp_path)
        assert len(runs) == 1
        assert runs[0].run_id == "run1"

    def test_sorted_by_timestamp(self, tmp_path):
        _write_run(
            tmp_path, "later",
            _make_eval_summary(interaction_datetime="2026-02-01T10:00:00"))
        _write_run(
            tmp_path, "earlier",
            _make_eval_summary(interaction_datetime="2026-01-01T10:00:00"))
        runs = discover_runs(tmp_path)
        assert runs[0].run_id == "earlier"
        assert runs[1].run_id == "later"

    def test_skips_invalid_json(self, tmp_path):
        run_dir = tmp_path / "bad"
        run_dir.mkdir()
        (run_dir / "eval_summary.json").write_text("not valid json")
        assert discover_runs(tmp_path) == []

    def test_skips_missing_datetime(self, tmp_path):
        summary = _make_eval_summary()
        del summary["interaction_datetime"]
        _write_run(tmp_path, "no_dt", summary)
        assert discover_runs(tmp_path) == []

    def test_skips_files(self, tmp_path):
        """Non-directory entries in results_dir are ignored."""
        (tmp_path / "stray_file.txt").write_text("hello")
        _write_run(tmp_path, "run1", _make_eval_summary())
        runs = discover_runs(tmp_path)
        assert len(runs) == 1


# ---------------------------------------------------------------------------
# load_run
# ---------------------------------------------------------------------------


class TestLoadRun:

    def test_parses_deterministic_metrics(self, tmp_path):
        run_dir = _write_run(tmp_path, "r1", _make_eval_summary())
        run = load_run(run_dir / "eval_summary.json")
        assert run is not None
        assert run.deterministic_metrics["token_usage.total_tokens"] == 1500.0
        assert run.deterministic_metrics[
            "token_usage.estimated_cost_usd"] == 0.005

    def test_parses_llm_metrics(self, tmp_path):
        run_dir = _write_run(tmp_path, "r1", _make_eval_summary())
        run = load_run(run_dir / "eval_summary.json")
        assert run is not None
        assert run.llm_metrics["general_quality"]["average"] == 4.2
        assert run.llm_metrics["general_quality"]["score_range"]["min"] == 1

    def test_parses_per_question(self, tmp_path):
        run_dir = _write_run(tmp_path, "r1", _make_eval_summary())
        run = load_run(run_dir / "eval_summary.json")
        assert run is not None
        assert len(run.per_question_summary) == 2
        assert run.per_question_summary[0]["question_id"] == "q1"
        assert run.per_question_summary[0]["general_quality"] == 4.0

    def test_git_info(self, tmp_path):
        run_dir = _write_run(
            tmp_path, "r1",
            _make_eval_summary(git_info={
                "commit": "deadbeef",
                "branch": "feature",
                "dirty": True
            }))
        run = load_run(run_dir / "eval_summary.json")
        assert run.git_info["commit"] == "deadbeef"
        assert run.git_info["branch"] == "feature"
        assert run.git_info["dirty"] is True

    def test_has_analysis_flag(self, tmp_path):
        _write_run(tmp_path,
                   "with_analysis",
                   _make_eval_summary(),
                   analysis="# Analysis")
        _write_run(tmp_path, "without_analysis", _make_eval_summary())

        run_with = load_run(tmp_path / "with_analysis" / "eval_summary.json")
        run_without = load_run(tmp_path / "without_analysis" /
                               "eval_summary.json")

        assert run_with.has_analysis is True
        assert run_without.has_analysis is False


# ---------------------------------------------------------------------------
# load_analysis
# ---------------------------------------------------------------------------


class TestLoadAnalysis:

    def test_loads_content(self, tmp_path):
        _write_run(tmp_path,
                   "r1",
                   _make_eval_summary(),
                   analysis="# My Analysis\nSome text.")
        run = load_run(tmp_path / "r1" / "eval_summary.json")
        assert load_analysis(run) == "# My Analysis\nSome text."

    def test_returns_empty_when_missing(self, tmp_path):
        _write_run(tmp_path, "r1", _make_eval_summary())
        run = load_run(tmp_path / "r1" / "eval_summary.json")
        assert load_analysis(run) == ""


# ---------------------------------------------------------------------------
# classify_metrics
# ---------------------------------------------------------------------------


class TestClassifyMetrics:

    def test_groups_correctly(self):
        det = [
            "token_usage.total_tokens",
            "token_usage.estimated_cost_usd",
            "latency_metrics.total_latency_seconds",
            "cache_efficiency.hit_rate",
            "tool_success_rate.rate",
        ]
        llm = ["general_quality", "trajectory_accuracy"]

        groups = classify_metrics(det, llm)

        assert "token_usage.total_tokens" in groups["Cost"]
        assert "token_usage.estimated_cost_usd" in groups["Cost"]
        assert "latency_metrics.total_latency_seconds" in groups["Latency"]
        assert "cache_efficiency.hit_rate" in groups["Other"]
        assert "tool_success_rate.rate" in groups["Other"]
        assert "general_quality" in groups["Quality"]
        assert "trajectory_accuracy" in groups["Quality"]

    def test_empty_inputs(self):
        groups = classify_metrics([], [])
        assert groups == {"Cost": [], "Latency": [], "Quality": [], "Other": []}


# ---------------------------------------------------------------------------
# compute_delta
# ---------------------------------------------------------------------------


class TestComputeDelta:

    def test_improvement_lower_is_better(self):
        # Latency went down — that's an improvement
        result = compute_delta(10.0, 5.0,
                               "latency_metrics.total_latency_seconds")
        assert result["direction"] == "improvement"
        assert result["is_improvement"] is True
        assert result["pct_change"] == pytest.approx(-50.0)

    def test_regression_lower_is_better(self):
        # Tokens went up — that's a regression
        result = compute_delta(1000, 1500, "token_usage.total_tokens")
        assert result["direction"] == "regression"
        assert result["is_improvement"] is False

    def test_improvement_higher_is_better(self):
        # Quality score went up — that's an improvement
        result = compute_delta(3.0, 4.5, "general_quality")
        assert result["direction"] == "improvement"
        assert result["is_improvement"] is True

    def test_regression_higher_is_better(self):
        # Quality went down — regression
        result = compute_delta(4.5, 3.0, "general_quality")
        assert result["direction"] == "regression"
        assert result["is_improvement"] is False

    def test_neutral_small_change(self):
        # Less than 1% is neutral
        result = compute_delta(100.0, 100.5, "token_usage.total_tokens")
        assert result["direction"] == "neutral"

    def test_zero_baseline(self):
        result = compute_delta(0.0, 5.0, "some_metric")
        assert result["pct_change"] == 0.0
        assert result["direction"] == "neutral"


# ---------------------------------------------------------------------------
# runs_to_overview_df
# ---------------------------------------------------------------------------


class TestRunsToOverviewDf:

    def test_basic(self, tmp_path):
        _write_run(
            tmp_path, "r1",
            _make_eval_summary(interaction_datetime="2026-01-01T10:00:00",
                               experiment_id="exp1"))
        _write_run(
            tmp_path, "r2",
            _make_eval_summary(interaction_datetime="2026-01-02T10:00:00",
                               experiment_id="exp2",
                               det_metrics={"token_usage.total_tokens": 2000}))

        runs = discover_runs(tmp_path)
        df = runs_to_overview_df(runs)

        assert len(df) == 2
        assert "run_id" in df.columns
        assert "token_usage.total_tokens" in df.columns
        assert "general_quality" in df.columns
        assert df.iloc[0]["run_id"] == "r1"
        assert df.iloc[1]["run_id"] == "r2"

    def test_empty_runs(self):
        df = runs_to_overview_df([])
        assert df.empty

    def test_includes_git_info(self, tmp_path):
        _write_run(
            tmp_path, "r1",
            _make_eval_summary(git_info={
                "commit": "abc123",
                "branch": "main",
                "dirty": False
            }))
        runs = discover_runs(tmp_path)
        df = runs_to_overview_df(runs)
        assert df.iloc[0]["git_commit"] == "abc123"[:8]
        assert df.iloc[0]["git_branch"] == "main"


# ---------------------------------------------------------------------------
# runs_to_per_question_df
# ---------------------------------------------------------------------------


class TestRunsToPerQuestionDf:

    def test_basic(self, tmp_path):
        _write_run(tmp_path, "r1", _make_eval_summary())
        runs = discover_runs(tmp_path)
        df = runs_to_per_question_df(runs, "general_quality")

        assert "q1" in df.index
        assert "q2" in df.index
        assert "r1" in df.columns
        assert df.loc["q1", "r1"] == 4.0
        assert df.loc["q2", "r1"] == 4.4

    def test_missing_metric(self, tmp_path):
        _write_run(tmp_path, "r1", _make_eval_summary())
        runs = discover_runs(tmp_path)
        df = runs_to_per_question_df(runs, "nonexistent_metric")
        # No scores found — pandas returns empty DataFrame
        assert df.empty

    def test_no_questions(self, tmp_path):
        _write_run(tmp_path, "r1", _make_eval_summary(per_question=[]))
        runs = discover_runs(tmp_path)
        df = runs_to_per_question_df(runs, "general_quality")
        assert df.empty
