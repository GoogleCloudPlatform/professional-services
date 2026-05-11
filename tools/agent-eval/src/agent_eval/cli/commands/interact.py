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
"""agent-eval interact — run interactions against a live agent."""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule

from agent_eval.cli._pacing import _continue
from agent_eval.core.interactions import InteractionRunner
from agent_eval.core.processor import InteractionProcessor
from agent_eval.core.converters import write_jsonl

console = Console()

TOTAL_STEPS = 2


def _step_header(n: int, title: str, description: str) -> None:
    """Print a formatted step header."""
    console.print()
    console.print(Rule(f"  Step {n}/{TOTAL_STEPS}: {title}  ", style="bold blue"))
    console.print(f"  [dim]{description}[/]")
    console.print()


def _find_eval_dir(agent_dir: Path) -> Path | None:
    """Find the eval/ directory — check inside agent_dir first, then parent."""
    if (agent_dir / "eval").is_dir():
        return agent_dir / "eval"
    if (agent_dir.parent / "eval").is_dir():
        return agent_dir.parent / "eval"
    return None


def _prompt_for_config(agent_dir, app_name, questions_file, base_url, results_dir, run_id):
    """Interactively prompt for any missing configuration."""
    from rich.prompt import Prompt

    agent_path = Path(agent_dir).resolve() if agent_dir else None

    # ── Agent directory ────────────────────────────────────────────────────
    if not agent_path:
        console.print()
        console.print(Panel(
            "[bold]Point to your agent module[/] — the folder containing agent.py.\n\n"
            "[dim]agent-eval will look for tests/eval/dataset.jsonl + tests/eval/metrics/\n"
            "relative to its project root (the nearest pyproject.toml).[/]",
            title="[bold]Agent Directory[/]",
            border_style="blue",
            padding=(1, 2),
        ))
        raw = Prompt.ask("  Agent directory")
        agent_path = Path(raw).resolve()

    if not agent_path.is_dir():
        console.print(f"\n  [red]Error:[/] Directory not found: {agent_path}")
        sys.exit(1)

    # Derive app_name from directory name if not provided
    if not app_name:
        app_name = agent_path.name

    # Auto-detect eval dir
    eval_path = _find_eval_dir(agent_path)

    # ── Questions file ─────────────────────────────────────────────────────
    if not questions_file:
        # Try auto-detecting from eval dir
        auto_detected = None
        if eval_path:
            from agent_eval.core.config import find_eval_files
            discovered = find_eval_files(eval_path)
            if discovered["golden_data"]:
                auto_detected = str(discovered["golden_data"][0])

        console.print()
        console.print(Panel(
            "[bold]Path to your test queries.[/]\n\n"
            "[dim]Defaults to the unified tests/eval/dataset.jsonl scaffolded by\n"
            "`agent-eval init`. Single-turn rows are auto-filtered for interact.[/]",
            title="[bold]Questions File[/]",
            border_style="blue",
            padding=(1, 2),
        ))
        questions_file = Prompt.ask(
            "  Questions file",
            default=auto_detected,
        )

    if not Path(questions_file).exists():
        console.print(f"\n  [red]Error:[/] Questions file not found: {questions_file}")
        sys.exit(1)

    # ── Base URL ───────────────────────────────────────────────────────────
    if not base_url:
        console.print()
        console.print(Panel(
            "[bold]Your agent's API endpoint.[/]\n\n"
            "[dim]For ADK Starter Pack agents, run `make playground` in the agent\n"
            "directory — the API starts on http://localhost:8501.\n"
            "For custom deployments, use your agent's serving URL.[/]",
            title="[bold]Base URL[/]",
            border_style="blue",
            padding=(1, 2),
        ))
        base_url = Prompt.ask("  Base URL", default="http://localhost:8501")

    # ── Results directory ──────────────────────────────────────────────────
    if not results_dir:
        auto_results = str(eval_path / "results") if eval_path else "results"
        results_dir = auto_results

    # ── Run ID ─────────────────────────────────────────────────────────────
    if not run_id:
        console.print()
        console.print(Panel(
            "[bold]Give this run a name[/] so you can easily find it later.\n\n"
            "Examples: [cyan]baseline[/], [cyan]v2-tool-hardening[/], [cyan]cache-optimization[/]\n\n"
            "[dim]Results will be saved to tests/eval/results/<run-id>/.\n"
            "Press Enter to use an auto-generated timestamp instead.[/]",
            title="[bold]Run ID[/]",
            border_style="blue",
            padding=(1, 2),
        ))
        default_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_id = Prompt.ask("  Run ID", default=default_ts).strip().replace(" ", "-")

    return agent_path, app_name, questions_file, base_url, results_dir, run_id


