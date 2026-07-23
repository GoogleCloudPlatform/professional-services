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
"""Pacing helpers for the agent-eval CLI.

Three helpers, one purpose: keep the user reading instead of watching content
scroll off-screen.

- ``_pause`` — silent ``time.sleep`` for sub-second visual rhythm between
  closely-related prints (already in use across ``init``).
- ``_continue`` — interactive anchor that blocks on Enter. Use at the end of
  any dense block (multi-line panel, table, banner) so the cursor pauses on
  the content instead of jumping past it to the next prompt. Falls back to a
  silent ``time.sleep(_PAUSE_LONG)`` when ``AGENT_EVAL_NO_PAUSES=1`` is set,
  so CI / non-interactive runs don't hang.
- ``styled_pager`` — drop-in replacement for ``console.pager(styles=True)``
  that also tells ``less`` to interpret ANSI styles (otherwise the pager
  shows raw ``ESC[...]m`` codes). When pauses are disabled the content
  prints inline so scripted runs still work.
"""

from __future__ import annotations

import os
import time
from collections.abc import Iterator
from contextlib import contextmanager

import questionary
from rich.console import Console

_PAUSE_SHORT = 0.25
_PAUSE_LONG = 0.6

_NO_PAUSES_ENV = "AGENT_EVAL_NO_PAUSES"


def _pauses_disabled() -> bool:
    return os.environ.get(_NO_PAUSES_ENV) == "1"


def _pause(seconds: float = _PAUSE_SHORT) -> None:
    """Insert a small breathing pause unless suppressed."""
    if _pauses_disabled():
        return
    time.sleep(seconds)


def _continue(
    message: str = "Press Enter to continue →",
    *,
    console: Console | None = None,
) -> None:
    """Block on Enter so the user actually reads what just rendered.

    ``message`` is shown as the prompt label — keep it short and forward-looking
    ("Next: dataset columns →") so it doubles as a pointer to what comes next.

    If ``message`` doesn't already mention "Enter", an explicit
    ``· press Enter ↵`` hint is appended. Reported by Dani 2026-04-25
    after a customer froze on a "Next: …" anchor not knowing to press Enter.

    When ``AGENT_EVAL_NO_PAUSES=1``, falls back to a silent ``_pause(_PAUSE_LONG)``
    so scripted / CI runs don't deadlock.
    """
    if _pauses_disabled():
        time.sleep(_PAUSE_LONG)
        return
    if console is not None:
        console.print()
    label = message if "enter" in message.lower() else f"{message}  · press Enter ↵"
    questionary.press_any_key_to_continue(label).ask()


@contextmanager
def styled_pager(console: Console) -> Iterator[None]:
    """Pager that correctly renders ANSI styles via ``less -R``.

    ``console.pager(styles=True)`` embeds escape codes but doesn't tell
    ``less`` to interpret them, so the pager shows literal ``ESC[...]m``
    text. Setting ``LESS=-R`` for the duration fixes that and is restored
    on exit.

    When pauses are disabled (``AGENT_EVAL_NO_PAUSES=1``), the block
    prints inline instead of paging, so scripted / CI runs don't deadlock.
    """
    if _pauses_disabled():
        yield
        return

    old_less = os.environ.get("LESS")
    os.environ["LESS"] = "-R"
    try:
        with console.pager(styles=True):
            yield
    finally:
        if old_less is None:
            os.environ.pop("LESS", None)
        else:
            os.environ["LESS"] = old_less
