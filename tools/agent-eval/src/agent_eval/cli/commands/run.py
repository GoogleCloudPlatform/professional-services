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
"""agent-eval run — orchestrate simulate, interact, and evaluate in one command."""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict

import click
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule

from agent_eval.cli._pacing import _continue, _pauses_disabled

console = Console()

# Module-level constant — referenced by click decorators below AND by the
# helpers further down. Must live at module scope (not inside the helper
# block) so the decorator's `default=` resolves at import time.
_DEFAULT_SIM_PARALLELISM = 3  # cap concurrent `adk eval` subprocesses to limit Vertex quota pressure


def _looks_headless() -> bool:
    """Return True when this shell almost certainly has no display.

    `webbrowser.open(file://...)` will frequently return True in headless
    environments (it found `xdg-open` or `firefox` on PATH) without
    actually showing anything. That's worse than failing — we tell the
    user "Opened in your default browser" and they see nothing. Detect
    the headless case upfront so we route to the localhost-server flow
    immediately instead of pretending to open something.

    Heuristics (any one triggers):
    - Linux + neither $DISPLAY nor $WAYLAND_DISPLAY set
    - $SSH_CONNECTION set (remote shell)
    - $CLOUD_WORKSTATIONS_AGENT_VERSION set (Google Cloud Workstation)
    - $CODESPACES set (GitHub Codespaces)

    macOS and Windows almost always have a display, so we don't try to
    detect headlessness there — webbrowser.open works as expected.
    """
    if sys.platform not in ("linux", "linux2"):
        return False
    if os.environ.get("SSH_CONNECTION") or os.environ.get("SSH_CLIENT"):
        return True
    if os.environ.get("CLOUD_WORKSTATIONS_AGENT_VERSION"):
        return True
    if os.environ.get("CODESPACES"):
        return True
    if not os.environ.get("DISPLAY") and not os.environ.get("WAYLAND_DISPLAY"):
        return True
    return False


def _open_report_in_run(html_path: Path, run_dir: Path, cwd: Path) -> None:
    """Phase 5/5 — open the HTML report.

    Three paths depending on environment:

    1. **Local dev with a display**: webbrowser.open(file://...) → done.
    2. **Remote dev box** (SSH, Cloud Workstation, Codespaces): detected
       upfront via `_looks_headless()` so we don't lie about opening it.
       Offer to spawn the localhost http.server right here.
    3. **CI / piped stdin**: skip the prompt; just print the path.

    Always end by printing the copy-paste commands for opening later.
    """
    rel_html = os.path.relpath(html_path, cwd)
    file_url = f"file://{html_path.resolve()}"
    headless = _looks_headless()

    console.print(f"  [bold]Path:[/]      {rel_html}")
    console.print(f"  [dim]URL:       {file_url}[/]")
    if headless:
        console.print(
            "  [dim]Detected headless shell[/] "
            "[dim](no $DISPLAY / SSH session / Cloud Workstation).[/]")
    console.print()

    if _pauses_disabled() or not sys.stdin.isatty():
        console.print("  [dim]Skipping auto-open (non-interactive shell).[/]")
        _print_open_later_commands()
        return

    from rich.prompt import Confirm

    # Headless: skip the misleading "open in browser" path and offer the
    # localhost server directly. That's the only thing that actually works
    # for SSH'd-in users.
    if headless:
        if not Confirm.ask(
                "  Start a localhost server now so you can view via SSH tunnel "
                "or Cloud Workstation Web Preview?",
                default=True,
        ):
            console.print()
            _print_open_later_commands()
            return
        from agent_eval.cli.commands.report import _serve as _serve_report
        console.print(
            "  [dim]Starting server... press Ctrl+C when you're done viewing.[/]"
        )
        try:
            _serve_report(html_path, port_hint=0)
        finally:
            console.print()
            _print_open_later_commands()
        return

    # Local with a display: try webbrowser.open. If the user said no to
    # the prompt, just print the re-open commands.
    if not Confirm.ask("  Open the report now?", default=True):
        console.print()
        _print_open_later_commands()
        return

    import webbrowser
    try:
        opened = webbrowser.open(file_url, new=2)
    except Exception:
        opened = False

    if opened:
        console.print()
        console.print("  [green]+[/] Opened in your default browser.")
        _print_open_later_commands()
        return

    # webbrowser.open returned False even though we thought we had a
    # display (rare — maybe BROWSER env var pointed at a missing binary).
    # Fall back to the serve flow.
    console.print()
    console.print(
        "  [yellow]Couldn't auto-open a browser[/] [dim](no working handler).[/]"
    )
    if not Confirm.ask(
            "  Start a localhost server you can open manually instead?",
            default=True,
    ):
        console.print()
        _print_open_later_commands()
        return
    from agent_eval.cli.commands.report import _serve as _serve_report
    try:
        _serve_report(html_path, port_hint=0)
    finally:
        console.print()
        _print_open_later_commands()


def _print_open_later_commands() -> None:
    """Always end the View phase with copy-paste commands so the user
    knows how to come back later, regardless of which path they took."""
    console.print("  [dim]Re-open anytime:[/]  [cyan]agent-eval report[/]"
                  "  [dim]· remote dev:[/] [cyan]agent-eval report --serve[/]")


def _start_storyteller():
    """Spawn a background StoryStreamer that prints essays paragraph-by-
    paragraph during the long wait. Returns the streamer so the caller
    can stop() it after the phase completes. Returns None if the import
    fails (defensive — should never happen in normal installs)."""
    try:
        from agent_eval.cli._stories import StoryStreamer
    except Exception:
        return None
    streamer = StoryStreamer(console)
    streamer.start()
    return streamer


@click.command()
@click.option("--agent-dir",
              default=None,
              help="Path to the agent module directory (containing agent.py). "
              "Auto-detected from the current directory if omitted.")
@click.option("--eval-dir",
              default=None,
              help="Path to eval/ directory (auto-detected if omitted).")
@click.option(
    "--run-id",
    default=None,
    help=
    "Name for the results folder (e.g., 'baseline'). Defaults to a timestamp.")
@click.option("--simulate/--no-simulate",
              "run_simulate",
              default=True,
              help="Run ADK User Sim scenarios (default: yes).")
@click.option(
    "--sim-parallelism",
    type=int,
    default=_DEFAULT_SIM_PARALLELISM,
    show_default=True,
    help=
    "Max concurrent ADK eval subprocesses during simulate. Higher = faster wall-clock "
    "but more Vertex AI quota pressure. Set to 1 to fully serialize.")
@click.option(
    "--interact/--no-interact",
    "run_interact",
    default=True,
    help=
    "Run DIY interactions against a live agent (default: yes). Skipped gracefully if agent is unreachable."
)
@click.option("--base-url",
              default="http://localhost:8501",
              help="Agent API URL for interact mode.")
@click.option(
    "--evaluate/--no-evaluate",
    "run_evaluate",
    default=True,
    help="Run evaluation after collecting interactions (default: yes).")
@click.option("--metrics-files",
              "metrics_files",
              multiple=True,
              default=None,
              help="Metric definition file(s) — pass once per file. "
              "Defaults to every *.json under <project>/tests/eval/metrics/.")
@click.option("--app-name",
              default=None,
              help="Agent app name for interact (defaults to agent dir name).")
@click.option("--questions-file",
              default=None,
              help="Path to golden dataset JSON for interact mode.")
@click.option("--num-questions",
              type=int,
              default=-1,
              help="Limit number of questions for interact (-1 = all).")
@click.option("--skip-traces",
              is_flag=True,
              help="Skip trace retrieval in interact mode (faster).")
@click.option("--analyze/--no-analyze",
              "run_analyze",
              default=True,
              help="Run AI-powered analysis after evaluation (default: yes).")
@click.option(
    "--focus",
    default=None,
    help=
    "Developer focus for analysis: metric names to highlight (e.g., 'latency, cache')."
)
@click.option("--skip-gemini",
              is_flag=True,
              help="Skip AI-powered analysis in the analyze phase.")
@click.option(
    "--dashboard/--no-dashboard",
    "run_dashboard",
    default=None,
    help=
    "Launch interactive dashboard after pipeline (default: prompt if gradio installed)."
)
@click.option(
    "--debug",
    is_flag=True,
    help="Show detailed logs from all phases (ADK, Vertex AI SDK, etc.).")
