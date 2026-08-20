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
"""agent-eval compare — compare two evaluation runs and display metric deltas."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


def _load_summary(run_path: Path) -> dict:
    summary_file = run_path / "eval_summary.json" if run_path.is_dir() else run_path
    if not summary_file.exists():
        console.print(f"[bold red]Error:[/] Summary file not found at {summary_file}")
        sys.exit(1)
    try:
        return json.loads(summary_file.read_text(encoding="utf-8"))
    except Exception as e:
        console.print(f"[bold red]Error parsing {summary_file}:[/] {e}")
        sys.exit(1)


@click.command(help="Compare two evaluation runs and display metric deltas.")
@click.argument("candidate_dir", required=True, type=click.Path(exists=True))
@click.argument("baseline_dir", required=True, type=click.Path(exists=True))
@click.option(
    "--output-file",
    default=None,
    help="Save comparison markdown table to specified filepath.",
)
@click.option(
    "--focus",
    default=None,
    help="Comma-separated metric names to highlight in the delta table.",
)
def compare(
    candidate_dir: str,
    baseline_dir: str,
    output_file: str | None,
    focus: str | None,
):
    """Compare candidate evaluation results against a baseline run."""
    cand_path = Path(candidate_dir).resolve()
    base_path = Path(baseline_dir).resolve()

    cand_summary = _load_summary(cand_path)
    base_summary = _load_summary(base_path)

    cand_overall = cand_summary.get("overall_summary", {})
    base_overall = base_summary.get("overall_summary", {})

    cand_llm = cand_overall.get("llm_based_metrics", {})
    base_llm = base_overall.get("llm_based_metrics", {})

    cand_det = cand_overall.get("deterministic_metrics", {})
    base_det = base_overall.get("deterministic_metrics", {})

    focus_keywords = [k.strip().lower() for k in focus.split(",")] if focus else []

    table = Table(
        title=f"Evaluation Comparison: {cand_path.name} vs {base_path.name} (baseline)",
        border_style="blue",
        padding=(0, 2),
    )
    table.add_column("Metric", style="bold")
    table.add_column("Baseline", justify="right", style="dim")
    table.add_column("Candidate", justify="right")
    table.add_column("Delta", justify="right")
    table.add_column("Status", justify="center")

    all_llm_keys = sorted(set(list(cand_llm.keys()) + list(base_llm.keys())))
    md_lines = [
        f"# Evaluation Comparison: {cand_path.name} vs {base_path.name}",
        "",
        "| Metric | Baseline | Candidate | Delta |",
        "|---|---|---|---|",
    ]

    for m in all_llm_keys:
        b_val = base_llm.get(m, {}).get("average")
        c_val = cand_llm.get(m, {}).get("average")
        b_str = f"{b_val:.2f}" if b_val is not None else "—"
        c_str = f"{c_val:.2f}" if c_val is not None else "—"

        delta_str = "—"
        status_str = "—"
        if b_val is not None and c_val is not None:
            delta = c_val - b_val
            if delta > 0.001:
                delta_str = f"[green]+{delta:.2f}[/]"
                status_str = "[green]▲ Improved[/]"
                md_delta = f"+{delta:.2f}"
            elif delta < -0.001:
                delta_str = f"[red]{delta:.2f}[/]"
                status_str = "[red]▼ Regressed[/]"
                md_delta = f"{delta:.2f}"
            else:
                delta_str = "[dim]0.00[/]"
                status_str = "[dim]Unchanged[/]"
                md_delta = "0.00"
        else:
            md_delta = "—"

        highlight = any(k in m.lower() for k in focus_keywords)
        m_label = f"[bold cyan]{m}[/]" if highlight else m
        table.add_row(m_label, b_str, c_str, delta_str, status_str)
        md_lines.append(f"| {m} | {b_str} | {c_str} | {md_delta} |")

    # Key deterministic metrics
    all_det_keys = sorted(set(list(cand_det.keys()) + list(base_det.keys())))
    if all_det_keys:
        for k in all_det_keys:
            b_val = base_det.get(k)
            c_val = cand_det.get(k)
            if not isinstance(b_val, (int, float)) and not isinstance(c_val, (int, float)):
                continue
            b_str = f"{b_val:.2f}" if isinstance(b_val, (int, float)) else "—"
            c_str = f"{c_val:.2f}" if isinstance(c_val, (int, float)) else "—"
            delta_str = "—"
            md_delta = "—"
            if isinstance(b_val, (int, float)) and isinstance(c_val, (int, float)):
                delta = c_val - b_val
                delta_sign = "+" if delta > 0 else ""
                delta_str = f"{delta_sign}{delta:.2f}"
                md_delta = delta_str
            table.add_row(f"[dim]{k}[/]", b_str, c_str, delta_str, "—")
            md_lines.append(f"| {k} | {b_str} | {c_str} | {md_delta} |")

    console.print()
    console.print(table)
    console.print()

    if output_file:
        out_p = Path(output_file).resolve()
        out_p.write_text("\n".join(md_lines) + "\n", encoding="utf-8")
        console.print(f"[bold green]Saved comparison markdown to:[/] {out_p}")
