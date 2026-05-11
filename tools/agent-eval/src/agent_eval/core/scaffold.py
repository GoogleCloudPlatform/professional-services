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
"""Scaffolds the eval/ folder structure for a new agent project."""

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from rich.console import Console

console = Console()

# Starter metrics scaffolded when the user opts out of AI generation.
#
# CANONICAL SCHEMA — mirrors the six patterns from
# https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval
# See ``core/metric_schema.py`` for the full schema spec.
#
# Two managed adaptive rubrics + two binary custom_llm_judge metrics. The
# custom ones are deliberately decomposed into single-criterion binary checks
# (rather than 0-5 vibes) — the inter-rater-reliability research and the
# docs' own static rubric metrics (SAFETY, FINAL_RESPONSE_MATCH) both score
# this way. Re-shape the criteria/rating_scores when scaffolding for a
# different agent shape.
METRIC_TEMPLATES = {
    "general_quality": {
        "kind": "managed",
        "base": "GENERAL_QUALITY",
    },
    "trajectory_accuracy": {
        "kind": "custom_llm_judge",
        "requires_multi_turn": True,
        "instruction": (
            "Evaluate whether the agent's execution trajectory used the available "
            "tools correctly to address the user's request. Score 1 only if EVERY "
            "criterion below is met; 0 if any criterion fails."),
        "criteria": {
            "tool_existence": (
                "Every tool the agent called appears in the **Available Tools** list. "
                "Hallucinated tool names → 0."),
            "no_obvious_detour": (
                "The agent did not take an obvious detour or call an irrelevant tool "
                "before reaching the answer."),
        },
        "rating_scores": {
            "1": "Pass: both criteria met",
            "0": "Fail: at least one criterion not met",
        },
        "dataset_mapping": {
            "prompt": {
                "source_column": "user_inputs"
            },
            "response": {
                "source_column": "trace_summary"
            },
            "reference": {
                "source_column": "extracted_data:tool_declarations"
            },
        },
    },
    "tool_use_quality": {
        "kind": "custom_llm_judge",
        "instruction": (
            "Evaluate the agent's tool calls for correctness. Score 1 only if EVERY "
            "criterion below is met; 0 if any criterion fails. The tool list and "
            "actual call trace are in the **Reference** section."),
        "criteria": {
            "selection":
                "Each tool the agent chose is appropriate for the request.",
            "arguments":
                "Tool arguments are populated correctly (right keys, right types, no obvious typos).",
            "no_redundancy":
                "No duplicate / unnecessary tool calls.",
        },
        "rating_scores": {
            "1": "Pass: all three criteria met",
            "0": "Fail: at least one criterion not met",
        },
        "dataset_mapping": {
            "prompt": {
                "source_column": "user_inputs"
            },
            "response": {
                "source_column": "final_response"
            },
            "reference": {
                "template":
                    ("Available Tools: {extracted_data_tool_declarations}\n\n"
                     "Tool Calls: {extracted_data_tool_interactions}"),
                "source_columns": [
                    "extracted_data:tool_declarations",
                    "extracted_data:tool_interactions",
                ],
            },
        },
    },
    "safety": {
        "kind": "managed",
        "base": "SAFETY",
    },
}


