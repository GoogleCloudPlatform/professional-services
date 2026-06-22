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
"""agent-eval analyze — generate reports and AI-powered root cause analysis."""

import asyncio
import os
import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table

from agent_eval.cli._pacing import _pauses_disabled
from agent_eval.core.analyzer import Analyzer

console = Console()


def _display_analysis(results_dir: str) -> None:
    """Read and display the gemini_analysis.md in a formatted way."""
    analysis_path = Path(results_dir) / "gemini_analysis.md"
    if not analysis_path.exists():
        return

    content = analysis_path.read_text().strip()
    if not content:
        return

    console.print()
    console.print(Rule("  AI Analysis  ", style="bold magenta"))
    console.print()
    console.print(Markdown(content))
    console.print()
    console.print(Rule(style="magenta"))


def _display_metrics_table(
    current_summary: dict,
    comparison_data: Optional[dict] = None,
    focus: Optional[str] = None,
    *,
    results_dir: Optional[str] = None,
    run_name_override: Optional[str] = None,
) -> None:
    """Display a Rich table of metrics with optional delta columns.

    Shows all metrics. When --focus contains metric name substrings,
    matching rows are highlighted in bold for easy screenshotting.

    The table title resolves the run name in this order: explicit
    ``run_name_override`` → comparison's ``current_run_name`` → results-dir
    folder name (the human-typed run_id) → experiment_id timestamp.
    """
    overall = current_summary.get("overall_summary", {})
    det_metrics = overall.get("deterministic_metrics", {})
    llm_metrics = overall.get("llm_based_metrics", {})

    if not det_metrics and not llm_metrics:
        return

    # Parse focus keywords for highlighting
    focus_keywords = []
    if focus:
        focus_keywords = [k.strip().lower() for k in focus.split(",")]

    def _is_focused(metric_name: str) -> bool:
        if not focus_keywords:
            return False
        name_lower = metric_name.lower()
        return any(kw in name_lower for kw in focus_keywords)

    # Build delta lookup from comparison data
    delta_lookup = {}
    if comparison_data:
        for d in comparison_data.get("deltas", []):
            delta_lookup[d["metric"]] = d

    has_comparison = bool(delta_lookup)

    # Determine table title — prefer user-friendly folder names over experiment
    # IDs. Resolution order: explicit run_name → comparison's current_run_name
    # → results-dir folder name (the run_id the user typed) → experiment_id.
    run_name = (
        run_name_override
        or (comparison_data or {}).get("current_run_name")
        or (Path(results_dir).name if results_dir else None)
        or current_summary.get("experiment_id", "current")
    )
    if has_comparison:
        baseline_name = comparison_data.get("baseline_run_name") or comparison_data.get(
            "baseline_id", "baseline"
        )
        title = f"Evaluation Results: {run_name} vs {baseline_name}"
    else:
        title = f"Evaluation Results: {run_name}"

    table = Table(title=title, border_style="blue", padding=(0, 2))
    table.add_column("Metric", style="bold")
    if has_comparison:
        table.add_column(baseline_name, justify="right")
    table.add_column(run_name if has_comparison else "Value", justify="right")
    if has_comparison:
        table.add_column("Change", justify="right")

    def _format_value(val, metric_name: str = "") -> str:
        """Format a metric value for display."""
        if isinstance(val, float):
            # Use the last segment of dotted metric names for format detection
            # e.g., "tool_success_rate.total_tool_calls" → "total_tool_calls"
            field_name = (
                metric_name.rsplit(".", 1)[-1] if "." in metric_name else metric_name
            )
            if (
                field_name.endswith("_rate")
                or field_name.endswith("_ratio")
                or field_name == "reasoning_ratio"
            ):
                return f"{val:.0%}"
            elif "cost" in field_name:
                return f"${val:.4f}"
            elif "seconds" in field_name or "latency" in field_name:
                return f"{val:.2f}s"
            elif val == int(val):
                return f"{int(val):,}"
            else:
                return f"{val:.2f}"
        return str(val)

    def _add_metric_row(
        metric_name: str, current_val, metric_type: str = "deterministic"
    ):
        focused = _is_focused(metric_name)
        delta = delta_lookup.get(metric_name)

        # Format current value
        if metric_type == "llm" and isinstance(current_val, dict):
            avg = current_val.get("average", 0)
            sr = current_val.get("score_range", {})
            max_v = sr.get("max", 1) if sr else 1
            current_str = f"{avg:.2f}/{max_v}"
        else:
            current_str = _format_value(current_val, metric_name)

        # Style for focused rows
        name_style = "bold cyan" if focused else ""
        val_style = "bold" if focused else ""
        marker = " ★" if focused else ""

        row = [f"[{name_style}]{metric_name}{marker}[/]" if name_style else metric_name]

        if has_comparison and delta:
            baseline_val = delta["baseline"]
            if metric_type == "llm":
                sr = (current_val if isinstance(current_val, dict) else {}).get(
                    "score_range", {}
                )
                max_v = sr.get("max", 1) if sr else 1
                baseline_str = f"{baseline_val:.2f}/{max_v}"
            else:
                baseline_str = _format_value(baseline_val, metric_name)
            row.append(f"[{val_style}]{baseline_str}[/]" if val_style else baseline_str)
            row.append(f"[{val_style}]{current_str}[/]" if val_style else current_str)

            # Change column with emoji
            emoji = delta["emoji"]
            pct = delta["pct_change"]
            direction = delta["direction"]

            if direction == "improvement":
                color = "green"
            elif direction == "regression":
                color = "red"
            else:
                color = "dim"

            change_str = f"{emoji} [{color}]{pct:+.1f}%[/]"
            if focused:
                change_str = f"[bold]{change_str}[/]"
            row.append(change_str)
        elif has_comparison:
            # No delta for this metric (new or not comparable)
            row.append("—")
            row.append(f"[{val_style}]{current_str}[/]" if val_style else current_str)
            row.append("[dim]NEW[/]")
        else:
            # No comparison at all
            row.append(f"[{val_style}]{current_str}[/]" if val_style else current_str)

        table.add_row(*row)

    # Add deterministic metrics
    for metric_name, val in sorted(det_metrics.items()):
        _add_metric_row(metric_name, val, "deterministic")

    # Separator between deterministic and LLM metrics
    if det_metrics and llm_metrics:
        sep = ["[dim]─── LLM Metrics ───[/]"]
        if has_comparison:
            sep.extend(["", "", ""])
        else:
            sep.append("")
        table.add_row(*sep)

    # Add LLM metrics
    for metric_name, val in sorted(llm_metrics.items()):
        _add_metric_row(metric_name, val, "llm")

    console.print()
    console.print(table)

    # Summary line for comparisons
    if has_comparison and comparison_data.get("deltas"):
        deltas = comparison_data["deltas"]
        improvements = sum(1 for d in deltas if d["direction"] == "improvement")
        regressions = sum(1 for d in deltas if d["direction"] == "regression")
        neutral = sum(1 for d in deltas if d["direction"] == "neutral")
        console.print()
        console.print(
            f"  {improvements} 🟢 improvements, "
            f"{regressions} 🔴 regressions, "
            f"{neutral} ⚪ neutral"
        )


