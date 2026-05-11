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
"""Resolve canonical paths for the unified ``tests/eval/`` layout.

Per the SDK-aligned plan §3, evaluation files live under ``tests/eval/``:

.. code-block:: text

    <agent_dir>/
    └── tests/eval/
        ├── dataset.jsonl
        ├── metrics/metric_definitions.json
        └── results/

Older projects use the legacy ``eval/`` layout (or ``app/eval/`` in
Agent Starter Pack projects). These helpers return the canonical path when
present, falling back to legacy locations so existing projects keep working
without forcing migration.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

_CANONICAL_EVAL = Path("tests") / "eval"
_LEGACY_EVAL_FLAT = Path("eval")
_LEGACY_EVAL_NESTED = Path("app") / "eval"


def agent_project_root(agent_dir: Path | str, *, max_depth: int = 4) -> Path:
    """Return the agent's project root.

    The project root is where ``pyproject.toml`` lives — i.e., the directory
    from which the user runs `pip install -e .` or `agents-cli playground`.
    For the standard ASP layout it's the parent of the ``app/`` module dir.

    The unified ``tests/eval/`` folder belongs at the project root (not
    inside ``app/``). Pre-rescue scaffolds wrote ``<agent_dir>/tests/eval/``
    which landed inside the agent module — failure F3 in the 2026-04-23
    customer demo. This helper is the single source of truth for "where
    should the unified eval files live."

    Walks up from ``agent_dir`` looking for ``pyproject.toml`` /
    ``setup.py``. If a marker is found at ``agent_dir`` itself, returns
    ``agent_dir``. If found while walking up, returns that ancestor. If
    nothing is found within ``max_depth``, returns ``agent_dir`` itself
    (treating it as a self-contained project for fresh scaffolds + isolated
    test fixtures). NEVER auto-promotes to ``agent_dir.parent`` without a
    project marker — that promoted random tmp dirs to project roots in
    earlier iterations.
    """
    start = Path(agent_dir).resolve()
    cur = start
    for _ in range(max_depth + 1):
        if (cur / "pyproject.toml").is_file() or (cur / "setup.py").is_file():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return start


def find_eval_dir(agent_dir: Path | str) -> Path:
    """Return the eval directory in use for ``agent_dir``.

    Preference order:
      1. ``<project_root>/tests/eval/`` (canonical, post-rescue)
      2. ``<agent_dir>/tests/eval/`` (legacy F3 location — pre-rescue scaffolds)
      3. ``<agent_dir>/eval/`` (legacy flat layout)
      4. ``<agent_dir>/app/eval/`` (legacy ASP nested)

    Falls back to the canonical project-root path even if it doesn't exist
    yet — callers that need to *write* into the eval folder can rely on
    this returning a consistent location.
    """
    base = Path(agent_dir)
    project_root = agent_project_root(base)
    for candidate in (
            project_root / _CANONICAL_EVAL,
            base / _CANONICAL_EVAL,
            base / _LEGACY_EVAL_FLAT,
            base / _LEGACY_EVAL_NESTED,
    ):
        if candidate.exists():
            return candidate
    return project_root / _CANONICAL_EVAL


def find_metrics_path(agent_dir: Path | str) -> Optional[Path]:
    """Return the active ``metric_definitions.json`` path or ``None`` if missing.

    Searches in canonical-first, then legacy-fallback order. Includes the
    pre-rescue F3 location ``<agent_dir>/tests/eval/`` so projects that
    were initialized before the rescue keep working until they migrate.
    Returns ``None`` when no metric definitions file exists anywhere.
    """
    base = Path(agent_dir)
    project_root = agent_project_root(base)
    for candidate in (
            project_root / _CANONICAL_EVAL / "metrics" /
            "metric_definitions.json",
            base / _CANONICAL_EVAL / "metrics" / "metric_definitions.json",
            base / _LEGACY_EVAL_FLAT / "metrics" / "metric_definitions.json",
            base / _LEGACY_EVAL_NESTED / "metrics" / "metric_definitions.json",
    ):
        if candidate.exists():
            return candidate
    return None


def find_dataset_path(agent_dir: Path | str) -> Optional[Path]:
    """Return the active ``dataset.jsonl`` path or ``None`` if missing.

    Searches canonical (project-root ``tests/eval/``), then the F3 legacy
    in-agent-dir location, so pre-rescue projects keep loading.
    """
    base = Path(agent_dir)
    project_root = agent_project_root(base)
    for candidate in (
            project_root / _CANONICAL_EVAL / "dataset.jsonl",
            base / _CANONICAL_EVAL / "dataset.jsonl",
    ):
        if candidate.exists():
            return candidate
    return None


# ---------------------------------------------------------------------------
# Project-root resolution from cwd
# ---------------------------------------------------------------------------
# Used by `agent-engine` (and any other command run from inside a deployed
# project) to find the canonical eval files when the user invokes from cwd
# rather than passing --agent-dir. Walks up looking for `pyproject.toml`
# (a project-root marker) — same heuristic as Python tooling like uv/poetry.

_PROJECT_ROOT_MARKERS = ("pyproject.toml", "setup.py", "setup.cfg")


def find_project_root(start: Path | None = None,
                      max_depth: int = 6) -> Optional[Path]:
    """Walk up from ``start`` (default cwd) looking for a project-root marker.

    Returns the directory containing the marker, or None if nothing matches
    within ``max_depth`` levels (avoids unbounded traversal in edge cases).
    """
    cur = (start or Path.cwd()).resolve()
    for _ in range(max_depth + 1):
        for marker in _PROJECT_ROOT_MARKERS:
            if (cur / marker).is_file():
                return cur
        if cur.parent == cur:
            return None
        cur = cur.parent
    return None


def resolve_relative_to_project(
    relpath: Path | str,
    explicit: Optional[Path | str] = None,
    *,
    start: Path | None = None,
) -> Optional[Path]:
    """Resolve ``relpath`` (e.g. ``tests/eval/dataset.jsonl``) against the
    nearest project root walking up from ``start`` (default cwd).

    Resolution order:
      1. ``explicit`` (an absolute or cwd-relative override) if given AND exists
      2. ``<cwd>/relpath`` if it exists (typical case: invoked from project root)
      3. ``<project_root>/relpath`` walking up via ``find_project_root``
      4. None — caller decides whether to fall back to a starter or error

    Returns the resolved absolute path or None.
    """
    relpath = Path(relpath)
    if explicit is not None:
        p = Path(explicit).expanduser()
        if p.is_absolute() and p.exists():
            return p
        candidate = (Path.cwd() / p).resolve()
        if candidate.exists():
            return candidate
        # Don't silently absorb a non-existent explicit override — return None
        # so the caller can surface a clear error.
        return None

    cwd = (start or Path.cwd()).resolve()
    direct = (cwd / relpath).resolve()
    if direct.exists():
        return direct

    project_root = find_project_root(start=cwd)
    if project_root is not None:
        candidate = (project_root / relpath).resolve()
        if candidate.exists():
            return candidate
    return None