def scaffold_eval_structure(
    target_dir: Path,
    agent_name: str = "app",
    mode: str = "both",
    metrics: list[str] | None = None,
    custom_metric_definitions: dict | None = None,
    ai_recommendations: dict | None = None,
) -> None:
    """Creates the eval/ folder structure with starter templates.

    Args:
        target_dir: Root directory of the agent project (eval/ is created here).
        agent_name: Agent module name (folder containing agent.py).
        mode: 'user-sim', 'diy', or 'both'.
        metrics: List of metric keys to include from METRIC_TEMPLATES.
        custom_metric_definitions: AI-generated metric definitions to merge in.
        ai_recommendations: Gemini's recommendations dict with scenarios/golden_data.
    """
    eval_dir = target_dir / "eval"
    has_ai = custom_metric_definitions is not None

    # Resolve which metrics to include
    metric_defs = {"metrics": {}}

    if custom_metric_definitions:
        # AI metrics provided — use ONLY what the AI generated (no forced defaults)
        for key, defn in custom_metric_definitions.items():
            if "agents" not in defn:
                defn["agents"] = [agent_name]
            metric_defs["metrics"][key] = defn
    else:
        # No AI metrics — use standard defaults
        if metrics is None:
            if mode == "diy":
                metrics = ["general_quality", "tool_use_quality", "safety"]
            else:
                metrics = [
                    "general_quality", "trajectory_accuracy",
                    "tool_use_quality", "safety"
                ]

        for key in metrics:
            if key in METRIC_TEMPLATES:
                defn = dict(METRIC_TEMPLATES[key])
                if "agents" not in defn:
                    defn["agents"] = [agent_name]
                metric_defs["metrics"][key] = defn

    # Create directories
    for d in [
            eval_dir, eval_dir / "metrics", eval_dir / "scenarios",
            eval_dir / "results"
    ]:
        d.mkdir(parents=True, exist_ok=True)

    # If AI content is provided and existing files exist, back them up
    backup_dir = None
    if has_ai:
        backed_up = _backup_existing_files(eval_dir, mode)
        if backed_up:
            backup_dir = backed_up
            console.print(
                f"  [dim]Previous files backed up to eval/.backup/[/]")

    display_prefix = str(eval_dir)

    _write_if_missing(eval_dir / "__init__.py", "")
    _write_if_missing(eval_dir / "results" / ".gitkeep", "")

    # ── Metrics ───────────────────────────────────────────────────────────
    metrics_path = eval_dir / "metrics" / "metric_definitions.json"
    if has_ai:
        # AI mode: always write (backup already taken if file existed)
        metrics_path.write_text(json.dumps(metric_defs, indent=2) + "\n")
        console.print(
            f"  [green]created[/]  {display_prefix}/metrics/metric_definitions.json"
        )
    else:
        existed = metrics_path.exists()
        _write_json_if_missing(metrics_path, metric_defs)
        status = "[yellow]kept[/]" if existed else "[green]created[/]"
        console.print(
            f"  {status}     {display_prefix}/metrics/metric_definitions.json")

    # ── Session input ─────────────────────────────────────────────────────
    session_path = eval_dir / "scenarios" / "session_input.json"
    session_input = {"app_name": agent_name, "user_id": "eval_user"}
    if session_path.exists():
        console.print(
            f"  [yellow]kept[/]     {display_prefix}/scenarios/session_input.json"
        )
    else:
        _write_json_if_missing(session_path, session_input)
        console.print(
            f"  [green]created[/]  {display_prefix}/scenarios/session_input.json"
        )

    # ── Scenarios ─────────────────────────────────────────────────────────
    if mode in ("user-sim", "both"):
        scenarios_path = eval_dir / "scenarios" / "conversation_scenarios.json"
        if has_ai and ai_recommendations and ai_recommendations.get(
                "scenarios"):
            # AI mode: write AI scenarios (backup already taken)
            ai_scenarios = _build_ai_scenarios(ai_recommendations["scenarios"])
            # If file didn't exist, start fresh; if it did, merge AI scenarios
            if scenarios_path.exists() and backup_dir:
                # Existing file was backed up — read old scenarios, append AI ones
                try:
                    old = json.loads(scenarios_path.read_text())
                    old_scenarios = old.get("scenarios", [])
                    merged = {
                        "scenarios": old_scenarios + ai_scenarios["scenarios"]
                    }
                    scenarios_path.write_text(
                        json.dumps(merged, indent=2) + "\n")
                except Exception:
                    scenarios_path.write_text(
                        json.dumps(ai_scenarios, indent=2) + "\n")
            else:
                scenarios_path.write_text(
                    json.dumps(ai_scenarios, indent=2) + "\n")
            console.print(
                f"  [green]created[/]  {display_prefix}/scenarios/conversation_scenarios.json"
            )
        elif not scenarios_path.exists():
            default_scenarios = {
                "scenarios": [{
                    "starting_prompt":
                        "Hello, I need help with something.",
                    "conversation_plan":
                        "Ask the agent about its capabilities. Follow up with a specific request.",
                }]
            }
            _write_json_if_missing(scenarios_path, default_scenarios)
            console.print(
                f"  [green]created[/]  {display_prefix}/scenarios/conversation_scenarios.json"
            )
        else:
            console.print(
                f"  [yellow]kept[/]     {display_prefix}/scenarios/conversation_scenarios.json"
            )

    # ── Golden dataset ────────────────────────────────────────────────────
    if mode in ("diy", "both"):
        (eval_dir / "eval_data").mkdir(parents=True, exist_ok=True)
        golden_path = eval_dir / "eval_data" / "golden_dataset.json"
        if has_ai and ai_recommendations and ai_recommendations.get(
                "golden_data"):
            # AI mode: write AI golden data (backup already taken)
            ai_golden = _build_ai_golden_data(ai_recommendations["golden_data"],
                                              agent_name)
            if golden_path.exists() and backup_dir:
                # Existing file was backed up — read old entries, append AI ones
                try:
                    old = json.loads(golden_path.read_text())
                    old_questions = old.get("golden_questions", [])
                    merged = {
                        "golden_questions":
                            old_questions + ai_golden["golden_questions"]
                    }
                    golden_path.write_text(json.dumps(merged, indent=2) + "\n")
                except Exception:
                    golden_path.write_text(
                        json.dumps(ai_golden, indent=2) + "\n")
            else:
                golden_path.write_text(json.dumps(ai_golden, indent=2) + "\n")
            console.print(
                f"  [green]created[/]  {display_prefix}/eval_data/golden_dataset.json"
            )
        elif not golden_path.exists():
            default_golden = {
                "golden_questions": [{
                    "id": "test_001",
                    "user_inputs": ["Hello, what can you help me with?"],
                    "agents_evaluated": [agent_name],
                    "metadata": {
                        "description": "Basic capability check"
                    },
                    "reference_data": {
                        "expected_behavior":
                            "Agent should describe its capabilities"
                    },
                }]
            }
            _write_json_if_missing(golden_path, default_golden)
            console.print(
                f"  [green]created[/]  {display_prefix}/eval_data/golden_dataset.json"
            )
        else:
            console.print(
                f"  [yellow]kept[/]     {display_prefix}/eval_data/golden_dataset.json"
            )

    console.print(f"  [green]created[/]  {display_prefix}/results/.gitkeep")

    if backup_dir:
        console.print()
        console.print(
            f"  [dim]Your previous files are in:[/]  [cyan]{backup_dir}[/]")
        console.print(
            f"  [dim]Delete when satisfied:[/]       rm -rf {backup_dir}")


