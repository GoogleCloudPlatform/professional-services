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
"""agent-eval migrate — convert legacy ``eval/`` layout to unified ``tests/eval/``.

Older projects scaffolded by previous versions of ``agent-eval init`` have a
split layout::

    <agent_dir>/
    ├── eval/                            # or app/eval/ in Agent Starter Pack projects
    │   ├── scenarios/
    │   │   ├── conversation_scenarios.json
    │   │   └── session_input.json
    │   ├── eval_data/golden_dataset.json
    │   └── metrics/metric_definitions.json

This command collapses that into the SDK-aligned unified layout::

    <agent_dir>/
    └── tests/eval/
        ├── dataset.jsonl
        ├── metrics/metric_definitions.json
        └── .backup/<timestamp>/         # originals kept by default

Per the SDK-aligned plan §5.2, the migration is **non-destructive**: originals
are copied (not deleted) into ``tests/eval/.backup/`` so users can roll back.
Use ``--dry-run`` to preview without writing anything.
"""

from __future__ import annotations

from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.command(name="migrate")
@click.option(
    "--agent-dir",
    "agent_dir",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    default=Path(),
    show_default=True,
    help="Project root containing the legacy eval/ folder.",
)
@click.option(
    "--out",
    "output_path",
    type=click.Path(dir_okay=False, path_type=Path),
    default=None,
    help="Destination dataset JSONL. Defaults to <agent-dir>/tests/eval/dataset.jsonl.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="Show what would change without writing any files.",
)
@click.option(
    "--no-backup",
    is_flag=True,
    help="Skip copying originals to tests/eval/.backup/<timestamp>/.",
)
def migrate(
    agent_dir: Path,
    output_path: Path | None,
    dry_run: bool,
    no_backup: bool,
) -> None:
    """Migrate legacy eval/ files into a unified tests/eval/dataset.jsonl."""
    from agent_eval.cli.main import _display_banner
    from agent_eval.core.dataset_io import (
        _find_legacy_eval_dir,
        _migrate_golden_dataset,
        _migrate_scenarios,
        migrate_legacy,
    )

    _display_banner()

    console.print()
    console.print("  [bold]Migrate legacy eval/ → tests/eval/dataset.jsonl[/]")
    console.print(f"  [dim]Project: [/] [cyan]{agent_dir.resolve()}[/]")

    legacy = _find_legacy_eval_dir(agent_dir)
    if legacy is None:
        console.print(
            "  [yellow]![/] No legacy [cyan]eval/[/] folder found under "
            f"[cyan]{agent_dir}[/] or [cyan]{agent_dir}/app[/]. Nothing to migrate."
        )
        return

    console.print(f"  [dim]Found:   [/] [cyan]{legacy}[/]")

    if dry_run:
        scenarios_path = legacy / "scenarios" / "conversation_scenarios.json"
        session_input_path = legacy / "scenarios" / "session_input.json"
        golden_path = legacy / "eval_data" / "golden_dataset.json"
        metrics_path = legacy / "metrics" / "metric_definitions.json"

        scen_rows = _migrate_scenarios(scenarios_path, session_input_path)
        golden_rows = _migrate_golden_dataset(golden_path)
        out = output_path or agent_dir / "tests" / "eval" / "dataset.jsonl"

        console.print()
        console.print("  [bold]Dry run — no files written[/]")
        table = Table(show_header=True, header_style="bold")
        table.add_column("Source", style="cyan")
        table.add_column("Becomes", style="cyan")
        table.add_column("Rows", justify="right")
        if scenarios_path.exists():
            table.add_row(str(scenarios_path), str(out), str(len(scen_rows)))
        if golden_path.exists():
            table.add_row(str(golden_path), str(out), str(len(golden_rows)))
        if metrics_path.exists():
            dst = agent_dir / "tests" / "eval" / "metrics" / "metric_definitions.json"
            table.add_row(str(metrics_path), str(dst), "—")
        console.print(table)
        console.print(
            f"  [dim]Total rows that would be written:[/] [bold]{len(scen_rows) + len(golden_rows)}[/]"
        )
        return

    summary = migrate_legacy(
        agent_dir,
        output_path=output_path,
        backup=not no_backup,
    )

    console.print()
    console.print("  [green]>[/] Migration complete.")
    console.print(f"  [dim]Output:    [/] [cyan]{summary['output_path']}[/]")
    console.print(
        f"  [dim]Rows:      [/] [bold]{summary['total_rows']}[/]"
        f" [dim]({summary['scenario_rows']} from scenarios,"
        f" {summary['golden_rows']} from golden_dataset)[/]"
    )
    if summary["metrics_copied"]:
        console.print(f"  [dim]Metrics:   [/] [cyan]{summary['metrics_copied']}[/]")
    if summary["backup_dir"]:
        console.print(f"  [dim]Backup:    [/] [cyan]{summary['backup_dir']}[/]")
    else:
        console.print("  [dim]Backup:    [/] skipped (--no-backup)")

    console.print()
    console.print(
        "  [dim]Next:[/] verify [cyan]tests/eval/dataset.jsonl[/], then run "
        "[bold]agent-eval evaluate[/] or [bold]agent-eval agent-engine[/]."
    )
