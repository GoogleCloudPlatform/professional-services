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
"""agent-eval stories — browse the wait-time story library.

Long-running phases (simulate, interact) print 1-2 random stories above
the blocking spinner so the user has something to read. This command
exposes the FULL library, browseable in a pager — read at your own pace,
search with /, navigate with arrow keys, quit with q.

Three modes:
- ``agent-eval stories``           browse all in pager (default)
- ``agent-eval stories <index>``   show a single story by 1-based index
- ``agent-eval stories --random``  print one random story (for sampling)
"""

from __future__ import annotations

import sys

import click
from rich.console import Console
from rich.rule import Rule

from agent_eval.cli._stories import STORIES, render_story_panel, random_story

console = Console()


@click.command(name="stories")
@click.argument("index", type=int, required=False)
@click.option(
    "--random",
    "show_random",
    is_flag=True,
    help="Print one random story and exit (no pager).",
)
@click.option(
    "--no-pager",
    is_flag=True,
    help="Print all stories straight to stdout instead of opening a pager.",
)
def stories(index: int | None, show_random: bool, no_pager: bool):
    """Browse the wait-time story library.

    \b
    Each story is a 250-400 word essay on agent evaluation, ADK internals,
    Vertex AI, or agent design. They appear during long simulate/interact
    waits, but you can browse them anytime with this command.

    \b
    Examples:
      agent-eval stories              # browse all in pager (q to quit)
      agent-eval stories 7            # show story #7 only
      agent-eval stories --random     # one random story
    """
    if not STORIES:
        console.print("[yellow]No stories available.[/]")
        sys.exit(1)

    if show_random:
        s = random_story()
        if s:
            console.print()
            console.print(render_story_panel(s[0], s[1]))
            console.print()
        return

    if index is not None:
        if not (1 <= index <= len(STORIES)):
            console.print(
                f"[red]Index out of range:[/] {index} "
                f"(library has {len(STORIES)} stories — use 1..{len(STORIES)})"
            )
            sys.exit(1)
        title, body = STORIES[index - 1]
        console.print()
        console.print(render_story_panel(title, body, index=index, total=len(STORIES)))
        console.print()
        return

    # Default: browse all in pager. The pager handles arrow keys, search
    # with /, quit with q. styles=True preserves Rich color codes through
    # `less -R`.
    def _emit_all() -> None:
        console.print()
        console.print(
            Rule(f"  agent-eval stories — {len(STORIES)} essays  ", style="bold cyan")
        )
        console.print("  [dim]Down/Up: scroll · /: search · n: next match · q: quit[/]")
        console.print()
        for i, (title, body) in enumerate(STORIES, 1):
            console.print(render_story_panel(title, body, index=i, total=len(STORIES)))
            console.print()

    if no_pager:
        _emit_all()
        return

    try:
        with console.pager(styles=True):
            _emit_all()
    except Exception:
        # Fallback to plain stdout if pager unavailable (rare on dev boxes,
        # common in some CI environments where stdout isn't a tty).
        _emit_all()