def _build_ai_scenarios(scenario_recs: list) -> dict:
    """Convert Gemini's scenario recommendations to conversation_scenarios.json format."""
    scenarios = []
    for s in scenario_recs:
        scenario = {}
        if s.get("starting_prompt"):
            scenario["starting_prompt"] = s["starting_prompt"]
        else:
            scenario["starting_prompt"] = s.get("description", "Hello")
        if s.get("conversation_plan"):
            scenario["conversation_plan"] = s["conversation_plan"]
        else:
            scenario["conversation_plan"] = s.get("description",
                                                  "Follow the agent's lead.")
        scenarios.append(scenario)
    return {"scenarios": scenarios}


def _build_ai_golden_data(golden_recs: list, agent_name: str) -> dict:
    """Convert Gemini's golden data recommendations to golden_dataset.json format."""
    questions = []
    for i, g in enumerate(golden_recs, 1):
        user_inputs = g.get("user_inputs", [])
        if not user_inputs and g.get("description"):
            user_inputs = [g["description"]]
        ref = g.get("reference_data", {})
        expected = ref.get("expected_behavior", "") if isinstance(ref,
                                                                  dict) else ""
        if not expected:
            expected = g.get("expected_behavior", g.get("description", ""))
        questions.append({
            "id": f"ai_generated_{i:03d}",
            "user_inputs": user_inputs,
            "agents_evaluated": [agent_name],
            "metadata": {
                "description": g.get("description", "")
            },
            "reference_data": {
                "expected_behavior": expected
            },
        })
    return {"golden_questions": questions}


