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
"""Read, write, migrate, and import the unified evaluation dataset.

Canonical row shape (matches Vertex AI GenAI Eval SDK columns plus free-form
``expected_*`` extras for custom metrics):

.. code-block:: jsonl

    {
      "prompt": "Find docs about pricing tiers",
      "reference": "Here are 3 documents about pricing...",
      "session_inputs": {"app_name": "app", "user_id": "u1", "state": {}},
      "conversation_history": [{"role": "user", "parts": [{"text": "..."}]}],
      "expected_docs": ["doc_pricing_v2"],
      "expected_tool_calls": [{"name": "search_docs", "args": {"query": "..."}}]
    }

Optional fields per row enable mixed datasets — some rows multi-turn, some
single-turn, some with reference, some without.
"""

from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger("agent_eval")


# Capability tags for per-row metric eligibility.
CAP_REFERENCE = "has_reference"
CAP_MULTI_TURN = "multi_turn"
CAP_SESSION_INPUTS = "has_session_inputs"
CAP_INTERMEDIATE_EVENTS = "has_intermediate_events"
CAP_RESPONSE = "has_response"


# ---------------------------------------------------------------------------
# Read / write
# ---------------------------------------------------------------------------

def read_dataset(path: Path | str) -> List[Dict[str, Any]]:
    """Read a JSONL dataset file. Returns ``[]`` if the file does not exist."""
    p = Path(path)
    if not p.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with p.open("r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSON in {p} on line {lineno}: {exc}"
                ) from exc
    return rows


def write_dataset(path: Path | str, rows: List[Dict[str, Any]]) -> None:
    """Write rows as JSONL (UTF-8). Creates parent directories as needed."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def append_dataset(path: Path | str, rows: List[Dict[str, Any]]) -> None:
    """Append rows to an existing JSONL dataset."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# Capability detection (per-row metric eligibility)
# ---------------------------------------------------------------------------

def detect_capabilities(row: Dict[str, Any]) -> Set[str]:
    """Return the capabilities a row supports for metric routing.

    Reads the explicit ``kind`` field FIRST (``"multi_turn"`` / ``"single_turn"``
    / ``"both"`` — emitted by the scaffold since 2026-05-01). Falls back to
    field-presence inference for hand-written rows that omit ``kind``:
    - ``conversation_plan`` / ``history`` / ``conversation_history`` → multi-turn
    - ``reference`` or nested ``reference_data`` → reference-eligible
    """
    caps: Set[str] = set()
    kind = row.get("kind")

    # Reference eligibility — both nested (canonical) and top-level (legacy mirror)
    has_reference = bool(
        row.get("reference")
        or (isinstance(row.get("reference_data"), dict) and row["reference_data"])
    )
    if has_reference:
        caps.add(CAP_REFERENCE)

    # Multi-turn capability — kind first, then field presence
    if kind in ("multi_turn", "both"):
        caps.add(CAP_MULTI_TURN)
    elif kind == "single_turn":
        pass  # explicitly single-turn — don't add multi-turn cap even if fields are there
    elif row.get("history") or row.get("conversation_history") or row.get("conversation_plan"):
        caps.add(CAP_MULTI_TURN)

    if row.get("session_inputs"):
        caps.add(CAP_SESSION_INPUTS)
    if row.get("intermediate_events"):
        caps.add(CAP_INTERMEDIATE_EVENTS)
    if row.get("response"):
        caps.add(CAP_RESPONSE)
    return caps


def is_single_turn(row: Dict[str, Any]) -> bool:
    """True when the row drives the single-turn path (interact / agent-engine).

    A row with ``kind: "both"`` qualifies for both — the single-turn path uses
    ``prompt`` + ``reference_data`` from the row even if it also has a
    ``conversation_plan``.
    """
    kind = row.get("kind")
    if kind in ("single_turn", "both"):
        return True
    if kind == "multi_turn":
        return False
    # No explicit kind → infer: any row that's not multi-turn is single-turn
    return CAP_MULTI_TURN not in detect_capabilities(row)