def run(agent_dir, eval_dir, run_id, run_simulate, sim_parallelism,
        run_interact, base_url, run_evaluate, metrics_files, app_name,
        questions_file, num_questions, skip_traces, run_analyze, focus,
        skip_gemini, run_dashboard, debug):
    """Run the full evaluation pipeline: simulate, interact, evaluate, and analyze.

    \b
    This command orchestrates the full workflow in a single step:
      1. Run ADK User Sim scenarios              → simulation JSONL
      2. Run DIY interactions against live agent  → interaction JSONL
      3. Run evaluation metrics on all collected interaction files
      4. Generate AI-powered analysis + comparison tables

    \b
    By default, all four phases run. If the agent is not reachable at
    --base-url, the interact phase is skipped gracefully and evaluation
    proceeds with simulation data only.

    \b
    Examples:
      # From inside the agent project (agent.py auto-detected)
      agent-eval run

    \b
      # Full pipeline with explicit agent-dir
      agent-eval run --agent-dir agents/my-agent/app

    \b
      # Skip interact (simulation only)
      agent-eval run --no-interact

    \b
      # With focus highlighting in analysis
      agent-eval run --focus "latency, cache"
    """
    from agent_eval.cli.main import _display_banner
    from agent_eval.core.evaluator import configure_logging
    _display_banner()

    # ── Logging ─────────────────────────────────────────────────────────────
    configure_logging(debug=debug)

    # ── Validation ──────────────────────────────────────────────────────────

    if not run_simulate and not run_interact:
        console.print(
            "\n  [red]Error:[/] Nothing to do. Use --simulate and/or --interact."
        )
        sys.exit(1)

    # ── Auto-detect agent-dir ───────────────────────────────────────────────
    if not agent_dir:
        from agent_eval.core.path_detector import _find_local_agents
        cwd = Path.cwd()
        agents = _find_local_agents(cwd)
        if not agents:
            console.print(
                f"\n  [red]Error:[/] No agent.py found at or below {cwd}")
            console.print(
                "  [dim]Run this from your agent project, or pass --agent-dir <path>.[/]"
            )
            sys.exit(1)
        if len(agents) > 1:
            console.print(
                f"\n  [yellow]Multiple agent.py files found near {cwd}:[/]")
            for a in agents:
                try:
                    console.print(f"    [dim]-[/] {a.relative_to(cwd)}")
                except ValueError:
                    console.print(f"    [dim]-[/] {a}")
            console.print("  [dim]Pick one with --agent-dir <path>.[/]")
            sys.exit(1)
        agent_path = agents[0].parent.resolve()
        try:
            rel = agent_path.relative_to(cwd)
            console.print(
                f"  [dim]Auto-detected agent at[/] [cyan]{rel}[/]  [dim](use --agent-dir to override)[/]"
            )
        except ValueError:
            console.print(
                f"  [dim]Auto-detected agent at[/] [cyan]{agent_path}[/]")
    else:
        agent_path = Path(agent_dir).resolve()

    if not (agent_path / "agent.py").exists():
        console.print(f"\n  [red]Error:[/] No agent.py found in {agent_path}")
        console.print(
            "  [dim]The --agent-dir should point to the folder containing agent.py[/]"
        )
        sys.exit(1)

    agent_name = agent_path.name
    if not app_name:
        app_name = agent_name

    # ── Canonical layout: <project_root>/tests/eval/dataset.jsonl ──────────
    # Per CLAUDE.md rule #11: ONE source of truth — every command consumes
    # this single file. simulate filters multi-turn rows; interact filters
    # single-turn. Metrics live at tests/eval/metrics/metric_definitions.json.
    from agent_eval.core.path_resolver import agent_project_root
    project_root = agent_project_root(agent_path)

    if eval_dir:
        eval_path = Path(eval_dir).resolve()
    else:
        eval_path = project_root / "tests" / "eval"
        if not eval_path.is_dir():
            console.print(
                f"\n  [red]Error:[/] No tests/eval/ directory at {project_root}"
            )
            console.print(
                "  [dim]Run `agent-eval init` first to scaffold one.[/]")
            sys.exit(1)

    dataset_path = eval_path / "dataset.jsonl"
    if not dataset_path.exists():
        console.print(f"\n  [red]Error:[/] No dataset.jsonl at {dataset_path}")
        console.print(
            "  [dim]Run `agent-eval init` to scaffold one, or `agent-eval migrate` for legacy eval/ files.[/]"
        )
        sys.exit(1)

    # Count rows by capability — single source of truth for what phases can run.
    from agent_eval.core.dataset_io import read_dataset, is_multi_turn, is_single_turn
    try:
        _all_rows = read_dataset(dataset_path)
    except Exception as e:
        console.print(f"\n  [red]Error:[/] Could not read {dataset_path}: {e}")
        sys.exit(1)
    n_multi_turn = sum(1 for r in _all_rows if is_multi_turn(r))
    n_single_turn = sum(1 for r in _all_rows if is_single_turn(r))

    # Validate simulate prerequisites — needs multi-turn rows.
    if run_simulate:
        if n_multi_turn == 0:
            console.print(
                f"\n  [yellow]Warning:[/] No multi-turn rows in {dataset_path.name}. "
                f"Skipping simulate phase.")
            console.print(
                "  [dim]Multi-turn rows have a `history` or `conversation_plan` field. "
                "Add some, or stick with --no-simulate.[/]")
            run_simulate = False

    # Validate interact prerequisites — point at unified dataset.jsonl.
    # `get_golden_questions` filters single-turn rows automatically.
    if run_interact:
        if not questions_file:
            if n_single_turn == 0:
                console.print(
                    f"\n  [yellow]Warning:[/] No single-turn rows in {dataset_path.name}. "
                    f"Skipping interact phase.")
                run_interact = False
            else:
                questions_file = str(dataset_path)
        elif not Path(questions_file).exists():
            console.print(
                f"\n  [red]Error:[/] Questions file not found: {questions_file}"
            )
            sys.exit(1)

        # Check if agent is reachable before committing to interact phase.
        # If the user-supplied --base-url isn't responding, scan a short list
        # of common ADK / FastAPI / dev-server ports on localhost so users
        # who started the agent on a non-default port aren't punished.
        if run_interact:
            from concurrent.futures import ThreadPoolExecutor
            from rich.prompt import Prompt

            def _check_url(url: str, timeout: float = 1.5) -> bool:
                # ADK's api_server returns 404 on `/` (no root handler) — that
                # still means the server is listening. urllib raises HTTPError
                # on 4xx; treat as alive. Only connection failures (refused,
                # timeout) mean nothing's there.
                import urllib.error
                try:
                    urllib.request.urlopen(url, timeout=timeout)
                    return True
                except urllib.error.HTTPError:
                    return True
                except Exception:
                    return False

            # Common ports: 8501 ADK make playground, 8500 user-config'd ADK,
            # 8000 FastAPI/uvicorn default, 8080 common dev, 8888 Jupyter-ish,
            # 5000 Flask default, 7860 Gradio default. localhost + 127.0.0.1
            # because some setups bind one but not the other.
            _COMMON_PORTS = (8501, 8500, 8000, 8080, 8888, 5000, 7860)
            _COMMON_HOSTS = ("http://localhost", "http://127.0.0.1")

            def _scan_for_live_agents(skip: str) -> list[str]:
                candidates = [
                    f"{host}:{port}" for host in _COMMON_HOSTS
                    for port in _COMMON_PORTS
                    if f"{host}:{port}" != skip.rstrip("/")
                ]
                with ThreadPoolExecutor(max_workers=8) as ex:
                    results = list(ex.map(_check_url, candidates))
                live_raw = [u for u, ok in zip(candidates, results) if ok]
                # Dedupe by port — localhost:PORT and 127.0.0.1:PORT almost
                # always point at the same service on a single dev box.
                # Prefer the localhost form (more readable). If somehow only
                # 127.0.0.1 responded for a port, keep that.
                seen_ports: dict[int, str] = {}
                for url in live_raw:
                    port = int(url.rsplit(":", 1)[1])
                    if port in seen_ports:
                        if "localhost" in url and "localhost" not in seen_ports[
                                port]:
                            seen_ports[port] = url
                    else:
                        seen_ports[port] = url
                return list(seen_ports.values())

            if not _check_url(base_url):
                console.print(
                    f"\n  [yellow]Warning:[/] Agent not reachable at {base_url}"
                )
                console.print("  [dim]Scanning common ports on localhost...[/]")
                live = _scan_for_live_agents(base_url)
                if live:
                    if len(live) == 1:
                        from rich.prompt import Confirm
                        console.print(
                            f"  [green]Found a live agent at[/] [cyan]{live[0]}[/]"
                        )
                        if Confirm.ask("  Use this URL?", default=True):
                            base_url = live[0]
                            console.print(
                                f"  [green]Connected to {base_url}[/]")
                        else:
                            console.print("  [dim]Skipping interact phase.[/]")
                            run_interact = False
                    else:
                        console.print(
                            "  [green]Found multiple live agents — pick one:[/]"
                        )
                        for i, u in enumerate(live, 1):
                            console.print(f"    [cyan]{i}.[/] {u}")
                        console.print("    [dim]0. Skip interact[/]")
                        choice = Prompt.ask(
                            "  Pick",
                            choices=[str(i) for i in range(0,
                                                           len(live) + 1)],
                            default="1",
                        ).strip()
                        if choice == "0":
                            run_interact = False
                            console.print("  [dim]Skipping interact phase.[/]")
                        else:
                            base_url = live[int(choice) - 1]
                            console.print(
                                f"  [green]Connected to {base_url}[/]")
                else:
                    # No agent reachable. Before the manual-URL fallback, offer
                    # to spawn `adk api_server` ourselves so the user doesn't
                    # have to keep `make playground` running in another shell.
                    from rich.prompt import Confirm
                    console.print(
                        "  [dim]No live agents found on common ports.[/]")
                    auto_start = Confirm.ask(
                        "  Start [cyan]adk web[/] for you in the background "
                        f"(same as [cyan]make playground[/] — serves [cyan]{agent_path.name}/[/] on a free port)?",
                        default=True,
                    )
                    if auto_start:
                        port = _pick_free_port(8501)
                        console.print(
                            f"  [dim]Spawning `adk web {project_root.name} --port {port}`...[/]"
                        )
                        proc = _start_adk_api_server(agent_path, project_root,
                                                     port)
                        candidate = f"http://127.0.0.1:{port}"
                        with console.status(
                                f"  [bold blue]Waiting for {candidate} to become ready (≤60s)...[/]",
                                spinner="dots",
                        ):
                            ready = _wait_for_url_ready(candidate,
                                                        timeout_s=60.0)
                        if ready:
                            base_url = candidate
                            auto_started_proc = proc
                            console.print(
                                f"  [green]Connected to {base_url}[/]  "
                                f"[dim](server log: {Path(proc._agent_eval_log).relative_to(project_root) if Path(proc._agent_eval_log).is_relative_to(project_root) else proc._agent_eval_log})[/]"
                            )
                        else:
                            try:
                                proc.terminate()
                                proc.wait(timeout=5)
                            except Exception:
                                pass
                            console.print(
                                f"  [yellow]Server didn't respond within 60s.[/] "
                                f"[dim]Check {Path(proc._agent_eval_log).name} for startup errors.[/]"
                            )
                            run_interact = False
                    else:
                        alt = Prompt.ask(
                            "  Enter agent URL (or press Enter to skip interact)",
                            default="",
                        ).strip()
                        if alt and _check_url(alt):
                            base_url = alt
                            console.print(
                                f"  [green]Connected to {base_url}[/]")
                        elif alt:
                            console.print(
                                f"  [yellow]Warning:[/] Agent not reachable at {alt} either. Skipping interact."
                            )
                            run_interact = False
                        else:
                            console.print("  [dim]Skipping interact phase.[/]")
                            run_interact = False

    # Metric files for evaluation. User can pass --metrics-files one or more
    # times; otherwise we glob every *.json under tests/eval/metrics/ so
    # adding a new test rubric is just dropping a file in the directory.
    metric_paths: list[Path] = []
    if run_evaluate:
        if metrics_files:
            for raw in metrics_files:
                p = Path(raw).resolve()
                if not p.exists():
                    console.print(
                        f"\n  [red]Error:[/] Metrics file not found: {p}")
                    sys.exit(1)
                metric_paths.append(p)
        else:
            metrics_dir = eval_path / "metrics"
            if metrics_dir.is_dir():
                metric_paths = sorted(metrics_dir.glob("*.json"))

        if not metric_paths:
            console.print(
                f"\n  [yellow]Warning:[/] No metric files found in {eval_path / 'metrics'}/"
            )
            console.print(
                "  [dim]Evaluation will be skipped. Run `agent-eval init` to scaffold one, or pass --metrics-files <path>.[/]"
            )
            run_evaluate = False

    # Final check after graceful fallbacks
    if not run_simulate and not run_interact:
        console.print(
            "\n  [red]Error:[/] Nothing to do — both simulate and interact were skipped."
        )
        console.print(
            f"  [dim]Start your agent at {base_url} and try again, or create a golden dataset.[/]"
        )
        sys.exit(1)

    # ── Build step list ────────────────────────────────────────────────────

    # Analyze requires evaluate to have run
    if run_analyze and not run_evaluate:
        run_analyze = False

    phases = []
    if run_simulate:
        phases.append("Simulate")
    if run_interact:
        phases.append("Interact")
    if run_evaluate:
        phases.append("Evaluate")
    if run_analyze:
        phases.append("Analyze")
        # Add an explicit "View" terminal phase whenever Analyze runs —
        # opening the HTML report IS the final step of the run, not a
        # post-script. Making it a real 5/5 phase header reinforces that
        # in the user's mental model and gives the open prompt a proper
        # surface instead of feeling tacked onto the final banner.
        phases.append("View")
    total_phases = len(phases)

    def _phase_header(phase_name: str, description: str) -> None:
        """Print a numbered phase header."""
        idx = phases.index(phase_name) + 1
        console.print()
        console.print(
            Rule(f"  Phase {idx}/{total_phases}: {phase_name}  ",
                 style="bold cyan"))
        console.print(f"  [dim]{description}[/]")
        console.print()

    # ── Run ID ─────────────────────────────────────────────────────────────

    if not run_id:
        from rich.prompt import Prompt
        console.print()
        console.print(
            Panel(
                "[bold]Give this run a name[/] so you can easily find it later.\n\n"
                "Examples: [cyan]baseline[/], [cyan]v2-tool-hardening[/], [cyan]cache-optimization[/]\n\n"
                "[dim]Results will be saved to tests/eval/results/<run-id>/.\n"
                "Press Enter to use an auto-generated timestamp instead.[/]",
                title="[bold]Run ID[/]",
                border_style="blue",
                padding=(1, 2),
            ))
        default_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_id = Prompt.ask("  Run ID",
                            default=default_ts).strip().replace(" ", "-")

    # ── Overview ────────────────────────────────────────────────────────────

    overview_lines = [
        f"[bold]Agent:[/]      [cyan]{agent_name}[/]  [dim]({agent_path})[/]",
        f"[bold]Eval dir:[/]   {eval_path}",
        f"[bold]Run ID:[/]     [cyan]{run_id}[/]  [dim](results → tests/eval/results/{run_id}/)[/]",
        f"[bold]Pipeline:[/]   {' → '.join(phases)}",
    ]
    if run_interact:
        overview_lines.append(f"[bold]Base URL:[/]   {base_url}")

    console.print(
        Panel(
            "\n".join(overview_lines),
            title="[bold]Run[/]",
            border_style="blue",
            padding=(1, 2),
        ))
    _continue("Press Enter to start the pipeline →", console=console)

    # ── Set up results directory ───────────────────────────────────────────

    results_dir = eval_path / "results"
    run_dir = results_dir / run_id
    raw_dir = run_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    interaction_files = []
    # If we auto-spawned `adk api_server` for the user, keep the Popen so we
    # can kill it after interact completes. Initialized to None so the kill
    # block at the end of the phase is always safe to dereference.
    auto_started_proc = None

    # Track per-phase outcomes for the end-of-run banner. The lying
    # "Pipeline complete!" green banner from the 2026-04-23 customer demo
    # is replaced with reality: phase_outcomes drives title/border/body.
    phase_outcomes: Dict[str,
                         str] = {}  # name → "completed" | "failed" | "skipped"

    # ── Phase: Simulate ────────────────────────────────────────────────────

    if run_simulate:
        _phase_header(
            "Simulate",
            f"Running ADK User Sim on {n_multi_turn} multi-turn row{'s' if n_multi_turn != 1 else ''} from dataset.jsonl.\n"
            "  Projects scenarios from the unified dataset, clears history, runs the sim, converts traces."
        )

        # Import the simulate internals — but we drive the steps ourselves
        # to avoid the nested "Step X/5" headers from simulate.py
        _simulate_ok = _run_simulate_phase(
            agent_name,
            agent_path,
            project_root,
            raw_dir,
            debug=debug,
            max_parallel=sim_parallelism,
        )

        if _simulate_ok:
            phase_outcomes["Simulate"] = "completed"
            sim_output = raw_dir / "processed_interaction_sim.jsonl"
            if sim_output.exists():
                interaction_files.append(sim_output)
        else:
            phase_outcomes["Simulate"] = "failed"
            if not run_interact:
                console.print()
                console.print(
                    "  [red]Simulate failed and interact is disabled — nothing left to score.[/]"
                )
                console.print(
                    "  [dim]Re-run with `--no-simulate` to scope down, or fix the failure above and try again.[/]"
                )
                sys.exit(1)

            # Stop and ask. Multi-turn metrics (e.g. multi_turn_general_quality)
            # have nothing to score without simulate's output, and continuing
            # silently would produce a half-truthful result. Honor
            # AGENT_EVAL_NO_PAUSES for CI: default to abort.
            from agent_eval.cli._pacing import _pauses_disabled
            console.print()
            console.print(
                Panel(
                    "[bold red]ADK User Sim failed.[/]  See the error above for the cause.\n\n"
                    "[bold]What this means:[/]\n"
                    "  [dim]>[/] No multi-turn traces were produced.\n"
                    "  [dim]>[/] Any metric with [cyan]requires_multi_turn: true[/] "
                    "(e.g. multi_turn_general_quality) will SKIP every row.\n"
                    "  [dim]>[/] Single-turn metrics will still score interact's output normally.\n\n"
                    "[bold]Common causes:[/]\n"
                    "  [dim]>[/] ADK couldn't import your agent (missing dep / bad PYTHONPATH)\n"
                    "  [dim]>[/] gcloud / Vertex auth expired — try [cyan]agent-eval setup[/]\n"
                    "  [dim]>[/] Project's [cyan]eval_config.json[/] has invalid fields",
                    title="[bold]Simulate failed[/]",
                    border_style="red",
                    padding=(1, 2),
                ))
            if _pauses_disabled():
                console.print(
                    "  [dim]AGENT_EVAL_NO_PAUSES=1 — aborting (default).[/]")
                sys.exit(1)
            from rich.prompt import Confirm
            keep_going = Confirm.ask(
                "  Continue with interact only (single-turn metrics only)?",
                default=False,
            )
            if not keep_going:
                console.print(
                    "  [dim]Aborted. Fix the simulate failure and re-run.[/]")
                sys.exit(1)
            console.print(
                "  [yellow]Continuing with interact only — multi-turn metrics will be skipped.[/]"
            )

    # ── Phase: Interact ────────────────────────────────────────────────────

    if run_interact:
        _phase_header(
            "Interact",
            f"Sending queries from golden dataset to your agent at {base_url}.\n"
            "  Make sure your agent is running before this step.")

        interact_output = _run_interact_phase(
            app_name,
            agent_path,
            questions_file,
            base_url,
            num_questions,
            skip_traces,
            raw_dir,
            str(results_dir),
            debug=debug,
        )

        if interact_output:
            phase_outcomes["Interact"] = "completed"
            interaction_files.append(interact_output)
        else:
            phase_outcomes["Interact"] = "failed"
            from agent_eval.cli._pacing import _pauses_disabled
            console.print()
            console.print(
                Panel(
                    "[bold red]Interact failed.[/]  See the error above for the cause.\n\n"
                    "[bold]What this means:[/]\n"
                    "  [dim]>[/] No single-turn traces were produced from the live agent.\n"
                    "  [dim]>[/] Single-turn metrics will SKIP every row.\n"
                    "  [dim]>[/] If simulate succeeded, multi-turn metrics still have data to score.\n\n"
                    "[bold]Common causes:[/]\n"
                    f"  [dim]>[/] Agent not reachable at [cyan]{base_url}[/] — start it (e.g. [cyan]make playground[/])\n"
                    "  [dim]>[/] Agent returned errors mid-stream — check its logs\n"
                    "  [dim]>[/] gcloud / Vertex auth expired — try [cyan]agent-eval setup[/]",
                    title="[bold]Interact failed[/]",
                    border_style="red",
                    padding=(1, 2),
                ))
            if not interaction_files:
                console.print(
                    "  [red]Nothing to score — simulate also produced no output.[/]"
                )
                sys.exit(1)
            if _pauses_disabled():
                console.print(
                    "  [dim]AGENT_EVAL_NO_PAUSES=1 — continuing with simulate output only.[/]"
                )
            else:
                from rich.prompt import Confirm
                keep_going = Confirm.ask(
                    "  Continue with simulate output only (single-turn metrics will skip)?",
                    default=False,
                )
                if not keep_going:
                    console.print(
                        "  [dim]Aborted. Fix the interact failure and re-run.[/]"
                    )
                    sys.exit(1)
                console.print(
                    "  [yellow]Continuing with simulate output only — single-turn metrics will be skipped.[/]"
                )

    # Tear down the auto-spawned ADK web server (if any) on the happy
    # path. The atexit hook in _start_adk_api_server is the safety net
    # for sys.exit / KeyboardInterrupt / unhandled exceptions; THIS block
    # is the cleaner, more chatty teardown for the normal flow. We use
    # killpg so any uvicorn worker the parent spawned dies with it
    # (start_new_session=True put them in their own process group).
    if auto_started_proc is not None and auto_started_proc.poll() is None:
        # NB: do NOT add `import os` here — it's already module-level at the
        # top of the file. Re-importing inside this branch shadows the global
        # `os` for the ENTIRE `run()` function, which crashes the
        # `os.path.relpath(...)` calls in the post-pipeline banner with
        # UnboundLocalError. signal is fine because it's not used elsewhere.
        import signal
        try:
            try:
                os.killpg(os.getpgid(auto_started_proc.pid), signal.SIGTERM)
            except (ProcessLookupError, PermissionError, OSError):
                auto_started_proc.terminate()
            try:
                auto_started_proc.wait(timeout=5)
            except Exception:
                try:
                    os.killpg(os.getpgid(auto_started_proc.pid), signal.SIGKILL)
                except (ProcessLookupError, PermissionError, OSError):
                    auto_started_proc.kill()
                auto_started_proc.wait(timeout=2)
            try:
                auto_started_proc._agent_eval_log_fp.close(
                )  # type: ignore[attr-defined]
            except Exception:
                pass
            console.print("  [dim]Stopped auto-started ADK web server.[/]")
        except Exception:
            pass

    # ── Phase: Evaluate ────────────────────────────────────────────────────

    if not interaction_files:
        console.print(
            "\n  [red]Error:[/] No interaction files were produced. Nothing to evaluate."
        )
        sys.exit(1)

    if run_evaluate:
        metric_names_preview = ", ".join(p.name for p in metric_paths)
        _phase_header(
            "Evaluate",
            f"Running metrics on {len(interaction_files)} interaction file{'s' if len(interaction_files) != 1 else ''}.\n"
            f"  Metric files: {metric_names_preview}")

        for f in interaction_files:
            console.print(f"    [dim]-[/] {f.name}")

        _run_evaluate_phase(interaction_files,
                            metric_paths,
                            run_dir,
                            run_id,
                            debug=debug)
        phase_outcomes["Evaluate"] = "completed"

        # Stop and ask if any metrics failed before pressing on into Analyze.
        # Analyze runs Gemini over a possibly-incomplete metric table; users
        # should make a deliberate call rather than have it happen silently.
        eval_summary_path = run_dir / "eval_summary.json"
        failed_now: list[dict] = []
        if eval_summary_path.exists():
            try:
                with open(eval_summary_path) as _f:
                    _es = json.load(_f)
                for entry in (_es.get("overall_summary",
                                      {}).get("failed_metrics") or []):
                    if isinstance(entry, dict):
                        failed_now.append(entry)
                    else:
                        failed_now.append({"metric": str(entry)})
            except (OSError, json.JSONDecodeError):
                pass

        if failed_now and run_analyze:
            from agent_eval.cli._pacing import _pauses_disabled
            by_type: dict[str, list[str]] = {}
            for e in failed_now:
                by_type.setdefault(e.get("exception_type") or "Unknown",
                                   []).append(e.get("metric", "?"))
            failure_lines = "\n".join(
                f"  [dim]>[/] [red]{exc_type}[/] in [cyan]{', '.join(names)}[/]"
                for exc_type, names in by_type.items())
            console.print()
            console.print(
                Panel(
                    f"[bold red]{len(failed_now)} metric(s) failed scoring.[/]\n\n"
                    f"{failure_lines}\n\n"
                    "[bold]What this means for analyze:[/]\n"
                    "  [dim]>[/] Gemini will summarize a [bold]partial[/] metrics table — "
                    "failed metrics show as FAILED, not as scores.\n"
                    "  [dim]>[/] Comparisons against past runs may flag those metrics as "
                    "missing rather than regressions.\n\n"
                    "[bold]Common causes:[/]\n"
                    "  [dim]>[/] [cyan]IndexError[/] — column-shape mismatch between sim and "
                    "interact rows (check agents_evaluated, response, intermediate_events).\n"
                    "  [dim]>[/] [cyan]ResourceExhausted[/] — autorater rate limits — try a "
                    "smaller dataset or rerun later.\n"
                    "  [dim]>[/] [cyan]InvalidArgument[/] — metric_definitions.json has a "
                    "schema issue (run `agent-eval init` to re-validate).\n\n"
                    f"[dim]Full exception text in {eval_summary_path.name} → "
                    f"overall_summary.failed_metrics.[/]",
                    title="[bold]Evaluate finished with failures[/]",
                    border_style="red",
                    padding=(1, 2),
                ))
            if _pauses_disabled():
                console.print(
                    "  [dim]AGENT_EVAL_NO_PAUSES=1 — continuing to Analyze (CI default).[/]"
                )
            else:
                from rich.prompt import Confirm
                keep_going = Confirm.ask(
                    "  Continue to Analyze with the partial metrics?",
                    default=False,
                )
                if not keep_going:
                    console.print(
                        f"  [dim]Aborted before Analyze. Results so far: {run_dir}[/]"
                    )
                    sys.exit(1)

    # ── Phase: Analyze ─────────────────────────────────────────────────────

    analysis_result = None
    if run_analyze:
        _phase_header(
            "Analyze",
            "Generating AI-powered analysis, comparison tables, and optimization log."
        )

        # Prompt for focus if not provided via CLI
        if not focus:
            from rich.prompt import Prompt
            console.print(
                Panel(
                    "[bold]Do you want to highlight specific metrics?[/]\n\n"
                    "Enter metric keywords to focus the analysis on (comma-separated).\n"
                    "Matching metrics will be highlighted in the comparison table.\n\n"
                    "Examples: [cyan]latency, cache[/] · [cyan]token, cost[/] · [cyan]tool, quality[/]\n\n"
                    "[dim]Press Enter to skip — all metrics will be weighted equally.[/]",
                    title="[bold]Analysis Focus[/]",
                    border_style="blue",
                    padding=(1, 2),
                ))
            focus_input = Prompt.ask("  Focus", default="").strip()
            if focus_input:
                focus = focus_input

        analysis_result = _run_analyze_phase(
            run_dir,
            agent_path,
            focus,
            skip_gemini,
            debug=debug,
        )
        phase_outcomes["Analyze"] = "completed" if analysis_result else "failed"

    # ── Done ────────────────────────────────────────────────────────────────

    cwd = Path.cwd()
    rel_run = os.path.relpath(run_dir, cwd)
    rel_agent = os.path.relpath(agent_path, cwd)

    console.print()

    # Read evaluation outcomes from eval_summary.json if it exists — surface
    # any failed metrics in the banner so we never again say "Pipeline
    # complete!" when 4 of 5 metrics failed (the 2026-04-23 demo lie).
    eval_summary_path = run_dir / "eval_summary.json"
    failed_metrics_summary: list[dict] = []
    if eval_summary_path.exists():
        try:
            with open(eval_summary_path) as _f:
                _es = json.load(_f)
            raw_failed = _es.get("overall_summary", {}).get(
                "failed_metrics", []) or []
            for entry in raw_failed:
                if isinstance(entry, dict):
                    failed_metrics_summary.append(entry)
                else:
                    failed_metrics_summary.append({"metric": str(entry)})
        except (OSError, json.JSONDecodeError):
            pass

    output_files = [f"  - {f.name}" for f in interaction_files]
    if run_evaluate:
        output_files.append("  - eval_summary.json")
    if analysis_result:
        output_files.append("  - gemini_analysis.md")
        output_files.append("  - question_answer_log.md")
        if analysis_result.get("optimization_log_path"):
            # Show relative-to-cwd so the user can copy/paste. Previously this
            # was relative-to-run_dir (yielded "../OPTIMIZATION_LOG.md" — cryptic).
            rel_log = os.path.relpath(analysis_result["optimization_log_path"],
                                      cwd)
            output_files.append(f"  - {rel_log}")
        if analysis_result.get("html_report_path"):
            output_files.append(
                "  - report.html  [bold cyan](open this — combined view of everything above)[/]"
            )

    comparison_info = ""
    if analysis_result and analysis_result.get("comparison_data"):
        cmp = analysis_result["comparison_data"]
        baseline_label = cmp.get("baseline_run_name") or cmp.get(
            "baseline_id", "previous")
        comparison_info = f"\n[bold]Compared to:[/]  {baseline_label}\n"

    has_phase_failure = any(v == "failed" for v in phase_outcomes.values())
    has_eval_failure = bool(failed_metrics_summary)
    overall_failed = has_phase_failure or has_eval_failure

    # Build per-phase summary line — green check for completed, red X for
    # failed, dim "—" for skipped.
    phase_summary_parts: list[str] = []
    for phase_name, outcome in phase_outcomes.items():
        if outcome == "completed":
            phase_summary_parts.append(f"[green]✓[/] {phase_name}")
        elif outcome == "failed":
            phase_summary_parts.append(f"[red]✗[/] {phase_name}")
        else:
            phase_summary_parts.append(f"[dim]·[/] {phase_name}")
    phase_summary = "  ".join(
        phase_summary_parts) if phase_summary_parts else "(no phases ran)"

    if overall_failed:
        title = "[bold]Done[/] — [red]with errors[/]"
        border = "red"
        headline = "[bold red]Pipeline finished with errors.[/]"
    else:
        title = "[bold]Done[/]"
        border = "green"
        headline = "[bold green]Pipeline complete![/]"

    body_lines = [
        headline,
        f"[bold]Phases:[/]   {phase_summary}",
    ]
    if failed_metrics_summary:
        # Group by exception type for compactness — matches A2's evaluate.py
        # display so the banner echoes what the evaluator already showed.
        by_type: dict[str, list[str]] = {}
        for e in failed_metrics_summary:
            by_type.setdefault(e.get("exception_type") or "Unknown",
                               []).append(e.get("metric", "?"))
        body_lines.append(
            f"[bold]Metrics:[/]  [red]{len(failed_metrics_summary)} failed[/] "
            f"(see eval_summary.json → overall_summary.failed_metrics):")
        for exc_type, names in by_type.items():
            body_lines.append(f"  [red]{exc_type}[/] in {', '.join(names)}")
    if comparison_info.strip():
        body_lines.append(comparison_info.strip())
    body_lines.append(f"[bold]Results:[/]  {rel_run}/")

    # The View phase below handles opening the report — no need to
    # repeat the open-it instructions here. Just announce the report's
    # existence so users scanning the banner know where it is.
    html_path = (analysis_result or
                 {}).get("html_report_path") if analysis_result else None
    if html_path:
        rel_html = os.path.relpath(html_path, cwd)
        body_lines.append("")
        body_lines.append(f"[bold cyan]📊 Report:[/]  [bold]{rel_html}[/]"
                          f"  [dim](opening below)[/]")
        body_lines.append("")
    # Subordinate raw markdown files — still on disk for tooling.
    body_lines.append("[bold]Raw artifacts:[/]")
    for f in output_files:
        if "report.html" not in f:
            body_lines.append(f)

    console.print(
        Panel(
            "\n".join(body_lines),
            title=title,
            border_style=border,
            padding=(1, 2),
        ))

    # ── Phase 5: View ──────────────────────────────────────────────────────
    # Open the HTML report. This is a real terminal phase, not an
    # afterthought — the report IS the deliverable of the run. We:
    #  1. Try webbrowser.open (works on local dev with a display)
    #  2. If that fails (remote box, no display) → offer to spawn the
    #     localhost http.server right here so the user doesn't have to
    #     leave the run shell and type a separate command
    #  3. Either way, finish with copy-paste commands for opening later
    if html_path and "View" in phases:
        _phase_header(
            "View", "Opening your report. The HTML has tabs for Overview, "
            "Per-Question, Iteration History, and AI Analysis.")
        _open_report_in_run(
            html_path=Path(html_path),
            run_dir=run_dir,
            cwd=cwd,
        )
        phase_outcomes["View"] = "completed"

    if not run_evaluate:
        rel_files = " \\\n  ".join(
            f"--interaction-file {os.path.relpath(f, cwd)}"
            for f in interaction_files)
        rel_metrics = " \\\n  ".join(
            f"--metrics-files {os.path.relpath(p, cwd)}"
            for p in metric_paths) if metric_paths else "--metrics-files <path>"
        console.print()
        console.print("[bold]Next step — run evaluation:[/]")
        console.print()
        console.print("agent-eval evaluate \\")
        console.print(f"  {rel_files} \\")
        console.print(f"  {rel_metrics} \\")
        console.print(f"  --results-dir {rel_run}")
        console.print()
    elif not run_analyze:
        console.print()
        console.print("[bold]Next step — generate analysis:[/]")
        console.print()
        console.print("agent-eval analyze \\")
        console.print(f"  --results-dir {rel_run} \\")
        console.print(f"  --agent-dir {rel_agent}")
        console.print()

    # ── Phase 5: Dashboard (optional) ──────────────────────────────────────

    if run_evaluate and run_dashboard is not False:
        _offer_dashboard(results_dir, run_dashboard)