@click.command()
@click.option(
    "--results-dir", required=True, help="Directory containing evaluation results."
)
@click.option(
    "--agent-dir",
    default=None,
    help="Path to agent directory (for source code context).",
)
@click.option(
    "--compare-to",
    default=None,
    help="Previous run's results dir for comparison (auto-detected if omitted).",
)
@click.option(
    "--focus",
    default=None,
    help="Developer focus: metric names to highlight + analysis priority (e.g., 'latency, cache efficiency').",
)
@click.option(
    "--strategy-file", default=None, help="Path to optimization strategy Markdown file."
)
@click.option(
    "--report-audience", default=None, help="Target audience for the analysis report."
)
@click.option("--report-tone", default=None, help="Tone of the analysis report.")
@click.option("--report-length", default=None, help="Length of the analysis report.")
@click.option(
    "--model", default="gemini-3.1-pro-preview", help="Gemini model for analysis."
)
@click.option(
    "--location", default=None, help="Vertex AI location (e.g. us-central1, global)."
)
@click.option("--skip-gemini", is_flag=True, help="Skip AI-powered analysis.")
@click.option("--gcs-bucket", default=None, help="GCS bucket for upload.")
@click.option(
    "--debug",
    is_flag=True,
    help="Show detailed logs from Gemini API and other services.",
)
def analyze(
    results_dir,
    agent_dir,
    compare_to,
    focus,
    strategy_file,
    report_audience,
    report_tone,
    report_length,
    model,
    location,
    skip_gemini,
    gcs_bucket,
    debug,
):
    """Analyze evaluation results and generate reports.

    \b
    Compares metrics across runs, generates AI-powered root cause analysis,
    and maintains a cumulative OPTIMIZATION_LOG.md.

    \b
    Features:
      - Auto-detects the previous run for comparison (override with --compare-to)
      - Highlights developer priorities with --focus
      - Tracks code changes via git diff between runs
      - Displays a screenshot-friendly metrics table in the terminal

    \b
    Examples:
      # Basic analysis (auto-compares to previous run if available)
      agent-eval analyze --results-dir tests/eval/results/baseline --agent-dir ./my_agent

    \b
      # With developer focus (highlights specific metrics)
      agent-eval analyze --results-dir tests/eval/results/v2 --focus "latency, cache"

    \b
      # Compare to a specific previous run
      agent-eval analyze --results-dir tests/eval/results/v3 --compare-to tests/eval/results/v1
    """
    from agent_eval.core.evaluator import configure_logging

    configure_logging(debug=debug)

    console.print("\n[bold blue]Analyzing Results[/]")

    config = {
        "results_dir": results_dir,
        "agent_dir": agent_dir,
        "compare_to": compare_to,
        "focus": focus,
        "model": model,
        "location": location,
        "skip_gemini": skip_gemini,
        "gcs_bucket": gcs_bucket,
        "strategy_file": strategy_file,
        "report_audience": report_audience,
        "report_tone": report_tone,
        "report_length": report_length,
    }

    analyzer = Analyzer(config)

    # Wrap analyzer.run() in a spinner so the multi-second Gemini call
    # doesn't look like the CLI froze. Mirrors the pattern used 8x in
    # init.py for other Gemini calls. Skipped under --skip-gemini since
    # there's no slow blocking step in that case, and skipped when output
    # isn't a TTY (CI / piped runs) so logs stay clean.
    use_spinner = (not skip_gemini) and sys.stdout.isatty() and not _pauses_disabled()
    try:
        if use_spinner:
            with console.status(
                "[bold blue]  Analyzing run with Gemini "
                "[dim](compares to previous run, drafts diagnosis with code citations)[/][/]",
                spinner="dots",
            ):
                analysis_result = asyncio.run(analyzer.run())
        else:
            analysis_result = asyncio.run(analyzer.run())
    except Exception as e:
        console.print(f"\n[bold red]Error during analysis:[/] {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)

    # ── Display metrics table ─────────────────────────────────────────
    if analysis_result and analysis_result.get("current_summary"):
        _display_metrics_table(
            analysis_result["current_summary"],
            analysis_result.get("comparison_data"),
            focus,
            results_dir=results_dir,
        )
    # The AI analysis used to print 80-200 lines of dense Gemini prose
    # straight to terminal here. With the HTML report, that's now
    # overwhelming + redundant — open report.html in a browser for the
    # full thing with charts, heatmap, and collapsible per-question
    # details. Use --print-analysis to restore the legacy terminal dump.

    # ── Done ───────────────────────────────────────────────────────────
    cwd = Path.cwd()
    rel_results = os.path.relpath(results_dir, cwd)

    html_path = (analysis_result or {}).get("html_report_path")
    rel_html = os.path.relpath(html_path, cwd) if html_path else None

    output_files = [
        f"  {rel_results}/eval_summary.json         — Aggregated metrics (raw JSON)",
        f"  {rel_results}/gemini_analysis.md         — AI diagnosis (raw markdown)",
        f"  {rel_results}/question_answer_log.md     — Per-question breakdown (raw markdown)",
    ]
    if analysis_result and analysis_result.get("optimization_log_path"):
        rel_log = os.path.relpath(analysis_result["optimization_log_path"], cwd)
        output_files.append(f"  {rel_log}  — Cumulative comparison log (raw markdown)")

    comparison_info = ""
    if analysis_result and analysis_result.get("comparison_data"):
        cmp = analysis_result["comparison_data"]
        baseline_label = cmp.get("baseline_run_name") or cmp.get(
            "baseline_id", "previous"
        )
        comparison_info = f"\n[bold]Compared to:[/]  {baseline_label}\n"

    main_block = ""
    if rel_html:
        main_block = (
            f"[bold cyan]📊 The full report is ready.[/] [dim]Tabs: Overview · "
            f"Per-Question · Iteration History · AI Analysis[/]\n"
            f"  [bold]{rel_html}[/]\n"
            f"  [dim]file://{Path(html_path).resolve()}[/]\n\n"
            f"  [bold]Open it:[/]  [cyan]agent-eval report[/]            [dim]# default browser[/]\n"
            f"  [dim]Or:[/]      [cyan]agent-eval report --serve[/]      [dim]# localhost http (SSH/remote dev)[/]\n\n"
        )
    main_block += "[bold]Raw artifacts:[/]\n" + "\n".join(output_files)

    console.print(
        Panel(
            f"[bold green]Analysis complete![/]{comparison_info}\n\n" + main_block,
            title="[bold]Done[/]",
            border_style="green",
            padding=(1, 2),
        )
    )

    # Offer to open immediately. Skip in NO_PAUSES (CI) or when the user
    # already declined via --no-open at run time. webbrowser.open returns
    # False on remote/headless systems — we surface --serve in that case.
    if rel_html and not _pauses_disabled() and sys.stdin.isatty():
        import webbrowser

        from rich.prompt import Confirm

        if Confirm.ask(
            "\n  Open the report in your default browser now?", default=True
        ):
            try:
                opened = webbrowser.open(f"file://{Path(html_path).resolve()}", new=2)
            except Exception:
                opened = False
            if not opened:
                console.print(
                    "  [yellow]No display available[/] [dim](remote dev box?)[/] — "
                    "run [cyan]agent-eval report --serve[/] for a localhost URL you can tunnel."
                )
