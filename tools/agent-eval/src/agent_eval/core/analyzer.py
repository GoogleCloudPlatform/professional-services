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
from __future__ import annotations

import ast
import json
import logging
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

import pandas as pd
from google import genai
from google.genai.types import HttpOptions

from agent_eval.core.gemini_prompt_builder import GeminiAnalysisPrompter
from agent_eval.core.utils import discover_agent_context

logger = logging.getLogger("agent_eval.analyzer")


class LogEntry(TypedDict):
    """A structured representation of a single question's evaluation results."""

    question_id: str
    metadata: Dict[str, Any]
    user_inputs: List[str]
    final_response: str
    trace_summary: List[str]
    sub_agent_trace: List[Dict[str, Any]]
    tool_interactions: List[Dict[str, Any]]
    eval_results: Dict[str, Dict[str, Any]]
    latency_summary: Dict[str, Any]
    adk_scores: Dict[str, float]
    agents_evaluated: List[str]


def robust_json_loads(x: Any) -> Optional[Dict[str, Any]]:
    """Safely load JSON strings, handling various input types.

    Tries json.loads first, then ast.literal_eval for Python dict syntax.
    """
    if x is None:
        return None
    if isinstance(x, (dict, list)):
        return x
    if not isinstance(x, str) or not x:
        return None
    try:
        return json.loads(x)
    except (json.JSONDecodeError, TypeError):
        # Try ast.literal_eval for Python dict syntax (single quotes)
        try:
            result = ast.literal_eval(x)
            if isinstance(result, (dict, list)):
                return result
        except (ValueError, SyntaxError):
            pass
        return None


# Metric prefixes where a lower value means better performance.
# Everything else (cache_hit_rate, tool_success_rate, all LLM metrics) = higher is better.
LOWER_IS_BETTER = {
    "token_usage.",
    "latency_metrics.",
    "thinking_metrics.",
    "tool_success_rate.failed_tool_calls",
    "context_saturation.",
    "estimated_cost",
}

# Threshold: changes smaller than this percentage are considered neutral.
NEUTRAL_THRESHOLD_PCT = 1.0


def _is_lower_better(metric_name: str) -> bool:
    """Check if a metric improves when its value decreases."""
    return any(
        metric_name.startswith(prefix)
        if prefix.endswith(".")
        else metric_name == prefix
        for prefix in LOWER_IS_BETTER
    )


def _compute_pct_change(baseline: float, current: float) -> float:
    """Compute percentage change from baseline to current."""
    if baseline == 0:
        return 0.0 if current == 0 else 100.0
    return ((current - baseline) / abs(baseline)) * 100


def _classify_direction(metric_name: str, pct_change: float) -> tuple[str, str]:
    """Returns (direction, emoji) for a metric change."""
    if abs(pct_change) < NEUTRAL_THRESHOLD_PCT:
        return "neutral", "⚪"

    lower_better = _is_lower_better(metric_name)
    # For lower-is-better: negative change = improvement
    # For higher-is-better: positive change = improvement
    is_improvement = (pct_change < 0) if lower_better else (pct_change > 0)
    if is_improvement:
        return "improvement", "🟢"
    return "regression", "🔴"


