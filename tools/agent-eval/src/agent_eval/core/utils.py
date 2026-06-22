# Copyright 2024 Google LLC
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
"""Shared utilities for agent-eval core modules."""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger("agent_eval.utils")

# Directories to skip when scanning agent source trees.
_EXCLUDE_PATTERNS = [
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    "node_modules",
    "site-packages",
]


def discover_agent_context(
    agent_dir: Path | None, quiet: bool = False
) -> dict[str, str]:
    """Discover and load agent source code and ADK context from an agent directory.

    Scans for agent.py, tools.py, and GEMINI.md files while skipping
    virtual environments, caches, and other non-source directories.

    Args:
        agent_dir: Path to the agent module directory.
        quiet: If True, suppress print output.

    Returns:
        Dict mapping file paths (or labels) to their contents.
    """
    context: dict[str, str] = {}
    if not agent_dir or not agent_dir.exists():
        return context

    def _should_exclude(path: Path) -> bool:
        path_str = str(path)
        return any(excl in path_str for excl in _EXCLUDE_PATTERNS)

    def _log(msg: str) -> None:
        if not quiet:
            logger.debug(msg)

    # 1. Find agent.py files (only in project source, not dependencies)
    for pattern in ["agent.py", "**/agent.py"]:
        for agent_file in agent_dir.glob(pattern):
            if agent_file.is_file() and not _should_exclude(agent_file):
                try:
                    context[str(agent_file)] = agent_file.read_text()
                    _log(f"  Found agent source: {agent_file}")
                except Exception:
                    pass

    # 2. Find tools.py if exists (only in project source)
    for pattern in ["tools.py", "**/tools.py"]:
        for tools_file in agent_dir.glob(pattern):
            if tools_file.is_file() and not _should_exclude(tools_file):
                try:
                    context[str(tools_file)] = tools_file.read_text()
                    _log(f"  Found tools source: {tools_file}")
                except Exception:
                    pass

    # 3. Load GEMINI.md (ADK context) — extract key sections to keep it concise
    gemini_md = agent_dir / "GEMINI.md"
    if gemini_md.exists():
        try:
            full_content = gemini_md.read_text()
            lines = full_content.split("\n")
            key_sections = []
            in_relevant_section = False
            section_count = 0

            for line in lines:
                if (
                    line.startswith("## 1.")
                    or line.startswith("## 2.")
                    or line.startswith("## 7.")
                    or line.startswith("## 8.")
                ):
                    in_relevant_section = True
                    section_count += 1
                elif line.startswith("## ") and section_count > 0:
                    in_relevant_section = False

                if in_relevant_section or len(key_sections) < 50:
                    key_sections.append(line)

                if len("\n".join(key_sections)) > 15000:
                    break

            adk_context = "\n".join(key_sections)
            context["GEMINI.md (ADK Reference - Key Sections)"] = adk_context
            _log(f"  Found ADK context: {gemini_md} ({len(adk_context)} chars)")
        except Exception:
            pass

    return context
