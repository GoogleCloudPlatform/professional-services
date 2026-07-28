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
"""Startup check that the installed SDK versions match what we declare.

Without this, a drifted environment fails deep inside an import chain with
something like ``ModuleNotFoundError: No module named 'google.adk.workflow'``,
which says nothing about the actual problem.

The common cause is installing agent-eval into the *agent's* own virtualenv.
Any later ``uv sync`` / ``uv run`` in that project re-resolves the environment
against the agent's lockfile and quietly downgrades a shared dependency out from
under agent-eval. The supported layout keeps them in separate venvs.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, requires, version

# Shared with the agent's own dependency tree, so these are the ones that drift.
_CRITICAL = ("google-adk", "google-cloud-aiplatform")

_DISTRIBUTION = "agent-eval"


class DependencyMismatchError(RuntimeError):
    """An installed dependency falls outside the range agent-eval declares."""


def _declared_specifiers() -> dict[str, object]:
    """Requirement specifiers agent-eval declares, keyed by package name.

    Read from our own installed metadata so this never drifts from
    pyproject.toml. Returns ``{}`` when metadata is unavailable (for example a
    plain source checkout), which disables the check rather than guessing.
    """
    try:
        raw = requires(_DISTRIBUTION) or []
    except PackageNotFoundError:
        return {}

    try:
        from packaging.requirements import Requirement
    except ImportError:
        # A check that cannot run must not become the failure it exists to
        # prevent — e.g. an intentionally dependency-free install.
        return {}

    found: dict[str, object] = {}
    for entry in raw:
        try:
            req = Requirement(entry)
        except Exception:
            continue
        if req.marker is not None and not req.marker.evaluate():
            continue  # an extra / environment-specific requirement
        name = req.name.lower().replace("_", "-")
        if name in _CRITICAL and req.specifier:
            found[name] = req.specifier
    return found


def check_runtime_dependencies() -> None:
    """Raise if a critical dependency is installed outside its declared range.

    Silently does nothing when versions are fine, or when we cannot determine
    what is required — a check that guesses is worse than no check.
    """
    specifiers = _declared_specifiers()
    if not specifiers:
        return

    problems: list[str] = []
    for name, specifier in specifiers.items():
        try:
            installed = version(name)
        except PackageNotFoundError:
            problems.append(f"  {name}: not installed, needs {specifier}")
            continue
        # prereleases=True so an rc of a valid version isn't reported as broken.
        if not specifier.contains(installed, prereleases=True):
            problems.append(f"  {name}: {installed} installed, needs {specifier}")

    if not problems:
        return

    raise DependencyMismatchError(
        "agent-eval's dependencies have drifted:\n"
        + "\n".join(problems)
        + "\n\nMost likely cause: agent-eval is installed in your agent's own "
        "virtualenv.\nRunning `uv sync` / `uv run` in that project re-resolves it "
        "against the\nagent's lockfile and downgrades shared packages underneath "
        "agent-eval.\n\nUse a separate environment for evaluation:\n"
        "    uv venv --python 3.12 .venv-eval\n"
        "    uv pip install --python .venv-eval/bin/python <agent-eval wheel>\n"
        "    uv pip install --python .venv-eval/bin/python -e .   # your agent\n"
        "\nKeep the agent's own venv for running the agent (e.g. `adk web`)."
    )