def _backup_existing_files(eval_dir: Path, mode: str) -> Path | None:
    """Back up existing eval files before AI overwrites them.

    Returns the backup directory path if any files were backed up, else None.
    """
    files_to_backup = [eval_dir / "metrics" / "metric_definitions.json"]
    if mode in ("user-sim", "both"):
        files_to_backup.append(eval_dir / "scenarios" /
                               "conversation_scenarios.json")
    if mode in ("diy", "both"):
        files_to_backup.append(eval_dir / "eval_data" / "golden_dataset.json")

    existing = [f for f in files_to_backup if f.exists()]
    if not existing:
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = eval_dir / ".backup" / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    for f in existing:
        rel = f.relative_to(eval_dir)
        dest = backup_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dest)

    return backup_dir


def scaffold_metrics_only(
    target_dir: Path,
    agent_name: str = "app",
    metrics: list[str] | None = None,
    custom_metric_definitions: dict | None = None,
    *,
    if_exists: str = "backup_and_overwrite",
) -> None:
    """Scaffold ``<project_root>/tests/eval/metrics/metric_definitions.json``.

    Writes at the agent's project root (parent of the ``app/`` module dir
    in standard ASP layout) — NOT inside the agent module. Pre-rescue this
    landed in ``<agent_dir>/tests/eval/`` which created the F3 confusion.

    The file content is minimal (just ``metrics``) — editing instructions and
    rationale belong in the CLI experience (see ``_metric_review_guide`` in
    ``cli/commands/init.py``), not embedded in the user's data file.

    ``if_exists`` controls behavior when the target file already exists:
      - ``"backup_and_overwrite"`` (default) — back up to ``.backup/`` then write
      - ``"skip"`` — leave the existing file alone, log "kept"
      - ``"overwrite"`` — overwrite without backup
    """
    from agent_eval.core.path_resolver import agent_project_root
    project_root = agent_project_root(target_dir)
    eval_dir = project_root / "tests" / "eval"
    metric_defs: dict = {"metrics": {}}

    if custom_metric_definitions:
        for key, defn in custom_metric_definitions.items():
            if "agents" not in defn:
                defn["agents"] = [agent_name]
            metric_defs["metrics"][key] = defn
    else:
        if metrics is None:
            metrics = ["general_quality", "tool_use_quality", "safety"]
        for key in metrics:
            if key in METRIC_TEMPLATES:
                defn = dict(METRIC_TEMPLATES[key])
                if "agents" not in defn:
                    defn["agents"] = [agent_name]
                metric_defs["metrics"][key] = defn

    (eval_dir / "metrics").mkdir(parents=True, exist_ok=True)
    (eval_dir / "results").mkdir(parents=True, exist_ok=True)
    _write_if_missing(eval_dir / "results" / ".gitkeep", "")

    metrics_path = eval_dir / "metrics" / "metric_definitions.json"
    if metrics_path.exists():
        if if_exists == "skip":
            console.print(
                f"  [yellow]kept[/]     {eval_dir}/metrics/metric_definitions.json  "
                f"[dim](already on disk; not overwriting)[/]")
            return
        if if_exists == "backup_and_overwrite" and custom_metric_definitions:
            backup = _backup_existing_files(eval_dir, mode="dataset-only")
            if backup:
                console.print(
                    f"  [dim]Previous metrics backed up to tests/eval/.backup/[/]"
                )
        if if_exists == "backup_and_overwrite" and not custom_metric_definitions:
            console.print(
                f"  [yellow]kept[/]     {eval_dir}/metrics/metric_definitions.json"
            )
            return
    metrics_path.write_text(json.dumps(metric_defs, indent=2) + "\n")
    console.print(
        f"  [green]created[/]  {eval_dir}/metrics/metric_definitions.json")
    console.print(f"  [green]created[/]  {eval_dir}/results/.gitkeep")