def _offer_dashboard(results_dir: Path, run_dashboard: bool | None) -> None:
    """Offer to launch the interactive dashboard after the pipeline completes."""
    try:
        import gradio  # noqa: F401
    except ImportError:
        if run_dashboard is True:
            # User explicitly asked for --dashboard but gradio is missing
            console.print()
            console.print(
                "  [yellow]Dashboard requires optional dependencies.[/]")
            console.print(
                "  Install them with:  [cyan]pip install agent-eval\\[dashboard][/]"
            )
            console.print()
        else:
            # Not installed and not explicitly requested — just show a tip
            console.print(
                "  [dim]Tip: Install dashboard extras for interactive visualization:[/]"
            )
            console.print("    [cyan]pip install agent-eval\\[dashboard][/]")
            console.print()
        return

    # Gradio is available — decide whether to launch
    if run_dashboard is True:
        should_launch = True
    elif run_dashboard is False:
        return
    else:
        # run_dashboard is None — prompt the user
        from rich.prompt import Confirm
        console.print()
        should_launch = Confirm.ask(
            "  Launch the interactive dashboard to compare all runs?",
            default=False,
        )

    if should_launch:
        # Dashboard is an OPTIONAL post-pipeline bonus, not part of the
        # numbered `phases` list. Don't fake it as "Phase N/N" — that
        # double-counted with the View phase (both rendered as "Phase 5"
        # when --dashboard was on alongside Analyze).
        console.print()
        console.print(Rule("  Bonus: Dashboard  ", style="bold cyan"))
        console.print(
            "  [dim]Starting interactive dashboard with all evaluation runs.[/]"
        )
        console.print()

        from agent_eval.dashboard.app import launch
        launch(str(results_dir), port=7860, share=False)


