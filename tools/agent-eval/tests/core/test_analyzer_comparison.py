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
"""Tests for analyzer comparison logic: deltas, direction, optimization log, prompts."""

import json
import pytest
from pathlib import Path
from unittest.mock import patch

from agent_eval.core.analyzer import (
    compute_comparison,
    format_comparison_table,
    _is_lower_better,
    _classify_direction,
    _compute_pct_change,
    Analyzer,
)
from agent_eval.core.gemini_prompt_builder import GeminiAnalysisPrompter


# ── Fixtures ──────────────────────────────────────────────────────────────


def _make_summary(
    experiment_id="eval-test",
    det_metrics=None,
    llm_metrics=None,
    git_info=None,
):
    """Build a minimal eval_summary.json dict."""
    return {
        "experiment_id": experiment_id,
        "overall_summary": {
            "deterministic_metrics": det_metrics or {},
            "llm_based_metrics": llm_metrics or {},
        },
        "git_info": git_info or {},
    }


# ── Direction classification ──────────────────────────────────────────────


class TestDirectionClassification:
    def test_lower_is_better_tokens(self):
        assert _is_lower_better("token_usage.total_tokens") is True

    def test_lower_is_better_latency(self):
        assert _is_lower_better("latency_metrics.total_seconds") is True

    def test_higher_is_better_cache(self):
        assert _is_lower_better("cache_efficiency.cache_hit_rate") is False

    def test_higher_is_better_llm_metric(self):
        assert _is_lower_better("trajectory_accuracy") is False

    def test_lower_is_better_failed_tools(self):
        assert _is_lower_better("tool_success_rate.failed_tool_calls") is True

    def test_improvement_lower_is_better(self):
        # Tokens went down → improvement
        direction, emoji = _classify_direction("token_usage.total_tokens", -15.0)
        assert direction == "improvement"
        assert emoji == "🟢"

    def test_regression_lower_is_better(self):
        # Tokens went up → regression
        direction, emoji = _classify_direction("token_usage.total_tokens", 20.0)
        assert direction == "regression"
        assert emoji == "🔴"

    def test_improvement_higher_is_better(self):
        # Quality went up → improvement
        direction, emoji = _classify_direction("general_quality", 5.0)
        assert direction == "improvement"
        assert emoji == "🟢"

    def test_regression_higher_is_better(self):
        # Quality went down → regression
        direction, emoji = _classify_direction("general_quality", -10.0)
        assert direction == "regression"
        assert emoji == "🔴"

    def test_neutral_threshold(self):
        direction, emoji = _classify_direction("token_usage.total_tokens", 0.5)
        assert direction == "neutral"
        assert emoji == "⚪"

    def test_neutral_zero(self):
        direction, emoji = _classify_direction("general_quality", 0.0)
        assert direction == "neutral"
        assert emoji == "⚪"


# ── Percentage change ────────────────────────────────────────────────────


class TestPctChange:
    def test_basic_increase(self):
        assert _compute_pct_change(100, 120) == 20.0

    def test_basic_decrease(self):
        assert _compute_pct_change(100, 80) == -20.0

    def test_zero_baseline(self):
        assert _compute_pct_change(0, 50) == 100.0

    def test_both_zero(self):
        assert _compute_pct_change(0, 0) == 0.0


# ── compute_comparison ───────────────────────────────────────────────────


