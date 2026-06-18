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
"""agent-eval evaluate — run metrics on processed interaction data."""

import asyncio
import json
import os
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from agent_eval.core.evaluator import Evaluator

console = Console()


def _display_metrics_summary(results_dir: str) -> None:
    """Read eval_summary.json and display a metrics overview table."""
    summary_path = Path(results_dir) / "eval_summary.json"
    if not summary_path.exists():
        return

    try:
        data = json.loads(summary_path.read_text())
        overall = data.get("overall_summary", {})
    except (json.JSONDecodeError, KeyError):
        return

    # ── LLM-as-Judge metrics table ─────────────────────────────────────
    llm_metrics = overall.get("llm_based_metrics", {})
    if llm_metrics:
        table = Table(title="LLM-as-Judge Metrics", border_style="blue", padding=(0, 2))
        table.add_column("Metric", style="bold")
        table.add_column("Score", justify="right")
        table.add_column("Range", justify="center", style="dim")
        table.add_column("", justify="center")

        for name, info in llm_metrics.items():
            avg = info.get("average", 0)
            sr = info.get("score_range", {})
            max_val = sr.get("max", 5)
            min_val = sr.get("min", 0)
            range_str = f"{min_val}–{max_val}"

            # Color based on how good the score is relative to range. Indicators
            # are intentionally neutral — a low score may mean the agent really
            # is failing this rubric (the most useful signal), or the rubric
            # itself is mis-targeted; the analyzer's AI report disambiguates.
            ratio = (avg - min_val) / (max_val - min_val) if max_val > min_val else 0
            if ratio >= 0.7:
                color = "green"
                indicator = "Pass"
            elif ratio >= 0.4:
                color = "yellow"
                indicator = "Mixed"
            else:
                color = "red"
                indicator = "Low"

            table.add_row(
                name, f"[{color}]{avg:.1f}[/]", range_str, f"[{color}]{indicator}[/]"
            )

        # Show metrics that failed all retries. Tolerate both legacy
        # str entries and the dict shape carrying real exception info.
        failed = overall.get("failed_metrics", [])
        failed_dicts: list[dict] = []
        for entry in failed:
            if isinstance(entry, dict):
                failed_dicts.append(entry)
            else:
                failed_dicts.append({"metric": str(entry)})
        for entry in failed_dicts:
            m_name = entry.get("metric", "?")
            note = entry.get("exception_type") or "Failed"
            table.add_row(m_name, "[red]FAILED[/]", "—", f"[red]{note}[/]")

        # Show metrics that were skipped by design (dimmed)
        skipped = overall.get("skipped_metrics", [])
        for entry in skipped:
            reason = (
                entry.get("reason", "skipped")
                if isinstance(entry, dict)
                else str(entry)
            )
            m_name = (
                entry.get("metric", str(entry))
                if isinstance(entry, dict)
                else str(entry)
            )
            table.add_row(
                f"[dim]{m_name}[/]", "[dim]SKIPPED[/]", "—", f"[dim]{reason}[/]"
            )

        console.print()
        console.print(table)

        if failed_dicts:
            # Group by exception_type so a fleet of identical failures
            # collapses into one explanatory line. Show real causes — the
            # old "API rate limits" copy was a lie that bit the customer
            # demo on 2026-04-23 (the actual cause was a pydantic schema
            # rejection, not a 429).
            by_type: dict[str, list[dict]] = {}
            for e in failed_dicts:
                by_type.setdefault(e.get("exception_type") or "Unknown", []).append(e)
            console.print(
                f"  [yellow]Warning:[/] {len(failed_dicts)} metric(s) failed:"
            )
            for exc_type, group in by_type.items():
                names = ", ".join(g["metric"] for g in group)
                sample_msg = next(
                    (g.get("message", "") for g in group if g.get("message")), ""
                )
                console.print(f"    [red]{exc_type}[/] in {names}")
                if sample_msg:
                    console.print(f"      [dim]{sample_msg}[/]")
            console.print(
                "  [dim]Full exception text in eval_summary.json (overall_summary.failed_metrics).[/]"
            )

        if skipped:
            console.print(
                f"  [dim]Note: {len(skipped)} metric(s) skipped (no rows had the required capabilities — see logs).[/]"
            )

    # ── Key deterministic metrics ──────────────────────────────────────
    det = overall.get("deterministic_metrics", {})
    if det:
        table = Table(
            title="Key Deterministic Metrics", border_style="blue", padding=(0, 2)
        )
        table.add_column("Metric", style="bold")
        table.add_column("Avg Value", justify="right")

        # Pick the most useful metrics to show. Latency labels are explicit:
        # "Wall-clock latency" is the elapsed time the user waits; "Sum of LLM
        # call durations" is additive across parallel sub-agent calls — it can
        # exceed wall-clock when sub-agents run concurrently. Same for tools.
        highlights = [
            ("Total tokens", "token_usage.total_tokens", "{:.0f}"),
            ("Prompt tokens", "token_usage.prompt_tokens", "{:.0f}"),
            ("Completion tokens", "token_usage.completion_tokens", "{:.0f}"),
            ("Estimated cost", "token_usage.estimated_cost_usd", "${:.4f}"),
            ("Wall-clock latency", "latency_metrics.total_latency_seconds", "{:.2f}s"),
            ("Σ LLM call durations", "latency_metrics.llm_latency_seconds", "{:.2f}s"),
            ("Cache hit rate", "cache_efficiency.cache_hit_rate", "{:.0%}"),
            ("Tool calls", "tool_utilization.total_tool_calls", "{:.0f}"),
            ("Tool success rate", "tool_success_rate.tool_success_rate", "{:.0%}"),
        ]

        for label, key, fmt in highlights:
            val = det.get(key)
            if val is not None:
                table.add_row(label, fmt.format(val))

        console.print()
        console.print(table)
        # One-line legend so the "Σ LLM > Wall-clock" surprise is explained.
        console.print(
            "  [dim]Σ LLM call durations is additive across parallel sub-agent "
            "calls — it can exceed wall-clock latency.[/]"
        )