# ── Phase implementations ─────────────────────────────────────────────────
# Extracted to keep the main function readable. These do NOT use simulate.py's
# _step_* functions directly (which print their own "Step X/5" headers) —
# instead they call the underlying logic with consistent formatting.

_UV_RUN_ADK = ["uv", "run", "--with", "google-adk[eval]"]


def _clean_env(project_root: Path) -> dict:
    """Lazily proxy to simulate.py's env scrubber so we don't double-import."""
    from agent_eval.cli.commands.simulate import _clean_env as _impl
    return _impl(project_root)


class _nullctx:
    """No-op context manager for the debug-mode branch (no spinner)."""

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False


def _split_scenarios_into_evalsets(
    agent_path: Path,
    project_root: Path,
    run_id: str,
) -> list[tuple[str, Path]]:
    """Split the projected `conversation_scenarios.json` into one tiny
    scenarios file per scenario, each tied to its own eval_set name.

    Returns a list of ``(eval_set_name, scenarios_file_path)`` tuples ready
    to feed into ``adk eval_set add_eval_case`` + ``adk eval``. Names are
    suffixed with the user's run_id so concurrent runs from different shells
    can't trip on each other.
    """
    full = json.loads((agent_path / "conversation_scenarios.json").read_text())
    scenarios = full.get("scenarios") or []
    out: list[tuple[str, Path]] = []
    safe_run_id = "".join(c if c.isalnum() else "_" for c in run_id)[:32]
    for i, scen in enumerate(scenarios):
        eval_set_name = f"eval_set_{safe_run_id}_{i:03d}"
        scen_file = project_root / ".agent_eval_tmp" / f"{eval_set_name}.scenarios.json"
        scen_file.parent.mkdir(parents=True, exist_ok=True)
        scen_file.write_text(json.dumps({"scenarios": [scen]}, indent=2) + "\n")
        out.append((eval_set_name, scen_file))
    return out