@click.command()
@click.option("--agent-dir", default=None,
              help="Path to the agent module directory (containing agent.py).")
@click.option("--app-name", default=None,
              help="Name of the agent application (defaults to agent dir name).")
@click.option("--questions-file", default=None,
              help="Path to the Golden Dataset JSON.")
@click.option("--base-url", default=None,
              help="Agent API URL (default: http://localhost:8501).")
@click.option("--user-id", default="eval_user", help="Session User ID.")
@click.option("--results-dir", default=None,
              help="Directory for outputs (auto-detected from eval/ if omitted).")
@click.option("--run-id", default=None,
              help="Name for the results folder (e.g., 'baseline', 'tool-hardening'). "
                   "Defaults to a timestamp like 20260319_060430.")
@click.option("--num-questions", type=int, default=-1, help="Limit number of questions (-1 = all).")
@click.option("--runs", type=int, default=1, help="Runs per question.")
@click.option("--skip-traces", is_flag=True, help="Skip trace retrieval (faster).")
@click.option("--filter", "metadata_filters", multiple=True, help="Metadata filters (key:val).")
@click.option("--state", "state_variables", multiple=True, help="State variables (key:val).")
@click.option("--user", default=os.environ.get("USER"), help="Operator username.")
@click.option("--debug", is_flag=True, help="Show detailed logs from agent interactions and trace retrieval.")
def interact(agent_dir, app_name, questions_file, base_url, user_id, results_dir,
             run_id, num_questions, runs, skip_traces, metadata_filters, state_variables, user, debug):
    """Run interactions against a live agent and collect traces.

    Sends queries from a golden dataset to a running agent endpoint, collects
    responses and traces, and saves them in agent-eval's JSONL format.

    \b
    Before running, start your agent:
      - ADK Starter Pack: `make playground` (serves on port 8501)
      - Custom agents: start your server on any port

    \b
    If options are not provided, the command will prompt interactively.
    """
    from agent_eval.cli.main import _display_banner
    from agent_eval.core.evaluator import configure_logging
    _display_banner()
    configure_logging(debug=debug)

    # ── Interactive prompts for missing config ─────────────────────────────

    agent_path, app_name, questions_file, base_url, results_dir, run_id = \
        _prompt_for_config(agent_dir, app_name, questions_file, base_url, results_dir, run_id)

    # ── Overview ───────────────────────────────────────────────────────────

    console.print(Panel(
        f"[bold]Agent:[/]          [cyan]{app_name}[/]  [dim]({agent_path})[/]\n"
        f"[bold]Questions:[/]      {questions_file}\n"
        f"[bold]Base URL:[/]       {base_url}\n"
        f"[bold]Run ID:[/]         [cyan]{run_id}[/]"
        f"  [dim](results saved to {results_dir}/{run_id}/)[/]\n\n"
        f"[bold]What will happen:[/]\n"
        f"  [dim]1.[/] Send each question to the agent and collect responses + traces\n"
        f"  [dim]2.[/] Process and enrich interaction logs into evaluation format",
        title="[bold]Interact[/]",
        border_style="blue",
        padding=(1, 2),
    ))
    _continue("Press Enter to start interacting →", console=console)

    # ── Build config ───────────────────────────────────────────────────────

    config = {
        "app_name": app_name,
        "questions_file": questions_file,
        "base_url": base_url,
        "user_id": user_id,
        "num_questions": num_questions,
        "results_dir": results_dir,
        "runs": runs,
        "metadata_filters": list(metadata_filters) if metadata_filters else None,
        "state_variables": list(state_variables) if state_variables else None,
        "skip_traces": skip_traces,
        "user": user,
    }

    # ── Step 1: Run interactions ───────────────────────────────────────────

    _step_header(1, "Run interactions",
                 "Sending each question from the golden dataset to your agent.\n"
                 "  The agent's responses and OpenTelemetry traces are captured\n"
                 "  for evaluation.")

    runner = InteractionRunner(config)

    try:
        raw_df = asyncio.run(runner.run())
    except Exception as e:
        console.print(f"    [red]Error during interaction run:[/] {e}")
        console.print(f"    [dim]Make sure your agent is running at {base_url}[/]")
        sys.exit(1)

    if raw_df.empty:
        console.print("    [yellow]![/] No interactions were captured.")
        console.print("    [dim]Check that your golden dataset has questions and the agent is responding.[/]")
        sys.exit(0)

    console.print(f"    [green]+[/] Captured [cyan]{len(raw_df)}[/] interaction{'s' if len(raw_df) != 1 else ''}")

    # ── Step 2: Process & enrich ───────────────────────────────────────────

    _step_header(2, "Process & enrich logs",
                 "Enriching raw interaction logs with trace data (tool calls,\n"
                 "  token counts, timing) and saving in evaluation format.")

    processor = InteractionProcessor(config)
    try:
        enriched_df = asyncio.run(processor.process(raw_df))
    except Exception as e:
        console.print(f"    [red]Error during processing:[/] {e}")
        sys.exit(1)

    # Save output as JSONL
    run_dir = os.path.join(results_dir, run_id)
    raw_dir = os.path.join(run_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    output_path = os.path.join(raw_dir, f"processed_interaction_{app_name}.jsonl")

    records = enriched_df.to_dict(orient="records")
    for record in records:
        for key, value in record.items():
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        record[key] = parsed
                except (json.JSONDecodeError, TypeError):
                    pass

    write_jsonl(records, output_path)

    console.print(f"    [green]+[/] Saved [cyan]{len(records)}[/] enriched interaction{'s' if len(records) != 1 else ''}")
    console.print(f"    [green]+[/] Output: {output_path}")
    console.print(f"    [green]+[/] Run directory: {run_dir}")

    # ── Done ───────────────────────────────────────────────────────────────

    # Use relative paths for clean copy-pasteable commands
    cwd = Path.cwd()
    rel_run = os.path.relpath(run_dir, cwd)
    rel_output = os.path.relpath(output_path, cwd)
    rel_agent = os.path.relpath(agent_path, cwd)

    # Try to find metrics file
    eval_path = _find_eval_dir(agent_path)
    # Find metrics file for the "next steps" hint
    eval_metrics = None
    if eval_path:
        from agent_eval.core.config import find_eval_files
        _discovered = find_eval_files(eval_path)
        if _discovered["metrics"]:
            eval_metrics = _discovered["metrics"][0]
    rel_metrics = os.path.relpath(eval_metrics, cwd) if eval_metrics else "<path/to/metric_definitions.json>"

    console.print()
    console.print(Panel(
        f"[bold green]Interactions complete![/]\n\n"
        f"[bold]Results:[/]  {rel_run}/",
        title="[bold]Done[/]",
        border_style="green",
        padding=(1, 2),
    ))

    console.print()
    console.print("[bold]Next steps — copy and paste:[/]")
    console.print()
    console.print("[bold]1.[/] Run deterministic + LLM-as-judge metrics:")
    console.print()
    console.print(f"agent-eval evaluate \\")
    console.print(f"  --interaction-file {rel_output} \\")
    console.print(f"  --metrics-files {rel_metrics} \\")
    console.print(f"  --results-dir {rel_run}")
    console.print()
    console.print("[bold]2.[/] Generate AI-powered analysis:")
    console.print()
    console.print(f"agent-eval analyze \\")
    console.print(f"  --results-dir {rel_run} \\")
    console.print(f"  --agent-dir {rel_agent}")
    console.print()