def is_multi_turn(row: Dict[str, Any]) -> bool:
    """True when the row drives the multi-turn path (simulate / UserSim).

    A row with ``kind: "both"`` qualifies for both — the multi-turn path uses
    ``prompt`` + ``conversation_plan`` (or ``history``) from the row even if
    it also has ``reference_data``.
    """
    kind = row.get("kind")
    if kind in ("multi_turn", "both"):
        return True
    if kind == "single_turn":
        return False
    return CAP_MULTI_TURN in detect_capabilities(row)


# ---------------------------------------------------------------------------
# ADK evalset import
# ---------------------------------------------------------------------------

def _adk_text_from_content(content: Optional[Dict[str, Any]]) -> str:
    """Extract joined text from an ADK ``user_content``-shaped dict."""
    if not content:
        return ""
    parts = content.get("parts") or []
    chunks = [p.get("text") for p in parts if isinstance(p, dict) and p.get("text")]
    return "\n".join(chunks)


def import_adk_evalset(evalset_path: Path | str) -> List[Dict[str, Any]]:
    """Convert an ADK ``.evalset.json`` file into unified rows.

    For each ``eval_case``, the LAST user turn becomes ``prompt`` and any
    earlier turns become ``conversation_history``. ``session_input`` (note
    ADK's singular form) maps to ``session_inputs``. Tool calls collected
    across the conversation become ``expected_tool_calls``.
    """
    p = Path(evalset_path)
    data = json.loads(p.read_text(encoding="utf-8"))
    rows: List[Dict[str, Any]] = []

    for case in data.get("eval_cases") or []:
        conversation = case.get("conversation") or []
        if not conversation:
            continue

        history: List[Dict[str, Any]] = []
        tool_calls: List[Dict[str, Any]] = []
        last_text = ""

        for i, turn in enumerate(conversation):
            user_content = turn.get("user_content") or {}
            text = _adk_text_from_content(user_content)
            tool_uses = ((turn.get("intermediate_data") or {}).get("tool_uses") or [])
            tool_calls.extend(tool_uses)

            if i == len(conversation) - 1:
                last_text = text
            elif text:
                history.append({"role": "user", "parts": [{"text": text}]})

        row: Dict[str, Any] = {"prompt": last_text}
        if history:
            # Use SDK-canonical column name 'history' (FLATTEN schema).
            row["history"] = history
        session_input = case.get("session_input")
        if session_input:
            row["session_inputs"] = session_input
        if tool_calls:
            row["expected_tool_calls"] = tool_calls
        eval_id = case.get("eval_id")
        if eval_id:
            row["id"] = eval_id

        rows.append(row)

    return rows


# ---------------------------------------------------------------------------
# Legacy migration: scenarios/ + golden_dataset.json -> dataset.jsonl
# ---------------------------------------------------------------------------

# Reserved canonical SDK fields — anything else under reference_data becomes
# a flat top-level expected_* column (or kept under its own name if already
# prefixed).
_CANONICAL_REFERENCE_KEYS = {"expected_behavior"}