def _create_and_load_evalset(
    agent_name: str,
    project_root: Path,
    eval_set_name: str,
    scenarios_file: Path,
    session_file: Path,
) -> tuple[bool, str]:
    """Create one eval_set and load one scenario into it. Returns
    ``(ok, error_text)``. Sequential and fast — pure metadata."""
    import subprocess
    env = _clean_env(project_root)

    # Wipe any prior eval_set with this name (defensive — re-runs).
    evalset_file = project_root / agent_name / f"{eval_set_name}.evalset.json"
    if evalset_file.exists():
        evalset_file.unlink()

    create = subprocess.run(
        [*_UV_RUN_ADK, "adk", "eval_set", "create", agent_name, eval_set_name],
        cwd=str(project_root),
        env=env,
        capture_output=True,
        text=True,
    )
    if create.returncode != 0:
        return False, f"create failed: {create.stderr.strip()}"

    add = subprocess.run(
        [
            *_UV_RUN_ADK,
            "adk",
            "eval_set",
            "add_eval_case",
            agent_name,
            eval_set_name,
            "--scenarios_file",
            str(scenarios_file),
            "--session_input_file",
            str(session_file),
        ],
        cwd=str(project_root),
        env=env,
        capture_output=True,
        text=True,
    )
    if add.returncode != 0:
        return False, f"add_eval_case failed: {add.stderr.strip()}"
    return True, ""