class TestComputeComparison:
    def test_basic_deterministic_deltas(self):
        baseline = _make_summary(
            experiment_id="baseline",
            det_metrics={"token_usage.total_tokens": 10000, "latency_metrics.total_seconds": 12.0},
        )
        current = _make_summary(
            experiment_id="current",
            det_metrics={"token_usage.total_tokens": 8000, "latency_metrics.total_seconds": 14.0},
        )
        result = compute_comparison(baseline, current)

        assert result["baseline_id"] == "baseline"
        assert result["current_id"] == "current"
        assert len(result["deltas"]) == 2

        token_delta = next(d for d in result["deltas"] if "total_tokens" in d["metric"])
        assert token_delta["baseline"] == 10000
        assert token_delta["current"] == 8000
        assert token_delta["direction"] == "improvement"  # tokens went down

        latency_delta = next(d for d in result["deltas"] if "total_seconds" in d["metric"])
        assert latency_delta["direction"] == "regression"  # latency went up

    def test_llm_metric_deltas(self):
        baseline = _make_summary(
            llm_metrics={"quality": {"average": 4.0, "score_range": {"min": 0, "max": 5}}},
        )
        current = _make_summary(
            llm_metrics={"quality": {"average": 4.5, "score_range": {"min": 0, "max": 5}}},
        )
        result = compute_comparison(baseline, current)

        assert len(result["deltas"]) == 1
        delta = result["deltas"][0]
        assert delta["metric"] == "quality"
        assert delta["direction"] == "improvement"
        # pct relative to range: (4.5-4.0)/5 * 100 = 10%
        assert delta["pct_change"] == 10.0

    def test_new_metric(self):
        baseline = _make_summary(det_metrics={"token_usage.total_tokens": 10000})
        current = _make_summary(
            det_metrics={"token_usage.total_tokens": 9000, "cache_efficiency.hit_rate": 0.5},
        )
        result = compute_comparison(baseline, current)

        assert len(result["new_metrics"]) == 1
        assert result["new_metrics"][0]["metric"] == "cache_efficiency.hit_rate"

    def test_removed_metric(self):
        baseline = _make_summary(
            det_metrics={"token_usage.total_tokens": 10000, "old_metric": 42},
        )
        current = _make_summary(det_metrics={"token_usage.total_tokens": 9000})
        result = compute_comparison(baseline, current)

        assert len(result["removed_metrics"]) == 1
        assert result["removed_metrics"][0]["metric"] == "old_metric"

    def test_neutral_small_change(self):
        baseline = _make_summary(det_metrics={"token_usage.total_tokens": 10000})
        current = _make_summary(det_metrics={"token_usage.total_tokens": 10050})
        result = compute_comparison(baseline, current)

        delta = result["deltas"][0]
        assert delta["direction"] == "neutral"

    def test_git_diff_same_commit(self):
        baseline = _make_summary(git_info={"commit": "abc123", "branch": "main"})
        current = _make_summary(git_info={"commit": "abc123", "branch": "main"})
        result = compute_comparison(baseline, current)
        assert result["git_diff"] == ""

    def test_empty_summaries(self):
        result = compute_comparison(_make_summary(), _make_summary())
        assert result["deltas"] == []
        assert result["new_metrics"] == []
        assert result["removed_metrics"] == []


# ── format_comparison_table ──────────────────────────────────────────────


class TestFormatComparisonTable:
    def test_produces_markdown_table(self):
        comparison = {
            "deltas": [
                {
                    "metric": "token_usage.total_tokens",
                    "baseline": 10000.0,
                    "current": 8000.0,
                    "delta": -2000.0,
                    "pct_change": -20.0,
                    "direction": "improvement",
                    "emoji": "🟢",
                }
            ],
            "new_metrics": [],
            "removed_metrics": [],
        }
        table = format_comparison_table(comparison)
        assert "token_usage.total_tokens" in table
        assert "10000.00" in table
        assert "8000.00" in table
        assert "🟢" in table
        assert "| Metric |" in table  # header row


# ── Auto-find previous run ───────────────────────────────────────────────


class TestAutoFindPreviousRun:
    def test_finds_most_recent(self, tmp_path):
        # Create two run folders with eval_summary.json
        run1 = tmp_path / "baseline"
        run1.mkdir()
        (run1 / "eval_summary.json").write_text("{}")

        run2 = tmp_path / "v2"
        run2.mkdir()
        (run2 / "eval_summary.json").write_text("{}")

        analyzer = Analyzer({"results_dir": str(tmp_path)})
        result = analyzer._auto_find_previous_run(tmp_path, run2)

        assert result == run1

    def test_no_previous_run(self, tmp_path):
        run1 = tmp_path / "baseline"
        run1.mkdir()
        (run1 / "eval_summary.json").write_text("{}")

        analyzer = Analyzer({"results_dir": str(tmp_path)})
        result = analyzer._auto_find_previous_run(tmp_path, run1)

        assert result is None

    def test_skips_current_run(self, tmp_path):
        run1 = tmp_path / "run1"
        run1.mkdir()
        (run1 / "eval_summary.json").write_text("{}")

        analyzer = Analyzer({"results_dir": str(tmp_path)})
        result = analyzer._auto_find_previous_run(tmp_path, run1)

        assert result is None


# ── Optimization log ─────────────────────────────────────────────────────