def _rows_from_recommendations(
    recommendations: dict | None,
    session_inputs: dict,
) -> list[dict]:
    """Convert Gemini's recommendations dict into unified dataset.jsonl rows.

    Each row carries an explicit ``kind`` field (``"multi_turn"`` /
    ``"single_turn"`` / ``"both"``) so the user can tell at a glance what
    drives what — and ``detect_capabilities`` can read it instead of
    inferring from field presence.

    Field shape:
    - **Multi-turn rows**: ``prompt`` + ``conversation_plan`` (a LIST of
      strings, one per follow-up turn — NOT a numbered string). Drive
      ``simulate``.
    - **Single-turn rows**: ``prompt`` + nested ``reference_data`` dict.
      Drive ``interact`` and ``agent-engine``. ``reference_data.expected_behavior``
      is also mirrored to the SDK-canonical top-level ``reference`` column for
      managed metrics like FINAL_RESPONSE_MATCH.
    - **Both**: a row that has both ``conversation_plan`` AND ``reference_data``
      drives both paths. Not generated by the AI today, but the format supports
      it for hand-edited rows.

    Every row gets the supplied ``session_inputs``.
    """
    rows: list[dict] = []
    if not recommendations:
        return rows

    # Key ORDER on every row: kind → id → prompt → session_inputs → ...
    # This puts the row's identity (what it is + which one) at the top so
    # the file is scannable. The id-at-the-end pre-2026-05-01 made it hard
    # to spot where one row ended and the next began when scrolling JSONL.
    for i, scen in enumerate(recommendations.get("scenarios") or [], 1):
        prompt = scen.get("starting_prompt") or scen.get("description") or ""
        if not prompt:
            continue
        row: dict = {
            "kind": "multi_turn",
            "id": scen.get("id") or f"multi_turn_{i:03d}",
            "prompt": prompt,
            "session_inputs": session_inputs,
        }
        plan = scen.get("conversation_plan")
        if plan is not None:
            # Coerce to LIST regardless of what Gemini returned. Some prompts
            # still slip through with a numbered string; ADK's UserSim then
            # iterates over CHARACTERS instead of turns. Defensive parse:
            # split on numbered markers ("1. ", "2. ", ...) or newlines.
            row["conversation_plan"] = _coerce_conversation_plan_to_list(plan)
        # Preserve reference_data on multi-turn rows when present. This
        # supports metrics that flag BOTH requires_multi_turn AND
        # requires_reference (e.g. "judge the trajectory AND compare the
        # final answer to a known-good route"). The simulate→convert
        # pipeline propagates this through to the saved interaction row
        # via _build_prompt_to_reference_map() in run.py.
        scen_ref_data = {
            k: v
            for k, v in (scen.get("reference_data") or {}).items()
            if v not in (None, "", [], {})
        }
        if scen_ref_data:
            row["reference_data"] = scen_ref_data
        rows.append(row)

    for i, g in enumerate(recommendations.get("golden_data") or [], 1):
        user_inputs = g.get("user_inputs") or []
        if not user_inputs and g.get("description"):
            user_inputs = [g["description"]]
        if not user_inputs:
            continue
        row = {
            "kind": "single_turn",
            "id": g.get("id") or f"single_turn_{i:03d}",
            "prompt": user_inputs[-1],
            "session_inputs": session_inputs,
        }
        if len(user_inputs) > 1:
            # SDK FLATTEN canonical column name. Older code used
            # 'conversation_history'; both still parse but 'history' is
            # the wire form so writing it directly avoids a translation.
            row["history"] = [{
                "role": "user",
                "parts": [{
                    "text": t
                }]
            } for t in user_inputs[:-1]]
        # Keep reference_data NESTED — single source of truth for
        # golden-comparison metrics. The evaluator's per-metric
        # `reference_data:<field>` source columns + the
        # SDK_COLUMN_DEFAULTS["reference"] = "reference_data:expected_behavior"
        # default in metric_schema.py wire it up. We do NOT mirror to a
        # top-level `reference` column anymore (pre-2026-05-02 behavior) —
        # the duplication forced a "don't hand-edit reference" caveat in
        # the editing guide and risked silent desync when users edited
        # one but not the other.
        ref_data = {
            k: v
            for k, v in (g.get("reference_data") or {}).items()
            if v not in (None, "", [], {})
        }
        if ref_data:
            row["reference_data"] = ref_data
        rows.append(row)

    return rows