def _run_one_adk_eval(
    agent_name: str,
    agent_path: Path,
    project_root: Path,
    eval_set_name: str,
    eval_config: Path,
    log_path: Path | None,
) -> tuple[str, int, str, float]:
    """Run a single `adk eval` subprocess.

    Returns ``(eval_set_name, returncode, stderr_tail, elapsed_seconds)``.
    Elapsed seconds is wall-clock for THIS scenario — useful for the
    end-of-phase per-scenario timing breakdown so the user sees the
    distribution and understands why parallel hit Amdahl's law.

    Output is streamed line-by-line into ``log_path`` (if given) so users
    can ``tail -f`` it WHILE the run is in flight — vs the previous
    behavior of buffering everything until subprocess exit (which made the
    parallel sim look frozen). Always written, parallel-safe by virtue of
    one log file per scenario.
    """
    import subprocess
    import time
    cmd = [*_UV_RUN_ADK, "adk", "eval", agent_name]
    if eval_config.exists():
        cmd += ["--config_file_path", str(eval_config)]
    cmd.append(eval_set_name)

    started = time.time()
    if log_path is not None:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        # Open the file ONCE and stream both stdout+stderr into it. Line-
        # buffered so `tail -f` shows progress in real time.
        with open(log_path, "w", buffering=1) as fp:
            fp.write(f"$ {' '.join(cmd)}\n\n")
            fp.flush()
            proc = subprocess.run(
                cmd,
                cwd=str(project_root),
                env=_clean_env(project_root),
                stdout=fp,
                stderr=subprocess.STDOUT,
                text=True,
            )
        elapsed = time.time() - started
        try:
            tail = "\n".join(log_path.read_text().strip().split("\n")[-3:])
        except OSError:
            tail = ""
        return eval_set_name, proc.returncode, tail, elapsed

    proc = subprocess.run(
        cmd,
        cwd=str(project_root),
        env=_clean_env(project_root),
        capture_output=True,
        text=True,
    )
    elapsed = time.time() - started
    stderr_tail = "\n".join((proc.stderr or "").strip().split("\n")[-3:])
    return eval_set_name, proc.returncode, stderr_tail, elapsed


def _cleanup_sim_aux_files(
    agent_path: Path,
    project_root: Path,
    evalsets: list[tuple[str, Path]],
) -> int:
    """Remove the per-scenario aux files we generated for this sim run.

    ADK's `adk eval_set add_eval_case` writes `<eval_set>.evalset.json`
    next to agent.py — those accumulate across runs and clutter the agent
    dir (10 files after 4 runs in the crwd-legal-discovery walkthrough).
    Plus our own `.agent_eval_tmp/` scratch dir. Both are transient: ADK
    consumes the evalset.json during eval, then it's dead weight.

    Returns the count of files cleaned.
    """
    cleaned = 0
    # ADK-generated evalset.json next to agent.py — one per eval_set.
    for name, _ in evalsets:
        f = agent_path / f"{name}.evalset.json"
        if f.exists():
            try:
                f.unlink()
                cleaned += 1
            except OSError:
                pass
    # Our own per-run scratch — scenarios files we wrote to feed
    # `adk eval_set add_eval_case`.
    for _, scen_file in evalsets:
        if scen_file.exists():
            try:
                scen_file.unlink()
                cleaned += 1
            except OSError:
                pass
    # If .agent_eval_tmp/ is now empty, clean it up too.
    tmp_dir = project_root / ".agent_eval_tmp"
    if tmp_dir.is_dir() and not any(tmp_dir.iterdir()):
        try:
            tmp_dir.rmdir()
        except OSError:
            pass
    return cleaned


def _start_adk_api_server(agent_path: Path, project_root: Path,
                          port: int) -> "subprocess.Popen":
    """Spawn `adk web <project_root> --port <port>` in the background.

    Matches what `make playground` does in Agent Starter Pack projects
    (`uv run adk web . --port 8500 --reload_agents`). `adk web` and
    `adk api_server` expose the same FastAPI endpoints; `adk web` also
    serves a UI which is a useful side benefit when debugging — the user
    can open the URL in a browser. Stdout+stderr stream into a temp log
    so we can show the user where to peek if startup hangs. Returns the
    Popen so the caller can terminate it after interact completes.

    Note: project_root, not agent_path.parent — `adk web` walks subdirs
    looking for `agent.py`. Same effective behavior since agent.py lives
    at `<project_root>/<agent_dir>/agent.py`.

    Lifecycle: registers an atexit hook AND its own process group so the
    subprocess gets killed no matter how this Python exits — sys.exit,
    KeyboardInterrupt, uncaught exception. The explicit terminate() in
    the interact-phase teardown is the happy path; this is the safety
    net so we don't leak a `adk web` listening on a port between runs.
    """
    import atexit
    import os
    import signal
    import subprocess
    log = project_root / ".agent_eval_tmp" / f"adk_web_{port}.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    fp = open(log, "w", buffering=1)
    fp.write(f"$ adk web {project_root} --port {port}\n\n")
    fp.flush()
    # start_new_session=True puts the subprocess in its own process group.
    # Lets us killpg() the whole tree (including any uvicorn workers it
    # spawns) without sending the same signal to OUR process.
    proc = subprocess.Popen(
        [
            *_UV_RUN_ADK, "adk", "web",
            str(project_root), "--host", "127.0.0.1", "--port",
            str(port)
        ],
        cwd=str(project_root),
        env=_clean_env(project_root),
        stdout=fp,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    proc._agent_eval_log = log  # type: ignore[attr-defined]
    proc._agent_eval_log_fp = fp  # type: ignore[attr-defined]

    def _atexit_kill() -> None:
        if proc.poll() is not None:
            return  # already exited
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            try:
                proc.wait(timeout=3)
            except Exception:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except (ProcessLookupError, PermissionError, OSError):
            pass
        try:
            fp.close()
        except Exception:
            pass

    atexit.register(_atexit_kill)
    proc._agent_eval_atexit = _atexit_kill  # type: ignore[attr-defined]
    return proc


def _wait_for_url_ready(url: str,
                        timeout_s: float = 60.0,
                        interval: float = 0.5) -> bool:
    """Poll a URL until it returns ANY HTTP response (incl. 404).

    ADK's `adk api_server` has no `/` route — it serves `/list-apps`,
    `/run`, etc. — so probing `/` returns 404. urllib.request.urlopen
    raises HTTPError on 4xx; treat that as "server is alive and answering"
    rather than "not ready". We're checking *reachability* of the FastAPI
    process, not the existence of any specific route. Connection refusals
    (server not yet listening) still loop.
    """
    import time
    import urllib.error
    import urllib.request
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1.5)
            return True
        except urllib.error.HTTPError:
            # 4xx/5xx → server IS up, just no handler at this path. Done.
            return True
        except Exception:
            time.sleep(interval)
    return False


def _pick_free_port(preferred: int = 8501) -> int:
    """Try the preferred port first; if taken, ask the OS for any free one."""
    import socket
    for candidate in (preferred, 0):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(("127.0.0.1", candidate))
            port = s.getsockname()[1]
            s.close()
            return port
        except OSError:
            s.close()
            continue
    return preferred  # fallback — let the spawn fail loudly if it must


def _prewarm_uv_resolver(project_root: Path) -> None:
    """Warm uv's dep cache before fanning out N parallel subprocesses.

    Without this, 3 simultaneous `uv run --with google-adk[eval]` calls hit
    uv's lockfile concurrently — one wins, the others block on the lock for
    minutes. Looks identical to a hung subprocess (no stdout, no exit).
    A single short-lived prewarm run resolves the env once; subsequent
    parallel calls find a warm cache and start instantly.
    """
    import subprocess
    subprocess.run(
        [*_UV_RUN_ADK, "adk", "--help"],
        cwd=str(project_root),
        env=_clean_env(project_root),
        capture_output=True,
        text=True,
        timeout=120,
    )