class TestOptimizationLog:
    def test_creates_baseline_entry(self, tmp_path):
        run_folder = tmp_path / "results" / "baseline"
        run_folder.mkdir(parents=True)
        (run_folder.parent).mkdir(exist_ok=True)

        analyzer = Analyzer({"results_dir": str(tmp_path)})
        log_path = analyzer.generate_optimization_log(
            comparison=None,
            focus="latency",
            run_folder=run_folder,
            current_summary=_make_summary(experiment_id="eval-baseline"),
        )

        assert log_path.exists()
        content = log_path.read_text()
        assert "Iteration 1" in content
        assert "Baseline" in content
        assert "latency" in content

    def test_appends_iteration(self, tmp_path):
        run_folder = tmp_path / "results" / "v2"
        run_folder.mkdir(parents=True)

        # Create existing log with baseline
        log_path = run_folder.parent / "OPTIMIZATION_LOG.md"
        log_path.write_text("# Optimization Log\n\n## Iteration 1 — Baseline\n\nBaseline entry.\n")

        comparison = {
            "baseline_id": "eval-baseline",
            "current_id": "eval-v2",
            "baseline_git": {},
            "current_git": {},
            "deltas": [
                {
                    "metric": "token_usage.total_tokens",
                    "type": "deterministic",
                    "baseline": 10000.0,
                    "current": 8000.0,
                    "delta": -2000.0,
                    "pct_change": -20.0,
                    "direction": "improvement",
                    "emoji": "🟢",
                }
            ],
            "new_metrics": [],
            "removed_metrics": [],
        }

        analyzer = Analyzer({"results_dir": str(tmp_path)})
        result_path = analyzer.generate_optimization_log(
            comparison=comparison,
            focus=None,
            run_folder=run_folder,
        )

        content = result_path.read_text()
        assert "Iteration 1" in content
        assert "Iteration 2" in content
        assert "🟢" in content
        assert "token_usage.total_tokens" in content


# ── Prompt builder extensions ────────────────────────────────────────────


class TestPromptBuilderExtensions:
    def _make_prompter(self, focus=None):
        return GeminiAnalysisPrompter(
            summary_data={"overall_summary": {}},
            analysis_content="test",
            context_files={},
            question_file_path="q.json",
            consolidated_metrics_path="m.json",
            focus_directive=focus,
        )

    def test_prompt_without_focus(self):
        prompter = self._make_prompter()
        prompt = prompter.build_prompt()
        assert "DEVELOPER PRIORITY" not in prompt

    def test_prompt_with_focus(self):
        prompter = self._make_prompter(focus="latency is critical")
        prompt = prompter.build_prompt()
        assert "DEVELOPER PRIORITY" in prompt
        assert "latency is critical" in prompt

    def test_comparison_prompt_includes_table(self):
        prompter = self._make_prompter(focus="tool accuracy")
        comparison_data = {
            "baseline_id": "eval-baseline",
            "current_id": "eval-v2",
            "baseline_git": {"commit": "abc123"},
            "current_git": {"commit": "def456"},
            "git_diff": "diff --git a/agent.py\n-old line\n+new line",
            "deltas": [],
            "new_metrics": [],
            "removed_metrics": [],
        }
        table = "| Metric | Baseline | Current | Delta | % Change | Status |"
        prompt = prompter.build_comparison_prompt(comparison_data, table)

        assert "eval-baseline" in prompt
        assert "eval-v2" in prompt
        assert "What Changed" in prompt
        assert "Impact Analysis" in prompt
        assert "tool accuracy" in prompt
        assert "diff --git" in prompt

    def test_comparison_prompt_no_git_diff(self):
        prompter = self._make_prompter()
        comparison_data = {
            "baseline_id": "baseline",
            "current_id": "current",
            "baseline_git": {},
            "current_git": {},
            "git_diff": "",
            "deltas": [],
            "new_metrics": [],
            "removed_metrics": [],
        }
        prompt = prompter.build_comparison_prompt(comparison_data, "")
        assert "No git information available" in prompt

    def test_backward_compat_no_new_params(self):
        """Prompter works without any new parameters (backward compat)."""
        prompter = GeminiAnalysisPrompter(
            summary_data={"overall_summary": {}},
            analysis_content="test",
            context_files={},
            question_file_path="q.json",
            consolidated_metrics_path="m.json",
        )
        prompt = prompter.build_prompt()
        assert "expert AI evaluation analyst" in prompt
