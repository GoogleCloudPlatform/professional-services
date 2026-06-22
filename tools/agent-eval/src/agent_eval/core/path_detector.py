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
"""Auto-detect which execution path applies to the user's project.

The CLI uses this at ``init`` time to skip questions when it can tell what
the user has. Two paths exist:

- ``A`` — Agent Engine (streamlined ``client.evals.create_evaluation_run``)
- ``B`` — Local ADK source OR any ADK FastAPI URL (UserSim multi-turn +
   ``interact`` single-turn against local-dev / Cloud Run / remote)
- ``unknown`` — neither auto-detected; caller scaffolds the no-detect fallback

There is no Path C — BYOD ingestion is roadmap-only, surfaced in
``docs/reference.md`` as ``ingest-traces`` (not implemented).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

# Mirror init.py's skip set so detection stays consistent with discovery.
_SKIP_DIRS = {
    ".venv",
    "venv",
    "site-packages",
    "node_modules",
    "__pycache__",
    ".git",
    ".adk",
    "sub_agents",
    "app_env",
    "eval_history",
}

# Placeholder value ASP writes when an agent is scaffolded but not yet deployed.
_PLACEHOLDER_RESOURCE_VALUES = {"None", "", None}


@dataclass
class PathDetection:
    """Result of probing a working directory for an execution path.

    The ``path`` field still reports the **primary** detection (deployed
    Agent Engine wins over local source when both are present) so existing
    callers keep working. New callers should inspect ``has_both()`` and
    ``local_agents`` to know that local source is *also* available alongside
    the deployment — the two surfaces are complementary, not exclusive.

    Note: ``path`` retains the legacy "A"/"B" enum values for now. They are
    INTERNAL-ONLY identifiers — never surface "Path A" or "Path B" in
    user-facing output (CLAUDE.md hard rule #10).
    """

    path: str  # "A" (deployed Agent Engine) | "B" (local source) | "unknown"
    evidence: str = ""
    agent_engine_resource: str | None = None
    local_agents: list[Path] = field(default_factory=list)

    def has_both(self) -> bool:
        """True when both a deployed Agent Engine AND a local agent are available."""
        return self.agent_engine_resource is not None and bool(self.local_agents)


# ---------------------------------------------------------------------------
# Deployed Agent Engine signals
# ---------------------------------------------------------------------------


def _resource_from_metadata_file(path: Path) -> str | None:
    """Extract a real Agent Engine resource name from a deployment-metadata file.

    Returns None if the file is missing, malformed, or holds a placeholder.
    """
    if not path.exists():
        return None
    try:
        import json

        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    for key in (
        "remote_agent_engine_id",
        "agent_engine_resource_name",
        "resource_name",
    ):
        value = data.get(key)
        if value and value not in _PLACEHOLDER_RESOURCE_VALUES:
            return value
    return None


# Filenames Agent Starter Pack writes when it deploys to Agent Engine. Either
# can sit at the project root or under ``deployment/`` — and the project root
# itself may be a sibling of the user's cwd (e.g. they ran ``init`` one level
# up). rglob handles all four positions; ``_SKIP_DIRS`` keeps it cheap.
_AGENT_ENGINE_METADATA_FILENAMES = (
    "deployment_metadata.json",
    "agent_engine_metadata.json",
)


def _find_metadata_candidates(cwd: Path) -> list[Path]:
    """rglob for Agent Engine metadata files, shallowest path first.

    Mirrors ``_find_local_agents`` so ``init`` finds an Agent Engine deployment
    whether the user runs it from inside the agent project or from a parent
    directory. If multiple metadata files exist (rare — multi-project parent),
    the shallowest one wins, which is usually what the user means.
    """
    candidates: list[Path] = []
    for filename in _AGENT_ENGINE_METADATA_FILENAMES:
        for found in cwd.rglob(filename):
            if any(part in _SKIP_DIRS for part in found.parts):
                continue
            candidates.append(found)
    candidates.sort(key=lambda p: (len(p.parts), str(p)))
    return candidates


def _detect_agent_engine(cwd: Path) -> PathDetection | None:
    """Probe for an Agent Engine deployment. Returns None if not found."""
    env_resource = os.getenv("AGENT_ENGINE_RESOURCE_NAME")
    if env_resource and env_resource not in _PLACEHOLDER_RESOURCE_VALUES:
        return PathDetection(
            path="A",
            evidence="AGENT_ENGINE_RESOURCE_NAME env var",
            agent_engine_resource=env_resource,
        )

    for candidate in _find_metadata_candidates(cwd):
        resource = _resource_from_metadata_file(candidate)
        if resource:
            rel = (
                candidate.relative_to(cwd)
                if candidate.is_relative_to(cwd)
                else candidate
            )
            return PathDetection(
                path="A",
                evidence=f"{rel} (remote_agent_engine_id set)",
                agent_engine_resource=resource,
            )

    return None


# ---------------------------------------------------------------------------
# Local ADK agent signals
# ---------------------------------------------------------------------------


def _find_local_agents(cwd: Path) -> list[Path]:
    """rglob for ``agent.py`` skipping standard noise directories."""
    agents: list[Path] = []
    for agent_py in sorted(cwd.rglob("agent.py")):
        if any(part in _SKIP_DIRS for part in agent_py.parts):
            continue
        agents.append(agent_py)
    return agents


def _detect_local_adk(cwd: Path) -> PathDetection | None:
    agents = _find_local_agents(cwd)
    if not agents:
        return None
    rel = agents[0].relative_to(cwd) if agents[0].is_relative_to(cwd) else agents[0]
    extra = f" (+{len(agents) - 1} more)" if len(agents) > 1 else ""
    return PathDetection(
        path="B",
        evidence=f"local ADK agent at {rel}{extra}",
        local_agents=agents,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def detect_execution_path(cwd: Path | str | None = None) -> PathDetection:
    """Auto-detect the execution path(s) available in ``cwd``.

    Probes for both Agent Engine deployment AND a local ``agent.py``. When
    both are present, the returned ``PathDetection.path`` is ``"A"`` (primary)
    *and* ``local_agents`` is populated, so callers can offer the user both
    options. Falls back to ``unknown`` when neither signal is found.
    """
    cwd = Path(cwd or ".").resolve()

    ae_detection = _detect_agent_engine(cwd)
    local_detection = _detect_local_adk(cwd)

    if ae_detection is not None:
        if local_detection is not None:
            ae_detection.local_agents = local_detection.local_agents
            ae_detection.evidence = (
                f"{ae_detection.evidence}; also found {local_detection.evidence}"
            )
        return ae_detection

    if local_detection is not None:
        return local_detection

    return PathDetection(
        path="unknown", evidence="no agent.py or deployment metadata found"
    )