def compute_comparison(
    baseline_summary: dict,
    current_summary: dict,
    baseline_run_name: str = "",
    current_run_name: str = "",
    agent_dir: str | None = None,
) -> dict:
    """Compute metric deltas between two evaluation runs.

    Args:
        baseline_summary: eval_summary.json content from the baseline run.
        current_summary: eval_summary.json content from the current run.
        baseline_run_name: Folder name of the baseline run (user-friendly label).
        current_run_name: Folder name of the current run (user-friendly label).
        agent_dir: If provided, scope git diff to this directory so only
            agent code changes are captured (not framework/docs changes).

    Returns:
        Dict with baseline/current IDs, run names, git info, deltas list,
        and new/removed metrics.
    """
    b_overall = baseline_summary.get("overall_summary", {})
    c_overall = current_summary.get("overall_summary", {})

    b_det = b_overall.get("deterministic_metrics", {})
    c_det = c_overall.get("deterministic_metrics", {})
    b_llm = b_overall.get("llm_based_metrics", {})
    c_llm = c_overall.get("llm_based_metrics", {})

    deltas = []
    new_metrics = []
    removed_metrics = []

    # --- Deterministic metrics ---
    all_det_keys = set(b_det.keys()) | set(c_det.keys())
    for key in sorted(all_det_keys):
        b_val = b_det.get(key)
        c_val = c_det.get(key)

        if b_val is None:
            new_metrics.append(
                {"metric": key, "type": "deterministic", "current": c_val}
            )
            continue
        if c_val is None:
            removed_metrics.append(
                {"metric": key, "type": "deterministic", "baseline": b_val}
            )
            continue

        try:
            b_num, c_num = float(b_val), float(c_val)
        except (TypeError, ValueError):
            continue

        pct = _compute_pct_change(b_num, c_num)
        direction, emoji = _classify_direction(key, pct)
        deltas.append(
            {
                "metric": key,
                "type": "deterministic",
                "baseline": b_num,
                "current": c_num,
                "delta": round(c_num - b_num, 4),
                "pct_change": round(pct, 2),
                "direction": direction,
                "emoji": emoji,
            }
        )

    # --- LLM metrics ---
    all_llm_keys = set(b_llm.keys()) | set(c_llm.keys())
    for key in sorted(all_llm_keys):
        b_info = b_llm.get(key)
        c_info = c_llm.get(key)

        if b_info is None:
            c_avg = (
                c_info.get("average", c_info) if isinstance(c_info, dict) else c_info
            )
            new_metrics.append({"metric": key, "type": "llm", "current": c_avg})
            continue
        if c_info is None:
            b_avg = (
                b_info.get("average", b_info) if isinstance(b_info, dict) else b_info
            )
            removed_metrics.append({"metric": key, "type": "llm", "baseline": b_avg})
            continue

        b_avg = b_info.get("average", b_info) if isinstance(b_info, dict) else b_info
        c_avg = c_info.get("average", c_info) if isinstance(c_info, dict) else c_info

        try:
            b_num, c_num = float(b_avg), float(c_avg)
        except (TypeError, ValueError):
            continue

        # For LLM metrics, compute % relative to score range if available
        score_range = (c_info if isinstance(c_info, dict) else {}).get(
            "score_range", {}
        )
        range_width = (
            score_range.get("max", 5) - score_range.get("min", 0)
            if score_range
            else None
        )
        if range_width and range_width > 0:
            pct = ((c_num - b_num) / range_width) * 100
        else:
            pct = _compute_pct_change(b_num, c_num)

        direction, emoji = _classify_direction(key, pct)
        deltas.append(
            {
                "metric": key,
                "type": "llm",
                "baseline": b_num,
                "current": c_num,
                "delta": round(c_num - b_num, 4),
                "pct_change": round(pct, 2),
                "direction": direction,
                "emoji": emoji,
                "score_range": score_range or None,
            }
        )

    # --- Git diff (scoped to agent directory if provided) ---
    b_git = baseline_summary.get("git_info", {})
    c_git = current_summary.get("git_info", {})
    git_diff = ""
    if (
        b_git.get("commit")
        and c_git.get("commit")
        and b_git["commit"] != c_git["commit"]
    ):
        try:
            cmd = ["git", "diff", b_git["commit"], c_git["commit"]]
            if agent_dir:
                # Scope diff to agent directory only — ignore framework/docs changes
                cmd += ["--", agent_dir]
            diff_result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10,
            )
            if diff_result.returncode == 0 and diff_result.stdout:
                git_diff = diff_result.stdout[:5000]
                if len(diff_result.stdout) > 5000:
                    git_diff += "\n... (truncated)"
        except Exception:
            pass

    return {
        "baseline_id": baseline_summary.get("experiment_id", "unknown"),
        "current_id": current_summary.get("experiment_id", "unknown"),
        "baseline_run_name": baseline_run_name
        or baseline_summary.get("experiment_id", "unknown"),
        "current_run_name": current_run_name
        or current_summary.get("experiment_id", "unknown"),
        "baseline_git": b_git,
        "current_git": c_git,
        "deltas": deltas,
        "new_metrics": new_metrics,
        "removed_metrics": removed_metrics,
        "git_diff": git_diff,
    }


def format_comparison_table(comparison: dict) -> str:
    """Format comparison deltas as a markdown table."""
    baseline_label = comparison.get("baseline_run_name", "Baseline")
    current_label = comparison.get("current_run_name", "Current")
    lines = [
        f"| Metric | {baseline_label} | {current_label} | Delta | % Change | Status |",
        "|--------|----------|---------|-------|----------|--------|",
    ]
    for d in comparison["deltas"]:
        b_str = (
            f"{d['baseline']:.2f}"
            if isinstance(d["baseline"], float)
            else str(d["baseline"])
        )
        c_str = (
            f"{d['current']:.2f}"
            if isinstance(d["current"], float)
            else str(d["current"])
        )
        d_str = (
            f"{d['delta']:+.2f}" if isinstance(d["delta"], float) else str(d["delta"])
        )
        pct_str = f"{d['pct_change']:+.1f}%"
        lines.append(
            f"| {d['metric']} | {b_str} | {c_str} | {d_str} | {pct_str} | {d['emoji']} {d['direction']} |"
        )

    for m in comparison.get("new_metrics", []):
        lines.append(f"| {m['metric']} | — | {m['current']} | — | NEW | 🆕 |")
    for m in comparison.get("removed_metrics", []):
        lines.append(f"| {m['metric']} | {m['baseline']} | — | — | REMOVED | ➖ |")

    return "\n".join(lines)