def _run_simulate_phase(
    agent_name: str,
    agent_path: Path,
    project_root: Path,
    raw_dir: Path,
    debug: bool = False,
    max_parallel: int = _DEFAULT_SIM_PARALLELISM,
) -> bool:
    """Run the simulate workflow. Returns True on success.

    Parallelization: ADK's `adk eval` runs scenarios sequentially within an
    eval_set. We split N scenarios into N eval_sets and fire N subprocesses
    in parallel (capped by ``max_parallel`` to limit Vertex AI quota
    pressure). Eval_history files are timestamp-suffixed → no collisions.
    """
    import shutil
    import time
    from concurrent.futures import ThreadPoolExecutor, as_completed

    from agent_eval.cli.commands.simulate import _project_dataset_to_adk_files
    from agent_eval.core.converters import AdkHistoryConverter, write_jsonl

    # Resolve run_id from raw_dir for unique eval_set naming.
    run_id_for_evalset = raw_dir.parent.name

    # 1. Project the unified dataset into ADK's required files (scenarios,
    # session_input, eval_config). Single source of truth = tests/eval/dataset.jsonl.
    console.print(
        "  [bold]1.[/] Staging ADK files from tests/eval/dataset.jsonl...")
    n_scenarios, source = _project_dataset_to_adk_files(agent_path,
                                                        project_root)
    if source != "dataset.jsonl":
        console.print(f"     [red]Could not project scenarios: {source}[/]")
        return False

    # 2. Clear eval history + stale .agent_eval_tmp/ scratch from prior runs.
    # The eval_history is critical (mixed traces would corrupt this run's
    # metrics). The .agent_eval_tmp/ aux files are just clutter — but
    # without this, broken/aborted runs leave behind eval_set_*.scenarios.json
    # files indefinitely.
    console.print("  [bold]2.[/] Clearing previous eval history...")
    eval_history = agent_path / ".adk" / "eval_history"
    cleared_history = 0
    if eval_history.exists():
        cleared_history = sum(1 for _ in eval_history.rglob("*") if _.is_file())
        shutil.rmtree(eval_history)

    cleared_tmp = 0
    tmp_dir = project_root / ".agent_eval_tmp"
    if tmp_dir.is_dir():
        for stale in tmp_dir.glob("eval_set_*.scenarios.json"):
            try:
                stale.unlink()
                cleared_tmp += 1
            except OSError:
                pass
        # Old api_server logs from past runs — keep only the most recent.
        for stale in tmp_dir.glob("adk_*server*.log"):
            try:
                stale.unlink()
                cleared_tmp += 1
            except OSError:
                pass

    if cleared_history or cleared_tmp:
        bits = []
        if cleared_history:
            bits.append(
                f"{cleared_history} eval_history file{'s' if cleared_history != 1 else ''}"
            )
        if cleared_tmp:
            bits.append(
                f"{cleared_tmp} stale .agent_eval_tmp file{'s' if cleared_tmp != 1 else ''}"
            )
        console.print(f"     [green]+[/] Cleared {' + '.join(bits)}")
    else:
        console.print("     [dim]Nothing to clear.[/]")

    # 3. Create one eval_set per scenario (so we can parallelize step 4).
    console.print(
        f"  [bold]3.[/] Splitting {n_scenarios} scenario{'s' if n_scenarios != 1 else ''} into eval_sets..."
    )
    evalsets = _split_scenarios_into_evalsets(agent_path, project_root,
                                              run_id_for_evalset)
    session_file = agent_path / "session_input.json"
    for name, scen_file in evalsets:
        ok, err = _create_and_load_evalset(agent_name, project_root, name,
                                           scen_file, session_file)
        if not ok:
            console.print(f"     [red]Failed to set up {name}:[/] {err}")
            return False
    console.print(
        f"     [green]+[/] Created {len(evalsets)} eval_set{'s' if len(evalsets) != 1 else ''}"
    )

    # 4. Run ADK User Sim — parallel across eval_sets.
    # --debug forces serial because parallel mode buffers per-subprocess
    # output to log files (otherwise 3 ADK processes would interleave
    # stdout into garbage). Debugging UX expects live streaming, so we
    # demote to serial and stream this one subprocess's output to terminal.
    if debug and max_parallel > 1:
        console.print(
            f"     [yellow]![/] [dim]--debug forces serial sim (live ADK output). "
            f"Drop --debug to use {max_parallel}-way parallel.[/]")
        max_parallel = 1
    actual_parallel = min(len(evalsets), max(1, max_parallel))
    parallel_note = (f"in parallel (cap {actual_parallel})"
                     if actual_parallel > 1 else "sequentially")
    console.print(
        f"  [bold]4.[/] Running ADK User Sim — {len(evalsets)} scenario(s) {parallel_note}..."
    )
    console.print(
        "     [dim]An LLM simulates users following your scenario scripts.[/]")
    if actual_parallel > 1:
        console.print(
            "     [dim]Wall-clock = the slowest single scenario "
            "(parallel can't shortcut a heavy one — Amdahl's law).[/]")
    console.print()

    eval_config = agent_path / "eval_config.json"
    sim_logs_dir = raw_dir / "sim_logs"
    failures: list[tuple[str, int, str]] = []

    # Pre-warm uv's dep cache — without this, N parallel `uv run --with
    # google-adk[eval]` calls fight over the lockfile (one resolves, others
    # block on the lock for minutes — looks identical to a hung subprocess).
    if actual_parallel > 1:
        with console.status("     [dim]Warming uv resolver (one-time)...[/]",
                            spinner="dots"):
            _prewarm_uv_resolver(project_root)

    if actual_parallel > 1:
        try:
            rel_logs = sim_logs_dir.relative_to(project_root)
        except ValueError:
            rel_logs = sim_logs_dir
        console.print(
            f"     [dim]Per-scenario logs stream live to[/] [cyan]{rel_logs}/[/]"
            f"  [dim](tail -f any of them to follow)[/]")
        console.print()

    started = time.time()

    per_scenario_elapsed: dict[str, float] = {}
    if actual_parallel == 1 and debug:
        # Single scenario, debug → stream live to terminal (legacy behavior).
        import subprocess
        for name, _ in evalsets:
            console.print(f"     [dim]» {name} (live):[/]")
            cmd = [*_UV_RUN_ADK, "adk", "eval", agent_name]
            if eval_config.exists():
                cmd += ["--config_file_path", str(eval_config)]
            cmd.append(name)
            scen_started = time.time()
            proc = subprocess.run(
                cmd,
                cwd=str(project_root),
                env=_clean_env(project_root),
                text=True,
            )
            per_scenario_elapsed[name] = time.time() - scen_started
            if proc.returncode != 0:
                failures.append((name, proc.returncode, ""))
    else:
        # Long blocking wait — start a background storyteller that prints
        # essays paragraph-by-paragraph at reading pace. Reads like an
        # article unfolding rather than a static spinner. Stops cleanly
        # when the phase completes. Skipped in --debug (you want logs).
        # We DROP the console.status spinner here too — the storyteller
        # provides the "something is happening" signal, and a status
        # spinner would fight the streaming console.print calls for the
        # bottom line.
        storyteller = _start_storyteller() if not debug else None
        ctx = _nullctx()
        try:
            with ctx:
                with ThreadPoolExecutor(max_workers=actual_parallel) as pool:
                    futures = {
                        pool.submit(
                            _run_one_adk_eval,
                            agent_name,
                            agent_path,
                            project_root,
                            name,
                            eval_config,
                            sim_logs_dir / f"{name}.log",
                        ):
                            name for name, _ in evalsets
                    }
                    for fut in as_completed(futures):
                        name, rc, tail, elapsed = fut.result()
                        per_scenario_elapsed[name] = elapsed
                        if rc != 0:
                            failures.append((name, rc, tail))
        finally:
            # Stop the storyteller cleanly so it doesn't keep printing
            # after sim completes (or after Ctrl+C unwinds). Idempotent
            # via internal Event check.
            if storyteller is not None:
                storyteller.stop()

    elapsed = time.time() - started
    mins, secs = divmod(int(elapsed), 60)
    elapsed_str = f"{mins}m {secs}s" if mins else f"{secs}s"

    eval_history = agent_path / ".adk" / "eval_history"
    has_traces = eval_history.exists() and any(eval_history.rglob("*.json"))
    n_traces = sum(1 for _ in eval_history.rglob("*.json")) if has_traces else 0

    console.print()
    if failures and not has_traces:
        console.print(
            "     [red]ADK eval failed across all scenarios — no traces generated.[/]"
        )
        for name, rc, tail in failures[:3]:
            console.print(f"     [dim]{name} (rc={rc}): {tail}[/]")
        return False
    if failures:
        console.print(
            f"     [yellow]![/] {len(failures)}/{len(evalsets)} scenario(s) returned non-zero "
            f"(traces still captured for {n_traces}).")
        for name, rc, _ in failures[:3]:
            console.print(
                f"     [dim]Failed: {name} (rc={rc}) — see sim_logs/ if --debug[/]"
            )
    console.print(
        f"     [dim]Wall-clock: {elapsed_str} for {len(evalsets)} scenario(s) "
        f"× {actual_parallel}-way parallel[/]")

    # Per-scenario timing breakdown — makes Amdahl's law visible. If one
    # scenario dominates (e.g. 7m vs 2m vs 4m), the user sees that parallel
    # can't help further without splitting that one scenario.
    if per_scenario_elapsed and actual_parallel > 1:
        sorted_times = sorted(per_scenario_elapsed.items(), key=lambda x: -x[1])
        slowest_name, slowest = sorted_times[0]
        fastest_name, fastest = sorted_times[-1]
        serial_total = sum(per_scenario_elapsed.values())
        speedup = serial_total / max(elapsed, 0.1)
        console.print(
            f"     [dim]Per-scenario: slowest {slowest_name} took {int(slowest)}s, "
            f"fastest {fastest_name} took {int(fastest)}s. "
            f"Serial would have been ~{int(serial_total)}s → speedup {speedup:.1f}×.[/]"
        )

    # Clean up the per-scenario aux files (eval_set_*.evalset.json + temp
    # scenarios files). ADK consumes them during `adk eval`; they're dead
    # weight after. Without this, the agent dir accumulates 3+ files per
    # sim run (e.g. 10 files after 4 runs in the crwd-legal-discovery test).
    n_cleaned = _cleanup_sim_aux_files(agent_path, project_root, evalsets)
    if n_cleaned:
        console.print(
            f"     [dim]Cleaned up {n_cleaned} transient eval_set file(s) from {agent_path.name}/[/]"
        )

    # Reset `result` shape for the rest of the function (legacy returncode/has_traces gate).
    class _LegacyResult:
        returncode = 1 if failures else 0
        stderr = ""

    result = _LegacyResult()

    eval_history = agent_path / ".adk" / "eval_history"
    has_traces = eval_history.exists() and any(eval_history.rglob("*.json"))

    if result.returncode != 0 and not has_traces:
        console.print("     [red]ADK eval failed — no traces generated.[/]")
        if result.stderr.strip():
            # Show last few lines of error for debugging
            last_lines = result.stderr.strip().split("\n")[-3:]
            for line in last_lines:
                console.print(f"     [dim]{line}[/]")
        return False
    if result.returncode != 0 and has_traces:
        console.print(
            "     [yellow]![/] ADK eval exited non-zero, but trace files were captured."
        )
        console.print(
            "     [dim]Use --debug to see ADK's full stderr (deprecation/EXPERIMENTAL warnings, "
            "missing scoring criteria, etc).[/]")

    if has_traces:
        n_traces = sum(1 for _ in eval_history.rglob("*.json"))
        # Compare against scenarios projected from dataset.jsonl. Silent loss
        # of rows (e.g. ADK timed out on one) used to slip past the user
        # because the next phase printed a count without a baseline.
        try:
            scen = json.loads(
                (agent_path / "conversation_scenarios.json").read_text())
            n_expected = len(scen.get("scenarios") or [])
        except (OSError, json.JSONDecodeError):
            n_expected = None

        if n_expected is not None and n_traces < n_expected:
            lost = n_expected - n_traces
            console.print(
                f"     [yellow]![/] [bold]Sim returned {n_traces}/{n_expected} traces[/] "
                f"— {lost} row{'s' if lost != 1 else ''} lost (likely timeout / sim error)."
            )
            console.print(
                "     [dim]Re-run with --debug to see which scenario(s) failed; "
                "those rows won't score multi-turn metrics this run.[/]")
        else:
            console.print(
                f"     [green]+[/] Simulation complete — {n_traces} trace file{'s' if n_traces != 1 else ''} generated"
            )

    # 5. Convert traces — pass a prompt→reference_data map so multi-turn rows
    # that carry reference_data flow that data through to the saved
    # interaction row. ADK auto-assigns its own eval_id (random hex) so the
    # converter can't join by id; it joins by starting_prompt instead, which
    # IS preserved verbatim as the trace's first user message.
    console.print()
    console.print("  [bold]5.[/] Converting traces to evaluation format...")
    try:
        from agent_eval.core.dataset_io import read_dataset
        prompt_to_ref: dict[str, dict] = {}
        try:
            for r in read_dataset(project_root / "tests" / "eval" /
                                  "dataset.jsonl"):
                ref = r.get("reference_data")
                p = r.get("prompt")
                if isinstance(ref, dict) and ref and p:
                    prompt_to_ref[p] = ref
        except Exception:
            pass  # converter still works without it; metrics requiring ref will skip
        converter = AdkHistoryConverter(str(agent_path),
                                        None,
                                        prompt_to_reference=prompt_to_ref)
        records = converter.run()
        if not records:
            console.print("     [yellow]![/] No traces found to convert.")
            return False

        sim_output = raw_dir / "processed_interaction_sim.jsonl"
        write_jsonl(records, str(sim_output))
        console.print(
            f"     [green]+[/] Converted [cyan]{len(records)}[/] simulation interaction{'s' if len(records) != 1 else ''}"
        )
        return True

    except Exception as e:
        console.print(f"     [red]Error converting traces:[/] {e}")
        return False


