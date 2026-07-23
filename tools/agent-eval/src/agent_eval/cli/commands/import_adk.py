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
"""agent-eval import — convert ADK ``.evalset.json`` files into ``dataset.jsonl``.

ADK already encourages users to keep eval cases under ``tests/eval/evalsets/``
in a JSON format with ``eval_cases[].conversation`` arrays. This command reads
those files and flattens them into the unified row shape used by the rest of
agent-eval (canonical Vertex AI columns + ``expected_*`` extras).

Why this exists: per the SDK-aligned plan §3.3, the `tests/eval/` folder
becomes the single home for eval data. Existing ADK evalsets are *inputs* —
this command imports them so users don't have to rewrite their work.

Example::

    agent-eval import \\
        --from agents/sample-agent/tests/eval/evalsets/basic.evalset.json

Appends to ``tests/eval/dataset.jsonl`` (or the path given by ``--out``).
Use ``--overwrite`` to replace the file instead.
"""

from __future__ import annotations

from pathlib import Path

import click
from rich.console import Console

console = Console()


@click.command(name="import")
@click.option(
    "--from",
    "source_path",
    type=click.Path(exists=True, dir_okay=False, path_type=Path),
    required=True,
    help="ADK .evalset.json file to import.",
)
@click.option(
    "--out",
    "output_path",
    type=click.Path(dir_okay=False, path_type=Path),
    default=Path("tests/eval/dataset.jsonl"),
    show_default=True,
    help="Destination dataset JSONL.",
)
@click.option(
    "--overwrite",
    is_flag=True,
    help="Replace the output file instead of appending.",
)
def import_adk(source_path: Path, output_path: Path, overwrite: bool) -> None:
    """Import an ADK .evalset.json into the unified dataset.jsonl format."""
    from agent_eval.cli.main import _display_banner
    from agent_eval.core.dataset_io import (
        append_dataset,
        import_adk_evalset,
        write_dataset,
    )

    _display_banner()

    console.print()
    console.print("  [bold]Import ADK evalset[/]")
    console.print(f"  [dim]Source:[/] [cyan]{source_path}[/]")
    console.print(f"  [dim]Dest:  [/] [cyan]{output_path}[/]")

    try:
        rows = import_adk_evalset(source_path)
    except Exception as exc:
        console.print(f"  [red]Failed to parse evalset:[/] {exc}")
        raise click.Abort() from None

    if not rows:
        console.print(
            "  [yellow]![/] No eval_cases found in the source file. Nothing to import."
        )
        return

    if overwrite or not output_path.exists():
        write_dataset(output_path, rows)
        verb = "Wrote"
    else:
        append_dataset(output_path, rows)
        verb = "Appended"

    console.print()
    console.print(
        f"  [green]>[/] {verb} [bold]{len(rows)}[/] row(s) to [cyan]{output_path}[/]"
    )

    sample = rows[0]
    preview_keys = ", ".join(sorted(sample.keys()))
    console.print(f"  [dim]Row schema (first row):[/] {preview_keys}")
