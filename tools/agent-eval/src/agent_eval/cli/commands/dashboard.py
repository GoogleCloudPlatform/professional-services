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
"""agent-eval dashboard — interactive visualization of evaluation runs."""

import sys

import click
from rich.console import Console

console = Console()


@click.command()
@click.option(
    "--results-dir",
    required=True,
    help=
    "Path to the results directory containing run sub-folders (e.g., tests/eval/results/)."
)
@click.option("--port",
              default=7860,
              type=int,
              help="Port for the dashboard server (default: 7860).")
@click.option("--share",
              is_flag=True,
              help="Create a public Gradio share link.")
def dashboard(results_dir, port, share):
    """Launch the interactive dashboard for comparing evaluation runs.

    \b
    Opens a Gradio web app that lets you:
      - Compare metrics across runs with scorecards and delta %
      - Visualize trends with grouped bar charts
      - Drill down into per-question scores
      - Read AI-powered analysis (gemini_analysis.md)
      - Export raw data tables

    \b
    Requires optional dependencies:
      pip install agent-eval[dashboard]
      # or: uv pip install gradio plotly

    \b
    Examples:
      agent-eval dashboard --results-dir tests/eval/results/
      agent-eval dashboard --results-dir tests/eval/results/ --port 8080
      agent-eval dashboard --results-dir tests/eval/results/ --share
    """
    try:
        from agent_eval.dashboard.app import launch
    except ImportError:
        console.print()
        console.print("  [red]Missing dashboard dependencies.[/]")
        console.print()
        console.print("  Install them with:")
        console.print("    [cyan]pip install agent-eval\\[dashboard][/]")
        console.print("    [dim]or:[/]  [cyan]uv pip install gradio plotly[/]")
        console.print()
        sys.exit(1)

    from agent_eval.cli.main import _display_banner
    _display_banner()

    console.print()
    console.print(f"  [bold]Results:[/]  {results_dir}")
    console.print(f"  [bold]Port:[/]     {port}")
    if share:
        console.print("  [bold]Share:[/]    public link enabled")
    console.print()

    launch(results_dir, port=port, share=share)