class Analyzer:
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def _process_log_row(self, row: pd.Series, index: int) -> Optional[LogEntry]:
        """Processes a single DataFrame row to extract structured log data for Markdown reporting."""
        try:
            question_id = row.get("question_id", f"row_{index}")
            metadata = robust_json_loads(row.get("question_metadata", {})) or {}

            # User inputs (all conversation turns)
            user_inputs = robust_json_loads(row.get("user_inputs", []))
            if not isinstance(user_inputs, list):
                user_inputs = [str(user_inputs)] if user_inputs else []

            # Final agent response. Pandas reads empty CSV cells as float
            # NaN, which crashes downstream `len()` calls in
            # _format_log_entry_markdown. Coerce to str at the source so
            # the markdown renderer can trust the type.
            final_response_raw = row.get("final_response", "")
            if final_response_raw is None or (
                isinstance(final_response_raw, float) and pd.isna(final_response_raw)
            ):
                final_response = ""
            else:
                final_response = str(final_response_raw)

            # Agent trajectory
            trace_summary = robust_json_loads(row.get("trace_summary", []))
            if not isinstance(trace_summary, list):
                trace_summary = []

            # Tool interactions and sub-agent trace (from extracted_data)
            extracted_data = robust_json_loads(row.get("extracted_data", {})) or {}
            tool_interactions = extracted_data.get("tool_interactions", [])
            if not isinstance(tool_interactions, list):
                tool_interactions = []

            sub_agent_trace = extracted_data.get("sub_agent_trace", [])
            if not isinstance(sub_agent_trace, list):
                sub_agent_trace = []

            # Evaluation results with scores and explanations
            eval_results = robust_json_loads(row.get("eval_results", "{}")) or {}

            # Latency summary (extract key metrics)
            latency_data = robust_json_loads(row.get("latency_data", []))
            latency_summary = {}
            if isinstance(latency_data, list) and latency_data:
                # Find the root invocation span for total latency
                for span in latency_data:
                    if span.get("name") == "invocation":
                        latency_summary["total_seconds"] = span.get(
                            "duration_seconds", 0
                        )
                        break

            # ADK scores (hallucinations, safety)
            adk_scores = {}
            for col in row.index:
                if col.startswith("adk_score."):
                    metric_name = col.replace("adk_score.", "")
                    adk_scores[metric_name] = row[col]

            # Agents evaluated
            agents_evaluated = robust_json_loads(row.get("agents_evaluated", []))
            if not isinstance(agents_evaluated, list):
                agents_evaluated = [agents_evaluated] if agents_evaluated else []

            return LogEntry(
                question_id=question_id,
                metadata=metadata,
                user_inputs=user_inputs,
                final_response=final_response,
                trace_summary=trace_summary,
                sub_agent_trace=sub_agent_trace,
                tool_interactions=tool_interactions,
                eval_results=eval_results,
                latency_summary=latency_summary,
                adk_scores=adk_scores,
                agents_evaluated=agents_evaluated,
            )
        except Exception as e:
            logger.warning("Error processing row %d: %s", index, e)
            return None

    def _format_log_entry_markdown(self, entry: LogEntry, entry_num: int) -> str:
        """Formats a single log entry into a comprehensive markdown string."""
        agents = ", ".join(entry["agents_evaluated"])
        metadata_str = (
            ", ".join([f"{k}: {v}" for k, v in entry["metadata"].items()]) or "None"
        )
        latency = entry["latency_summary"].get("total_seconds", "N/A")
        latency_str = (
            f"{latency:.2f}s" if isinstance(latency, (int, float)) else latency
        )

        # Header with key info
        header = f"""## {entry_num}. Question: `{entry["question_id"]}`

| Property | Value |
|----------|-------|
| **Agents** | {agents} |
| **Latency** | {latency_str} |
| **Metadata** | {metadata_str} |"""

        # Conversation (interleaved)
        conversation_md = "### Conversation\n\n"

        # Get text responses from trace
        text_responses = [
            t.get("text_response", "")
            for t in entry["sub_agent_trace"]
            if t.get("text_response")
        ]

        for i, user_input in enumerate(entry["user_inputs"]):
            conversation_md += f"**User Turn {i + 1}:**\n> {user_input}\n\n"
            if i < len(text_responses):
                # Indent agent response for clarity
                agent_resp = text_responses[i].replace("\n", "\n  ")
                conversation_md += f"**Agent Turn {i + 1}:**\n  {agent_resp}\n\n"

        # Final agent response (summary block). Belt-and-suspenders: even
        # though _process_log_row coerces to str, defend here too in case a
        # caller bypasses that path.
        fr = (
            entry["final_response"]
            if isinstance(entry["final_response"], str)
            else str(entry["final_response"] or "")
        )
        final_response = fr[:500] + "..." if len(fr) > 500 else fr
        response_md = f"### Final Response Summary\n\n{final_response}\n"

        # Agent trajectory
        trajectory = (
            " → ".join(entry["trace_summary"]) if entry["trace_summary"] else "N/A"
        )
        trajectory_md = f"### Agent Trajectory\n\n`{trajectory}`\n"

        # Tool interactions (concise)
        tools_md = "### Tool Calls\n\n"
        if entry["tool_interactions"]:
            tools_md += "| Tool | Arguments (key) | Result Summary |\n|------|-----------------|----------------|\n"
            for tool in entry["tool_interactions"][:10]:  # Limit to 10 tools
                tool_name = tool.get("tool_name", "unknown")
                args = tool.get("input_arguments", {})
                args_summary = (
                    ", ".join(f"{k}" for k in list(args.keys())[:3]) if args else "none"
                )
                result = tool.get("output_result")
                result_summary = "success" if result else "no result"
                if isinstance(result, dict) and "error" in str(result).lower():
                    result_summary = "error"
                tools_md += f"| `{tool_name}` | {args_summary} | {result_summary} |\n"
        else:
            tools_md += "*No tool calls recorded*\n"

        # ADK Scores (if available)
        adk_md = ""
        if entry["adk_scores"]:
            adk_md = "### ADK Evaluation Scores\n\n"
            for metric, score in entry["adk_scores"].items():
                score_str = (
                    f"{score:.2f}" if isinstance(score, (int, float)) else str(score)
                )
                adk_md += f"- **{metric}:** {score_str}\n"

        # Evaluation metrics with explanations. The `explanation` field
        # varies wildly across metrics — string for most, list of dicts
        # for hallucination, sometimes float NaN when the autorater
        # failed. Coerce every shape into a printable string before
        # truncating so `len()` / slice never sees a non-string.
        metrics_md = "### Evaluation Metrics\n\n"
        for m_name, m_val in entry["eval_results"].items():
            if isinstance(m_val, dict):
                score = m_val.get("score", "N/A")
                score_str = (
                    f"{score:.2f}" if isinstance(score, (int, float)) else str(score)
                )
                expl_raw = m_val.get("explanation", "")
                if isinstance(expl_raw, str):
                    expl = expl_raw
                elif expl_raw is None:
                    expl = ""
                elif isinstance(expl_raw, (list, dict)):
                    try:
                        expl = json.dumps(expl_raw, default=str, indent=2)
                    except (TypeError, ValueError):
                        expl = str(expl_raw)
                else:
                    expl = str(expl_raw)
                expl_short = expl[:300] + "..." if len(expl) > 300 else expl
                metrics_md += f"#### {m_name}: **{score_str}**\n\n{expl_short}\n\n"
            else:
                metrics_md += f"- **{m_name}:** {m_val}\n"

        return f"""{header}

{conversation_md}
{response_md}
{trajectory_md}
{tools_md}
{adk_md}
{metrics_md}
"""

    def generate_question_answer_log(
        self, results_file: Path, output_path: Path
    ) -> bool:
        """Generates a detailed log comparing questions, reference data, and agent output."""
        logger.debug("Generating Question-Answer Log from %s", results_file)
        try:
            df = pd.read_csv(results_file)
            logger.debug("Loaded %d evaluation results.", len(df))

            # NOTE: rewritten from a walrus-operator comprehension because
            # the upstream PSO CI's pyflakes can't parse `:=` and crashes
            # the lint with "FlakesChecker has no attribute NAMEDEXPR".
            log_entries = []
            for index, row in df.iterrows():
                entry = self._process_log_row(row, index)
                if entry is not None:
                    log_entries.append(entry)

            header = f"# Question-Answer Analysis Log\n\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n**Total Questions:** {len(log_entries)}\n"
            markdown_content = [header]
            markdown_content.extend(
                self._format_log_entry_markdown(entry, i)
                for i, entry in enumerate(log_entries, 1)
            )

            output_path.write_text("---".join(markdown_content), encoding="utf-8")
            logger.debug("Question-answer log saved to %s", output_path)
            return True

        except Exception as e:
            logger.error("Error generating question-answer log: %s", e)
            return False

    def analyze_evaluation_results(
        self,
        summary_path: Path,
        results_path: Path,
    ) -> tuple[Optional[dict], Optional[str]]:
        """Analyzes evaluation results and returns the content for the Gemini prompt."""
        try:
            summary_data = json.loads(summary_path.read_text())
            results_df = pd.read_csv(results_path)
        except FileNotFoundError as e:
            logger.error("Input file not found: %s", e)
            return None, None

        # Use 'average_metrics' from summary_data (includes flattened sub-metrics)
        average_metrics = summary_data.get("overall_summary", {}).get(
            "average_metrics", {}
        )
        # Fallback if average_metrics missing (might need calculation if not in summary yet)
        if not average_metrics:
            # Try to reconstruct from deterministic/llm summaries
            overall = summary_data.get("overall_summary", {})
            average_metrics.update(overall.get("deterministic_metrics", {}))
            average_metrics.update(overall.get("llm_based_metrics", {}))

        all_explanations = {metric: [] for metric in average_metrics}

        for _, row in results_df.iterrows():
            try:
                eval_results = robust_json_loads(row["eval_results"])
                if not eval_results:
                    continue

                for metric, details in eval_results.items():
                    if (
                        metric in all_explanations
                        and isinstance(details, dict)
                        and "explanation" in details
                        and "score" in details
                    ):
                        all_explanations[metric].append(
                            {
                                "score": details["score"],
                                "explanation": details["explanation"],
                            }
                        )
            except (json.JSONDecodeError, TypeError, KeyError):
                continue

        output_lines = ["--- Evaluation Analysis ---\n"]
        for metric, mean_score in average_metrics.items():
            output_lines.append(f"\n## Metric: `{metric}`\n")
            score_str = (
                f"{mean_score:.4f}"
                if isinstance(mean_score, (int, float))
                else str(mean_score)
            )
            output_lines.append(f"**Average Score:** {score_str}\n")

            explanations = all_explanations.get(metric)
            if explanations:
                # Show first 10 explanations as a sample
                explanation_summary = "\n".join(
                    f"- [Score: {exp['score']}] {exp['explanation']}"
                    for exp in explanations[:10]
                )
                output_lines.append(
                    f"**Sample Explanations:**\n{explanation_summary}\n"
                )

        return summary_data, "".join(output_lines)

    def _discover_agent_context(self, agent_dir: Optional[Path]) -> Dict[str, str]:
        """Discovers and loads agent source code and ADK context from agent directory."""
        return discover_agent_context(agent_dir)

    def _auto_find_previous_run(
        self, results_dir: Path, current_run_folder: Path
    ) -> Optional[Path]:
        """Find the most recent previous run folder in results_dir.

        Scans for subdirectories containing eval_summary.json, sorted by
        modification time. Returns the most recent one that isn't the current run.
        """
        candidates = []
        for subdir in results_dir.iterdir():
            if not subdir.is_dir() or subdir == current_run_folder:
                continue
            if (subdir / "eval_summary.json").exists():
                candidates.append(subdir)

        if not candidates:
            return None

        # Most recently modified first
        candidates.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        return candidates[0]

    def _load_baseline_summary(self, compare_to_path: Path) -> Optional[dict]:
        """Load eval_summary.json from a baseline run directory."""
        run_folder = self._find_run_folder(compare_to_path)
        if not run_folder:
            # Try direct path
            summary_file = compare_to_path / "eval_summary.json"
            if summary_file.exists():
                run_folder = compare_to_path
            else:
                return None

        summary_file = run_folder / "eval_summary.json"
        if not summary_file.exists():
            return None

        try:
            return json.loads(summary_file.read_text())
        except (json.JSONDecodeError, OSError):
            return None

    def generate_optimization_log(
        self,
        comparison: dict,
        focus: Optional[str],
        run_folder: Path,
        gemini_comparison_text: Optional[str] = None,
        current_summary: Optional[dict] = None,
    ) -> Path:
        """Generate or append to OPTIMIZATION_LOG.md in the results directory.

        Args:
            comparison: Output from compute_comparison() (None for baseline entry).
            focus: Developer focus text (if any).
            run_folder: Current run's results folder.
            gemini_comparison_text: Gemini's comparison analysis (if available).
            current_summary: Current eval_summary.json for baseline entries.

        Returns:
            Path to the OPTIMIZATION_LOG.md file.
        """
        log_path = run_folder.parent / "OPTIMIZATION_LOG.md"

        # Determine iteration number
        iteration = 1
        existing_content = ""
        if log_path.exists():
            existing_content = log_path.read_text()
            # Find the highest iteration number
            matches = re.findall(r"## Iteration (\d+)", existing_content)
            if matches:
                iteration = max(int(m) for m in matches) + 1

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if comparison is None:
            # Baseline entry — no comparison data yet
            entry = f"\n\n## Iteration {iteration} — Baseline\n\n"
            entry += f"**Date:** {timestamp}\n"
            entry += f"**Run:** {run_folder.name}\n"
            if current_summary:
                git = current_summary.get("git_info", {})
                if git.get("commit"):
                    entry += f"**Git:** `{git['commit'][:8]}` ({git.get('branch', 'unknown')})"
                    if git.get("dirty"):
                        entry += " ⚠️ uncommitted changes"
                    entry += "\n"
            if focus:
                entry += f"**Focus:** {focus}\n"
            entry += "\n*Baseline run — no comparison available yet.*\n"
        else:
            baseline_name = comparison.get(
                "baseline_run_name", comparison["baseline_id"]
            )
            current_name = comparison.get("current_run_name", run_folder.name)
            entry = (
                f"\n\n## Iteration {iteration} — {current_name} vs {baseline_name}\n\n"
            )
            entry += f"**Date:** {timestamp}\n"
            entry += f"**Current Run:** {current_name}\n"
            entry += f"**Baseline Run:** {baseline_name}\n"

            # Git info
            c_git = comparison.get("current_git", {})
            b_git = comparison.get("baseline_git", {})
            if c_git.get("commit"):
                entry += f"**Git:** `{b_git.get('commit', '?')[:8]}` → `{c_git['commit'][:8]}`"
                if c_git.get("dirty"):
                    entry += " ⚠️ uncommitted changes"
                entry += "\n"
            if focus:
                entry += f"**Focus:** {focus}\n"

            # Summary counts
            improvements = sum(
                1 for d in comparison["deltas"] if d["direction"] == "improvement"
            )
            regressions = sum(
                1 for d in comparison["deltas"] if d["direction"] == "regression"
            )
            neutral = sum(
                1 for d in comparison["deltas"] if d["direction"] == "neutral"
            )
            entry += f"\n**Summary:** {improvements} 🟢 improvements, {regressions} 🔴 regressions, {neutral} ⚪ neutral\n\n"

            # Comparison table
            entry += format_comparison_table(comparison) + "\n"

            # Gemini's analysis excerpt
            if gemini_comparison_text:
                # Extract first ~500 chars as a summary
                excerpt = gemini_comparison_text[:500]
                if len(gemini_comparison_text) > 500:
                    excerpt += "..."
                entry += f"\n### AI Analysis\n\n{excerpt}\n"

        # Write
        if not existing_content:
            header = "# Optimization Log\n\n"
            header += "Cumulative record of evaluation runs and metric changes.\n"
            header += "Generated automatically by `agent-eval analyze`.\n"
            log_path.write_text(header + entry, encoding="utf-8")
        else:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(entry)

        return log_path

    def generate_gemini_analysis(
        self,
        summary_data: dict,
        analysis_content: str,
        raw_dir: Path,
        output_path: Path,
        comparison_data: Optional[dict] = None,
    ) -> str:
        """Generates a detailed technical diagnosis using Gemini.

        Args:
            summary_data: The evaluation summary dict.
            analysis_content: Pre-formatted analysis content.
            raw_dir: Directory for raw/debug files (prompt goes here).
            output_path: Path for the analysis output file.
            comparison_data: Output from compute_comparison() (if comparing runs).

        Returns:
            The comparison analysis text from Call 2 (empty string if no comparison).
        """
        # Find relevant context files dynamically
        consolidated_metrics_file = raw_dir / "temp_consolidated_metrics.json"
        question_file = raw_dir / "temp_consolidated_questions.json"

        context_content = {}

        # Load standard context files
        for file_path in [consolidated_metrics_file, question_file]:
            if file_path.exists():
                try:
                    context_content[str(file_path)] = file_path.read_text()
                except Exception:
                    pass

        # Load deterministic metrics logic
        det_metrics_path = Path("src/evaluation/core/deterministic_metrics.py")
        if det_metrics_path.exists():
            try:
                context_content["evaluation/core/deterministic_metrics.py"] = (
                    det_metrics_path.read_text()
                )
            except Exception:
                pass

        # Discover agent context from --agent-dir if provided
        agent_dir = self.config.get("agent_dir")
        custom_strategy_content = None

        if agent_dir:
            logger.debug("Discovering agent context")
            agent_context = self._discover_agent_context(Path(agent_dir))
            context_content.update(agent_context)

        # Load optimization strategy file if provided via CLI
        strategy_path = self.config.get("strategy_file")
        if strategy_path:
            strategy_file = Path(strategy_path)
            if strategy_file.exists():
                try:
                    custom_strategy_content = strategy_file.read_text()
                    logger.debug("Found optimization strategy: %s", strategy_file)
                except Exception as e:
                    logger.warning("Could not read strategy file: %s", e)
            else:
                logger.warning("Strategy file not found: %s", strategy_file)

        focus = self.config.get("focus")

        prompter = GeminiAnalysisPrompter(
            summary_data=summary_data,
            analysis_content=analysis_content,
            context_files=context_content,
            question_file_path=str(question_file),
            consolidated_metrics_path=str(consolidated_metrics_file),
            # Pass custom config params
            audience=self.config.get("report_audience"),
            tone=self.config.get("report_tone"),
            length=self.config.get("report_length"),
            custom_strategy_content=custom_strategy_content,
            focus_directive=focus,
        )
        prompt = prompter.build_prompt()

        # Save prompt to raw/ folder for debugging
        (raw_dir / "gemini_prompt.txt").write_text(prompt, encoding="utf-8")

        model, client = self._get_gemini_client()

        logger.debug("Calling Vertex AI (%s) — Call 1: Current run diagnosis", model)
        analysis_text = ""
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            analysis_text = response.text
            output_path.write_text(analysis_text, encoding="utf-8")
            logger.debug("Analysis report saved to %s", output_path)
        except Exception as e:
            logger.error("Error calling Vertex AI API: %s", e)
            logger.error(
                "Tip: Ensure GOOGLE_CLOUD_PROJECT is set and you're authenticated with gcloud."
            )

        # --- Call 2: Comparison analysis (if comparison data provided) ---
        comparison_text = ""
        if comparison_data is not None:
            comparison_table = format_comparison_table(comparison_data)
            comparison_prompt = prompter.build_comparison_prompt(
                comparison_data=comparison_data,
                comparison_table=comparison_table,
            )
            # Save comparison prompt for debugging
            (raw_dir / "gemini_comparison_prompt.txt").write_text(
                comparison_prompt, encoding="utf-8"
            )

            logger.debug("Calling Vertex AI (%s) — Call 2: Comparison analysis", model)
            try:
                response = client.models.generate_content(
                    model=model, contents=comparison_prompt
                )
                comparison_text = response.text

                # Append comparison to the analysis file
                combined = (
                    analysis_text + "\n\n---\n\n# Run Comparison\n\n" + comparison_text
                )
                output_path.write_text(combined, encoding="utf-8")
                logger.debug("Comparison analysis appended to %s", output_path)
            except Exception as e:
                logger.error("Error during comparison analysis: %s", e)

        return comparison_text

    def _get_gemini_client(self):
        """Initialize and return (model_name, genai.Client) for Gemini calls."""
        from agent_eval.core.config import get_project_id, get_location

        model = self.config.get("model", "gemini-3.1-pro-preview")

        project = get_project_id()
        location = self.config.get("location") or get_location(model)

        logger.debug("Using location '%s' for model %s", location, model)

        if not project:
            logger.warning(
                "GOOGLE_CLOUD_PROJECT not set. Trying default credentials..."
            )

        client = genai.Client(
            vertexai=True,
            project=project,
            location=location,
            http_options=HttpOptions(api_version="v1"),
        )
        return model, client

    def _find_run_folder(self, results_dir: Path) -> Optional[Path]:
        """
        Find the run folder to analyze. Supports two structures:
        1. Direct run folder: results_dir/raw/evaluation_results_*.csv
        2. Parent folder with timestamp subfolders: results_dir/{timestamp}/raw/...
        """
        # Check if this is a run folder (has raw/ subfolder with results)
        raw_dir = results_dir / "raw"
        if raw_dir.exists():
            results_files = list(raw_dir.glob("evaluation_results_*.csv"))
            if results_files:
                return results_dir

        # Check if this is a parent folder with timestamp subfolders
        subdirs = [
            d
            for d in results_dir.iterdir()
            if d.is_dir() and d.name.isdigit() or "_" in d.name
        ]
        subdirs.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        for subdir in subdirs:
            raw_dir = subdir / "raw"
            if raw_dir.exists():
                results_files = list(raw_dir.glob("evaluation_results_*.csv"))
                if results_files:
                    return subdir

        # Legacy: Check for results directly in results_dir (old structure)
        results_files = list(results_dir.glob("evaluation_results_*.csv"))
        if results_files:
            logger.debug("Found legacy folder structure (no raw/ subfolder)")
            return results_dir

        return None

    def run(self) -> Optional[dict]:
        """Main entry point for analysis.

        Returns:
            Dict with current_summary, comparison_data, and optimization_log_path
            for use by the CLI display layer. None if analysis failed.
        """
        results_dir = Path(self.config["results_dir"])
        skip_gemini = self.config.get("skip_gemini", False)
        gcs_bucket = self.config.get("gcs_bucket")
        compare_to = self.config.get("compare_to")
        focus = self.config.get("focus")

        # Find the run folder (supports datetime folder structure)
        run_folder = self._find_run_folder(results_dir)
        if not run_folder:
            logger.error("No evaluation results found in '%s'", results_dir)
            return None

        logger.debug("Analyzing run folder: %s", run_folder)

        # Determine paths based on folder structure
        raw_dir = run_folder / "raw"
        if raw_dir.exists():
            results_files = list(raw_dir.glob("evaluation_results_*.csv"))
        else:
            # Legacy structure
            results_files = list(run_folder.glob("evaluation_results_*.csv"))
            raw_dir = run_folder

        if not results_files:
            logger.error("No 'evaluation_results_*.csv' file found")
            return None

        results_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        results_file = results_files[0]
        logger.debug("Analyzing results file: %s", results_file.name)

        summary_file = run_folder / "eval_summary.json"
        if not summary_file.exists():
            logger.error("Summary file not found in '%s'", run_folder)
            return None

        current_summary = json.loads(summary_file.read_text())

        # 1. Generate Q&A Log
        qa_log_path = run_folder / "question_answer_log.md"
        self.generate_question_answer_log(results_file, qa_log_path)

        # 2. Find baseline for comparison
        comparison_data = None
        agent_dir = self.config.get("agent_dir")

        if compare_to:
            # Explicit baseline
            compare_to_path = Path(compare_to)
            logger.debug("Loading baseline from %s", compare_to)
            baseline_summary = self._load_baseline_summary(compare_to_path)
            if baseline_summary:
                comparison_data = compute_comparison(
                    baseline_summary,
                    current_summary,
                    baseline_run_name=compare_to_path.name,
                    current_run_name=run_folder.name,
                    agent_dir=agent_dir,
                )
                logger.debug(
                    "Comparison computed: %d metrics compared",
                    len(comparison_data["deltas"]),
                )
            else:
                logger.warning("Could not load baseline from %s", compare_to)
        else:
            # Auto-detect previous run
            # The results parent is either run_folder.parent (normal) or results_dir itself
            results_parent = run_folder.parent
            if results_parent == run_folder:
                results_parent = results_dir
            previous_run = self._auto_find_previous_run(results_parent, run_folder)
            if previous_run:
                logger.debug("Auto-detected previous run: %s", previous_run.name)
                baseline_summary = self._load_baseline_summary(previous_run)
                if baseline_summary:
                    comparison_data = compute_comparison(
                        baseline_summary,
                        current_summary,
                        baseline_run_name=previous_run.name,
                        current_run_name=run_folder.name,
                        agent_dir=agent_dir,
                    )
                    logger.debug(
                        "Comparison computed: %d metrics compared",
                        len(comparison_data["deltas"]),
                    )
            else:
                logger.debug("No previous run found (this is the baseline)")

        # Check if comparison is meaningful (agent code actually changed)
        skip_comparison_call = False
        if comparison_data:
            b_git = comparison_data.get("baseline_git", {})
            c_git = comparison_data.get("current_git", {})
            same_commit = (
                b_git.get("commit")
                and c_git.get("commit")
                and b_git["commit"] == c_git["commit"]
            )
            no_diff = not comparison_data.get("git_diff")
            if same_commit or no_diff:
                skip_comparison_call = True
                if same_commit:
                    logger.debug(
                        "Same commit (%s). Skipping comparison analysis — "
                        "metric changes are due to LLM non-determinism.",
                        c_git["commit"][:8],
                    )
                else:
                    logger.debug(
                        "No agent code changes between commits %s..%s. "
                        "Skipping comparison analysis — metric changes are "
                        "due to LLM non-determinism, not code changes.",
                        b_git.get("commit", "?")[:8],
                        c_git.get("commit", "?")[:8],
                    )

        # 3. Generate Gemini Analysis (Call 1 + optional Call 2)
        gemini_comparison_text = ""
        if not skip_gemini:
            summary, analysis_content = self.analyze_evaluation_results(
                summary_file, results_file
            )
            if summary and analysis_content:
                analysis_path = run_folder / "gemini_analysis.md"
                gemini_comparison_text = self.generate_gemini_analysis(
                    summary,
                    analysis_content,
                    raw_dir,
                    analysis_path,
                    comparison_data=comparison_data
                    if not skip_comparison_call
                    else None,
                )

        # 4. Generate / append OPTIMIZATION_LOG.md
        log_path = self.generate_optimization_log(
            comparison=comparison_data,
            focus=focus,
            run_folder=run_folder,
            gemini_comparison_text=gemini_comparison_text or None,
            current_summary=current_summary,
        )
        logger.debug("Optimization log updated: %s", log_path)

        # 5. Single self-contained HTML report combining everything.
        # Folds the three markdown files into one tabs-based browseable
        # page (Overview, Per-Question heatmap, Iteration History, AI
        # Analysis). Markdowns stay on disk for tooling that wants raw
        # files; the HTML is the recommended viewing surface.
        html_report_path = None
        try:
            from agent_eval.core.html_report import generate_html_report

            gemini_md = (
                (run_folder / "gemini_analysis.md").read_text()
                if (run_folder / "gemini_analysis.md").exists()
                else None
            )
            opt_log_md = (
                log_path.read_text() if log_path and log_path.exists() else None
            )
            agent_dir_path = Path(self.config.get("agent_dir") or "")
            agent_name = agent_dir_path.name if agent_dir_path.name else None
            html_report_path = generate_html_report(
                run_dir=run_folder,
                summary=current_summary,
                comparison=comparison_data,
                gemini_analysis_md=gemini_md,
                optimization_log_md=opt_log_md,
                results_csv=results_file,
                agent_name=agent_name,
            )
            logger.debug("HTML report written: %s", html_report_path)
        except Exception as exc:
            logger.warning("Could not generate HTML report: %s", exc)

        # 6. GCS Upload (Placeholder)
        if gcs_bucket:
            logger.debug("[PLACEHOLDER] Uploading Results to GCS: gs://%s", gcs_bucket)

        return {
            "current_summary": current_summary,
            "comparison_data": comparison_data,
            "optimization_log_path": log_path,
            "html_report_path": html_report_path,
        }