@click.command()
@click.option(
    "--interaction-file",
    required=True,
    multiple=True,
    help="Path(s) to processed interaction JSONL or CSV. Can be specified multiple times.",
)
@click.option(
    "--metrics-files",
    required=True,
    multiple=True,
    help="Paths to metric definition JSONs.",
)
@click.option("--results-dir", required=True, help="Directory for outputs.")
@click.option(
    "--input-label", default="manual", help="Label for this run (e.g. 'baseline')."
)
@click.option(
    "--test-description",
    default="Automated evaluation",
    help="Description of this evaluation run.",
)
@click.option(
    "--filter", "metric_filter", multiple=True, help="Metric filters (key:val)."
)
@click.option(
    "--gcs-dest",
    default=None,
    help="GCS URI (gs://bucket/path/) to upload Vertex AI eval artifacts to. "
    "When set, evaluation runs through Vertex's managed pipeline and returns "
    "a dashboard URL alongside local scoring.",
)
@click.option(
    "--debug",
    is_flag=True,
    help="Show detailed logs from Vertex AI SDK and other services.",
)
def evaluate(
    interaction_file,
    metrics_files,
    results_dir,
    input_label,
    test_description,
    metric_filter,
    gcs_dest,
    debug,
):
    """Run evaluation metrics on processed interaction data."""
    from agent_eval.core.evaluator import configure_logging

    configure_logging(debug=debug)

    if gcs_dest and not gcs_dest.startswith("gs://"):
        console.print(f"  [red]--gcs-dest must start with gs://[/] (got: {gcs_dest})")
        sys.exit(1)

    console.print("\n[bold blue]Running Evaluation[/]")
    if len(interaction_file) > 1:
        console.print(f"  [dim]Combining {len(interaction_file)} interaction files[/]")
        for f in interaction_file:
            console.print(f"    [dim]- {f}[/]")

    config = {
        "metric_filters": None,
        "input_label": input_label,
        "test_description": test_description,
        "gcs_dest": gcs_dest,
    }

    if metric_filter:
        filters = {}
        for f in metric_filter:
            k, v = f.split(":", 1)
            filters[k] = v.split(",")
        config["metric_filters"] = filters

    evaluator = Evaluator(config)

    try:
        asyncio.run(
            evaluator.evaluate(
                interaction_files=[Path(f) for f in interaction_file],
                metrics_files=list(metrics_files),
                results_dir=Path(results_dir),
            )
        )

        cwd = Path.cwd()
        rel_results = os.path.relpath(results_dir, cwd)
        rel_metrics = (
            os.path.relpath(metrics_files[0], cwd)
            if metrics_files
            else "<metrics.json>"
        )

        # ── Display metrics overview ───────────────────────────────────
        _display_metrics_summary(results_dir)

        if gcs_dest:
            console.print()
            console.print(
                f"  [bold]Vertex AI managed pipeline:[/] artifacts uploaded to {gcs_dest}"
            )
            console.print(
                "  [dim]Open the Vertex AI > Evaluations console to see the dashboard for this run.[/]"
            )

        console.print()
        console.print(
            Panel(
                f"[bold green]Evaluation complete![/]\n\n"
                f"[bold]Results:[/]  {rel_results}/\n\n"
                "[bold]Deep dive into the files:[/]\n"
                f"  eval_summary.json        — Full aggregated scores\n"
                f"  question_answer_log.md   — Per-question breakdown with scores\n\n"
                "[bold]Scores look wrong?[/] Low scores often mean a [bold]metric mapping[/]\n"
                "issue, not an agent problem. Each metric's `dataset_mapping`\n"
                f"controls which trace fields the LLM judge sees. Edit:\n"
                f"  {rel_metrics}\n\n"
                "[dim]See docs/reference.md > Custom Metrics for mapping options.[/]",
                title="[bold]Done[/]",
                border_style="green",
                padding=(1, 2),
            )
        )

        console.print()
        console.print("[bold]Next step — copy and paste:[/]")
        console.print()
        console.print("agent-eval analyze \\")
        console.print(f"  --results-dir {rel_results}")
        console.print()

    except Exception as e:
        import traceback

        traceback.print_exc()
        console.print(f"[bold red]Error during evaluation:[/] {e}")
        sys.exit(1)