def _flatten_reference_data(reference_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map the legacy nested ``reference_data`` dict to flat top-level columns.

    - ``expected_behavior`` → ``reference`` (canonical SDK column)
    - any other key kept verbatim at top level (e.g. ``expected_docs``,
      ``expected_tool_call``)
    """
    out: Dict[str, Any] = {}
    for key, value in reference_data.items():
        if key == "expected_behavior":
            out["reference"] = value
        else:
            out[key] = value
    return out


def _migrate_scenarios(
    scenarios_path: Path,
    session_input_path: Optional[Path],
) -> List[Dict[str, Any]]:
    """Convert legacy scenarios/conversation_scenarios.json to rows."""
    if not scenarios_path.exists():
        return []
    scen_data = json.loads(scenarios_path.read_text(encoding="utf-8"))
    session_inputs: Optional[Dict[str, Any]] = None
    if session_input_path and session_input_path.exists():
        session_inputs = json.loads(session_input_path.read_text(encoding="utf-8"))

    rows: List[Dict[str, Any]] = []
    for scen in scen_data.get("scenarios") or []:
        row: Dict[str, Any] = {"prompt": scen.get("starting_prompt", "")}
        plan = scen.get("conversation_plan")
        if plan:
            row["conversation_plan"] = plan
        if session_inputs:
            row["session_inputs"] = session_inputs
        rows.append(row)
    return rows


def _migrate_golden_dataset(golden_path: Path) -> List[Dict[str, Any]]:
    """Convert legacy eval_data/golden_dataset.json to rows."""
    if not golden_path.exists():
        return []
    data = json.loads(golden_path.read_text(encoding="utf-8"))
    rows: List[Dict[str, Any]] = []
    for q in data.get("golden_questions") or []:
        user_inputs = q.get("user_inputs") or []
        if not user_inputs:
            continue

        row: Dict[str, Any] = {"prompt": user_inputs[-1]}
        if len(user_inputs) > 1:
            # Canonical SDK FLATTEN column name.
            row["history"] = [
                {"role": "user", "parts": [{"text": t}]}
                for t in user_inputs[:-1]
            ]

        ref_data = q.get("reference_data") or {}
        row.update(_flatten_reference_data(ref_data))

        for opt in ("id", "metadata"):
            if q.get(opt):
                row[opt] = q[opt]

        rows.append(row)
    return rows


def _find_legacy_eval_dir(agent_dir: Path) -> Optional[Path]:
    """Return the legacy ``eval/`` folder under ``<agent_dir>`` or ``<agent_dir>/app``.

    Older Agent Starter Pack projects nest the agent under ``app/`` so eval
    files land at ``app/eval/``. Solo projects keep them at the top level.
    Returns ``None`` if neither exists.
    """
    for candidate in (agent_dir / "app" / "eval", agent_dir / "eval"):
        if candidate.exists():
            return candidate
    return None


def migrate_legacy(
    agent_dir: Path | str,
    *,
    output_path: Optional[Path | str] = None,
    backup: bool = True,
) -> Dict[str, Any]:
    """Migrate legacy layouts → unified ``<project_root>/tests/eval/dataset.jsonl``.

    Detects four legacy patterns and folds them all into a single canonical
    file at the agent's project root:

    1. ``<agent_dir>/eval/scenarios/conversation_scenarios.json`` — UserSim scenarios
    2. ``<agent_dir>/eval/eval_data/golden_dataset.json`` — DIY single-turn queries
    3. ``<agent_dir>/eval/metrics/metric_definitions.json`` — relocated to
       ``<project_root>/tests/eval/metrics/``
    4. ``<agent_dir>/tests/eval/dataset.jsonl`` — wrongly-placed F3 location
       from pre-rescue scaffolds; folded into the canonical file at the
       project root and the source is removed.

    Originals are copied to ``<project_root>/tests/eval/.backup/<timestamp>/``
    when ``backup=True``. Idempotent — re-running on an already-migrated
    project is a no-op (returns ``total_rows: 0``, ``backup_dir: None``).

    Returns a summary dict with row counts, output paths, and backup location.
    """
    from agent_eval.core.path_resolver import agent_project_root

    agent_dir = Path(agent_dir)
    project_root = agent_project_root(agent_dir)
    legacy_eval = _find_legacy_eval_dir(agent_dir)

    scen_rows: List[Dict[str, Any]] = []
    golden_rows: List[Dict[str, Any]] = []
    f3_rows: List[Dict[str, Any]] = []
    metrics_src: Optional[Path] = None
    metrics_dst: Optional[Path] = None
    sources_present: List[Path] = []

    if legacy_eval is not None:
        scenarios_path = legacy_eval / "scenarios" / "conversation_scenarios.json"
        session_input_path = legacy_eval / "scenarios" / "session_input.json"
        golden_path = legacy_eval / "eval_data" / "golden_dataset.json"
        metrics_src_candidate = legacy_eval / "metrics" / "metric_definitions.json"

        scen_rows = _migrate_scenarios(scenarios_path, session_input_path)
        golden_rows = _migrate_golden_dataset(golden_path)

        for p in (scenarios_path, golden_path, metrics_src_candidate):
            if p.exists():
                sources_present.append(p)

        if metrics_src_candidate.exists():
            metrics_src = metrics_src_candidate
            metrics_dst = project_root / "tests" / "eval" / "metrics" / "metric_definitions.json"

    # F3 fold: the wrongly-placed dataset that pre-rescue scaffolds wrote
    # to <agent_dir>/tests/eval/. We move its rows to the canonical
    # project-root location and then delete the source.
    f3_dataset = agent_dir / "tests" / "eval" / "dataset.jsonl"
    canonical_dataset = project_root / "tests" / "eval" / "dataset.jsonl"
    f3_active = f3_dataset.exists() and f3_dataset.resolve() != canonical_dataset.resolve()
    if f3_active:
        try:
            f3_rows = read_dataset(f3_dataset)
        except Exception as exc:
            logger.warning("Couldn't read F3 dataset at %s: %s", f3_dataset, exc)
            f3_rows = []
        sources_present.append(f3_dataset)
        # Also pick up F3-located metrics if present (and no legacy_eval source).
        f3_metrics = agent_dir / "tests" / "eval" / "metrics" / "metric_definitions.json"
        if f3_metrics.exists() and not metrics_src:
            metrics_src = f3_metrics
            metrics_dst = project_root / "tests" / "eval" / "metrics" / "metric_definitions.json"
            sources_present.append(f3_metrics)

    out_path = Path(output_path) if output_path else canonical_dataset
    rows = scen_rows + golden_rows + f3_rows
    if rows or not out_path.exists():
        write_dataset(out_path, rows)

    if metrics_src and metrics_dst and metrics_src.resolve() != metrics_dst.resolve():
        metrics_dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(metrics_src, metrics_dst)

    backup_dir: Optional[Path] = None
    if backup and sources_present:
        from datetime import datetime
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = project_root / "tests" / "eval" / ".backup" / ts
        backup_dir.mkdir(parents=True, exist_ok=True)
        copied_dirs: Set[str] = set()
        for src in sources_present:
            parent = src.parent
            key = f"{parent.parent.name}_{parent.name}" if parent.name in copied_dirs else parent.name
            if key in copied_dirs:
                continue
            try:
                shutil.copytree(parent, backup_dir / key, dirs_exist_ok=True)
                copied_dirs.add(key)
            except Exception as exc:
                logger.warning("Backup of %s failed: %s", parent, exc)

    # Once F3 rows are safely in the canonical file AND backed up, remove
    # the F3 source so the user no longer sees the duplicate folder.
    if f3_active and backup_dir is not None and (project_root / "tests" / "eval" / "dataset.jsonl").exists():
        try:
            f3_root = agent_dir / "tests" / "eval"
            shutil.rmtree(f3_root)
        except Exception as exc:
            logger.warning("Couldn't remove F3 dir %s: %s", agent_dir / "tests", exc)

    return {
        "legacy_eval_dir": str(legacy_eval) if legacy_eval else None,
        "f3_dataset": str(f3_dataset) if f3_active else None,
        "output_path": str(out_path),
        "scenario_rows": len(scen_rows),
        "golden_rows": len(golden_rows),
        "f3_rows": len(f3_rows),
        "total_rows": len(rows),
        "metrics_copied": str(metrics_dst) if metrics_dst else None,
        "backup_dir": str(backup_dir) if backup_dir else None,
    }