def _coerce_conversation_plan_to_list(plan: Any) -> list[str]:
    """Normalize ``conversation_plan`` to a list of turn strings.

    Defensive against Gemini returning a numbered string instead of a JSON
    array (common slip even when the prompt explicitly asks for an array).
    Without this, ADK's UserSim iterates over individual characters of the
    string and the simulation breaks.
    """
    import re as _re
    if isinstance(plan, list):
        return [str(t).strip() for t in plan if str(t).strip()]
    if isinstance(plan, str):
        # Try splitting on numbered markers first ("1. ", "2. ", ...)
        parts = _re.split(r"\s*\n?\s*\d+\.\s+", plan)
        cleaned = [p.strip() for p in parts if p.strip()]
        if len(cleaned) > 1:
            return cleaned
        # Fall back to newline splitting
        cleaned = [p.strip() for p in plan.splitlines() if p.strip()]
        if cleaned:
            return cleaned
        return [plan.strip()]
    return []


def scaffold_dataset_jsonl(
    target_dir: Path,
    agent_name: str = "app",
    *,
    recommendations: dict | None = None,
) -> None:
    """Scaffold the unified ``<project_root>/tests/eval/dataset.jsonl``.

    This is the single source of truth for evaluation data — consumed by
    ``simulate`` (multi-turn rows), ``interact`` (single-turn rows), and
    ``agent-engine`` (single-turn rows; multi-turn skipped with a clear
    message). Writes at the project root (parent of the agent module in
    ASP layout), NOT inside the agent module dir.

    When ``recommendations`` carries Gemini-generated ``scenarios`` and/or
    ``golden_data``, those are converted into rows so the user starts with
    realistic data — the existing file is backed up and replaced so
    re-running ``init --ai-metrics`` refreshes content. Without
    recommendations, an existing file is preserved and only fresh projects
    get the 2-row starter.
    """
    from agent_eval.core.path_resolver import agent_project_root
    project_root = agent_project_root(target_dir)
    dataset_path = project_root / "tests" / "eval" / "dataset.jsonl"

    session_inputs = {
        "app_name": agent_name,
        "user_id": "eval_user",
        "state": {}
    }
    ai_rows = _rows_from_recommendations(recommendations, session_inputs)

    if dataset_path.exists() and not ai_rows:
        console.print(f"  [yellow]kept[/]     {dataset_path}")
        return

    if dataset_path.exists() and ai_rows:
        backup_root = project_root / "tests" / "eval" / ".backup" / datetime.now(
        ).strftime("%Y%m%d_%H%M%S")
        backup_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dataset_path, backup_root / "dataset.jsonl")
        console.print(f"  [dim]Previous dataset backed up to {backup_root}[/]")

    rows = ai_rows or [
        {
            "prompt": "Hello, what can you help me with?",
            "session_inputs": session_inputs
        },
        {
            "prompt": "Walk me through one of your most common tasks.",
            "session_inputs": session_inputs
        },
    ]

    dataset_path.parent.mkdir(parents=True, exist_ok=True)
    with dataset_path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    console.print(
        f"  [green]created[/]  {dataset_path} [dim]({len(rows)} rows)[/]")


def _write_if_missing(path: Path, content: str) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)


def _write_json_if_missing(path: Path, data: dict) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2) + "\n")
