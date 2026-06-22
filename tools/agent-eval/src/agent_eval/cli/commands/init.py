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
"""agent-eval init — scaffold the eval/ folder structure for a new agent project."""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import click
import questionary
from rich.console import Console
from rich.panel import Panel
from rich.prompt import IntPrompt, Prompt
from rich.rule import Rule
from rich.table import Table

from agent_eval.cli._pacing import (
    _PAUSE_LONG,
    _continue,
    _pause,
    _pauses_disabled,
    styled_pager,
)
from agent_eval.core.metric_schema import is_managed_entry, managed_base_name

# ---------------------------------------------------------------------------
# Iterative review (Phase D4): show generated artifact → explain → wait →
# detect manual edits → diff → carry edited content into downstream steps.
# Customer feedback 2026-04-25: "the init experience shouldn't be waiting
# for the end to generate all the files, it should include the user more,
# … explain what every part of that file means … so that the user can
# correct if needed."
# ---------------------------------------------------------------------------


def _hash_file(path: Path) -> str:
    """SHA-256 of the file bytes — used to detect manual edits between
    when we showed the file and when the user pressed Enter to continue."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _parse_artifact(path: Path) -> Any:
    """Parse the artifact file. JSON for .json, JSONL for .jsonl, raw text otherwise."""
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        return json.loads(text)
    if path.suffix == ".jsonl":
        rows = []
        for lineno, line in enumerate(text.splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise json.JSONDecodeError(
                    f"line {lineno}: {exc.msg}",
                    line,
                    exc.pos,
                )
        return rows
    return text


def _summarize_diff(before: Any, after: Any) -> List[str]:
    """Render a short human-readable diff for the artifact. Limited to
    common shapes (dict-of-metrics for metric_definitions; list-of-rows
    for dataset.jsonl). Returns a list of bullet lines."""
    lines: List[str] = []

    if isinstance(before, dict) and isinstance(after, dict):
        b_metrics = (before.get("metrics") or {}) if "metrics" in before else before
        a_metrics = (after.get("metrics") or {}) if "metrics" in after else after
        if isinstance(b_metrics, dict) and isinstance(a_metrics, dict):
            removed = sorted(set(b_metrics) - set(a_metrics))
            added = sorted(set(a_metrics) - set(b_metrics))
            modified = sorted(
                k
                for k in (set(b_metrics) & set(a_metrics))
                if b_metrics.get(k) != a_metrics.get(k)
            )
            for name in added:
                lines.append(f"[green]+ added[/]    {name}")
            for name in removed:
                lines.append(f"[red]− removed[/]  {name}")
            for name in modified:
                lines.append(f"[yellow]~ updated[/]  {name}")

    if isinstance(before, list) and isinstance(after, list):
        delta = len(after) - len(before)
        if delta > 0:
            lines.append(
                f"[green]+ added[/]    {delta} row(s) (now {len(after)} total)"
            )
        elif delta < 0:
            lines.append(f"[red]− removed[/]  {-delta} row(s) (now {len(after)} total)")
        else:
            lines.append(f"[yellow]~ same row count[/] ({len(after)}); content edited")

    if not lines:
        lines.append("[yellow]~ file changed[/] (couldn't structurally diff)")

    return lines


def _review_artifact(
    path: Path,
    *,
    explanation: Callable[[], None],
    title: str,
    auto_approve: bool,
) -> Tuple[bool, Optional[Any]]:
    """Show ``path``, run ``explanation()``, wait, detect edits, parse + diff.

    Returns ``(was_edited, parsed_content)``. When ``was_edited`` is True
    the caller MUST replace its in-memory model with ``parsed_content`` so
    downstream steps see the user's edits. When False, ``parsed_content``
    is None — caller keeps using its existing in-memory model.
    """
    if auto_approve or not path.exists():
        return False, None

    pre_hash = _hash_file(path)

    console.print()
    console.print(f"  [bold]Take a look — {title}:[/]")
    console.print(f"    [cyan]{path}[/]")
    console.print()
    explanation()
    console.print()
    _continue(
        "Open the file, edit anything that doesn't fit. When you're done, continue →",
        console=console,
    )

    if not path.exists():
        # User deleted the file mid-review
        console.print(
            f"  [yellow]![/] {path.name} no longer exists; restoring not implemented yet."
        )
        return False, None

    post_hash = _hash_file(path)
    if pre_hash == post_hash:
        console.print("  [dim]No edits — continuing with the generated version.[/]")
        snap = path.with_suffix(path.suffix + ".gen")
        if snap.exists():
            try:
                snap.unlink()
            except OSError:
                pass
        return False, None

    # Try to re-parse the user's edits.
    try:
        parsed = _parse_artifact(path)
    except json.JSONDecodeError as exc:
        console.print(
            f"  [red]Couldn't re-parse {path.name}:[/] {exc.msg} (at offset {exc.pos})\n"
            f"  [dim]Fix the file and re-run `agent-eval init`, or restore the AI version "
            f"from a backup under tests/eval/.backup/.[/]"
        )
        raise click.Abort()

    # Diff against the generated version, then clean up the snapshot so it
    # doesn't litter the user's tests/eval/ directory.
    snapshot_path = path.with_suffix(path.suffix + ".gen")
    try:
        before = _parse_artifact(snapshot_path)
    except FileNotFoundError:
        before = None
    if before is not None:
        diff_lines = _summarize_diff(before, parsed)
        console.print(f"  [green]✓ Picked up your edits to {path.name}:[/]")
        for line in diff_lines:
            console.print(f"      {line}")
    else:
        console.print(f"  [green]✓ Picked up your edits to {path.name}.[/]")

    if snapshot_path.exists():
        try:
            snapshot_path.unlink()
        except OSError:
            pass

    return True, parsed


def _save_generated_snapshot(path: Path) -> None:
    """Save a sibling ``.gen`` snapshot before showing the file to the user.

    Used by ``_review_artifact`` to compute a diff against the AI baseline.
    Cleaned up after the review completes (success or skip-without-edit).
    """
    snapshot = path.with_suffix(path.suffix + ".gen")
    snapshot.write_bytes(path.read_bytes())


# ── Metric review pause: editing guide + validation gate ────────────────────
#
# When ``init`` materializes ``metric_definitions.json`` between Call 2 (metric
# generation) and Call 3 (test data generation), it pauses for the user to
# review/edit the file. The functions below render the in-CLI editing guide
# (no JSON noise — kept out of the file itself), validate the user's edits
# against the canonical schema, and extract the reference-data field names
# the next step needs to know about.


def _render_metric_review_guide(
    custom_metrics: Dict[str, Any],
    rationale: str,
    metrics_path: Path,
) -> None:
    """Show the user what's in the file + what they can/can't edit.

    Called by ``_review_artifact`` as its ``explanation`` callback during
    the metrics review pause. Stays in the CLI — never embedded in the
    file itself, so the user's metric_definitions.json stays clean.
    """
    from agent_eval.core.metric_schema import is_managed_entry, managed_base_name

    n = len(custom_metrics)
    plural = "metric" if n == 1 else "metrics"
    console.print(
        f"  [bold]{n} {plural}[/] will score every row in your dataset.jsonl."
    )

    # Compact per-metric summary so the user knows what each entry does.
    summary = Table(show_header=False, box=None, padding=(0, 2), show_edge=False)
    summary.add_column(style="bold cyan", min_width=24)
    summary.add_column(style="dim")
    for name, defn in custom_metrics.items():
        if is_managed_entry(defn):
            base = managed_base_name(defn) or "?"
            summary.add_row(name, f"managed · base: {base}")
        elif defn.get("kind") == "custom_llm_judge":
            n_crit = len(defn.get("criteria") or {})
            scores = sorted((defn.get("rating_scores") or {}).keys())
            scale = (
                "binary 0/1"
                if scores == ["0", "1"]
                else f"scale {scores[0]}-{scores[-1]}"
                if scores
                else "?"
            )
            tags = []
            if defn.get("requires_reference"):
                tags.append("reference rows")
            if defn.get("requires_multi_turn"):
                tags.append("multi-turn rows")
            tag_str = f" · {' · '.join(tags)}" if tags else ""
            summary.add_row(name, f"custom · {n_crit} criteria · {scale}{tag_str}")
        else:
            summary.add_row(name, f"kind: {defn.get('kind', '?')}")
    console.print(summary)

    if rationale:
        console.print()
        console.print("  [bold]Why these metrics[/] [dim](Gemini's reasoning):[/]")
        for line in rationale.strip().splitlines():
            console.print(f"    [dim]│[/] {line}")

    console.print()
    console.print("  [bold]What you can edit freely[/]")
    console.print("    [green]✓[/] Add or remove entries under [cyan]metrics[/]")
    console.print(
        "    [green]✓[/] For [cyan]custom_llm_judge[/] metrics — edit [cyan]instruction[/], [cyan]criteria[/], [cyan]rating_scores[/]"
    )
    console.print(
        '        [dim italic](keep [cyan]rating_scores[/] [dim italic]binary[/] [cyan]{"1":"Pass…","0":"Fail…"}[/] [dim italic]for reliable scoring)[/]'
    )
    console.print(
        "    [green]✓[/] Toggle [cyan]requires_reference: true[/] / [cyan]requires_multi_turn: true[/]"
    )
    console.print(
        "    [green]✓[/] Tweak [cyan]dataset_mapping[/] to point at different source columns"
    )
    console.print()
    console.print("  [bold]What you must keep[/]")
    console.print(
        "    [red]✗[/] Don't drop [cyan]kind[/] — it tells the evaluator how to build the SDK metric"
    )
    console.print(
        "    [red]✗[/] For [cyan]managed[/] — [cyan]base[/] must be a valid Vertex SDK metric name (uppercase)"
    )
    console.print(
        "    [red]✗[/] For [cyan]custom_llm_judge[/] — [cyan]criteria[/] + [cyan]rating_scores[/] are required"
    )
    console.print()
    console.print("  [bold]What happens next[/]")
    console.print(
        "    [dim]>[/] When you continue, we'll generate a [cyan]dataset.jsonl[/] [bold]designed to[/]"
    )
    console.print(
        "    [dim]>[/] [bold]exercise these metrics[/] — every test row will be relevant to what's here."
    )
    console.print(
        "    [dim]>[/] If you change a metric now, the test data will reflect it."
    )


def _validate_user_edited_metrics(parsed: Any) -> List[str]:
    """Re-validate a user-edited metric_definitions.json against the canonical schema.

    Returns a list of plain-English error messages (empty when clean). Each
    message names the offending metric + what's wrong + the canonical fix —
    no stack traces, no JSON paths.
    """
    from agent_eval.core.metric_generator import _validate_single_metric

    errors: List[str] = []
    if not isinstance(parsed, dict):
        return ["The file's top-level shape is wrong — expected a JSON object."]
    metrics = parsed.get("metrics")
    if not isinstance(metrics, dict):
        return [
            "Missing or invalid [cyan]metrics[/] key — the file must look like "
            '[cyan]{"metrics": {...}}[/] with each metric as a key inside.'
        ]
    if not metrics:
        return [
            "[cyan]metrics[/] is empty — the eval pipeline needs at least one metric to score against."
        ]
    for name, defn in metrics.items():
        per_metric_errors = _validate_single_metric(name, defn)
        for err in per_metric_errors:
            # _validate_single_metric returns "'name': details" — strip the quotes
            # for cleaner CLI output.
            cleaned = err.replace(f"'{name}':", "").strip()
            errors.append(f"[bold cyan]{name}[/] — {cleaned}")
    return errors


def _required_reference_fields(custom_metrics: Dict[str, Any]) -> List[Tuple[str, str]]:
    """Extract (metric_name, reference_data_field) pairs from the metrics dict.

    The data-generation step needs this to know which ``reference_data:<field>``
    keys MUST be populated in the generated golden_data rows. Without this,
    Gemini might default to ``expected_behavior`` even when the metrics expect
    ``expected_docs`` / ``expected_route`` / etc. — leading to silent
    every-row-skipped behavior at evaluation time.

    Returns pairs like ``[("document_retrieval_success", "expected_docs"),
    ("subagent_routing_accuracy", "expected_route")]``. Empty when no metric
    needs reference data.
    """
    pairs: List[Tuple[str, str]] = []
    for name, defn in custom_metrics.items():
        if not isinstance(defn, dict):
            continue
        # Custom LLM judge with requires_reference + reference_data:<field> mapping
        for placeholder, mapping in (defn.get("dataset_mapping") or {}).items():
            if isinstance(mapping, dict):
                col = mapping.get("source_column", "")
                if isinstance(col, str) and col.startswith("reference_data:"):
                    field = col.split(":", 1)[1]
                    if field:
                        pairs.append((name, field))
        # Managed metric with explicit reference_field declaration
        ref_field = defn.get("reference_field")
        if isinstance(ref_field, str) and ref_field:
            pairs.append((name, ref_field))
    # Dedupe while preserving order.
    seen: set = set()
    unique: List[Tuple[str, str]] = []
    for pair in pairs:
        if pair not in seen:
            seen.add(pair)
            unique.append(pair)
    return unique


def _review_with_validation_loop(
    metrics_path: Path,
    *,
    custom_metrics: Dict[str, Any],
    rationale: str,
    auto_approve: bool,
) -> Dict[str, Any]:
    """Wrap ``_review_artifact`` with a validation gate that loops on errors.

    After the user edits the file, re-validate against the canonical schema.
    If invalid, surface the errors in plain English and let them fix-and-retry.
    Returns the final (possibly user-edited) metrics dict ready for Call 3.
    """
    while True:
        if auto_approve or not metrics_path.exists():
            return custom_metrics

        _save_generated_snapshot(metrics_path)
        edited, parsed = _review_artifact(
            metrics_path,
            explanation=lambda: _render_metric_review_guide(
                custom_metrics, rationale, metrics_path
            ),
            title="here's what each metric does + open the file to tweak before we generate test data",
            auto_approve=auto_approve,
        )

        if not edited:
            return custom_metrics

        errors = _validate_user_edited_metrics(parsed)
        if not errors:
            edited_metrics = parsed.get("metrics") or {}
            return {k: v for k, v in edited_metrics.items() if isinstance(v, dict)}

        # Validation failed — surface errors and let user retry.
        console.print()
        console.print(
            f"  [yellow]·[/] [bold]Found {len(errors)} issue(s) in your edits.[/] "
            "[dim]Fix them so the eval pipeline doesn't break:[/]"
        )
        for err in errors:
            console.print(f"    [red]✗[/] {err}")
        console.print()
        console.print(
            "    [bold]1.[/] [green]Edit again[/] — fix the file and continue"
        )
        console.print(
            "    [bold]2.[/] [yellow]Restore the AI version[/] — discard your edits, use what Gemini generated"
        )
        console.print("    [bold]3.[/] [red]Abort init[/] — exit and fix later")
        console.print()
        try:
            choice = IntPrompt.ask("  Select", default=1)
        except (KeyboardInterrupt, EOFError):
            raise click.Abort()
        while choice not in (1, 2, 3):
            choice = IntPrompt.ask("  Select", default=1)

        if choice == 2:
            # Restore from .gen snapshot (saved before the user's edits).
            snapshot = metrics_path.with_suffix(metrics_path.suffix + ".gen")
            if snapshot.exists():
                metrics_path.write_text(snapshot.read_text())
                snapshot.unlink()
                console.print("  [green]>[/] Restored the Gemini-generated version.")
            return custom_metrics
        if choice == 3:
            console.print("  [dim]Aborting init. Re-run when you're ready.[/]")
            raise click.Abort()
        # choice == 1 → loop back to the review pause


def _validate_dataset_against_metrics(
    dataset_path: Path,
    custom_metrics: Dict[str, Any],
) -> List[str]:
    """Check that ``dataset.jsonl`` actually feeds every metric the user picked.

    The dangerous case is a metric with ``requires_reference: true`` that needs
    ``reference_data:expected_docs`` populated — but every generated row has
    only ``expected_behavior``. The metric silently skips every row at
    evaluation time and the user sees no signal for it. This validator catches
    those gaps before the user runs ``evaluate``.

    Returns plain-English warning strings (empty when clean).
    """
    warnings: List[str] = []
    rows: List[dict] = []
    try:
        with dataset_path.open() as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
    except Exception as exc:
        return [f"Couldn't parse dataset.jsonl: {exc}"]
    if not rows:
        return ["dataset.jsonl is empty — no rows to evaluate."]

    # Per-metric required reference field check — the gap-2 fix.
    required_fields = _required_reference_fields(custom_metrics)
    for metric_name, field in required_fields:
        rows_with_field = [
            r
            for r in rows
            if isinstance(r.get("reference_data"), dict)
            and r["reference_data"].get(field) not in (None, "", [], {})
        ]
        if rows_with_field:
            continue
        # Specifically check whether the field is misplaced as a top-level
        # row column (a common Gemini slip — see scaffold._rows_from_recommendations
        # comments). If so, surface the exact fix instead of a generic warning.
        rows_with_field_top_level = [
            r for r in rows if r.get(field) not in (None, "", [], {})
        ]
        if rows_with_field_top_level:
            warnings.append(
                f"[bold cyan]{metric_name}[/] needs [cyan]reference_data.{field}[/] populated, "
                f"but [bold]{len(rows_with_field_top_level)} row(s)[/] have it as a "
                f"[cyan]top-level[/] field instead. Move [cyan]{field}[/] inside a nested "
                f"[cyan]reference_data: {{...}}[/] dict on each row."
            )
        else:
            warnings.append(
                f"[bold cyan]{metric_name}[/] needs [cyan]reference_data.{field}[/] populated, "
                f"but no row has it — the metric will skip every row at evaluate time."
            )

    # Multi-turn metric needs multi-turn rows to score against.
    multi_turn_metrics = [
        n
        for n, d in custom_metrics.items()
        if isinstance(d, dict) and d.get("requires_multi_turn")
    ]
    if multi_turn_metrics:
        has_multi_turn = any(
            (r.get("history") or r.get("conversation_plan")) for r in rows
        )
        if not has_multi_turn:
            names = ", ".join(f"[cyan]{n}[/]" for n in multi_turn_metrics)
            warnings.append(
                f"{names} need multi-turn rows, but no row has [cyan]history[/] or "
                f"[cyan]conversation_plan[/] — those metrics will skip every row."
            )

    # Metrics flagging BOTH `requires_multi_turn` AND `requires_reference`
    # need at least one row that has BOTH a multi-turn flow AND populated
    # reference_data. The evaluator handles per-row routing — but the data
    # generator may not have produced such a row. Soft warning with the two
    # actionable fixes (add reference_data to a multi-turn row, OR drop one
    # flag). NOT a blocker — both shapes are fully supported at runtime.
    both_flagged_metrics = [
        (n, d)
        for n, d in custom_metrics.items()
        if isinstance(d, dict)
        and d.get("requires_multi_turn")
        and d.get("requires_reference")
    ]
    if both_flagged_metrics:
        has_both_in_dataset = any(
            (r.get("history") or r.get("conversation_plan"))
            and isinstance(r.get("reference_data"), dict)
            and any(
                v for v in r["reference_data"].values() if v not in (None, "", [], {})
            )
            for r in rows
        )
        if not has_both_in_dataset:
            names = ", ".join(f"[cyan]{n}[/]" for n, _ in both_flagged_metrics)
            warnings.append(
                f"{names} flag BOTH [cyan]requires_multi_turn[/] AND "
                f"[cyan]requires_reference[/], but no row has both. "
                f"Two fixes (either works): "
                f"(1) add a [cyan]reference_data[/] block to a multi-turn row in "
                f"[cyan]dataset.jsonl[/] populating the field this metric reads, OR "
                f"(2) drop one flag from the metric definition."
            )

    return warnings


def _review_dataset_with_validation(
    dataset_path: Path,
    *,
    custom_metrics: Dict[str, Any],
    auto_approve: bool,
) -> None:
    """Wrap the dataset review pause with the coverage validation gate.

    Loops on warnings: if a metric won't have data to score, give the user
    Edit again / Continue anyway. Even on the first iteration (no edits yet)
    the validator runs — Gemini may have generated a dataset that doesn't
    cover all the metrics' required fields.
    """
    while True:
        if auto_approve or not dataset_path.exists():
            return

        _save_generated_snapshot(dataset_path)
        _review_artifact(
            dataset_path,
            explanation=lambda: _explain_dataset_file(dataset_path),
            title="here's what each row drives in the eval pipeline",
            auto_approve=auto_approve,
        )

        warnings = _validate_dataset_against_metrics(dataset_path, custom_metrics)
        if not warnings:
            return  # clean — continue

        console.print()
        console.print(
            f"  [yellow]·[/] [bold]Found {len(warnings)} coverage issue(s) in your dataset.[/] "
            "[dim]Some metrics won't have rows to score:[/]"
        )
        for w in warnings:
            console.print(f"    [yellow]![/] {w}")
        console.print()
        console.print(
            "    [bold]1.[/] [green]Edit again[/] — populate the missing fields and continue"
        )
        console.print(
            "    [bold]2.[/] [yellow]Continue anyway[/] — those metrics will skip rows; you'll see warnings at evaluate time"
        )
        console.print()
        try:
            choice = IntPrompt.ask("  Select", default=1)
        except (KeyboardInterrupt, EOFError):
            return
        while choice not in (1, 2):
            choice = IntPrompt.ask("  Select", default=1)

        if choice == 2:
            return  # continue with warnings
        # choice == 1 → loop back to the review pause


console = Console()

# Directories to skip when searching for agent.py
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

INTERACTION_MODES = [
    (
        "both",
        "Both (recommended)",
        "Generates files for both methods — use whichever fits when you're ready.",
    ),
    (
        "user-sim",
        "ADK User Sim (multi-turn)",
        "An LLM plays the role of a user, following scenario scripts you define.\n"
        "       Best for: conversational agents with back-and-forth dialogue.",
    ),
    (
        "diy",
        "DIY Interactions (single-turn)",
        "You send specific queries from a golden dataset to a running agent.\n"
        "       Best for: pipeline agents, deployed endpoints, or regression testing.",
    ),
]

STARTER_METRICS = [
    (
        "general_quality",
        "General Quality",
        "Overall response quality (Vertex AI built-in)",
        True,
    ),
    (
        "trajectory_accuracy",
        "Trajectory Accuracy",
        "Did the agent call the right tools in the right order?",
        True,
    ),
    (
        "tool_use_quality",
        "Tool Use Quality",
        "Were tool arguments correct and calls non-redundant?",
        False,
    ),
    ("safety", "Safety", "Safety compliance check (Vertex AI built-in)", False),
]


def _find_agents(search_dir: Path) -> list[tuple[str, Path]]:
    """Find ADK agents by looking for agent.py files.

    Returns a list of (agent_module_name, agent_module_dir) tuples.
    Sub-agents (inside sub_agents/ directories) are excluded — they run as
    part of a parent agent and should be evaluated through the parent.
    """
    agents = []
    for agent_py in sorted(search_dir.rglob("agent.py")):
        if any(part in _SKIP_DIRS for part in agent_py.parts):
            continue
        module_dir = agent_py.parent
        agents.append((module_dir.name, module_dir))
    return agents


# ── Welcome preamble ──────────────────────────────────────────────────────


def _display_intro() -> None:
    """Brief, oriented welcome shown right after the banner.

    The goal: tell the user the *shape* of what's about to happen so the
    rest of the flow lands with context. No surprises, no sudden labels.
    """
    console.print()
    console.print("  [bold]Setting up evaluation for your agent.[/]")
    console.print(
        "  [dim]This is a one-time scaffold — once it's done, you'll run[/] [cyan]agent-eval run[/] [dim]to evaluate.[/]"
    )
    console.print()
    console.print("  [dim]Here's what we'll do together:[/]")
    console.print(
        "    [dim]1.[/] Verify your Google Cloud environment is ready for Vertex AI Eval"
    )
    console.print(
        "    [dim]2.[/] Detect how to reach your agent (deployed Agent Engine, local ADK source, or both)"
    )
    console.print("    [dim]3.[/] Pick the metrics that fit your agent")
    console.print(
        "    [dim]4.[/] Generate scenarios + golden data and write everything to [cyan]eval/[/]"
    )
    console.print()
    _pause(_PAUSE_LONG)


# ── Optional pre-step: legacy-layout migration prompt ──────────────────────


def _maybe_offer_legacy_migration(agent_dir: Path) -> None:
    """Detect a pre-unification eval/ layout and offer to migrate it in place.

    Newly scaffolded files land under ``tests/eval/`` after the SDK-aligned
    refactor. Existing projects with ``eval/scenarios/`` and ``eval/eval_data/``
    keep working via the path_resolver fallback, but the user is one prompt
    away from the canonical layout — we surface that prompt here.
    """
    from agent_eval.core.dataset_io import _find_legacy_eval_dir

    legacy = _find_legacy_eval_dir(agent_dir)
    if legacy is None:
        return

    has_scenarios = (legacy / "scenarios" / "conversation_scenarios.json").exists()
    has_golden = (legacy / "eval_data" / "golden_dataset.json").exists()
    if not (has_scenarios or has_golden):
        return

    unified = agent_dir / "tests" / "eval" / "dataset.jsonl"
    if unified.exists():
        # Already migrated — nothing to offer.
        return

    console.print()
    console.print("  [bold yellow]Legacy eval/ layout detected[/]")
    console.print(f"  [dim]Found:[/] [cyan]{legacy}[/]")
    console.print(
        "  [dim]Migrating folds [cyan]scenarios/[/] + [cyan]eval_data/[/] into a single "
        "[cyan]tests/eval/dataset.jsonl[/]. Originals are backed up — non-destructive.[/]"
    )
    try:
        confirm = questionary.confirm(
            "Migrate to the unified tests/eval/ layout now?",
            default=True,
        ).unsafe_ask()
    except (KeyboardInterrupt, Exception):
        return

    if not confirm:
        console.print(
            "  [dim]Skipped. Run `agent-eval migrate` later when you're ready.[/]"
        )
        return

    from agent_eval.core.dataset_io import migrate_legacy

    summary = migrate_legacy(agent_dir)
    console.print(
        f"  [green]>[/] Wrote [bold]{summary['total_rows']}[/] rows to [cyan]{summary['output_path']}[/]"
    )
    if summary.get("backup_dir"):
        console.print(
            f"  [dim]Originals backed up to:[/] [cyan]{summary['backup_dir']}[/]"
        )


# ── Step 0: Environment readiness check ────────────────────────────────────


def _verify_environment(auto_approve: bool = False) -> None:
    """Confirm the GCP env is ready for evaluation, or point at `agent-eval setup`.

    The heavy lifting — gcloud auth, ADC, API enablement, autorater binding —
    lives in `agent-eval setup`. Init only verifies the post-setup state so it
    can proceed, or stop early with a clear "run setup first" pointer. The
    `auto_approve` flag is accepted for signature compatibility but doesn't
    change behavior here: we never prompt to fix things, we just check.
    """
    from dotenv import load_dotenv

    # Lazy import — setup.py imports _pause from this module, so a top-level
    # import the other way would create a cycle at module load time.
    from agent_eval.cli.commands.setup import (
        _adc_file_path,
    )
    from agent_eval.cli.commands.setup import (
        _check_api_enabled as _setup_check_api,
    )

    load_dotenv(override=True)

    console.print()
    console.print(
        Rule("  Step 1/4: Checking your Google Cloud environment  ", style="bold cyan")
    )
    console.print()
    console.print(
        "  [dim]Eval needs a project, ADC credentials, and the Vertex AI API enabled.[/]"
    )
    console.print(
        "  [dim]All of that is set up by[/] [cyan]agent-eval setup[/][dim] — this is just a quick check.[/]"
    )
    _pause()

    project = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("PROJECT_ID")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION") or "us-central1"
    missing: list[str] = []

    console.print()
    if project:
        console.print(f"  [green]>[/] GOOGLE_CLOUD_PROJECT = [cyan]{project}[/]")
    else:
        console.print("  [red]x[/] GOOGLE_CLOUD_PROJECT is not set")
        missing.append("project")

    console.print(f"  [green]>[/] GOOGLE_CLOUD_LOCATION = [cyan]{location}[/]")

    adc_file = _adc_file_path()
    if adc_file.exists():
        console.print("  [green]>[/] Application Default Credentials present")
    else:
        console.print("  [red]x[/] Application Default Credentials not found")
        console.print(f"      [dim]expected at:[/] [dim]{adc_file}[/]")
        missing.append("adc")

    if project:
        api_ok = _setup_check_api(project, "aiplatform.googleapis.com")
        if api_ok is True:
            console.print("  [green]>[/] Vertex AI API is enabled")
        elif api_ok is False:
            console.print("  [red]x[/] Vertex AI API is not enabled on this project")
            missing.append("api")
        else:
            console.print(
                "  [dim]-[/] Vertex AI API status — could not verify (gcloud unavailable)"
            )

    if missing:
        console.print()
        console.print("  [yellow]![/] Your Google Cloud environment isn't ready yet.")
        console.print(
            "  [dim]Run this first — it walks the same checks and fixes anything missing:[/]"
        )
        console.print()
        console.print("      [bold cyan]agent-eval setup[/]")
        console.print()
        console.print("  [dim]Then re-run[/] [cyan]agent-eval init[/][dim].[/]")
        raise click.Abort()

    if not auto_approve:
        _continue("Next: selecting which agent to evaluate →", console=console)


# ── Path detection (Vertex AI GenAI Eval execution path) ──────────────────


def _display_path_detection(search_dir: Path) -> "PathDetection":  # noqa: F821
    """Detect and explain how we'll reach the user's agent.

    The narrative leads with the *local* pipeline (always available, the
    typical starting point) and frames a deployed Agent Engine as a
    streamlined single-turn pass that *adds on top* — they compose, never
    replace each other.

    BYOD is roadmap-only (see docs/reference.md).
    """
    from agent_eval.core.path_detector import (
        PathDetection,
        _detect_agent_engine,
        _detect_local_adk,
    )

    console.print()
    console.print(
        Rule("  Step 3/4: Figuring out how to reach your agent  ", style="bold cyan")
    )
    console.print()
    console.print(
        "  [dim]To score your agent, agent-eval first needs to[/] [bold]run it against test inputs[/]"
    )
    console.print(
        "  [dim]and[/] [bold]capture what happens[/] [dim]— every prompt, response, tool call, trace.[/]"
    )
    console.print()
    console.print(
        "  [dim]The[/] [bold]local pipeline[/] [dim]is the default — we import your[/] [cyan]agent.py[/] "
        "[dim]directly so you can iterate without redeploying.[/]"
    )
    console.print()
    console.print(
        "  [dim]Captured interactions land in[/] [cyan]tests/eval/dataset.jsonl[/][dim], which Step 4 hands to[/]"
    )
    console.print(
        "  [cyan]client.evals.evaluate()[/][dim] for scoring (canonical Vertex SDK schema).[/]"
    )
    console.print()

    # ── Scan: local ADK source (the primary surface) ──
    _continue("Next: look for a local agent.py →", console=console)
    with console.status(
        "  [dim]Scanning for a local agent.py...[/]",
        spinner="dots",
    ):
        _pause(_PAUSE_LONG)
        local_detection = _detect_local_adk(search_dir)

    # ── Scan: deployed Agent Engine (silent — only surfaced if found) ──
    # Detection still runs so a deployed agent gets wired up automatically,
    # but we don't pause the user through extra prompts when nothing's found.
    # The manual-entry escape hatch is preserved for the rare case where
    # auto-detect misses a real deployment.
    ae_detection = _detect_agent_engine(search_dir)

    console.print()

    if local_detection is not None:
        local_count = len(local_detection.local_agents)
        first = local_detection.local_agents[0]
        try:
            rel = first.relative_to(search_dir)
        except ValueError:
            rel = first
        extra = f" (+{local_count - 1} more)" if local_count > 1 else ""

        console.print("  [green]>[/] [bold]Found your local ADK agent.[/]")
        console.print(f"    [dim]agent.py at[/] [cyan]{rel}[/]{extra}")

        if ae_detection is not None:
            # Both surfaces detected — quiet acknowledgment, no deep dive.
            # The streamlined pass is wired up automatically; the user can
            # opt into it later via `agent-eval agent-engine`.
            console.print(
                "  [green]+[/] [dim]Also detected a deployed agent for the same project[/] "
                "[dim italic](Vertex's streamlined single-turn pass is available too).[/]"
            )

        console.print()
        _pause()
        console.print("  [bold]What this means for your eval:[/]")
        console.print(
            "    [dim]>[/] [bold]Multi-turn conversations[/] — we'll drive your agent locally with ADK's [cyan]UserSim[/]."
        )
        console.print(
            "    [dim]>[/] [bold]Single-turn queries[/] — [cyan]agent-eval interact[/] hits your agent's REST endpoint"
        )
        console.print(
            "      ([cyan]/run[/], [cyan]/debug/trace[/]) on local dev, Cloud Run, or any ADK FastAPI host."
        )
        console.print(
            "    [dim]>[/] [bold]Scoring[/] — every trace converges at Vertex's [cyan]client.evals.evaluate()[/]."
        )
    else:
        # No local agent. AE-only is a niche case (less common in practice);
        # keep it short and offer the manual escape hatch only on demand.
        if ae_detection is not None:
            console.print(
                "  [yellow]·[/] [bold]No local agent.py found, but a deployed agent was detected.[/]  "
                "[dim](you can still evaluate via the streamlined pass — point[/] "
                "[cyan]--target-dir[/] [dim]at agent.py to also enable UserSim)[/]"
            )
        else:
            console.print(
                "  [yellow]>[/] [bold]Couldn't auto-detect a local agent here.[/]"
            )
            console.print()
            _pause()
            console.print("  [bold]What this means for your eval:[/]")
            console.print(
                "    [dim]>[/] We'll scaffold a starter [cyan]tests/eval/dataset.jsonl[/] you can hand-edit,"
            )
            console.print(
                "    [dim]>[/] then point [cyan]agent-eval interact --base-url <url>[/] at any ADK"
            )
            console.print(
                "    [dim]>[/] FastAPI endpoint (local dev, Cloud Run, or any host) to collect traces."
            )
            console.print()
            _pause()
            console.print(
                "    [dim italic]Have non-ADK traces? See[/] [cyan]docs/reference.md[/] [dim italic]→ "
                "Experimental & on the roadmap (BYOD ingest is in design).[/]"
            )

            # Manual deployment-resource entry — only shown when nothing was
            # auto-detected AND we're interactive. Keeps the operational
            # escape hatch without bloating the happy path.
            if not _pauses_disabled():
                console.print()
                console.print(
                    "    [dim italic]If you have a deployed agent we couldn't find, paste its resource name (or skip):[/]"
                )
                console.print(
                    "    [dim italic]Format:[/] [cyan]projects/<NUMBER>/locations/<REGION>/reasoningEngines/<ID>[/]"
                )
                try:
                    manual = questionary.text(
                        "    Resource name (Enter to skip):",
                        default="",
                    ).ask()
                except (KeyboardInterrupt, EOFError):
                    manual = None
                if manual and manual.strip():
                    stripped = manual.strip()
                    if re.match(
                        r"^projects/[^/]+/locations/[^/]+/reasoningEngines/[^/]+$",
                        stripped,
                    ):
                        ae_detection = PathDetection(
                            path="A",
                            evidence="user-provided resource name",
                            agent_engine_resource=stripped,
                        )
                        console.print(
                            "    [green]>[/] [dim]Got it — streamlined pass available too.[/]"
                        )
                    else:
                        console.print(
                            "    [yellow]·[/] [dim]Doesn't look like a Reasoning Engines resource — skipping.[/]"
                        )

    # Compose the unified PathDetection downstream code expects.
    if ae_detection is not None and local_detection is not None:
        ae_detection.local_agents = local_detection.local_agents
        ae_detection.evidence = (
            f"{ae_detection.evidence}; also found {local_detection.evidence}"
        )
        detection: PathDetection = ae_detection
    elif ae_detection is not None:
        detection = ae_detection
    elif local_detection is not None:
        detection = local_detection
    else:
        detection = PathDetection(
            path="unknown",
            evidence="no agent.py or deployment metadata found",
        )

    console.print()
    _continue(
        "Next: configuring the metrics that will score your agent →", console=console
    )
    return detection


def _derive_chosen_paths(detection) -> set[str]:  # noqa: ANN001
    """Derive which evaluation surfaces to scaffold from what was detected.

    Local source and a deployed Agent Engine *compose* — UserSim imports
    ``agent.py`` directly and works fine alongside the managed pass — so
    there's no chooser. Every detected surface is included automatically.

    Returns a subset of ``{"A", "B"}``:
    - local source detected → ``"B"`` (local pipeline)
    - Agent Engine deployment detected → ``"A"`` (streamlined single-turn pass)
    - both detected → both
    - neither → ``set()`` (caller defaults to local-only — the typical
      "I'm iterating before deploying" starting point)
    """
    if detection.path == "unknown":
        return set()

    chosen: set[str] = set()
    if detection.local_agents:
        chosen.add("B")
    if detection.agent_engine_resource is not None:
        chosen.add("A")
    if not chosen:
        # Belt-and-braces — `path` was set but neither marker fields were.
        chosen.add(detection.path)
    return chosen


def _prompt_path_choice(detection) -> set[str]:  # noqa: ANN001
    """Announce what we'll scaffold based on detection — no chooser.

    The local pipeline (``simulate`` + ``interact`` + ``evaluate`` + ``analyze``)
    is the default: it works against any local ``agent.py`` and is what most
    people use while iterating. A detected Agent Engine deployment *adds* the
    streamlined ``create_evaluation_run`` pass on top — never replaces local.
    """
    chosen = _derive_chosen_paths(detection)

    console.print()
    if chosen == {"A", "B"}:
        console.print(
            "  [green]>[/] Scaffolding the [bold]local pipeline[/] [dim]+[/] "
            "the [bold]Agent Engine streamlined pass[/]."
        )
        console.print(
            "    [dim]They compose — keep iterating locally, re-run the streamlined pass to confirm against the deployed agent.[/]"
        )
    elif chosen == {"B"}:
        console.print("  [green]>[/] Scaffolding the [bold]local pipeline[/] only.")
        console.print(
            "    [dim]No deployment detected — that's the typical starting point. Deploy with[/] "
            "[cyan]make backend[/] [dim](or any agent_engine target) to also unlock the streamlined pass.[/]"
        )
    elif chosen == {"A"}:
        console.print(
            "  [yellow]·[/] Scaffolding the [bold]Agent Engine streamlined pass[/] only."
        )
        console.print(
            "    [dim]No local[/] [cyan]agent.py[/] [dim]found nearby — point us at it with[/] "
            "[cyan]--target-dir <path>[/] [dim]to also enable the local UserSim pipeline.[/]"
        )
    # chosen == set() → caller falls back to local-only and prints its own
    # message; no announcement here.

    return chosen


# ── Step 2: Agent Selection ─────────────────────────────────────────────────


def _prompt_agent_selection(
    agents: list[tuple[str, Path]], search_dir: Path
) -> tuple[str, Path]:
    """Let the user select which discovered agent to scaffold for."""
    console.print()
    console.print(Rule("  Step 2/4: Selecting your agent  ", style="bold cyan"))
    console.print()
    console.print(
        "  [dim]The agent module is the folder containing your agent.py, tools, and prompts.[/]"
    )
    console.print("  [dim]The eval/ folder will be created inside it.[/]")
    console.print()

    for i, (name, module_dir) in enumerate(agents, 1):
        rel_path = module_dir.relative_to(search_dir)
        console.print(
            f"    [bold]{i}.[/] [cyan]{name}/[/]  [dim]→ {rel_path}/agent.py[/]"
        )

    if len(agents) > 1:
        console.print()
        console.print("  [dim]Sub-agents (inside sub_agents/) are excluded —[/]")
        console.print("  [dim]evaluate them through their parent agent.[/]")

    console.print()
    if len(agents) == 1:
        choice = IntPrompt.ask("  Select agent", default=1)
    else:
        choice = IntPrompt.ask(f"  Select agent [dim](1-{len(agents)})[/]")

    while choice < 1 or choice > len(agents):
        console.print(f"  [red]Please enter a number between 1 and {len(agents)}[/]")
        choice = IntPrompt.ask("  Select agent")

    selected = agents[choice - 1]
    _continue("Next: figuring out how to reach this agent →", console=console)
    return selected


def _prompt_agent_name_manual() -> tuple[str, Path]:
    """Prompt for agent module path when no agents are discovered."""
    console.print()
    console.print(Rule("  Step 2/4: Selecting your agent  ", style="bold cyan"))
    console.print()
    console.print()
    console.print("  [yellow]![/] No ADK agents found in the current directory tree.")
    console.print(
        "  [dim]An ADK agent is identified by a folder containing an agent.py file.[/]"
    )
    console.print(
        "  [dim]You can still scaffold eval/ manually — enter the path to your agent module.[/]"
    )

    console.print()
    target_input = Prompt.ask(
        "  Agent module path [dim](folder with agent.py)[/]",
        default="app",
    )
    target = Path(target_input)
    _continue("Next: figuring out how to reach this agent →", console=console)
    return target.name, target


# ── Step 3 sub-prompt: Interaction Mode (local pipeline only) ──────────────


def _prompt_interaction_mode(chosen_paths: set[str] | None = None) -> str:
    """Prompt for interaction mode (user-sim / diy / both).

    When ``chosen_paths == {"A"}`` the prompt is skipped — the streamlined
    Agent Engine pass scaffolds only ``tests/eval/dataset.jsonl``, no
    scenarios (there's no local agent to drive). Returns ``"dataset-only"``
    in that case so downstream code can branch on it.
    """
    if chosen_paths == {"A"}:
        console.print()
        console.print(
            "  [dim]Streamlined Agent Engine pass scaffolds[/] [cyan]tests/eval/dataset.jsonl[/] "
            "[dim]only — no scenarios needed (no local agent to drive).[/]"
        )
        return "dataset-only"

    console.print()
    console.print(
        "  [bold]Choose interaction mode[/] [dim](sub-step of Step 3 — how the local pipeline drives your agent)[/]"
    )
    console.print("  [dim]How will you generate traces for evaluation?[/]")
    console.print("  [dim]This determines which starter files are created.[/]")
    console.print()

    for i, (_, label, desc) in enumerate(INTERACTION_MODES, 1):
        console.print(f"    [bold]{i}.[/] [cyan]{label}[/]")
        console.print(f"       [dim]{desc}[/]")
        if i < len(INTERACTION_MODES):
            console.print()

    console.print()
    console.print(
        "  [dim]Both is recommended — having both file types ready makes switching easy later.[/]"
    )

    console.print()
    choice = IntPrompt.ask("  Select", default=1)
    while choice < 1 or choice > len(INTERACTION_MODES):
        console.print(
            f"  [red]Please enter a number between 1 and {len(INTERACTION_MODES)}[/]"
        )
        choice = IntPrompt.ask("  Select", default=1)

    selected = INTERACTION_MODES[choice - 1][0]

    # Surface the Cloud Run trace caveat when DIY (live URL) is involved.
    # Vertex AI's ADK FastAPI sub-modes differ in trace persistence: local
    # dev keeps full traces, but Cloud Run often does not. Existing code
    # at processor.py:56-73 already degrades gracefully (latency_data=None,
    # state-derived metrics still work) — but the user should know upfront.
    if selected in ("diy", "both"):
        console.print()
        console.print("  [yellow]![/] [bold]Cloud Run trace caveat[/]")
        console.print(
            "  [dim]If you point DIY at a Cloud Run URL, traces often don't persist —[/]"
        )
        console.print(
            "  [dim]you'll get state-derived metrics only (no latency/spans/tools).[/]"
        )
        console.print(
            "  [dim]For full trace fidelity, deploy to Agent Engine instead:[/]"
        )
        console.print(
            "  [dim]  uvx agent-starter-pack enhance --adk -d agent_engine && make backend[/]"
        )

    return selected


# ── Step 4: Metrics ─────────────────────────────────────────────────────────


def _prompt_metrics_choice(
    agent_dir: Path, agent_name: str
) -> tuple[list[str], dict | None, dict | None, dict | None]:
    """Let user choose between starter metrics or AI-generated metrics.

    Returns (starter_metric_keys, custom_definitions_or_None, recommendations_or_None, agent_analysis_or_None).
    """
    console.print()
    console.print(
        Rule(
            "  Step 4/4: Configuring the metrics that will score your agent  ",
            style="bold cyan",
        )
    )
    console.print()
    console.print(
        "  [dim]Deterministic metrics (latency, tokens, cost) are always included — they come for free[/]"
    )
    console.print(
        "  [dim]from the trace. Now we'll pick the LLM-as-judge metrics that grade content quality.[/]"
    )
    _pause()

    return _prompt_ai_metrics_multistep(agent_dir, agent_name)


def _prompt_starter_metrics() -> list[str]:
    """Original starter metrics toggle UI."""
    selected = [key for key, _, _, default in STARTER_METRICS if default]

    console.print()
    _draw_metrics(selected)

    console.print("\n  [dim]Enter numbers to toggle, or press Enter to continue.[/]")

    while True:
        raw = Prompt.ask("  Toggle", default="")
        if raw.strip() == "":
            break
        try:
            idx = int(raw.strip()) - 1
            if 0 <= idx < len(STARTER_METRICS):
                key = STARTER_METRICS[idx][0]
                if key in selected:
                    selected.remove(key)
                else:
                    selected.append(key)
                console.print()
                _draw_metrics(selected)
                console.print()
        except ValueError:
            console.print("  [red]Enter a number or press Enter to continue.[/]")

    return selected


def _display_metrics_education(managed_metrics: Dict[str, Dict]) -> None:
    """Walk the user through the relevant Vertex AI eval docs before the picker.

    Three short backgrounders, in the order the docs sidebar uses:
      1. The SDK call we'll run for them when they later run `agent-eval evaluate`.
      2. The canonical dataset columns each row in `tests/eval/dataset.jsonl` may use.
      3. The families the catalog's managed metrics belong to (rendered dynamically
         from what the installed SDK actually exposes — only families with ≥1
         metric show up, with a footnote naming the families Vertex docs catalog
         but our pinned SDK doesn't ship as managed).
    Then a callout that the picker is SDK-introspected — resilient to upstream changes.
    """
    from rich.syntax import Syntax

    from agent_eval.core import metric_families

    # Mirror the picker's grouping (anything classified as "custom" — i.e. GCS YAML
    # metrics like COHERENCE / FLUENCY — gets bucketed as adaptive in the picker).
    family_counts: Dict[str, int] = {}
    for key, info in managed_metrics.items():
        family = metric_families.classify(managed_base_name(info) or key)
        if family == "custom":
            family = "adaptive_rubric"
        family_counts[family] = family_counts.get(family, 0) + 1

    try:
        import importlib.metadata

        sdk_version = importlib.metadata.version("google-cloud-aiplatform")
    except Exception:
        sdk_version = "installed"

    # ── Background 1 — the SDK call ──────────────────────────────────────
    console.print()
    console.print("  [dim]── Background 1 of 3 — the SDK call we'll run for you ──[/]")
    console.print()
    console.print(
        "  [dim]When you later run[/] [cyan]agent-eval evaluate[/][dim], we hand the dataset and[/]"
    )
    console.print(
        "  [dim]the metrics you select below to the Vertex AI Evaluation SDK like this:[/]"
    )
    console.print()
    code = (
        "from vertexai import Client, types\n"
        "from google.genai.types import HttpOptions\n\n"
        "client = Client(\n"
        "    project=PROJECT, location=LOCATION,\n"
        '    http_options=HttpOptions(api_version="v1beta1"),  # required for evals\n'
        ")\n\n"
        "result = client.evals.evaluate(\n"
        "    dataset=eval_dataset,              # tests/eval/dataset.jsonl\n"
        "    metrics=[ ...your selections... ], # SDK Metric objects\n"
        ")"
    )
    console.print(
        Syntax(
            code, "python", theme="monokai", padding=(0, 4), background_color="default"
        )
    )
    console.print()
    console.print(
        "  [dim]Docs:[/] [cyan]https://cloud.google.com/vertex-ai/generative-ai/docs/models/run-evaluation[/]"
    )
    _continue("Next: dataset columns →", console=console)

    # ── Background 2 — the dataset columns ───────────────────────────────
    console.print()
    console.print(
        "  [dim]── Background 2 of 3 — the columns each row in your dataset may use ──[/]"
    )
    console.print()
    console.print(
        "  [dim]Each row in[/] [cyan]tests/eval/dataset.jsonl[/] [dim]is a JSON object. You don't need every[/]"
    )
    console.print(
        "  [dim]column on every row — different metrics consume different columns:[/]"
    )
    console.print()
    cols = Table(show_header=False, box=None, padding=(0, 2), show_edge=False)
    cols.add_column(style="cyan", min_width=22)
    cols.add_column(style="dim")
    cols.add_row("prompt", "user input — always present")
    cols.add_row(
        "response", "agent's text reply — filled in at runtime by simulate / interact"
    )
    cols.add_row(
        "reference", "expected answer — used by computation + final_response_match"
    )
    cols.add_row("conversation_history", "multi-turn dialogue — multi_turn_* metrics")
    cols.add_row("intermediate_events", "tool calls + thoughts — tool_use_quality")
    cols.add_row("session_inputs", "ADK session init (app_name, user_id, state)")
    cols.add_row("expected_*", "free-form columns surfaced to custom metric templates")
    console.print(cols)
    console.print()
    console.print(
        "  [dim]Docs:[/] [cyan]https://cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-dataset[/]"
    )
    _continue("Next: the metric families →", console=console)

    # ── Background 3 — the families with metrics in this catalog ────────
    console.print()
    console.print(
        f"  [dim]── Background 3 of 3 — the families your[/] [bold]{len(managed_metrics)}[/] "
        "[dim]managed metrics belong to ──[/]"
    )
    console.print()
    console.print(
        "  [dim]Knowing the family tells you what data the metric needs and how it's scored.[/]"
    )
    console.print(
        "  [dim]The picker below groups its options by family in this exact order.[/]"
    )
    console.print()

    # Render only families that actually have managed metrics in the live SDK.
    # Vertex docs catalog four (Adaptive Rubric, Static Rubric, Computation,
    # Translation) but the SDK we pin only ships managed metrics in two — and
    # showing four rows where two are empty confused customers (Dani 2026-04-30:
    # "weren't there 4 families?"). The footnote names the absent ones so users
    # who expect them know where they went and what to do instead.
    _ALL_FAMILY_ROWS = [
        (
            "adaptive_rubric",
            "Adaptive Rubric",
            "Judge LLM generates rubrics on the fly",
            "optional",
        ),
        (
            "static_rubric",
            "Static Rubric",
            "Judge LLM applies a fixed rubric (safety / grounding)",
            "optional",
        ),
        (
            "computation",
            "Computation",
            "Deterministic math (BLEU, ROUGE, exact_match, tool_*)",
            "[bold]required[/]",
        ),
        (
            "translation",
            "Translation",
            "Niche — translation-quality scorers (comet, metricx)",
            "[bold]required[/]",
        ),
    ]

    fams = Table(
        show_header=True,
        header_style="bold dim",
        box=None,
        padding=(0, 2),
        show_edge=False,
    )
    fams.add_column("Family", style="bold cyan", min_width=18)
    fams.add_column("How it's scored", style="dim", min_width=44)
    fams.add_column("Reference?", style="dim")
    fams.add_column("In catalog", style="dim", justify="right")

    absent_families: list[tuple[str, str]] = []
    for key, label, scoring, ref in _ALL_FAMILY_ROWS:
        n = family_counts.get(key, 0)
        if n > 0:
            fams.add_row(label, scoring, ref, str(n))
        else:
            absent_families.append((label, scoring))

    console.print(fams)

    if absent_families:
        absent_names = " and ".join(f"[bold]{label}[/]" for label, _ in absent_families)
        console.print()
        console.print(
            f"  [dim italic]Vertex docs also catalog {absent_names}, but the SDK we pin[/]"
        )
        console.print(
            f"  [dim italic]([/][cyan]google-cloud-aiplatform=={sdk_version}[/][dim italic]) doesn't expose any as managed metrics —[/]"
        )
        console.print(
            "  [dim italic]use the[/] [cyan]custom[/] [dim italic]metric path below if you need them. Reference (Vertex's metric-types overview):[/]"
        )
        console.print(
            "  [cyan]https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval[/]"
        )

    console.print()
    console.print(
        "  [dim]Docs:[/] [cyan]https://cloud.google.com/vertex-ai/generative-ai/docs/models/rubric-metric-details[/]"
    )
    _pause(_PAUSE_LONG)

    # ── Resilience callout ───────────────────────────────────────────────
    counts_str = " · ".join(
        f"{family_counts.get(f, 0)} {label}"
        for f, label in [
            ("adaptive_rubric", "adaptive"),
            ("static_rubric", "static"),
            ("computation", "computation"),
            ("translation", "translation"),
        ]
        if family_counts.get(f, 0) > 0
    )
    console.print()
    console.print(
        f"  [green]>[/] [dim]Found[/] [bold]{len(managed_metrics)}[/] [dim]managed metrics in[/] "
        f"[cyan]google-cloud-aiplatform=={sdk_version}[/]  [dim]({counts_str})[/]"
    )
    console.print(
        "  [dim]Pulled live via[/] [cyan]metric_families.classify()[/] [dim]reading the installed SDK —[/]"
    )
    console.print(
        "  [dim]when Google adds a new managed metric upstream, this picker stays current automatically.[/]"
    )
    console.print()
    console.print(
        "  [yellow]Heads-up:[/] [dim]you'll[/] [bold]pick from this catalog[/] [dim]in the very next step,[/]"
    )
    console.print(
        "  [dim]so take a moment to read what each metric scores. Inside the pager:[/]"
    )
    console.print(
        "  [bold]↑/↓[/] [dim]or[/] [bold]Space[/] [dim]to scroll ·[/] [bold]q[/] [dim]to exit when done.[/]"
    )
    _continue("Next: open the metrics catalog →", console=console)


def _prompt_managed_metrics_selection(
    managed_metrics: Dict[str, Dict],
    preselected: Optional[set] = None,
) -> Dict[str, Dict]:
    """Arrow-key checkbox selection for managed metrics.

    Uses questionary.checkbox() with grouped separators for a clean UX.
    Returns a dict of selected metric entries ready for metric_definitions.json.

    Args:
        managed_metrics: All available managed metrics from SDK discovery.
        preselected: Keys to pre-check. If None, defaults to general_quality + safety.
    """
    # Per the Vertex AI docs ("Determine your evaluation strategy"):
    # "We recommend starting with GENERAL_QUALITY as the default."
    # Everything else is opt-in via the checkbox below.
    defaults = preselected if preselected is not None else {"general_quality"}
    # Track whether `defaults` came from an existing metric_definitions.json
    # so the picker's helper text can honestly say "loaded from your file"
    # vs "the Vertex AI docs' recommended starting point". Without this, the
    # message lies whenever a re-run finds non-default selections.
    _from_existing_file = preselected is not None and bool(preselected)

    # Group by metric family (adaptive/static/computation/translation) per the
    # plan §3.4. Family classification comes from SDK introspection — adding a
    # new managed metric upstream lands it in the right group automatically.
    from agent_eval.core import metric_families

    # Known families with curated ordering and display labels (see
    # `family_short` / `family_subtitle` below). If the SDK ever introduces a
    # new family, we still surface it — under its raw key, with a "not yet
    # curated" subtitle — at the end of the list rather than silently dropping
    # it into adaptive_rubric.
    KNOWN_FAMILY_ORDER = [
        "adaptive_rubric",
        "static_rubric",
        "computation",
        "translation",
    ]
    grouped: Dict[str, Dict[str, Dict]] = {f: {} for f in KNOWN_FAMILY_ORDER}

    for key, info in managed_metrics.items():
        family = metric_families.classify(managed_base_name(info) or key)
        if family == "custom":
            # `metric_families.classify` returns "custom" for GCS-YAML legacy
            # rubric metrics (COHERENCE, FLUENCY, …); they belong in adaptive.
            family = "adaptive_rubric"
        grouped.setdefault(family, {})[key] = info

    # Order: known families first (curated), then any new ones the SDK invents.
    family_order = KNOWN_FAMILY_ORDER + [
        f for f in grouped if f not in KNOWN_FAMILY_ORDER
    ]

    def _tag_for(info: Dict) -> str:
        """Short capability gate that decides whether a metric can run on the user's data."""
        if info.get("requires_multi_turn"):
            return "multi-turn"
        if info.get("requires_reference"):
            return "needs ref"
        return ""

    # ── Step 1: Rich catalog table ────────────────────────────────────────
    # Why Rich (not a fake table built inside questionary choices): Rich
    # auto-wraps long descriptions, adapts to terminal width, and does its own
    # box drawing. Manual width math + `…` truncation inside questionary
    # choices breaks the moment any value grows or the terminal shrinks.
    console.print()
    console.print("  [bold]Now pick which managed metrics to enable[/]")
    console.print(
        "  [dim]Same families you just saw, grouped the same way. "
        "Catalog first, picker right after.[/]"
    )
    console.print()

    # Render one sub-table per family, sandwiched between Rich rules. This
    # keeps the Name column from being widened by long family titles, and
    # gives each family a clear visual block.
    family_subtitle = {
        "adaptive_rubric": "LLM-generated rubrics, judge-scored — start here",
        "static_rubric": "Fixed criteria — safety, grounding, hallucination",
        "computation": "Deterministic — needs reference",
        "translation": "Translation-quality scorers — needs reference",
    }
    family_short = {
        "adaptive_rubric": "Adaptive Rubric",
        "static_rubric": "Static Rubric",
        "computation": "Computation",
        "translation": "Translation",
    }

    def _family_label(key: str) -> str:
        """Display label for a family key, with a graceful fallback for new SDK families."""
        return family_short.get(key, key.replace("_", " ").title())

    def _family_subtitle(key: str) -> str:
        return family_subtitle.get(key, "[new family from SDK — not yet curated]")

    # Iteration counter the catalog reads to vary the "Pre-checked" wording
    # between the first render and re-opens. Dict-wrapped so the closure can
    # mutate it without `nonlocal` gymnastics.
    _picker_iteration = {"count": 0}

    # Catalog rendering lives in a closure so we can re-render it if the user
    # picks the "↩ Reopen the catalog" sentinel from the picker.
    def _render_catalog() -> None:
        # Catalog goes through the system pager (less / more) so the user
        # controls the scroll instead of having content blast past. After they
        # press `q`, the picker opens with the terminal at the top.
        with styled_pager(console):
            console.rule("[bold]Managed metrics catalog[/]", style="grey50")
            for family in family_order:
                members = grouped[family]
                if not members:
                    continue
                console.print()
                console.print(
                    f"  [bold cyan]{_family_label(family)}[/]  "
                    f"[dim]· {_family_subtitle(family)}[/]"
                )
                sub = Table(
                    header_style="bold cyan",
                    border_style="grey50",
                    show_lines=False,
                    padding=(0, 1),
                    expand=True,
                )
                sub.add_column("Name", style="bold", no_wrap=True)
                sub.add_column("Range", justify="center", no_wrap=True)
                sub.add_column("Tag", no_wrap=True)
                sub.add_column("What it scores", overflow="fold", ratio=1)
                for key in sorted(members):
                    info = members[key]
                    sr = info.get("score_range", {})
                    score = f"{sr.get('min', '?')}-{sr.get('max', '?')}"
                    sub.add_row(
                        managed_base_name(info),
                        score,
                        _tag_for(info),
                        info.get("description", ""),
                    )
                console.print(sub)

            # Legend (about reading the tags) lives inside the pager.
            # Picker controls (toggle/navigate/confirm) live with the picker
            # itself, just below — that's where they're actually used.
            console.print()
            console.rule("[bold]Tag legend[/]", style="grey50")
            console.print()
            console.print(
                "  [bold]multi-turn[/] [dim]needs[/] [cyan]agent-eval simulate[/] [dim]rows[/]"
            )
            console.print(
                "  [bold]needs ref[/] [dim]needs the[/] [cyan]reference[/] [dim]column populated[/]"
            )
            console.print()
            console.print(
                "  [bold yellow]End of catalog.[/]  "
                "[dim]Press[/] [bold]q[/] [dim]to exit and open the picker.[/]"
            )
            console.rule(style="grey50")
        console.print()

        # ── Picker controls cheat-sheet (printed right before the prompt) ──
        console.print(
            "  [bold]Picker controls:[/]  "
            "[bold green]●[/] [dim]= selected ·[/]  [bold]○[/] [dim]= unselected ·[/]  "
            "[bold]space[/] [dim]toggles ·[/] [bold]↑/↓[/] [dim]navigates ·[/] "
            "[bold]enter[/] [dim]→ review screen ([bold]not[/] final — you can edit again from there)[/]"
        )
        # Reflect what's actually pre-checked, and where it came from. Reading
        # `defaults` (mutated on reopen) keeps this honest across loop iterations.
        _checked_names = sorted(
            managed_base_name(managed_metrics[k])
            for k in defaults
            if k in managed_metrics
        )
        _names_text = ", ".join(_checked_names) if _checked_names else "nothing"
        if _from_existing_file and not _picker_iteration["count"]:
            console.print(
                f"  [dim]Pre-checked from your existing[/] "
                f"[cyan]metric_definitions.json[/][dim]:[/] "
                f"[bold green]{_names_text}[/] [dim]— uncheck any you no longer want.[/]"
            )
        elif _picker_iteration["count"]:
            console.print(
                f"  [dim]Pre-checked:[/] [bold green]{_names_text}[/] "
                f"[dim]— your selections so far (preserved across reopens).[/]"
            )
        else:
            console.print(
                f"  [dim]Pre-checked for you:[/] [bold green]{_names_text}[/] "
                "[dim]— the Vertex AI docs' recommended starting point.[/]"
            )
        console.print(
            "  [dim]Forgot what something does? Tick[/] [bold]↩ Reopen the catalog[/] "
            "[dim](first option) and confirm — selections are kept.[/]"
        )
        console.print()

    picker_style = questionary.Style(
        [
            ("qmark", "fg:#00d7ff bold"),
            ("question", "bold"),
            ("answer", "fg:#5fff87 bold"),
            ("pointer", "fg:#00d7ff bold"),
            ("highlighted", "fg:#00d7ff bold"),
            ("selected", "fg:#5fff87 bold"),
            ("separator", "fg:#6c6c6c bold"),
            ("instruction", "fg:#6c6c6c italic"),
        ]
    )

    # Sentinel value for the "↩ Reopen the catalog" choice. If the user leaves
    # this checked when they confirm, we re-render the catalog (preserving
    # their other selections as defaults) and re-prompt.
    _REOPEN_CATALOG = "__reopen_catalog__"

    # ── Step 2: Lightweight picker ────────────────────────────────────────
    # Each choice is just NAME (+ optional [tag]). No fake columns, no
    # truncation, no width math — terminal width is irrelevant.
    while True:
        _render_catalog()
        _picker_iteration["count"] += 1

        choices: list = [
            questionary.Choice(
                "↩ Reopen the catalog (jump back to re-read — your selections are kept)",
                value=_REOPEN_CATALOG,
                checked=False,
            ),
            questionary.Separator(" "),
        ]
        for idx, family in enumerate(family_order):
            members = grouped[family]
            if not members:
                continue
            # Thin grouping marker — full label/subtitle live in the catalog above.
            choices.append(questionary.Separator(f"── {_family_label(family)} ──"))
            for key in sorted(members):
                info = members[key]
                tag = _tag_for(info)
                label = managed_base_name(info)
                if tag:
                    label = f"{label}  [{tag}]"
                choices.append(
                    questionary.Choice(label, value=key, checked=(key in defaults))
                )

        selected_keys = questionary.checkbox(
            "Select managed metrics:",
            choices=choices,
            instruction=" ",  # legend already printed above; keep prompt line clean
            style=picker_style,
            qmark="?",
        ).ask()

        if selected_keys is None:
            raise KeyboardInterrupt

        if _REOPEN_CATALOG in selected_keys:
            # Preserve everything else they had ticked so reopening doesn't
            # wipe their progress; loop back to re-render the catalog.
            defaults = {k for k in selected_keys if k != _REOPEN_CATALOG}
            console.print()
            console.print(
                "  [dim]↩ Reopening the catalog — your[/] "
                f"[bold]{len(defaults)}[/] [dim]selection"
                f"{'s' if len(defaults) != 1 else ''} so far[/] [dim]will be kept.[/]"
            )
            console.print()
            continue

        # ── Review screen (Enter ≠ lock-in) ───────────────────────────────
        # Customers were hitting Enter mid-navigation thinking it was just
        # cursor movement, then losing the chance to fix the selection.
        # Show the recap grouped by family and offer a "go back and edit"
        # option that reopens the picker with current selections preserved.
        # Reported by Dani 2026-04-30 after a customer demo misclick.
        console.print()
        if selected_keys:
            from collections import defaultdict as _defaultdict

            review_by_family: Dict[str, list] = _defaultdict(list)
            for key in selected_keys:
                entry = managed_metrics.get(key, {})
                fam = metric_families.classify(managed_base_name(entry) or key)
                review_by_family[fam].append(managed_base_name(entry) or key)

            console.print(
                f"  [bold]Review your selection — {len(selected_keys)} managed metric"
                f"{'s' if len(selected_keys) != 1 else ''}:[/]"
            )
            for fam in family_order:
                if fam not in review_by_family:
                    continue
                names = ", ".join(sorted(review_by_family[fam]))
                console.print(
                    f"    [dim]·[/] [bold cyan]{_family_label(fam)}[/] [dim]—[/] {names}"
                )
        else:
            console.print(
                "  [yellow]·[/] [bold]No managed metrics selected.[/] "
                "[dim](custom metrics are still available in the next step)[/]"
            )

        console.print()
        try:
            confirm_choice = questionary.select(
                "  Lock this in?",
                choices=[
                    questionary.Choice(
                        "Yes — lock it in and continue",
                        value="confirm",
                    ),
                    questionary.Choice(
                        "Go back and edit (your current selection is preserved)",
                        value="edit",
                    ),
                ],
                default="confirm",  # matches the Choice value, not the label
                style=picker_style,
                qmark="?",
            ).ask()
        except (KeyboardInterrupt, EOFError):
            raise KeyboardInterrupt

        if confirm_choice is None:
            raise KeyboardInterrupt

        if confirm_choice == "edit":
            defaults = set(selected_keys)
            console.print()
            console.print(
                f"  [dim]↩ Reopening the picker — your[/] "
                f"[bold]{len(defaults)}[/] [dim]selection"
                f"{'s' if len(defaults) != 1 else ''} will be kept.[/]"
            )
            console.print()
            continue

        break

    # Build selected metrics dict (final — review confirmed above)
    from agent_eval.core.metric_discovery import get_metric_definition_entry

    selected: Dict[str, Dict] = {}
    for key in selected_keys:
        entry = get_metric_definition_entry(key, managed_metrics)
        if entry:
            selected[key] = entry

    console.print()
    if selected:
        console.print(
            f"  [green]✓[/] [bold]Locked in {len(selected)} managed metric"
            f"{'s' if len(selected) != 1 else ''}.[/]"
        )
    else:
        console.print(
            "  [yellow]>[/] [bold]Continuing with no managed metrics.[/] "
            "[dim](you can add custom metrics in the next step)[/]"
        )

    return selected


def _display_agent_analysis(analysis: Dict[str, Any]) -> None:
    """Display the agent analysis results in a Rich table."""
    console.print("  [bold]Your agent's evaluation data[/]")
    console.print(
        "  [dim]These are the data points found in your code. Custom metrics[/]"
    )
    console.print("  [dim]will be designed to evaluate your agent using this data.[/]")
    console.print()
    table = Table(
        border_style="cyan",
        padding=(0, 2),
    )
    table.add_column("Source", style="bold cyan", min_width=30)
    table.add_column("Description", ratio=2)

    # Always-available data
    table.add_row("user_inputs", "User messages (always available)")
    table.add_row("final_response", "Agent's final text response")
    table.add_row("trace_summary", "Execution trajectory summary")

    # Tools
    tools = analysis.get("tools", [])
    if tools:
        tool_names = ", ".join(t.get("name", "?") for t in tools[:5])
        table.add_row("tool_interactions", f"{len(tools)} tools: {tool_names}")

    # State variables
    state_vars = analysis.get("state_variables", {})
    for var_name, description in state_vars.items():
        table.add_row(f"state: {var_name}", str(description)[:60])

    # Sub-agents
    sub_agents = analysis.get("sub_agents", [])
    if sub_agents:
        agent_names = ", ".join(a.get("name", "?") for a in sub_agents[:5])
        table.add_row("sub_agent_trace", f"{len(sub_agents)} sub-agents: {agent_names}")

    # Conversation history
    table.add_row(
        "conversation_history", "Full multi-turn conversation (if simulation)"
    )

    console.print(table)
    console.print()
    console.print("  [dim]State variables are available via extracted_data:<name>[/]")
    console.print("  [dim]Creating state variables in your agent makes them[/]")
    console.print("  [dim]available for evaluation metrics automatically.[/]")

    # Key behaviors — visually separated from the data table above so the
    # user can scan the analysis output as two distinct sections.
    behaviors = analysis.get("key_behaviors", [])
    if behaviors:
        console.print()
        console.rule("[dim]Key behaviors to evaluate[/]", style="grey50", align="left")
        console.print()
        for b in behaviors[:5]:
            console.print(f"    [dim]•[/] {b}")


def _display_state_suggestions(suggestions: list[dict]) -> None:
    """Display suggested state variables the user could add to their agent."""
    from rich.syntax import Syntax

    console.print()
    console.print("  [bold]Suggested state variables[/]")
    console.print(
        "  [dim]Adding these to your agent code would enable richer evaluation metrics.[/]"
    )
    console.print(
        "  [dim]State variables saved during execution become available for metrics automatically.[/]"
    )
    console.print(
        "  [yellow]![/] [dim]These snippets are AI-generated — review carefully before pasting,[/]"
    )
    console.print(
        "    [dim]preserve your existing docstrings, and verify the function still returns correctly.[/]"
    )
    console.print()

    for i, s in enumerate(suggestions, 1):
        name = s.get("name", "unknown")
        purpose = s.get("purpose", "")
        snippet = s.get("code_snippet", "")
        eval_use = s.get("evaluation_use", "")

        console.print(f"  [bold cyan]{i}. {name}[/]")
        console.print(f"     [dim]Purpose:[/] {purpose}")
        console.print(f"     [dim]Metric use:[/] {eval_use}")
        if snippet:
            console.print()
            syntax = Syntax(snippet, "python", theme="monokai", padding=1)
            console.print(syntax)
        console.print()

    console.print("  [dim]Learn more about ADK state management:[/]")
    console.print(
        "  [cyan]https://adk.dev/sessions/state/#key-characteristics-of-state[/]"
    )


def _prompt_ai_metrics_multistep(
    agent_dir: Path,
    agent_name: str,
) -> tuple[list[str], dict | None, dict | None, dict | None]:
    """Multi-step AI metric generation pipeline.

    Step 3a: Discover managed metrics + ADK knowledge
    Step 3b: User selects managed metrics
    Step 3c: Gemini Call 1 — Analyze agent source code
    Step 3d: Gemini Call 2 — Generate custom metric definitions
    Step 3e: Gemini Call 3 — Generate scenarios + golden data
    Step 3f: Display & confirm

    Returns (starter_keys, custom_definitions_or_None, recommendations_or_None, agent_analysis_or_None).
    """
    # ── Load existing eval files first ───────────────────────────────────
    existing_metrics = _load_existing_metrics(agent_dir)
    existing_scenarios, existing_golden = _load_existing_eval_data(agent_dir)

    # Split existing metrics into managed and custom
    existing_managed_keys: set = set()
    existing_custom: Dict[str, Any] = {}
    if existing_metrics:
        for k, v in existing_metrics.items():
            if isinstance(v, dict) and is_managed_entry(v):
                existing_managed_keys.add(k)
            elif isinstance(v, dict):
                existing_custom[k] = v

    # Show existing metrics summary if re-running
    if existing_metrics:
        console.print()
        console.print("  [bold]Existing metrics found[/]")
        if existing_managed_keys:
            managed_names = ", ".join(sorted(existing_managed_keys))
            console.print(
                f"  [green]>[/] {len(existing_managed_keys)} managed: [cyan]{managed_names}[/]"
            )
        if existing_custom:
            custom_names = ", ".join(sorted(existing_custom.keys()))
            console.print(
                f"  [green]>[/] {len(existing_custom)} custom: [cyan]{custom_names}[/]"
            )
        console.print("  [dim]Your existing selections will be pre-checked below.[/]")

    # ── Discover managed metrics from SDK ─────────────────────────────────
    console.print()
    managed_metrics = {}
    try:
        with console.status(
            "[bold blue]  Asking the Vertex AI Eval SDK what's available...[/]",
            spinner="dots",
        ):
            from agent_eval.core.metric_discovery import discover_managed_metrics

            managed_metrics = discover_managed_metrics()
            _pause(_PAUSE_LONG)
    except Exception as e:
        console.print(f"  [yellow]![/] Could not discover managed metrics: {e}")
        console.print("  [dim]Falling back to starter metrics.[/]")
        return _prompt_starter_metrics(), None, None, None

    # ── Hand-on-shoulder walk through the relevant docs ───────────────────
    _display_metrics_education(managed_metrics)

    # ── User selects managed metrics (intro lives inside the helper) ──────
    preselected = existing_managed_keys if existing_managed_keys else None
    selected_managed = _prompt_managed_metrics_selection(managed_metrics, preselected)

    if selected_managed:
        names = ", ".join(managed_base_name(info) for info in selected_managed.values())
        console.print(f"\n  [green]Selected:[/] {names}")
    else:
        console.print("\n  [dim]No managed metrics selected.[/]")

    # ── Custom metrics priorities (always generated) ──────────────────────
    console.print()
    console.print(
        "  [bold]Custom metrics[/]  [dim]— tailored to your agent's behaviors[/]"
    )
    if existing_custom:
        console.print(
            f"  [dim]You have {len(existing_custom)} existing custom metric(s): "
            f"{', '.join(sorted(existing_custom.keys()))}[/]"
        )
        console.print("  [dim]Gemini will preserve and may improve them.[/]")
    console.print(
        "  [dim]Guide what custom metrics should focus on (optional) — e.g., accuracy[/]"
    )
    console.print(
        "  [dim]of billing lookups, tool call efficiency, out-of-scope handling.[/]"
    )
    console.print(
        "  [dim]Press Enter to skip — Gemini will analyze the code on its own.[/]"
    )
    console.print()
    user_priorities = Prompt.ask("  What should custom metrics focus on?", default="")

    # How many custom metrics? Gemini gravitates to the upper bound of any
    # range we give it (told 2-4 → returned 3 even when the user asked for
    # exactly 1). Same fix as test data generation: pin an EXACT number and
    # let the user override.
    console.print()
    console.print(
        "  [dim italic]Tip: start small.[/] [dim]One sharp metric you understand "
        "beats five fuzzy ones — easier to debug,[/]"
    )
    console.print(
        "  [dim]easier to trust, and the eval loop becomes more meaningful. "
        "You can grow the catalog later — your[/]"
    )
    console.print(
        "  [cyan]CLAUDE.md[/] [dim]/[/] [cyan]GEMINI.md[/] [dim]teach your code assistant the "
        "metric_definitions.json schema, so editing it[/]"
    )
    console.print("  [dim]is a one-line ask away.[/]")
    console.print()
    while True:
        try:
            n_custom_metrics = IntPrompt.ask(
                "  How many custom metrics should Gemini generate?",
                default=3,
            )
        except (KeyboardInterrupt, EOFError):
            n_custom_metrics = 3
            break
        if 1 <= n_custom_metrics <= 10:
            break
        console.print("  [red]Pick a number between 1 and 10.[/]")
    plural = "metric" if n_custom_metrics == 1 else "metrics"
    console.print(
        f"  [dim]→ Gemini will generate exactly[/] [bold]{n_custom_metrics} custom {plural}[/]."
    )

    generate_custom = True  # always generate; refine/skip loop is the user's off-ramp

    _continue("Next: scan your agent's code for evaluation data →", console=console)

    # ── Gemini Call 1 — Analyze agent source code ─────────────────────────
    console.print()
    console.print("  [bold cyan]Analyzing your agent's code[/]")
    console.print(
        "  [dim]Reading agent.py, tools, and prompts to understand available evaluation data.[/]"
    )
    console.print()
    agent_analysis: Dict[str, Any] = {}
    with console.status(
        "[bold blue]  Analyzing agent source code...[/]",
        spinner="dots",
    ):
        try:
            from agent_eval.core.metric_generator import analyze_agent_data

            agent_analysis = analyze_agent_data(agent_dir, agent_name)
        except Exception as e:
            console.print(f"  [yellow]Agent analysis failed:[/] {e}")
            console.print("  [dim]Continuing with default data assumptions.[/]")
            agent_analysis = {"tools": [], "state_variables": {}, "key_behaviors": []}

    if agent_analysis.get("tools") or agent_analysis.get("state_variables"):
        console.print()
        _display_agent_analysis(agent_analysis)

    # ── State variable suggestions (opt-in, single round) ──────────────
    # Bug fix 2026-05-02: previously this loop ALWAYS displayed suggestions
    # AND left `suggested_state_variables` in agent_analysis when the user
    # picked Continue without adding them. Gemini's metric generator then
    # invented metrics referencing state vars that don't exist in the agent
    # code (e.g. `retrieval_query` was never persisted, but a metric
    # `retrieval_query_accuracy` referenced it). Two fixes:
    #   1. Opt-in prompt — ask BEFORE showing the suggestions
    #   2. Single round — show once, accept-or-not, no infinite loop
    #   3. STRIP `suggested_state_variables` after this block so they can't
    #      leak into Call 2's prompt and influence metric generation
    suggestions = agent_analysis.get("suggested_state_variables", [])
    user_modified_agent_code = False  # tracks whether to remind about re-deploy later

    if suggestions:
        console.print()
        console.print(
            f"  [bold]Gemini found {len(suggestions)} state variable(s)[/] [dim]you could add to "
            "your agent that would unlock richer evaluation[/]"
        )
        console.print(
            "  [dim](e.g. tracking tool inputs/outputs explicitly so metrics can score them).[/]"
        )
        console.print()
        try:
            wants_suggestions = questionary.confirm(
                "  Show the suggestions? You can review the AI-drafted snippets and decide whether to paste them.",
                default=True,
            ).ask()
        except (KeyboardInterrupt, EOFError):
            wants_suggestions = False

        if wants_suggestions:
            _display_state_suggestions(suggestions)
            _continue(
                "Next: did you add any of these to your agent? →",
                console=console,
            )

            console.print()
            console.print(
                "    [bold]1.[/] [cyan]Yes — re-analyze[/] (I added one or more snippets to my agent.py)"
            )
            console.print(
                "    [bold]2.[/] [green]No — continue[/] (use the agent's current state variables only; "
                "drop the suggestions)"
            )
            console.print()
            action = IntPrompt.ask("  Select", default=2)
            while action not in (1, 2):
                console.print("  [red]Please enter 1 or 2[/]")
                action = IntPrompt.ask("  Select", default=2)

            if action == 1:
                user_modified_agent_code = True
                console.print()
                console.print("  [bold cyan]Re-analyzing your agent's code[/]")
                console.print(
                    "  [dim]Reading updated agent.py, tools, and prompts...[/]"
                )
                console.print()
                with console.status(
                    "[bold blue]  Re-analyzing agent source code...[/]",
                    spinner="dots",
                ):
                    try:
                        from agent_eval.core.metric_generator import (
                            analyze_agent_data as _reanalyze,
                        )

                        agent_analysis = _reanalyze(agent_dir, agent_name)
                    except Exception as e:
                        console.print(f"  [yellow]Re-analysis failed:[/] {e}")
                        console.print("  [dim]Continuing with previous analysis.[/]")

                if agent_analysis.get("tools") or agent_analysis.get("state_variables"):
                    console.print()
                    _display_agent_analysis(agent_analysis)

        # Whether the user added them or not, REMOVE `suggested_state_variables`
        # so the metric generator doesn't see them. If the user accepted +
        # re-analyzed, accepted vars are now in `state_variables` (real); if
        # they declined, the suggestions shouldn't influence Gemini.
        agent_analysis.pop("suggested_state_variables", None)

        # If the user modified agent.py, flag the re-deploy step here so
        # they don't run agent-engine against the stale deployed version.
        if user_modified_agent_code:
            console.print()
            console.print(
                "  [bold yellow]⚠ You changed your agent code.[/] [dim]Local "
                "[cyan]agent-eval run[/] [dim]will pick up the changes automatically (it[/]"
            )
            console.print(
                "  [dim]imports[/] [cyan]agent.py[/] [dim]live). But[/] [cyan]agent-eval agent-engine[/] "
                "[dim]hits your[/] [bold]deployed[/] [dim]Reasoning Engine —[/]"
            )
            console.print(
                "  [dim]re-deploy first or you'll evaluate the stale version:[/]  [cyan]make backend[/]"
            )

    # ── Gemini Call 2 — Generate custom metrics (if opted in) ─────────────
    custom_metrics: Dict[str, Any] = {}
    rationale = ""

    if generate_custom:
        console.print()
        console.print("  [bold cyan]Generating custom scoring rubrics[/]")
        console.print(
            "  [dim]Creating LLM-as-judge metrics tailored to your agent's specific behaviors.[/]"
        )
        console.print(
            "  [dim]These complement your selected managed metrics — they won't be replaced.[/]"
        )
        console.print()
        with console.status(
            "[bold blue]  Generating custom metrics...[/]", spinner="dots"
        ):
            try:
                from agent_eval.core.metric_generator import generate_metric_definitions

                custom_metrics, rationale = generate_metric_definitions(
                    agent_dir=agent_dir,
                    agent_name=agent_name,
                    agent_analysis=agent_analysis,
                    selected_managed=selected_managed,
                    user_priorities=user_priorities,
                    existing_metrics=existing_metrics,
                    n_custom_metrics=n_custom_metrics,
                )
            except Exception as e:
                console.print(f"\n  [yellow]Metric generation failed:[/] {e}")
                console.print("  [dim]Continuing with managed metrics only.[/]")

        # ── Confirm/Refine custom metrics ─────────────────────────────────
        if custom_metrics:
            console.print()
            _display_generated_metrics(custom_metrics, rationale)
            _continue(
                "Next: accept, refine, or skip the generated metrics →", console=console
            )

            while True:
                console.print()
                console.print("    [bold]1.[/] [green]Accept[/] — use these metrics")
                console.print(
                    "    [bold]2.[/] [cyan]Refine[/] — provide feedback and regenerate"
                )
                console.print(
                    "    [bold]3.[/] [yellow]Skip custom[/] — use managed metrics only"
                )
                console.print()
                action = IntPrompt.ask("  Select", default=1)
                while action not in (1, 2, 3):
                    console.print("  [red]Please enter 1, 2, or 3[/]")
                    action = IntPrompt.ask("  Select", default=1)

                if action == 1:
                    break

                if action == 3:
                    custom_metrics = {}
                    break

                # action == 2: Refine
                console.print()
                console.print("  [bold]What should change?[/]")
                console.print(
                    '  [dim]Tell Gemini what to adjust — e.g., "focus more on tool error[/]'
                )
                console.print(
                    '  [dim]handling", "add a metric for latency awareness"[/]'
                )
                console.print()
                feedback = Prompt.ask("  Feedback")
                if not feedback.strip():
                    continue

                combined_priorities = user_priorities
                if combined_priorities:
                    combined_priorities += f"\n\nADDITIONAL FEEDBACK: {feedback}"
                else:
                    combined_priorities = f"FEEDBACK on previous generation: {feedback}"

                console.print()
                with console.status(
                    "[bold blue]Regenerating metrics...[/]", spinner="dots"
                ):
                    try:
                        custom_metrics, rationale = generate_metric_definitions(
                            agent_dir=agent_dir,
                            agent_name=agent_name,
                            agent_analysis=agent_analysis,
                            selected_managed=selected_managed,
                            n_custom_metrics=n_custom_metrics,
                            user_priorities=combined_priorities,
                            existing_metrics=existing_metrics,
                        )
                    except Exception as e:
                        console.print(f"\n  [yellow]Regeneration failed:[/] {e}")
                        console.print("  [dim]Showing previous results.[/]")
                        continue

                user_priorities = combined_priorities
                console.print()
                _display_generated_metrics(custom_metrics, rationale)

    # ── Finalize metrics ──────────────────────────────────────────────────
    if not custom_metrics:
        custom_metrics = dict(selected_managed)
        if existing_custom:
            custom_metrics.update(existing_custom)

    # ── Materialize metrics file BEFORE Call 3 (data gen) ─────────────────
    # The file becomes the contract: test data is generated to EXERCISE these
    # metrics. The user can edit on disk now and the data-gen step picks
    # up their changes. Validation gate catches schema-breaking edits before
    # they propagate. (See _render_metric_review_guide for the in-CLI
    # editing guide — kept out of the JSON to keep the file clean.)
    from agent_eval.core.path_resolver import agent_project_root
    from agent_eval.core.scaffold import scaffold_metrics_only

    project_root = agent_project_root(agent_dir)
    metrics_path = (
        project_root / "tests" / "eval" / "metrics" / "metric_definitions.json"
    )
    console.print()
    console.print(
        "  [bold cyan]Writing metric_definitions.json[/] [dim](you can tweak it before we generate test data)[/]"
    )
    scaffold_metrics_only(
        target_dir=agent_dir,
        agent_name=agent_name,
        custom_metric_definitions=custom_metrics,
    )
    custom_metrics = _review_with_validation_loop(
        metrics_path,
        custom_metrics=custom_metrics,
        rationale=rationale,
        auto_approve=False,  # this whole multistep path is interactive
    )

    # ── Test data guidance ────────────────────────────────────────────────
    console.print()
    console.print("  [bold cyan]Creating test scenarios and sample queries[/]")
    console.print("  [dim]We'll generate two kinds of test rows from your metrics:[/]")
    console.print(
        "    [cyan]•[/] [bold]Multi-turn[/] [dim]— conversation scripts that drive[/] [cyan]simulate[/] [dim](ADK UserSim plays the user role)[/]"
    )
    console.print(
        "    [cyan]•[/] [bold]Single-turn[/] [dim]— specific queries with reference data that drive[/] [cyan]interact[/] [dim]+[/] [cyan]agent-engine[/]"
    )
    console.print()

    # Row-count prompt. Gemini gravitates to the lower bound of any range we
    # give it (told 5-8 → returned 5), so we pin an EXACT number per kind
    # and let the user override.
    console.print(
        "  [dim italic]Tip: start small.[/] [dim]A few well-chosen rows you can read end-to-end "
        "beat dozens of[/]"
    )
    console.print(
        "  [dim]auto-generated noise — easier to debug, easier to trust the scores. "
        "You can grow the[/]"
    )
    console.print(
        "  [dim]dataset later — your[/] [cyan]CLAUDE.md[/] [dim]/[/] [cyan]GEMINI.md[/] "
        "[dim]teach your code assistant the row schema, so adding[/]"
    )
    console.print("  [dim]more rows is a one-line ask away.[/]")
    console.print()
    while True:
        try:
            n_rows = IntPrompt.ask(
                "  How many rows of [bold]each kind[/] should we generate?",
                default=5,
            )
        except (KeyboardInterrupt, EOFError):
            n_rows = 5
            break
        if 1 <= n_rows <= 30:
            break
        console.print("  [red]Pick a number between 1 and 30.[/]")
    console.print(
        f"  [dim]→ Gemini will generate exactly[/] [bold]{n_rows} multi-turn[/] [dim]+[/] "
        f"[bold]{n_rows} single-turn[/] [dim]rows ({n_rows * 2} total).[/]"
    )

    console.print()
    if existing_scenarios or existing_golden:
        console.print(
            "  [dim]You have existing test data. Gemini will extend it — guide what new[/]"
        )
        console.print(
            "  [dim]scenarios should focus on, or press Enter to let Gemini decide.[/]"
        )
    else:
        console.print(
            "  [dim]Guide what test data should focus on — e.g., edge cases for billing,[/]"
        )
        console.print(
            "  [dim]multi-step workflows, error handling, out-of-scope requests.[/]"
        )
        console.print(
            "  [dim]Press Enter to skip — Gemini will generate based on agent code and metrics.[/]"
        )
    console.print()
    test_data_priorities = Prompt.ask("  What should test data focus on?", default="")

    _continue("Next: generate test scenarios and sample queries →", console=console)

    # Required reference_data field names — extracted from the (possibly
    # user-edited) metrics so Call 3 knows which fields MUST be populated.
    # Gap-2 fix from the audit: without this, Gemini defaulted to
    # expected_behavior even when metrics expected expected_docs / expected_route
    # → silent every-row-skipped behavior at evaluate time.
    required_ref_fields = _required_reference_fields(custom_metrics)

    # ── Gemini Call 3 — Generate test data ────────────────────────────────
    recommendations: Dict[str, Any] = {}
    with console.status("[bold blue]  Generating test data...[/]", spinner="dots"):
        try:
            from agent_eval.core.metric_generator import generate_eval_data

            recommendations = generate_eval_data(
                agent_dir=agent_dir,
                agent_name=agent_name,
                agent_analysis=agent_analysis,
                metric_definitions=custom_metrics,
                existing_scenarios=existing_scenarios,
                existing_golden=existing_golden,
                user_priorities=test_data_priorities,
                metric_rationale=rationale,
                required_reference_fields=required_ref_fields,
                rows_per_kind=n_rows,
            )
        except Exception as e:
            console.print(f"  [yellow]Test data generation failed:[/] {e}")
            console.print(
                "  [dim]You can add scenarios and golden data manually later.[/]"
            )

    # ── Confirm/Refine test data ──────────────────────────────────────────
    if recommendations:
        _display_recommendations(recommendations)
        _continue(
            "Next: accept, refine, or skip the generated test data →", console=console
        )

        while True:
            console.print()
            console.print(
                "    [bold]1.[/] [green]Accept[/] — create eval files with these metrics and test data"
            )
            console.print(
                "    [bold]2.[/] [cyan]Refine[/] — provide feedback and regenerate test data"
            )
            console.print(
                "    [bold]3.[/] [yellow]Skip[/]   — keep metrics, use starter test data instead"
            )
            console.print()
            action = IntPrompt.ask("  Select", default=1)
            while action not in (1, 2, 3):
                console.print("  [red]Please enter 1, 2, or 3[/]")
                action = IntPrompt.ask("  Select", default=1)

            if action == 1:
                break

            if action == 3:
                recommendations = None
                break

            # action == 2: Refine test data
            console.print()
            console.print("  [bold]What should change?[/]")
            console.print(
                '  [dim]Tell Gemini what to adjust — e.g., "add more edge cases",[/]'
            )
            console.print(
                '  [dim]"the golden queries are too simple", "test error handling more"[/]'
            )
            console.print()
            feedback = Prompt.ask("  Feedback")
            if not feedback.strip():
                continue

            if test_data_priorities:
                test_data_priorities += f"\n\nADDITIONAL FEEDBACK: {feedback}"
            else:
                test_data_priorities = f"FEEDBACK on previous generation: {feedback}"

            console.print()
            with console.status(
                "[bold blue]Regenerating test data...[/]", spinner="dots"
            ):
                try:
                    recommendations = generate_eval_data(
                        agent_dir=agent_dir,
                        agent_name=agent_name,
                        agent_analysis=agent_analysis,
                        metric_definitions=custom_metrics,
                        metric_rationale=rationale,
                        required_reference_fields=required_ref_fields,
                        rows_per_kind=n_rows,
                        existing_scenarios=existing_scenarios,
                        existing_golden=existing_golden,
                        user_priorities=test_data_priorities,
                    )
                except Exception as e:
                    console.print(f"\n  [yellow]Regeneration failed:[/] {e}")
                    console.print("  [dim]Showing previous results.[/]")
                    continue

            console.print()
            _display_recommendations(recommendations)

    # ── Return ────────────────────────────────────────────────────────────
    starter_keys = list(selected_managed.keys())
    return starter_keys, custom_metrics, recommendations, agent_analysis


def _load_existing_metrics(agent_dir: Path) -> Optional[Dict[str, Any]]:
    """Load existing metric definitions if present."""
    eval_dir = agent_dir / "eval"
    if not eval_dir.exists():
        return None

    from agent_eval.core.config import find_eval_files

    discovered = find_eval_files(eval_dir)
    for metrics_file in discovered["metrics"]:
        try:
            data = json.loads(metrics_file.read_text())
            return data.get("metrics", {})
        except Exception:
            pass
    return None


def _load_existing_eval_data(
    agent_dir: Path,
) -> tuple[Optional[list], Optional[list]]:
    """Load existing scenarios and golden data if present."""
    eval_dir = agent_dir / "eval"
    if not eval_dir.exists():
        return None, None

    from agent_eval.core.config import find_eval_files

    discovered = find_eval_files(eval_dir)

    scenarios = None
    all_scenarios: list = []
    for f in discovered["scenarios"]:
        try:
            content = json.loads(f.read_text())
            all_scenarios.extend(content.get("scenarios", []))
        except Exception:
            pass
    if all_scenarios:
        scenarios = all_scenarios

    golden = None
    all_questions: list = []
    for f in discovered["golden_data"]:
        try:
            content = json.loads(f.read_text())
            all_questions.extend(
                content.get("golden_questions", content.get("questions", []))
            )
        except Exception:
            pass
    if all_questions:
        golden = all_questions

    return scenarios, golden


def _display_generated_metrics(metrics: dict, rationale: str) -> None:
    """Display AI-generated metrics in a Rich table with managed/custom separation."""
    console.print("  [bold]Evaluation Metrics[/]")
    console.print()
    table = Table(
        border_style="cyan",
        padding=(0, 2),
    )
    table.add_column("Metric", style="bold cyan")
    table.add_column("Type", style="dim", width=10)
    table.add_column("Description")
    table.add_column("Runs On", style="dim", justify="center")

    def _runs_on(defn: dict) -> str:
        if defn.get("requires_multi_turn"):
            return "multi-turn rows"
        if defn.get("requires_reference"):
            return "reference rows"
        return "any row"

    # Sort: managed metrics first, then custom
    sorted_metrics = sorted(
        metrics.items(), key=lambda x: (0 if is_managed_entry(x[1]) else 1, x[0])
    )

    shown_custom_separator = False
    for name, defn in sorted_metrics:
        is_managed = is_managed_entry(defn)

        # Add separator before first custom metric
        if not is_managed and not shown_custom_separator:
            table.add_row(
                "[dim]── Custom Metrics (AI-generated) ──[/]",
                "",
                "",
                "",
            )
            shown_custom_separator = True

        metric_type = "managed" if is_managed else "custom"
        desc = (
            defn.get("description", "")
            if is_managed
            else defn.get("score_range", {}).get("description", "")
        )
        table.add_row(name, metric_type, desc[:60], _runs_on(defn))

    console.print(table)

    console.print()
    console.print("  [dim]Runs On:  any row       = no row capability required[/]")
    console.print(
        "  [dim]         multi-turn rows = needs conversation_history (simulate output)[/]"
    )
    console.print(
        "  [dim]         reference rows  = needs reference_data (golden questions)[/]"
    )
    console.print()
    console.print("  [dim]Managed = Google's built-in rubrics (you selected these)[/]")
    console.print("  [dim]Custom  = AI-generated rubrics tailored to your agent[/]")

    if rationale and not rationale.startswith("\n"):
        console.print()
        console.rule(
            "[dim]Rationale — why these metrics[/]", style="grey50", align="left"
        )
        console.print()
        for line in rationale.strip().splitlines():
            console.print(f"  [dim]{line}[/]")


def _display_recommendations(recommendations: dict) -> None:
    """Display Gemini's evaluation recommendations."""

    # ── Strategy & file feedback ──────────────────────────────────────────
    strategy_parts = []
    strategy = recommendations.get("strategy", "")
    if strategy:
        strategy_parts.append(f"[bold]Strategy:[/] {strategy}")

    feedback = recommendations.get("existing_file_feedback", "")
    if feedback and feedback != "No existing files provided.":
        strategy_parts.append(f"\n[bold]Existing files:[/] {feedback}")

    if strategy_parts:
        console.print()
        console.print("  [bold]Recommendations[/]")
        for part in strategy_parts:
            for line in part.strip().splitlines():
                console.print(f"  {line}")

    # ── Scenario table (multi-turn) ──────────────────────────────────────
    # Visually separate the strategy paragraph from the scenarios table so
    # the test data display reads as distinct sections, not a wall of text.
    scenarios = recommendations.get("scenarios", [])
    if scenarios:
        console.print()
        console.rule(
            "[dim]Suggested Scenarios — multi-turn conversations for ADK User Sim[/]",
            style="grey50",
            align="left",
        )
        console.print(
            "  [dim]The simulator follows these plans without reference data —[/]"
            "\n  [dim]it evaluates how the agent handles the full conversation.[/]"
        )
        console.print()
        scenario_table = Table(border_style="cyan", padding=(0, 2), expand=True)
        scenario_table.add_column("#", style="dim", width=3)
        scenario_table.add_column("Starting Prompt", style="cyan", ratio=2)
        scenario_table.add_column("Description", ratio=3)
        for i, s in enumerate(scenarios[:5], 1):
            prompt = s.get("starting_prompt", "")
            desc = s.get("description", s.get("conversation_plan", ""))
            scenario_table.add_row(str(i), prompt, desc)
        console.print(scenario_table)

    # ── Golden queries table (single-turn) ────────────────────────────────
    golden = recommendations.get("golden_data", [])
    if golden:
        console.print()
        console.rule(
            "[dim]Suggested Test Queries — single-turn queries with reference data[/]",
            style="grey50",
            align="left",
        )
        console.print(
            "  [dim]Each query includes expected behavior so the evaluator can[/]"
            "\n  [dim]check if the agent's response matches what it should do.[/]"
        )
        console.print()
        golden_table = Table(border_style="cyan", padding=(0, 2), expand=True)
        golden_table.add_column("#", style="dim", width=3)
        golden_table.add_column("Query", style="cyan", ratio=2)
        golden_table.add_column("Expected Behavior", ratio=3)
        for i, g in enumerate(golden[:5], 1):
            inputs = g.get("user_inputs", [])
            query = inputs[0] if inputs else g.get("description", "")
            ref_data = g.get("reference_data", {})
            expected = (
                ref_data.get("expected_behavior", "")
                if isinstance(ref_data, dict)
                else ""
            )
            if not expected:
                expected = g.get("expected_behavior", g.get("description", ""))
            golden_table.add_row(str(i), query, expected)
        console.print(golden_table)


def _draw_metrics(selected: list[str]) -> None:
    for i, (key, label, desc, _) in enumerate(STARTER_METRICS, 1):
        marker = "[green]x[/]" if key in selected else " "
        console.print(f"    [{marker}] [bold]{i}.[/] {label:24s} [dim]{desc}[/]")


# ── Summary & Next Steps ───────────────────────────────────────────────────


def _display_summary(
    agent_dir: Path,
    agent_name: str,
    mode: str,
    metrics: list[str],
    custom_metrics: dict | None = None,
    chosen_paths: set[str] | None = None,
) -> None:
    """Show what files will be created/kept, with descriptions of each file's purpose."""
    # Files land at the AGENT PROJECT ROOT (where pyproject.toml lives) —
    # NEVER inside the agent module dir. Pre-rescue this used `agent_dir / "tests"`
    # which displayed `app/tests/eval/` even though we wrote to the project root.
    from agent_eval.core.path_resolver import agent_project_root

    project_root = agent_project_root(agent_dir)
    unified_dir = project_root / "tests" / "eval"
    is_existing = unified_dir.exists()
    chosen_paths = chosen_paths or {"A", "B"}

    # Determine what will happen to each file
    existing_dataset = (unified_dir / "dataset.jsonl").exists()
    existing_unified_metrics = (
        unified_dir / "metrics" / "metric_definitions.json"
    ).exists()
    has_ai = custom_metrics is not None

    # One unified location, both surfaces read from it (Phase D — single
    # source of truth). The chosen_paths set still influences the
    # next-steps text below (which commands to highlight) but doesn't
    # change WHERE we write.
    console.print(
        f"  Writing eval files to [cyan]{unified_dir}/[/]  "
        f"[dim](one location feeds simulate, interact, and agent-engine)[/]"
    )
    if is_existing and has_ai:
        console.print(
            "  [dim]Existing files will be backed up to .backup/ before updating.[/]"
        )
    elif is_existing:
        console.print("  [dim]Existing files will not be overwritten.[/]")
    console.print()

    # Build file table with descriptions
    table = Table(show_header=True, border_style="blue", padding=(0, 2), expand=True)
    table.add_column("Status", width=10)
    table.add_column("File", style="cyan", ratio=2)
    table.add_column("Purpose", ratio=3)

    # ── Unified layout (Phase D): one dataset.jsonl + one metrics file ──
    # Same files regardless of detected execution paths. simulate, interact,
    # and agent-engine all read from the same source of truth at the
    # project root. The chosen_paths set still influences the next-steps
    # text below (which commands to highlight) but no longer changes which
    # files get written.
    if existing_unified_metrics and not has_ai:
        table.add_row(
            "[yellow]kept[/]",
            "[dim]tests/eval/metrics/metric_definitions.json[/]",
            "[dim]Your current scoring rubrics (unchanged)[/]",
        )
    elif has_ai and existing_unified_metrics:
        table.add_row(
            "[green]updated[/]",
            "tests/eval/metrics/metric_definitions.json",
            "AI-generated scoring rubrics (previous version backed up to .backup/)",
        )
    else:
        table.add_row(
            "[green]new[/]",
            "tests/eval/metrics/metric_definitions.json",
            "LLM-as-judge scoring rubrics (managed + custom)",
        )

    if existing_dataset and not has_ai:
        table.add_row(
            "[yellow]kept[/]",
            "[dim]tests/eval/dataset.jsonl[/]",
            "[dim]Your current evaluation rows (unchanged)[/]",
        )
    elif has_ai and existing_dataset:
        table.add_row(
            "[green]updated[/]",
            "tests/eval/dataset.jsonl",
            "AI-generated rows (previous version backed up to .backup/)",
        )
    else:
        table.add_row(
            "[green]new[/]",
            "tests/eval/dataset.jsonl",
            "Single source of truth — drives simulate (multi-turn rows), "
            "interact + agent-engine (single-turn rows)",
        )

    console.print(table)
    console.print()
    console.print(
        "  [dim]One file feeds every path. ADK's per-run scenario files "
        "(conversation_scenarios.json etc.) are projected from this dataset "
        "by `agent-eval simulate` and live in app/ as ephemeral cache.[/]"
    )


def _display_next_steps(
    agent_name: str,
    agent_dir: Path,
    mode: str,
    custom_metrics: dict | None = None,
    chosen_paths: set[str] | None = None,
) -> None:
    from agent_eval.core.path_resolver import agent_project_root

    project_root = agent_project_root(agent_dir).resolve()
    unified_eval = project_root / "tests" / "eval"
    has_ai = custom_metrics is not None
    chosen_paths = chosen_paths or {"A", "B"}
    has_local = "B" in chosen_paths
    has_agent_engine = "A" in chosen_paths

    # Resolve agent_dir relative to project_root for tighter command display
    # (e.g. "agents/crwd-legal-discovery/app" instead of an absolute path).
    try:
        agent_dir_rel = agent_dir.resolve().relative_to(project_root)
    except (ValueError, OSError):
        agent_dir_rel = agent_dir

    lines: list[str] = []
    step = 1

    # Review files — single source of truth at the project root.
    lines.append(f"[bold]{step}.[/] Review your metric definitions:")
    lines.append(f"   [cyan]{unified_eval / 'metrics' / 'metric_definitions.json'}[/]")
    step += 1
    lines.append(
        f"[bold]{step}.[/] Review your evaluation dataset (one file, all paths):"
    )
    lines.append(f"   [cyan]{unified_eval / 'dataset.jsonl'}[/]")
    step += 1

    lines.append("")

    # ── Where to run the next commands from + one-time dep install ──────
    # Both `run` and `agent-engine` walk up from cwd to find the nearest
    # pyproject.toml — running from accelerate/ root finds the wrong one.
    # Plus both import the agent's `agent.py` for AgentInfo, so the agent's
    # deps need to be in agent-eval's venv too (otherwise: missing-dep
    # warnings + reduced-fidelity scoring).
    lines.append("[bold yellow]→ Before you run anything below:[/]")
    lines.append(f"   [dim]$[/] cd {project_root}")
    lines.append(
        "   [dim]$[/] uv pip install -e .   [dim](one-time — install agent deps into agent-eval's venv)[/]"
    )
    lines.append("")

    # Always lead with the local iteration loop when local source is
    # available. The streamlined Agent Engine pass is a confirmation step
    # against the deployed agent — surfaced second.
    if has_local:
        lines.append(f"[bold]{step}.[/] Run the local pipeline (the iteration loop):")
        lines.append(f"   [dim]$[/] agent-eval run --agent-dir {agent_dir_rel}")
        lines.append("")
        lines.append(
            "   [dim]Four phases — collect traces (UserSim + DIY) → evaluate → analyze.[/]"
        )
        lines.append(
            "   [dim]simulate reads multi-turn rows from dataset.jsonl, interact reads single-turn.[/]"
        )
        step += 1
        lines.append("")

    if has_agent_engine:
        lines.append(
            f"[bold]{step}.[/] Run the streamlined pass against the deployed agent:"
        )
        lines.append(
            "   [dim]$[/] make backend            [dim](redeploy if you changed[/] [cyan]agent.py[/] [dim]since last deploy)[/]"
        )
        lines.append("   [dim]$[/] agent-eval agent-engine")
        lines.append("")
        lines.append(
            "   [dim]Auto-discovers[/] [cyan]tests/eval/dataset.jsonl[/] [dim]and[/] "
            "[cyan]deployment_metadata.json[/] [dim]from the project root.[/]"
        )
        lines.append(
            "   [yellow]⚠[/] [dim]This hits the[/] [bold]deployed[/] [dim]agent — local edits to[/] "
            "[cyan]agent.py[/] [dim]won't show up until you re-deploy with[/] [cyan]make backend[/][dim].[/]"
        )
        if has_local:
            lines.append(
                "   [dim]Single-turn managed scoring against the live deployment. Multi-turn rows are[/]"
            )
            lines.append(
                "   [dim]skipped here (Agent Engine is single-turn only) — covered by[/] [cyan]simulate[/] "
                "[dim]above. Compare both surfaces with[/] [cyan]agent-eval dashboard[/][dim].[/]"
            )
        else:
            lines.append(
                "   [dim]Vertex calls your deployed agent, scores against your metrics, uploads to GCS.[/]"
            )
            lines.append(
                "   [dim]To also enable the local pipeline (UserSim + full traces), put your agent.py[/]"
            )
            lines.append(
                "   [dim]somewhere we can find it and re-run[/] [cyan]agent-eval init[/][dim].[/]"
            )
        step += 1

    if has_ai and (unified_eval / ".backup").exists():
        lines.append("")
        lines.append(
            "[dim]Your previous eval files are backed up in tests/eval/.backup/.[/]"
        )
        lines.append(
            "[dim]Delete the backup when you're satisfied with the new files.[/]"
        )

    if has_local:
        lines.append("")
        lines.append(
            "[dim]Note: the interact phase sends queries to a running agent.[/]"
        )
        lines.append(
            "[dim]Start your agent (e.g. [bold]adk web[/bold] or [bold]agents-cli playground[/bold]) before running.[/]"
        )
        lines.append(
            "[dim]If the agent isn't reachable, interact is skipped gracefully.[/]"
        )

    lines.append("")
    lines.append("[dim]Run individual phases — see: agent-eval --help[/]")

    console.print(
        Panel(
            "\n".join(lines),
            title="[bold]Next Steps[/]",
            border_style="green",
            padding=(1, 2),
        )
    )


def _metric_uses_reference_data(defn: dict) -> bool:
    """Whether a custom metric's mapping references reference_data.* columns."""
    return bool(_metric_reference_fields(defn))


def _metric_reference_fields(defn: dict) -> set[str]:
    """Field names from `reference_data.<field>` referenced by this metric.

    Returns an empty set if the metric doesn't pull from reference_data at all.
    Returns {"*"} if it pulls reference_data without naming a specific field.
    """
    fields: set[str] = set()
    mapping = defn.get("dataset_mapping", {})
    for config in mapping.values():
        if not isinstance(config, dict):
            continue
        cols = [config.get("source_column", "")] + config.get("source_columns", [])
        for col in cols:
            if not col or "reference_data" not in col:
                continue
            # Patterns: "reference_data:expected_response", "reference_data.expected_docs"
            for sep in (":", "."):
                if sep in col:
                    tail = col.split(sep, 1)[1]
                    if tail and tail != "reference_data":
                        fields.add(tail)
                        break
            else:
                fields.add("*")
    return fields


def _populated_reference_fields(recommendations: dict | None) -> set[str]:
    """Reference field names actually populated in generated golden data."""
    if not recommendations:
        return set()
    populated: set[str] = set()
    for entry in recommendations.get("golden_data", []) or []:
        if not isinstance(entry, dict):
            continue
        rd = entry.get("reference_data", {})
        if not isinstance(rd, dict):
            continue
        for field, val in rd.items():
            if val and str(val).strip():
                populated.add(field)
    return populated


def _display_connection_map(
    custom_metrics: dict | None,
    recommendations: dict | None,
    agent_analysis: dict | None = None,
) -> None:
    """Show how metrics, data sources, and test data connect."""
    if not custom_metrics:
        return

    console.print()
    console.print("  [bold]How everything connects[/]")
    console.print(
        "  [dim]Each metric evaluates specific aspects of your agent using available data.[/]"
    )
    console.print()

    table = Table(border_style="cyan", padding=(0, 2), expand=True)
    table.add_column("Metric", style="bold cyan", ratio=2)
    table.add_column("Data Sources", ratio=3)
    table.add_column("Runs On", style="dim", width=12)

    for name, defn in custom_metrics.items():
        if not isinstance(defn, dict):
            continue

        sources: list[str] = []
        if is_managed_entry(defn):
            sources.append("request/response (auto)")
        else:
            mapping = defn.get("dataset_mapping", {})
            for config in mapping.values():
                if isinstance(config, dict):
                    if "source_column" in config:
                        sources.append(config["source_column"])
                    elif "source_columns" in config:
                        sources.extend(config["source_columns"])

        source_str = ", ".join(sources) if sources else "default"

        # Flags compose — a metric can require both. Show that explicitly so
        # the user understands the row → metric routing.
        flags = []
        if defn.get("requires_multi_turn"):
            flags.append("multi-turn")
        if defn.get("requires_reference"):
            flags.append("reference")
        runs_on = " + ".join(flags) if flags else "any row"

        table.add_row(name, source_str, runs_on)

    console.print(table)

    if agent_analysis:
        state_vars = agent_analysis.get("state_variables", {})
        if state_vars:
            referenced: set[str] = set()
            for defn in custom_metrics.values():
                if not isinstance(defn, dict):
                    continue
                mapping = defn.get("dataset_mapping", {})
                for config in mapping.values():
                    if isinstance(config, dict):
                        for col in [config.get("source_column", "")] + config.get(
                            "source_columns", []
                        ):
                            if "state_variables" in col or col.startswith(
                                "extracted_data:"
                            ):
                                key = col.split(":")[-1].split(".")[-1]
                                if key in state_vars:
                                    referenced.add(key)

            unreferenced = set(state_vars.keys()) - referenced
            if referenced or unreferenced:
                console.print()
                console.print("  [bold]Agent state coverage[/]")
            if referenced:
                console.print(
                    f"  [green]>[/] State variables used by metrics: [cyan]{', '.join(sorted(referenced))}[/]"
                )
            if unreferenced:
                console.print(
                    f"  [dim]>[/] Available but not in metrics: [dim]{', '.join(sorted(unreferenced))}[/]"
                )

    if recommendations:
        scenarios = recommendations.get("scenarios", [])
        golden = recommendations.get("golden_data", [])
        if scenarios or golden:
            console.print()
            console.print("  [bold]Test data coverage[/]")
            if scenarios:
                console.print(
                    f"  [green]>[/] {len(scenarios)} scenarios will exercise your metrics via multi-turn simulation"
                )
            if golden:
                console.print(
                    f"  [green]>[/] {len(golden)} golden queries will test against expected behaviors"
                )

    ref_metric_fields: dict[str, set[str]] = {}
    for name, defn in custom_metrics.items():
        if not isinstance(defn, dict):
            continue
        used = _metric_reference_fields(defn)
        if defn.get("requires_reference"):
            field = defn.get("reference_field")
            if field:
                used.add(field)
            elif not used:
                used.add("*")
        if used:
            ref_metric_fields[name] = used

    if ref_metric_fields:
        all_required = {
            f for fields in ref_metric_fields.values() for f in fields if f != "*"
        }
        populated = _populated_reference_fields(recommendations)
        missing = all_required - populated

        console.print()
        console.print("  [bold]Reference-data metrics[/]")
        for name, fields in sorted(ref_metric_fields.items()):
            field_str = (
                ", ".join(sorted(fields))
                if fields != {"*"}
                else "any populated field (auto-resolved)"
            )
            console.print(
                f"    [cyan]{name}[/] -> reads [bold]reference_data.{field_str}[/]"
            )

        if populated:
            console.print(
                f"    [green]+[/] Generated golden data populates: [green]{', '.join(sorted(populated))}[/]"
            )
        if missing:
            console.print(
                f"    [yellow]![/] Missing in golden data: [yellow]{', '.join(sorted(missing))}[/]"
            )
            console.print(
                "    [dim]  Edit `eval/eval_data/golden_dataset.json` to add these fields, or the metric will be skipped.[/]"
            )
        console.print(
            "    [dim]Gemini's drafts are starting points — sharpen them with the actual answers your agent should produce.[/]"
        )


# ── Command ─────────────────────────────────────────────────────────────────


@click.command()
@click.option(
    "--target-dir",
    default=None,
    help="Directory containing agent.py (eval/ will be created here).",
)
@click.option(
    "--agent-name",
    default=None,
    help="Agent module name (auto-detected from target-dir if omitted).",
)
@click.option(
    "--mode",
    type=click.Choice(["user-sim", "diy", "both"]),
    default=None,
    help="Interaction mode.",
)
@click.option(
    "--auto-approve", "-y", is_flag=True, help="Skip interactive prompts, use defaults."
)
@click.option(
    "--ai-metrics",
    is_flag=True,
    help="Generate tailored metrics with AI (Gemini analyzes your agent code).",
)
def init(target_dir, agent_name, mode, auto_approve, ai_metrics):
    """Scaffold the eval/ folder structure for an ADK agent.

    Searches for agent.py files in the current directory tree and lets you
    select which agent to add evaluation to. The eval/ folder is created
    inside the agent module directory, as a sibling to agent.py.
    """
    from agent_eval.cli.main import _display_banner

    _display_banner()

    if not auto_approve:
        _display_intro()

    # ── Step 0: Environment verification ──
    _verify_environment(auto_approve=auto_approve)

    custom_metrics = None
    recommendations = None
    agent_analysis = None
    chosen_paths: set[str] = set()  # derived from detection below (interactive + auto)

    if auto_approve:
        if target_dir:
            agent_dir = Path(target_dir)
            agent_name = agent_name or agent_dir.name
        else:
            agents = _find_agents(Path("."))
            if agents:
                agent_name_found, agent_dir = agents[0]
                agent_name = agent_name or agent_name_found
                console.print(
                    f"  Auto-selected agent: [cyan]{agent_name}/[/] [dim]({agent_dir})[/]"
                )
            else:
                agent_name = agent_name or "app"
                agent_dir = Path(agent_name)

        mode = mode or "both"

        # Silent path detection so -y derives the same way as the interactive
        # flow — if the user has only local source we don't pointlessly
        # scaffold Agent Engine bits, and vice versa.
        from agent_eval.core.path_detector import detect_execution_path

        detect_root = agent_dir if agent_dir.exists() else Path(".")
        chosen_paths = _derive_chosen_paths(detect_execution_path(detect_root))
        if not chosen_paths:
            # No agent.py and no deployment found — default to local-only
            # (the typical "I'm starting fresh, going to wire up agent.py
            # next" case). Scaffolds tests/eval/dataset.jsonl + eval/ stubs.
            chosen_paths = {"B"}

        if ai_metrics:
            console.print()
            with console.status(
                "[bold blue]Generating tailored metrics with Gemini...[/]",
                spinner="dots",
            ):
                try:
                    from agent_eval.core.metric_discovery import (
                        discover_managed_metrics,
                        get_metric_definition_entry,
                    )
                    from agent_eval.core.metric_generator import (
                        analyze_agent_data,
                        generate_eval_data,
                        generate_metric_definitions,
                    )

                    # Per Vertex AI docs: start with GENERAL_QUALITY as the default.
                    managed = discover_managed_metrics()
                    selected_managed = {}
                    for key in ("general_quality",):
                        entry = get_metric_definition_entry(key, managed)
                        if entry:
                            selected_managed[key] = entry

                    # Preserve any existing metrics/test data on re-runs
                    existing_metrics_auto = _load_existing_metrics(agent_dir)
                    existing_scenarios_auto, existing_golden_auto = (
                        _load_existing_eval_data(agent_dir)
                    )

                    # Run the 3-step pipeline
                    agent_analysis = analyze_agent_data(agent_dir, agent_name)
                    custom_metrics, rationale = generate_metric_definitions(
                        agent_dir=agent_dir,
                        agent_name=agent_name,
                        agent_analysis=agent_analysis,
                        selected_managed=selected_managed,
                        existing_metrics=existing_metrics_auto,
                    )
                    eval_data = generate_eval_data(
                        agent_dir=agent_dir,
                        agent_name=agent_name,
                        agent_analysis=agent_analysis,
                        metric_definitions=custom_metrics,
                        existing_scenarios=existing_scenarios_auto,
                        existing_golden=existing_golden_auto,
                    )
                    recommendations = eval_data
                    metrics = list(selected_managed.keys())
                    console.print(
                        f"  [green]Generated {len(custom_metrics)} metrics[/]"
                    )
                except Exception as e:
                    console.print(f"  [yellow]AI generation failed:[/] {e}")
                    console.print("  [dim]Using default starter metrics.[/]")
                    metrics = [key for key, _, _, default in STARTER_METRICS if default]
        else:
            metrics = [key for key, _, _, default in STARTER_METRICS if default]
    else:
        search_dir = Path(target_dir) if target_dir else Path(".")

        # Step 2 — Pick the agent FIRST so detection can be scoped to its
        # subtree. Otherwise, in a multi-agent project, detection would
        # latch onto whichever agent happens to have a deployment_metadata.json
        # file — even if the user wants to work on a different one.
        agents = _find_agents(search_dir)
        if agents:
            agent_name_found, agent_dir = _prompt_agent_selection(agents, search_dir)
            agent_name = agent_name or agent_name_found
        else:
            agent_name, agent_dir = _prompt_agent_name_manual()

        # Step 2.5 — Detect a legacy eval/ layout and offer to migrate.
        # Scaffolds since the SDK-aligned refactor write to tests/eval/, but
        # earlier projects have eval/scenarios + eval/eval_data. Surface a
        # one-key migrate prompt before we add more files alongside the old
        # layout.
        _maybe_offer_legacy_migration(agent_dir)

        # Step 3 — Detect the execution path for THIS agent.
        # Scope rule:
        # - Multiple agents in search_dir → scope to THIS agent's project
        #   root (the directory with pyproject.toml, typically one level
        #   above app/). That's where ASP writes deployment_metadata.json.
        #   Scoping to agent_dir alone (the app/ folder) misses the file
        #   that sits one level up — the bug Dani found 2026-05-01 when
        #   running init from the accelerate root with multiple agents
        #   under agents/.
        # - Single agent (typical when --target-dir IS the agent project)
        #   → search_dir already is the project root.
        from agent_eval.core.path_resolver import agent_project_root as _ae_root

        detect_root = _ae_root(agent_dir) if len(agents) > 1 else search_dir
        detection = _display_path_detection(detect_root)
        chosen_paths = _prompt_path_choice(detection)

        mode = mode or _prompt_interaction_mode(chosen_paths)
        metrics, custom_metrics, recommendations, agent_analysis = (
            _prompt_metrics_choice(agent_dir, agent_name)
        )

    # No-detect fallback: default to the local pipeline. It's the typical
    # starting point — you don't need a deployment to start iterating, and
    # scaffolding the streamlined Agent Engine pass when no deployment exists
    # would just write stubs the user never runs.
    if not chosen_paths:
        chosen_paths = {"B"}

    console.print()
    _display_summary(agent_dir, agent_name, mode, metrics, custom_metrics, chosen_paths)

    if not auto_approve:
        _continue(
            "Next: write the eval files (you'll review each one) →", console=console
        )

    console.print()

    # ── Scaffold Step 1: metrics ──────────────────────────────────────────
    # In the AI multi-step flow, _prompt_ai_metrics_multistep already
    # materialized metric_definitions.json + ran the review/validation gate
    # BEFORE Call 3 generated the dataset. Here we use if_exists="skip" so
    # we don't clobber those edits; only write when the file isn't on disk
    # yet (the non-AI / starter-metrics path).
    from agent_eval.core.path_resolver import agent_project_root
    from agent_eval.core.scaffold import scaffold_dataset_jsonl, scaffold_metrics_only

    project_root = agent_project_root(agent_dir)
    metrics_path = (
        project_root / "tests" / "eval" / "metrics" / "metric_definitions.json"
    )

    metrics_already_materialized = metrics_path.exists()
    scaffold_metrics_only(
        target_dir=agent_dir,
        agent_name=agent_name,
        metrics=metrics,
        custom_metric_definitions=custom_metrics,
        if_exists="skip",
    )
    # Non-AI / starter-metrics path: the file was just written for the first
    # time. Run the same review + validation loop the AI path uses so the
    # user gets a chance to tweak before the dataset gets written.
    if not metrics_already_materialized and metrics_path.exists() and not auto_approve:
        try:
            starter_parsed = _parse_artifact(metrics_path)
        except Exception:
            starter_parsed = {"metrics": {}}
        starter_metrics_dict = {
            k: v
            for k, v in (starter_parsed.get("metrics") or {}).items()
            if isinstance(v, dict)
        }
        custom_metrics = _review_with_validation_loop(
            metrics_path,
            custom_metrics=starter_metrics_dict,
            rationale="",
            auto_approve=auto_approve,
        )

    # ── Scaffold Step 2: unified dataset.jsonl — same review loop ──────
    dataset_path = project_root / "tests" / "eval" / "dataset.jsonl"

    scaffold_dataset_jsonl(
        target_dir=agent_dir,
        agent_name=agent_name,
        recommendations=recommendations,
    )
    # Review + coverage validation. The validator catches the dangerous case
    # where a metric needs reference_data:expected_docs but the generated rows
    # only have expected_behavior — silent every-row-skipped at evaluate time.
    _review_dataset_with_validation(
        dataset_path,
        custom_metrics=custom_metrics or {},
        auto_approve=auto_approve,
    )

    # Materialize an empty `eval_config.json` upfront so the user sees the
    # full canonical scaffold (dataset + metrics + eval_config). simulate.py
    # would create one on-demand, but writing it here means the Next Steps
    # panel can point at a file that already exists. Empty `criteria` keeps
    # ADK's per-interaction scoring out of the way — agent-eval scores in
    # batch via Vertex AI. If a user already has one with criteria,
    # simulate.py's backup-and-empty flow handles it on first run.
    eval_config_path = project_root / "tests" / "eval" / "eval_config.json"
    if not eval_config_path.exists():
        eval_config_path.parent.mkdir(parents=True, exist_ok=True)
        eval_config_path.write_text(json.dumps({"criteria": {}}, indent=2) + "\n")

    # Legacy ADK runtime files (eval/scenarios/) are NOT written anymore in
    # the unified flow. simulate.py projects them on-demand from
    # dataset.jsonl. Old projects can run `agent-eval migrate` to fold any
    # hand-edited scenarios into the unified file.

    if custom_metrics:
        if not auto_approve:
            _continue("Next: see how everything connects →", console=console)
        _display_connection_map(custom_metrics, recommendations, agent_analysis)

    if not auto_approve:
        _continue("Next: how to run your first evaluation →", console=console)
    console.print()
    _display_next_steps(agent_name, agent_dir, mode, custom_metrics, chosen_paths)


def _explain_metrics_file(path: Path, custom_metrics: Optional[Dict[str, Any]]) -> None:
    """Render the per-metric breakdown of metric_definitions.json so the
    user knows what each entry does + which internal flags drive routing."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        console.print(f"  [yellow]Couldn't pre-render explanation:[/] {exc}")
        return

    metrics = data.get("metrics") or {}
    if not metrics:
        console.print("  [dim](file is empty)[/]")
        return

    table = Table(show_header=True, padding=(0, 1), border_style="dim")
    table.add_column("Metric", style="bold")
    table.add_column("Type")
    table.add_column("Required SDK columns")
    table.add_column("Routing flags")

    from agent_eval.core.evaluator import _MANAGED_METRIC_REQUIRED_COLUMNS

    for name, defn in metrics.items():
        is_managed = bool(is_managed_entry(defn))
        if is_managed:
            mname = managed_base_name(defn)
            required = _MANAGED_METRIC_REQUIRED_COLUMNS.get(
                mname, ("prompt", "response")
            )
            required_str = ", ".join(required)
            type_str = "[cyan]managed[/]"
        else:
            mapping = defn.get("dataset_mapping") or {}
            required_str = ", ".join(sorted(mapping.keys())) or "(custom template)"
            type_str = "[magenta]custom[/]"
        flags = []
        if defn.get("requires_reference"):
            flags.append("requires_reference")
        if defn.get("requires_multi_turn"):
            flags.append("requires_multi_turn")
        flags_str = ", ".join(flags) if flags else "[dim]any row[/]"
        table.add_row(name, type_str, required_str, flags_str)

    console.print(table)
    console.print(
        "  [dim]Internal keys agent-eval reads:[/] "
        "[bold]is_managed[/]→takes Vertex's RubricMetric path; "
        "[bold]requires_multi_turn[/]→only score rows with `history`; "
        "[bold]requires_reference[/]→only score rows with `reference`; "
        "[bold]dataset_mapping[/]→which trace fields go in which SDK column."
    )


def _explain_dataset_file(path: Path) -> None:
    """Render a row breakdown of the unified dataset.jsonl so the user
    sees the kinds of rows we generated and which paths each one feeds."""
    from agent_eval.core.dataset_io import is_multi_turn, is_single_turn, read_dataset

    try:
        rows = read_dataset(path)
    except Exception as exc:
        console.print(f"  [yellow]Couldn't pre-render explanation:[/] {exc}")
        return

    if not rows:
        console.print("  [dim](no rows)[/]")
        return

    n_multi = sum(1 for r in rows if is_multi_turn(r))
    n_single = sum(1 for r in rows if is_single_turn(r))
    n_both = sum(1 for r in rows if is_multi_turn(r) and is_single_turn(r))
    n_with_ref = sum(
        1
        for r in rows
        if r.get("reference") or isinstance(r.get("reference_data"), dict)
    )

    # Two orthogonal axes describe each row:
    #   1. SHAPE — multi-turn (driven by `simulate`) vs single-turn (driven by
    #      `interact` + `agent-engine`). Decides which command(s) read the row.
    #   2. REFERENCE — does the row carry `reference_data` for golden-comparison?
    #      Independent of shape — multi-turn AND single-turn rows can both have it.
    summary = (
        f"  [bold]{len(rows)} row(s)[/]: "
        f"[cyan]{n_multi} multi-turn[/] (→ `simulate`, "
        f"tests conversation flow), "
        f"[green]{n_single} single-turn[/] (→ `interact` + `agent-engine`, "
        f"tests one-shot quality)"
    )
    if n_both:
        summary += f", [magenta]{n_both} both[/] (drive every command)"
    summary += (
        f". [yellow]{n_with_ref} carry [cyan]reference_data[/][/] "
        f"(eligible for golden-comparison metrics — works on either shape)."
    )
    console.print(summary)

    # Show a 1-line sample per row, capped at 6 so the output stays scannable.
    table = Table(show_header=True, padding=(0, 1), border_style="dim")
    table.add_column("ID")
    table.add_column("Kind", style="bold")
    table.add_column("Drives")
    table.add_column("Prompt", overflow="ellipsis", max_width=55)
    table.add_column("Reference?")

    for i, row in enumerate(rows[:6]):
        rid = row.get("id") or f"row_{i:03d}"
        kind = row.get("kind") or (
            "multi_turn" if is_multi_turn(row) else "single_turn"
        )
        if is_multi_turn(row) and is_single_turn(row):
            drives = "simulate + interact + agent-engine"
        elif is_multi_turn(row):
            drives = "simulate"
        else:
            drives = "interact + agent-engine"
        prompt = (row.get("prompt") or "").replace("\n", " ")[:55]
        has_ref = (
            "✓"
            if (row.get("reference") or isinstance(row.get("reference_data"), dict))
            else "[dim]—[/]"
        )
        table.add_row(rid, kind, drives, prompt, has_ref)

    if len(rows) > 6:
        table.add_row("…", "…", "…", f"({len(rows) - 6} more)", "…")
    console.print(table)
    console.print()

    # ── In-CLI editing guide for the dataset (no JSON noise in the file) ──
    # Same pattern as the metrics review pause: explain what each key does,
    # what the user can edit freely, and what they must keep.
    console.print("  [bold]What each row's keys mean[/]")
    keys = Table(show_header=False, box=None, padding=(0, 2), show_edge=False)
    keys.add_column(style="bold cyan", min_width=18)
    keys.add_column(style="dim")
    keys.add_row(
        "kind",
        'REQUIRED — "multi_turn" / "single_turn" / "both". Decides which command(s) read the row.',
    )
    keys.add_row(
        "id", "REQUIRED — short label so failures point at a specific row. Edit freely."
    )
    keys.add_row("prompt", "REQUIRED — the user's first message to the agent.")
    keys.add_row(
        "session_inputs",
        "ADK session init: app_name, user_id, state seed. Usually leave alone.",
    )
    keys.add_row(
        "conversation_plan",
        "Multi-turn ONLY — JSON array of follow-up turns the simulated user sends.",
    )
    keys.add_row(
        "reference_data",
        "OPTIONAL on ANY row (multi-turn or single-turn) — NESTED dict. expected_behavior is the human-readable golden answer; add metric-specific fields (expected_docs, expected_routing, etc.) to satisfy reference-required metrics. A multi-turn row WITH reference_data also feeds metrics that need both flags.",
    )
    keys.add_row(
        "history",
        "Optional multi-turn — earlier user turns in canonical Vertex shape. Auto-built when user_inputs has >1 entry.",
    )
    console.print(keys)

    console.print()
    console.print("  [bold]What you can edit freely[/]")
    console.print(
        "    [green]✓[/] [bold]prompt[/] — sharpen the queries to match your real users"
    )
    console.print(
        "    [green]✓[/] [bold]reference_data[/] — set the EXACT expected outputs your metrics will compare against"
    )
    console.print(
        "    [green]✓[/] [bold]conversation_plan[/] — reorder, add, or refine the simulated user's follow-ups (must stay a list of strings)"
    )
    console.print(
        "    [green]✓[/] Add new rows — copy an existing row, change [cyan]id[/] + [cyan]prompt[/]"
    )
    console.print(
        '    [green]✓[/] Toggle a row\'s [cyan]kind[/] to "both" if you want it driven by simulate AND interact'
    )
    console.print()
    console.print("  [bold]What you must keep[/]")
    console.print(
        "    [red]✗[/] [bold]kind[/] — required on every row, must be one of multi_turn/single_turn/both"
    )
    console.print(
        "    [red]✗[/] [bold]reference_data[/] [red]must be a NESTED dict[/] (not flattened to top-level expected_*)"
    )
    console.print(
        "    [red]✗[/] [bold]conversation_plan[/] [red]must be a JSON array[/] (not a numbered string — ADK iterates over characters otherwise)"
    )
    console.print()
    console.print("  [bold]What happens next[/]")
    console.print(
        "    [dim]>[/] When you continue, this becomes the [bold]single source of truth[/] —"
    )
    console.print(
        "    [dim]>[/] [cyan]simulate[/] reads the multi-turn rows, [cyan]interact[/]+[cyan]agent-engine[/] read the single-turn rows."
    )
    console.print(
        "    [dim]>[/] We'll then check that every metric has rows it can actually score against."
    )