def _run_interact_phase(
    app_name: str,
    agent_path: Path,
    questions_file: str,
    base_url: str,
    num_questions: int,
    skip_traces: bool,
    raw_dir: Path,
    results_dir: str,
    debug: bool = False,
) -> Path | None:
    """Run the interact workflow. Returns the output path on success, None on failure."""
    import asyncio
    from agent_eval.core.interactions import InteractionRunner
    from agent_eval.core.processor import InteractionProcessor
    from agent_eval.core.converters import write_jsonl

    config = {
        "app_name": app_name,
        "questions_file": questions_file,
        "base_url": base_url,
        "user_id": "eval_user",
        "num_questions": num_questions,
        "results_dir": results_dir,
        "runs": 1,
        "metadata_filters": None,
        "state_variables": None,
        "skip_traces": skip_traces,
        "user": os.environ.get("USER"),
    }

    runner = InteractionRunner(config)

    # Pre-count single-turn rows so the spinner reports accurate totals.
    # Read the file directly — calling get_golden_questions here would log
    # "skipping N multi-turn rows" twice (once here, once inside runner.run()).
    _q_count = 0
    try:
        qf = Path(questions_file)
        if qf.suffix.lower() == ".jsonl":
            from agent_eval.core.dataset_io import read_dataset, is_single_turn
            _q_count = sum(1 for r in read_dataset(qf) if is_single_turn(r))
        else:
            with open(qf) as _f:
                _data = json.load(_f)
            _q_count = len(
                _data.get("questions") or _data.get("golden_questions") or [])
        if num_questions and num_questions != -1:
            _q_count = min(_q_count, num_questions)
    except Exception:
        _q_count = 0

    try:
        if _q_count:
            # Background storyteller during the (potentially long) parallel
            # agent query wave. We drop console.status here too — the
            # streamer is the activity signal and they'd fight for the
            # bottom line. Skipped in --debug.
            interact_storyteller = _start_storyteller() if not debug else None
            console.print(
                f"    [dim]Querying agent — {_q_count} question"
                f"{'s' if _q_count != 1 else ''} in flight (parallel)...[/]")
            try:
                raw_df = asyncio.run(runner.run())
            finally:
                if interact_storyteller is not None:
                    interact_storyteller.stop()
        else:
            raw_df = asyncio.run(runner.run())
    except Exception as e:
        console.print(f"    [red]Error during interactions:[/] {e}")
        console.print(
            f"    [dim]Make sure your agent is running at {base_url}[/]")
        return None

    if raw_df is None or raw_df.empty:
        console.print("    [yellow]![/] No interactions were captured.")
        return None

    console.print(
        f"    [green]+[/] Captured [cyan]{len(raw_df)}[/] interaction{'s' if len(raw_df) != 1 else ''}"
    )

    processor = InteractionProcessor(config)
    try:
        with console.status(
                "    [bold blue]Processing and enriching traces[/] — pulling tool calls, "
                "thinking tokens, latency...",
                spinner="dots",
        ):
            enriched_df = asyncio.run(processor.process(raw_df))
    except Exception as e:
        console.print(f"    [red]Error during processing:[/] {e}")
        return None

    interact_output = raw_dir / f"processed_interaction_{app_name}.jsonl"

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

    write_jsonl(records, str(interact_output))
    try:
        rel_out = interact_output.relative_to(Path.cwd())
    except ValueError:
        rel_out = interact_output
    console.print(
        f"    [green]+[/] Saved [cyan]{len(records)}[/] enriched interaction"
        f"{'s' if len(records) != 1 else ''} → [dim]{rel_out}[/]")
    return interact_output


def _run_evaluate_phase(
    interaction_files: list[Path],
    metric_paths: list[Path],
    run_dir: Path,
    run_id: str,
    debug: bool = False,
) -> None:
    """Run the evaluate workflow."""
    from agent_eval.core.evaluator import Evaluator
    from agent_eval.cli.commands.evaluate import _display_metrics_summary

    eval_config = {
        "metric_filters": None,
        "input_label": "run",
        "test_description": f"Combined evaluation run: {run_id}",
    }

    evaluator = Evaluator(eval_config)
    try:
        evaluator.evaluate(
            interaction_files=interaction_files,
            metrics_files=[str(p) for p in metric_paths],
            results_dir=run_dir,
        )
        _display_metrics_summary(str(run_dir))

    except Exception as e:
        import traceback
        traceback.print_exc()
        console.print(f"\n  [red]Evaluation error:[/] {e}")
        console.print(
            "  [dim]Interaction files were saved. You can re-run evaluate manually.[/]"
        )


def _run_analyze_phase(
    run_dir: Path,
    agent_path: Path,
    focus: str = None,
    skip_gemini: bool = False,
    debug: bool = False,
) -> dict:
    """Run the analyze workflow. Returns the analysis result dict or None."""
    from agent_eval.core.analyzer import Analyzer
    from agent_eval.cli.commands.analyze import _display_metrics_table

    config = {
        "results_dir": str(run_dir),
        "agent_dir": str(agent_path),
        "focus": focus,
        "skip_gemini": skip_gemini,
        "model": "gemini-3.1-pro-preview",
    }

    analyzer = Analyzer(config)

    try:
        analysis_result = analyzer.run()
    except Exception as e:
        console.print(f"\n  [red]Analysis error:[/] {e}")
        console.print(
            "  [dim]Evaluation results were saved. You can run analyze manually.[/]"
        )
        return None

    # Display metrics table
    if analysis_result and analysis_result.get("current_summary"):
        _display_metrics_table(
            analysis_result["current_summary"],
            analysis_result.get("comparison_data"),
            focus,
            results_dir=str(run_dir),
        )

    # The AI analysis used to dump 80-200 lines of dense Gemini prose to
    # the terminal here. With the HTML report now generated alongside,
    # the terminal dump is overwhelming + redundant — the HTML has the
    # same content with charts, heatmap, and per-question accordion. The
    # final banner below tells the user where to open it.
    return analysis_result
