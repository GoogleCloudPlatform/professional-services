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
"""agent-eval report — open the latest HTML report in a browser.

Two modes, depending on where you're running:

- **Local dev**: ``agent-eval report`` opens the HTML in your default
  browser via ``webbrowser.open(file://...)``. Done.

- **Remote dev box** (Cloud Workstation, dev VM, SSH session): no display
  for ``webbrowser.open``. Run ``agent-eval report --serve`` instead — it
  starts a tiny ``http.server`` on a free localhost port and prints the
  URL. SSH-tunnel with ``-L PORT:localhost:PORT`` (or use Cloud
  Workstation's "Web preview" button) to view from your laptop.

Auto-detects the most recent run under ``tests/eval/results/`` so you
don't need to remember the run ID. Override with ``--run-id``.
"""
from __future__ import annotations

import os
import sys
import webbrowser
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel

from agent_eval.cli._pacing import _pauses_disabled

console = Console()


def _find_latest_report(results_dir: Path) -> Optional[Path]:
    """Walk results_dir/*/report.html, return the most recently modified."""
    if not results_dir.is_dir():
        return None
    candidates = list(results_dir.glob("*/report.html"))
    if not candidates:
        return None
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def _resolve_results_dir(explicit: Optional[str]) -> Optional[Path]:
    """Default: <project_root>/tests/eval/results/. Override with --results-dir."""
    if explicit:
        p = Path(explicit).resolve()
        return p if p.is_dir() else None
    # Walk up from cwd looking for a tests/eval/results/ dir.
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        candidate = parent / "tests" / "eval" / "results"
        if candidate.is_dir():
            return candidate
    return None


def _serve(report: Path, port_hint: int = 0) -> None:
    """Start a localhost http.server rooted at the report's run dir
    so all relative assets resolve. Blocks until Ctrl+C.

    port_hint=0 → OS picks a free port. Otherwise we try the hint first.
    """
    import http.server
    import socketserver

    serve_dir = report.parent
    rel_to_serve_root = report.name  # always 'report.html'

    handler_cls = http.server.SimpleHTTPRequestHandler

    # Quiet logging — http.server logs every request to stderr by default.
    class _QuietHandler(handler_cls):

        def log_message(self, *args, **kwargs):
            pass

    # Pick a port: try the hint, then bump to OS-assigned if taken.
    port = port_hint
    httpd = None
    for attempt_port in (port_hint, 0) if port_hint else (0,):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", attempt_port),
                                           _QuietHandler)
            port = httpd.server_address[1]
            break
        except OSError:
            continue
    if httpd is None:
        console.print("  [red]Could not bind to a port.[/]")
        sys.exit(1)

    # Re-root the handler at serve_dir.
    os.chdir(serve_dir)

    url = f"http://127.0.0.1:{port}/{rel_to_serve_root}"
    console.print()
    console.print(
        Panel(
            f"[bold]Serving:[/] {report}\n"
            f"[bold]URL:[/]     [cyan]{url}[/]\n\n"
            f"[dim]Local browser:[/] open the URL above\n"
            f"[dim]SSH tunnel:[/]    [cyan]ssh -L {port}:localhost:{port} <host>[/]\n"
            f"[dim]Cloud Workstation:[/] use the [bold]Web Preview[/] button → "
            f"change port to [cyan]{port}[/]\n\n"
            f"[bold]Ctrl+C[/] to stop the server.",
            title="[bold]agent-eval report[/]",
            border_style="cyan",
            padding=(1, 2),
        ))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        console.print("\n  [dim]Server stopped.[/]")
    finally:
        httpd.server_close()


@click.command(name="report")
@click.option(
    "--run-id",
    default=None,
    help="Open the report for a specific run ID instead of the latest.")
@click.option(
    "--results-dir",
    default=None,
    help="Path to tests/eval/results/. Auto-detected from cwd if omitted.")
@click.option(
    "--serve",
    is_flag=True,
    help=
    "Start a localhost HTTP server instead of opening in the default browser. "
    "Use this on remote dev boxes (Cloud Workstation, SSH) where no display exists."
)
@click.option("--port",
              type=int,
              default=0,
              help="With --serve, the port to bind. Default: OS-assigned.")
@click.option("--no-open",
              is_flag=True,
              help="Just print the path; don't open a browser.")
def report(run_id, results_dir, serve, port, no_open):
    """Open the latest evaluation report in your default browser.

    \b
    Examples:
      agent-eval report                       # latest run, opens browser
      agent-eval report --run-id baseline     # specific run
      agent-eval report --serve               # localhost HTTP (for SSH/remote dev)
      agent-eval report --serve --port 8080   # pin a port for SSH tunneling
      agent-eval report --no-open             # just print the path
    """
    results = _resolve_results_dir(results_dir)
    if not results:
        console.print(
            "  [red]Couldn't find a tests/eval/results/ directory.[/]\n"
            "  [dim]Run from inside an agent project, or pass --results-dir <path>.[/]"
        )
        sys.exit(1)

    # Resolve the report path.
    if run_id:
        report_path = results / run_id / "report.html"
        if not report_path.exists():
            console.print(
                f"  [red]No report.html for run [cyan]{run_id}[/]:[/] {report_path}\n"
                f"  [dim]Available runs:[/]")
            for run_dir in sorted(results.iterdir()):
                if (run_dir / "report.html").exists():
                    console.print(f"    [cyan]{run_dir.name}[/]")
            sys.exit(1)
    else:
        report_path = _find_latest_report(results)
        if not report_path:
            console.print(
                f"  [red]No report.html found under {results}/[/]\n"
                f"  [dim]Run [cyan]agent-eval analyze[/] (or [cyan]agent-eval run[/]) first.[/]"
            )
            sys.exit(1)

    if serve:
        _serve(report_path, port_hint=port)
        return

    cwd = Path.cwd()
    try:
        rel = report_path.relative_to(cwd)
    except ValueError:
        rel = report_path
    file_url = f"file://{report_path.resolve()}"

    if no_open:
        console.print(f"\n  [bold]Report:[/] {rel}")
        console.print(f"  [dim]{file_url}[/]\n")
        return

    console.print(f"\n  [bold]Report:[/] {rel}")
    console.print(f"  [dim]{file_url}[/]\n")
    # Try to open in the default browser. webbrowser.open returns False on
    # remote/headless systems where it can't find a display — surface that
    # gracefully + nudge toward --serve.
    try:
        opened = webbrowser.open(file_url, new=2)
    except Exception:
        opened = False
    if opened:
        console.print("  [green]Opened in your default browser.[/]")
    else:
        console.print(
            "  [yellow]Couldn't open a browser automatically.[/] "
            "[dim]On a remote dev box?[/]\n"
            "  [bold]Try:[/]  [cyan]agent-eval report --serve[/]  "
            "[dim](starts a localhost HTTP server you can SSH-tunnel to)[/]")
