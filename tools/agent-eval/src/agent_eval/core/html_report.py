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
"""Generate a self-contained HTML evaluation report from analyzer outputs.

Combines what `gemini_analysis.md` + `question_answer_log.md` +
`OPTIMIZATION_LOG.md` currently render as separate markdown files into
ONE browseable file with tabs, charts, and collapsible per-question
details.

Style inspired by Google Developer Groups (DevFest) — bold black borders,
rounded cards, the four-color palette (Google red/yellow/green/blue),
typographic ornaments. Playful but professional.

All assets (Chart.js, marked.js, fonts) come from CDN — the file opens
via `file://` with no install steps. Data is embedded as JSON inside
`<script>` tags so the report is portable (email it, attach to a
ticket, drop in Slack — all the data travels with the file).

Public API: ``generate_html_report(...)`` writes ``report.html`` to the
run folder and returns its Path.
"""

from __future__ import annotations

import html
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("agent_eval")

# ---------------------------------------------------------------------------
# Data extraction (turn analyzer outputs into JSON for the template)
# ---------------------------------------------------------------------------

_LOWER_IS_BETTER_PATTERNS = (
    "latency",
    "tokens",
    "cost",
    "thinking_tokens",
)


def _is_lower_better(metric_name: str) -> bool:
    name = metric_name.lower()
    return any(p in name for p in _LOWER_IS_BETTER_PATTERNS)


def _format_value(val: Any, metric: str) -> str:
    if val is None:
        return "—"
    if isinstance(val, str):
        return val
    if not isinstance(val, (int, float)):
        return str(val)
    name = metric.lower()
    if "cost" in name:
        return f"${val:.4f}"
    if "latency" in name or "seconds" in name:
        return f"{val:.2f}s"
    if "rate" in name or "ratio" in name:
        if 0 <= val <= 1:
            return f"{val * 100:.0f}%"
        return f"{val:.0%}" if val <= 1 else f"{val:.0f}"
    if isinstance(val, float):
        if abs(val) >= 1000:
            return f"{val:,.0f}"
        if val == int(val):
            return str(int(val))
        return f"{val:.2f}"
    return str(val)


def _normalize_score(
    val: Any, score_range: Optional[Dict[str, Any]]
) -> Optional[float]:
    if not isinstance(val, (int, float)):
        return None
    if not score_range:
        return float(max(0.0, min(1.0, val)))
    lo, hi = score_range.get("min", 0), score_range.get("max", 1)
    if hi == lo:
        return None
    return float(max(0.0, min(1.0, (val - lo) / (hi - lo))))


def _build_overview_tiles(summary: Dict[str, Any]) -> List[Dict[str, Any]]:
    det = (summary.get("overall_summary") or {}).get("deterministic_metrics") or {}
    tiles = []
    cost = det.get("token_usage.estimated_cost_usd")
    if cost is not None:
        tiles.append(
            {
                "label": "Estimated Cost",
                "value": f"${cost:.4f}",
                "hint": "Per question on average",
                "color": "yellow",
            }
        )
    wall = det.get("latency_metrics.total_latency_seconds")
    if wall is not None:
        tiles.append(
            {
                "label": "Wall-clock",
                "value": f"{wall:.1f}s",
                "hint": "Average per question",
                "color": "blue",
            }
        )
    cache = det.get("cache_efficiency.cache_hit_rate")
    if cache is not None:
        tiles.append(
            {
                "label": "Cache Hit Rate",
                "value": f"{cache * 100:.0f}%",
                "hint": "Higher = cheaper",
                "color": "green",
            }
        )
    tokens = det.get("token_usage.total_tokens")
    if tokens is not None:
        tiles.append(
            {
                "label": "Total Tokens",
                "value": f"{tokens:,.0f}",
                "hint": "Prompt + completion + thinking",
                "color": "red",
            }
        )
    return tiles


def _build_llm_metric_rows(
    summary: Dict[str, Any],
    comparison: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    llm = (summary.get("overall_summary") or {}).get("llm_based_metrics") or {}
    skipped = (summary.get("overall_summary") or {}).get("skipped_metrics") or []
    delta_lookup = {}
    if comparison:
        for d in comparison.get("deltas", []):
            delta_lookup[d["metric"]] = d

    rows = []
    for name, info in llm.items():
        if not isinstance(info, dict):
            continue
        avg = info.get("average")
        rng = info.get("score_range") or {"min": 0, "max": 1}
        normalized = _normalize_score(avg, rng)
        d = delta_lookup.get(name)
        rows.append(
            {
                "name": name,
                "score": _format_value(avg, name),
                "score_normalized": normalized,
                "range": f"{rng.get('min', 0)}–{rng.get('max', 1)}",
                "baseline": _format_value(d["baseline"], name) if d else None,
                "delta_pct": d.get("pct_change") if d else None,
                "delta_direction": d.get("direction") if d else None,
                "skipped": False,
            }
        )
    for s in skipped:
        if isinstance(s, dict):
            rows.append(
                {
                    "name": s.get("metric", "?"),
                    "score": "SKIPPED",
                    "range": "—",
                    "skipped": True,
                    "reason": s.get("reason", ""),
                }
            )
    return rows


def _build_deterministic_rows(
    summary: Dict[str, Any],
    comparison: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    det = (summary.get("overall_summary") or {}).get("deterministic_metrics") or {}
    delta_lookup = {}
    if comparison:
        for d in comparison.get("deltas", []):
            delta_lookup[d["metric"]] = d
    rows = []
    for name, val in det.items():
        d = delta_lookup.get(name)
        rows.append(
            {
                "name": name,
                "value": _format_value(val, name),
                "raw_value": val,
                "baseline": _format_value(d["baseline"], name) if d else None,
                "delta_pct": d.get("pct_change") if d else None,
                "delta_direction": d.get("direction") if d else None,
                "lower_better": _is_lower_better(name),
            }
        )
    return rows


def _flatten_det_metrics(det: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    flat: Dict[str, Any] = {}
    for k, v in (det or {}).items():
        if isinstance(v, dict):
            flat.update(_flatten_det_metrics(v, f"{prefix}{k}."))
        else:
            flat[f"{prefix}{k}"] = v
    return flat


def _extract_prompt_response(llm_scores: Dict[str, Any]) -> tuple[str, str]:
    for val in (llm_scores or {}).values():
        if not isinstance(val, dict):
            continue
        inp = val.get("input") or {}
        prompt = inp.get("prompt") or ""
        response = inp.get("response") or ""
        if prompt or response:
            return str(prompt), str(response)
    return "", ""


def _truncate_for_payload(text: str, limit: int = 8000) -> str:
    """Cap absurdly long strings (e.g., agent responses that include
    scraped HTML pages) so the embedded JSON doesn't balloon to 10MB+
    and so the per-question accordion stays readable."""
    if not isinstance(text, str) or len(text) <= limit:
        return text
    return text[:limit] + f"\n\n… [truncated; original was {len(text):,} chars]"


def _short_prompt_preview(text: str, limit: int = 70) -> str:
    """Friendly heatmap label — first line of the prompt, capped."""
    if not isinstance(text, str):
        return ""
    first = text.strip().split("\n", 1)[0]
    if len(first) > limit:
        first = first[:limit].rsplit(" ", 1)[0] + "…"
    return first


def _safe_parse(s: Any) -> Any:
    """Parse a CSV cell that may be JSON OR Python repr (single quotes).

    The evaluator writes nested structures as `str(obj)` in some columns —
    that uses single-quotes which JSON can't load. Try JSON first (fast
    path for properly-serialized data), fall back to ast.literal_eval
    (handles Python repr safely without exec).
    """
    if not isinstance(s, str) or not s.strip():
        return None
    try:
        return json.loads(s)
    except (json.JSONDecodeError, ValueError):
        try:
            import ast

            return ast.literal_eval(s)
        except (ValueError, SyntaxError):
            return None


def _build_csv_lookup(results_csv: Optional[Path]) -> Dict[str, Dict[str, Any]]:
    """Pre-parse the per-question CSV into a {question_id: {...}} map.

    Each value contains the rich data the eval_summary doesn't carry:
    conversation turns, tool calls, state variables, agent trajectory,
    per-turn latency. All caps applied so the embedded payload doesn't
    balloon (CSV rows are 200-500 KB each in practice).
    """
    lookup: Dict[str, Dict[str, Any]] = {}
    if not results_csv or not results_csv.exists():
        return lookup
    try:
        import csv

        # Per-row CSV cells (extracted_data, session_trace, final_session_state)
        # frequently push 200-500 KB. Python's csv module defaults to 128 KB
        # max field size. Raise the cap to the C long max so big traces parse.
        try:
            csv.field_size_limit(2**31 - 1)
        except OverflowError:
            csv.field_size_limit(2**24)
        with open(results_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                qid = row.get("question_id") or row.get("eval_id")
                if not qid:
                    continue
                ed = _safe_parse(row.get("extracted_data")) or {}
                lat = _safe_parse(row.get("latency_data")) or []
                user_inputs = _safe_parse(row.get("user_inputs")) or []
                if not isinstance(user_inputs, list):
                    user_inputs = [str(user_inputs)]

                # Tool calls — actual ADK schema for `tool_interactions[i]` is
                # exactly `{tool_name, input_arguments, output_result, call_id}`.
                # No `agent`, no `latency_seconds`, no top-level `status`.
                # Failure detection mirrors `calculate_tool_success_rate` in
                # deterministic_metrics.py: parse the `output_result` and flag
                # it as failed if the parsed dict has `status == "error"` or
                # an `error`/`error_message` key. Without this, the `ok ✓`
                # pill was unconditionally true even on failed runs.
                def _classify_tool_result(result_val: Any) -> bool:
                    """Return True if the tool call succeeded, False if it failed."""
                    parsed = result_val
                    if isinstance(result_val, str):
                        try:
                            parsed = json.loads(result_val)
                        except (json.JSONDecodeError, TypeError):
                            return True  # opaque text result — treat as success
                    if isinstance(parsed, dict):
                        if parsed.get("status") == "error":
                            return False
                        if "error" in parsed or "error_message" in parsed:
                            return False
                    return True

                tool_calls = []
                for ti in (ed.get("tool_interactions") or [])[:50]:
                    if not isinstance(ti, dict):
                        continue
                    args_obj = ti.get("input_arguments") or {}
                    result = ti.get("output_result") or ""
                    tool_calls.append(
                        {
                            "name": ti.get("tool_name") or "?",
                            "call_id": (ti.get("call_id") or "")[:24],
                            "args": _truncate_for_payload(
                                json.dumps(args_obj, default=str)
                                if not isinstance(args_obj, str)
                                else args_obj,
                                800,
                            ),
                            "result": _truncate_for_payload(
                                json.dumps(result, default=str)
                                if not isinstance(result, str)
                                else result,
                                2500,
                            ),
                            "ok": _classify_tool_result(result),
                        }
                    )

                # State variables (final state after all turns).
                state_vars = ed.get("state_variables") or {}
                if not isinstance(state_vars, dict):
                    state_vars = {}
                state_clean = {}
                for k, v in list(state_vars.items())[:30]:
                    rendered = (
                        json.dumps(v, default=str, indent=2)
                        if not isinstance(v, (str, int, float, bool, type(None)))
                        else v
                    )
                    state_clean[k] = rendered

                # Agents that participated. sub_agent_trace entries have
                # `agent_name` (or `agent`) as the key; pull both, dedupe,
                # preserve insertion order.
                agents_invoked = []
                for sat in (ed.get("sub_agent_trace") or [])[:50]:
                    if not isinstance(sat, dict):
                        continue
                    a = sat.get("agent_name") or sat.get("agent")
                    if a and a not in agents_invoked:
                        agents_invoked.append(a)

                # Extra context the user explicitly asked for: the agent's
                # system instruction (truncated) and tool declarations
                # (so the report shows what schema the LLM saw for tools).
                system_instruction = ed.get("system_instruction") or ""
                if isinstance(system_instruction, list):
                    system_instruction = "\n\n".join(str(x) for x in system_instruction)
                # ADK wraps tool declarations as
                #   [{"function_declarations": [{name, description}, ...]}]
                # Flatten to a flat list of dicts so the JS render doesn't
                # bottom-out on `td.name` (undefined) and dump raw JSON.
                raw_tds = ed.get("tool_declarations") or []
                tool_declarations: List[Dict[str, Any]] = []
                if isinstance(raw_tds, list):
                    for td in raw_tds:
                        if isinstance(td, dict) and isinstance(
                            td.get("function_declarations"), list
                        ):
                            for fd in td["function_declarations"]:
                                if isinstance(fd, dict):
                                    tool_declarations.append(
                                        {
                                            "name": fd.get("name") or "?",
                                            "description": _truncate_for_payload(
                                                fd.get("description") or "", 200
                                            ),
                                        }
                                    )
                        elif isinstance(td, dict):
                            tool_declarations.append(
                                {
                                    "name": td.get("name")
                                    or td.get("tool_name")
                                    or "?",
                                    "description": _truncate_for_payload(
                                        td.get("description") or "", 200
                                    ),
                                }
                            )
                        elif isinstance(td, str):
                            tool_declarations.append({"name": td, "description": ""})

                # Thinking trace (Gemini reasoning tokens) — only the count
                # + a sample, since these can be massive.
                thinking_trace = ed.get("thinking_trace") or []
                thinking_summary = {
                    "n_thoughts": len(thinking_trace)
                    if isinstance(thinking_trace, list)
                    else 0,
                    "sample": "",
                }
                if isinstance(thinking_trace, list) and thinking_trace:
                    first = thinking_trace[0]
                    if isinstance(first, dict):
                        thinking_summary["sample"] = _truncate_for_payload(
                            first.get("text") or json.dumps(first, default=str),
                            600,
                        )
                    else:
                        thinking_summary["sample"] = _truncate_for_payload(
                            str(first), 600
                        )

                # Conversation history — pair user inputs with model responses.
                conv_history = ed.get("conversation_history") or []
                conversation = []
                if isinstance(conv_history, list) and conv_history:
                    for turn in conv_history[:50]:
                        if not isinstance(turn, dict):
                            continue
                        role = turn.get("role") or "user"
                        parts = turn.get("parts") or []
                        text = " ".join(
                            (p.get("text") or "") for p in parts if isinstance(p, dict)
                        ).strip()
                        if text:
                            conversation.append(
                                {
                                    "role": role,
                                    "text": _truncate_for_payload(text, 4000),
                                }
                            )
                if not conversation:
                    fss = _safe_parse(row.get("final_session_state")) or {}
                    history_turns = fss.get("state", {}).get("history") or []
                    for h in history_turns:
                        if isinstance(h, dict):
                            author = h.get("author") or h.get("role") or "user"
                            text = h.get("text") or ""
                            if text:
                                conversation.append(
                                    {
                                        "role": (
                                            "model"
                                            if author
                                            in ("agents", "model", "assistant")
                                            else "user"
                                        ),
                                        "text": _truncate_for_payload(text, 4000),
                                    }
                                )

                if not conversation:
                    # Fall back to user_inputs + final_response.
                    for ui in user_inputs[:20]:
                        conversation.append(
                            {
                                "role": "user",
                                "text": _truncate_for_payload(str(ui), 4000),
                            }
                        )
                    final_resp = row.get("final_response") or row.get("response") or ""
                    if final_resp:
                        conversation.append(
                            {
                                "role": "model",
                                "text": _truncate_for_payload(str(final_resp), 4000),
                            }
                        )

                # Per-turn latency breakdown. The CSV's `latency_data` column
                # is a list of invocation trees (one per turn), each with
                # `duration_seconds` for the total and a recursive `children`
                # list. LLM time = sum of duration_seconds where type ==
                # 'LLM_CALL'; Tool time = sum where type == 'TOOL_CALL'.
                # The earlier code read flat `total_latency_seconds` /
                # `llm_latency_seconds` / `tool_latency_seconds` keys that
                # don't exist in this column, so every cell came back None
                # and rendered as em-dashes.
                def _sum_by_type(node: Any, target_type: str) -> float:
                    if not isinstance(node, dict):
                        return 0.0
                    s = 0.0
                    if node.get("type") == target_type:
                        d = node.get("duration_seconds")
                        if isinstance(d, (int, float)):
                            s += float(d)
                    for child in node.get("children") or []:
                        s += _sum_by_type(child, target_type)
                    return s

                turn_latencies = []
                if isinstance(lat, list):
                    for i, t in enumerate(lat[:30]):
                        if not isinstance(t, dict):
                            continue
                        total = t.get("duration_seconds")
                        llm_s = _sum_by_type(t, "LLM_CALL")
                        tool_s = _sum_by_type(t, "TOOL_CALL")
                        turn_latencies.append(
                            {
                                "turn": i + 1,
                                "total_s": total
                                if isinstance(total, (int, float))
                                else None,
                                "llm_s": llm_s if llm_s > 0 else None,
                                "tool_s": tool_s if tool_s > 0 else None,
                            }
                        )

                lookup[qid] = {
                    "conversation": conversation,
                    "final_response": _truncate_for_payload(
                        row.get("final_response") or "", 6000
                    ),
                    "tool_calls": tool_calls,
                    "state_vars": state_clean,
                    "agents_invoked": agents_invoked,
                    "turn_latencies": turn_latencies,
                    "trajectory": _truncate_for_payload(
                        row.get("trace_summary") or "", 500
                    ),
                    "system_instruction": _truncate_for_payload(
                        system_instruction, 4000
                    ),
                    "tool_declarations": tool_declarations[:30],
                    "thinking": thinking_summary,
                }
    except Exception as exc:
        logger.warning("Could not parse results CSV for HTML report: %s", exc)
    return lookup


def _build_per_question_data(
    results_csv: Optional[Path],
    summary: Dict[str, Any],
    csv_lookup: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Build heatmap matrix + per-question rubric verdict trees.

    Conversation + tool-call detail comes from question_answer_log.md
    (rendered as markdown in the report). This function builds the
    structured data Chart.js + the heatmap need PLUS the rubric verdict
    trees the autorater emitted (which the markdown file doesn't include).
    """
    qa_list = (
        summary.get("per_question_summary")
        or summary.get("all_question_summaries")
        or []
    )
    if not qa_list:
        return {"questions": [], "metric_names": [], "matrix": [], "verdicts": []}

    csv_lookup = csv_lookup or {}

    metric_names: List[str] = []
    for qa in qa_list:
        for m in (qa.get("llm_metrics") or qa.get("llm_based_metrics") or {}).keys():
            if m not in metric_names:
                metric_names.append(m)

    # Number sim rows so the heatmap shows "Sim #1" rather than ADK's
    # opaque hex eval_id. Interact rows already have nice IDs from us.
    sim_counter = 0
    questions = []
    matrix = []
    verdicts = []
    for qa in qa_list:
        raw_qid = qa.get("question_id") or qa.get("eval_id") or "?"
        source = qa.get("source_type") or ""
        if source == "simulation":
            sim_counter += 1
            friendly = f"Sim #{sim_counter}"
        else:
            friendly = raw_qid

        llm_scores = qa.get("llm_metrics") or qa.get("llm_based_metrics") or {}
        prompt, _ = _extract_prompt_response(llm_scores)
        if not prompt:
            prompt = qa.get("prompt") or ""
        prompt_preview = _short_prompt_preview(prompt, 70)

        # Rubric verdicts per metric — keep the structure but cap reasoning
        # length so the payload stays sane. This is the rich autorater
        # output the user wants in the report.
        per_metric_verdicts: Dict[str, Any] = {}
        for mname, mval in llm_scores.items():
            if not isinstance(mval, dict):
                continue
            entries = []
            raw_verdicts = mval.get("rubric_verdicts")
            # Some metrics (managed FINAL_RESPONSE_MATCH) emit a single
            # numeric "verdict" instead of a list of rubric records. Guard
            # the iter — anything not a list = no per-rubric tree to show.
            if not isinstance(raw_verdicts, list):
                raw_verdicts = []
            for v in raw_verdicts:
                if not isinstance(v, dict):
                    continue
                ev = v.get("evaluated_rubric") or {}
                content = (ev.get("content") or {}).get("property") or {}
                entries.append(
                    {
                        "rubric": _truncate_for_payload(
                            content.get("description") or "", 400
                        ),
                        "type": ev.get("type") or "",
                        "importance": ev.get("importance") or "",
                        "verdict": v.get("verdict"),
                        "reasoning": _truncate_for_payload(
                            v.get("reasoning") or "", 600
                        ),
                    }
                )
            # Preserve the explanation's original shape — string, list (e.g.
            # hallucination's per-claim verdicts), or dict — the JS renders
            # each shape differently. Cap deeply if it's a string. For
            # lists/dicts we cap each leaf string inside.
            raw_expl = mval.get("explanation")
            if isinstance(raw_expl, str):
                expl_payload: Any = _truncate_for_payload(raw_expl, 1200)
            elif isinstance(raw_expl, list):
                expl_payload = [
                    {
                        k: (_truncate_for_payload(v, 1200) if isinstance(v, str) else v)
                        for k, v in item.items()
                    }
                    if isinstance(item, dict)
                    else _truncate_for_payload(str(item), 1200)
                    for item in raw_expl
                ]
            elif isinstance(raw_expl, dict):
                expl_payload = {
                    k: (_truncate_for_payload(v, 1200) if isinstance(v, str) else v)
                    for k, v in raw_expl.items()
                }
            else:
                expl_payload = ""
            # Carry the autorater error through so the JS can render the
            # red "Autorater error" block. Without this the JS falls back
            # to "No rubric verdicts" which is misleading — the metric DID
            # run, it just failed.
            err = mval.get("error")
            err_str = ""
            if err is not None:
                err_str = _truncate_for_payload(
                    err if isinstance(err, str) else json.dumps(err, default=str),
                    600,
                )
            per_metric_verdicts[mname] = {
                "score": mval.get("score"),
                "explanation": expl_payload,
                "verdicts": entries,
                "error": err_str,
            }

        det_flat = _flatten_det_metrics(qa.get("deterministic_metrics") or {})

        row = []
        cell_details = []
        for m in metric_names:
            mv = per_metric_verdicts.get(m)
            score_val = mv.get("score") if isinstance(mv, dict) else None
            if score_val is None:
                row.append(None)
                cell_details.append(None)
            else:
                row.append(
                    float(score_val) if isinstance(score_val, (int, float)) else None
                )
                cell_details.append(_format_value(score_val, m))
        questions.append(
            {
                "id": friendly,
                "raw_id": raw_qid,
                "prompt_preview": prompt_preview,
                "source_type": source,
            }
        )
        matrix.append(
            {
                "id": friendly,
                "label": prompt_preview or friendly,
                "raw_id": raw_qid,
                "source_type": source,
                "row": row,
                "cells": cell_details,
            }
        )
        # Pull the rich conversation/tool/state data from the CSV lookup
        # if it was pre-parsed. This is the wisely-extracted data the user
        # actually wants to see per question — what did the agent do?
        csv_extra = csv_lookup.get(raw_qid) or {}
        verdicts.append(
            {
                "id": friendly,
                "raw_id": raw_qid,
                "source_type": source,
                "prompt_preview": prompt_preview,
                "metrics": per_metric_verdicts,
                "deterministic": det_flat,
                # New: from CSV
                "conversation": csv_extra.get("conversation") or [],
                "final_response": csv_extra.get("final_response") or "",
                "tool_calls": csv_extra.get("tool_calls") or [],
                "state_vars": csv_extra.get("state_vars") or {},
                "agents_invoked": csv_extra.get("agents_invoked") or [],
                "turn_latencies": csv_extra.get("turn_latencies") or [],
                "trajectory": csv_extra.get("trajectory") or "",
                "system_instruction": csv_extra.get("system_instruction") or "",
                "tool_declarations": csv_extra.get("tool_declarations") or [],
                "thinking": csv_extra.get("thinking") or {},
            }
        )

    return {
        "questions": questions,
        "metric_names": metric_names,
        "matrix": matrix,
        "verdicts": verdicts,
    }


def _build_iterations_data(
    results_parent: Path, current_run_id: str
) -> List[Dict[str, Any]]:
    """Walk every run folder under ``results_parent`` and build a sorted
    list of iteration entries from each run's ``eval_summary.json``.

    Replaces the old "render OPTIMIZATION_LOG.md as markdown" approach
    with structured data the HTML report can render natively as charts
    + delta cards. The markdown file stays on disk for git/grep, but
    this is the canonical iteration view now.

    Each entry: ``{run_id, datetime, llm_metrics, det_metrics_key,
    git_commit, is_current}``. Sorted oldest-first so the line chart
    reads left-to-right as the iteration journey.
    """
    if not results_parent or not results_parent.is_dir():
        return []
    iterations = []
    for run_dir in results_parent.iterdir():
        if not run_dir.is_dir():
            continue
        summary_file = run_dir / "eval_summary.json"
        if not summary_file.exists():
            continue
        try:
            data = json.loads(summary_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        ov = data.get("overall_summary") or {}
        llm = ov.get("llm_based_metrics") or {}
        det = ov.get("deterministic_metrics") or {}
        # Pull just the metrics worth charting on a timeline. Full scores
        # for everything would be noisy; these are the headline signals.
        det_keys = (
            "token_usage.total_tokens",
            "token_usage.estimated_cost_usd",
            "latency_metrics.total_latency_seconds",
            "cache_efficiency.cache_hit_rate",
            "tool_utilization.total_tool_calls",
        )
        det_picked = {k: det.get(k) for k in det_keys if det.get(k) is not None}
        llm_picked = {
            n: (info.get("average") if isinstance(info, dict) else info)
            for n, info in llm.items()
        }
        # Use mtime as the datetime — it's the run completion time.
        try:
            dt = datetime.fromtimestamp(summary_file.stat().st_mtime)
            dt_str = dt.strftime("%Y-%m-%d %H:%M")
            dt_sort = dt.timestamp()
        except OSError:
            dt_str = ""
            dt_sort = 0
        git = data.get("git_info") or {}
        iterations.append(
            {
                "run_id": run_dir.name,
                "datetime": dt_str,
                "_sort": dt_sort,
                "llm_metrics": llm_picked,
                "det_metrics": det_picked,
                "git_commit": (git.get("commit") or "")[:8],
                "git_branch": git.get("branch") or "",
                "is_current": run_dir.name == current_run_id,
            }
        )
    iterations.sort(key=lambda x: x["_sort"])
    # Compute deltas vs immediately-previous iteration so each card can
    # show movement at a glance.
    for i, it in enumerate(iterations):
        if i == 0:
            it["deltas"] = {}
            continue
        prev = iterations[i - 1]
        deltas: Dict[str, float] = {}
        for src in ("llm_metrics", "det_metrics"):
            for k, v in (it[src] or {}).items():
                pv = (prev[src] or {}).get(k)
                if isinstance(v, (int, float)) and isinstance(pv, (int, float)) and pv:
                    deltas[k] = round((v - pv) / abs(pv) * 100, 1)
        it["deltas"] = deltas
    # Strip the internal sort key.
    for it in iterations:
        it.pop("_sort", None)
    return iterations


def _build_per_source_data(summary: Dict[str, Any]) -> Dict[str, Any]:
    """Project ``per_source_summary`` into a shape the JS can render as a
    side-by-side strip (simulation vs interaction). Each source has its own
    averaged metrics — the unified pipeline runs UserSim AND interact, and
    splitting them out is one of the most useful "what changed?" signals
    (e.g. cache hits 39% on sim, 25% on interact → why?).
    """
    raw = summary.get("per_source_summary") or {}
    if not raw:
        return {"sources": []}
    sources = []
    for src_name, metrics in raw.items():
        if not isinstance(metrics, dict):
            continue
        flat: Dict[str, Any] = {}
        for k, v in metrics.items():
            # Each entry is `{average: float, count: int}`.
            if isinstance(v, dict) and "average" in v:
                flat[k] = {"average": v.get("average"), "count": v.get("count")}
        sources.append({"name": src_name, "metrics": flat})
    return {"sources": sources}


def _build_payload(
    *,
    run_id: str,
    agent_name: str,
    summary: Dict[str, Any],
    comparison: Optional[Dict[str, Any]],
    gemini_analysis_md: Optional[str],
    optimization_log_md: Optional[str],
    qa_log_md: Optional[str],
    results_csv: Optional[Path],
    iterations: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    git = summary.get("git_info") or {}
    return {
        "meta": {
            "run_id": run_id,
            "agent_name": agent_name,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "experiment_id": summary.get("experiment_id", ""),
            "test_description": summary.get("test_description", ""),
            "interaction_datetime": summary.get("interaction_datetime", ""),
            "run_type": summary.get("run_type", ""),
            "git_commit": (git.get("commit") or "")[:8],
            "git_branch": git.get("branch") or "",
            "git_dirty": bool(git.get("dirty")),
            "has_comparison": bool(comparison),
            "baseline_run": (comparison or {}).get("baseline_run_name")
            or (comparison or {}).get("baseline_id"),
        },
        "tiles": _build_overview_tiles(summary),
        "llm_metrics": _build_llm_metric_rows(summary, comparison),
        "deterministic_metrics": _build_deterministic_rows(summary, comparison),
        "per_source": _build_per_source_data(summary),
        "per_question": _build_per_question_data(
            results_csv, summary, csv_lookup=_build_csv_lookup(results_csv)
        ),
        "qa_log_md": _truncate_for_payload(qa_log_md or "", 200000),
        "iterations": iterations or [],
        "comparison": {
            "deltas": (comparison or {}).get("deltas") or [],
            "baseline_git": (comparison or {}).get("baseline_git") or {},
            "current_git": (comparison or {}).get("current_git") or {},
        },
        "gemini_analysis_md": _truncate_for_payload(gemini_analysis_md or "", 60000),
        "optimization_log_md": _truncate_for_payload(optimization_log_md or "", 60000),
    }


# ---------------------------------------------------------------------------
# HTML template — DevFest / Google Developer Groups aesthetic
# ---------------------------------------------------------------------------
# Bold black borders + rounded everything + Google four-color palette
# (red/yellow/green/blue). Inter Black for display, Inter for body. SVG
# typographic ornaments (asterisk, semicolon) as decorative accents.

_HTML_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>agent-eval — __RUN_ID__</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
  <style>
    :root {
      --bg: #f8f7f2;          /* warm off-white, like DevFest poster */
      --surface: #ffffff;
      --ink: #0f0f0f;          /* near-black, the heavy ink color */
      --ink-soft: #555;
      --border: 2.5px solid var(--ink);
      --radius: 16px;
      --radius-pill: 999px;
      /* Google brand four */
      --g-red: #ea4335;
      --g-yellow: #fbbc04;
      --g-green: #34a853;
      --g-blue: #4285f4;
      /* Soft tints for backgrounds */
      --g-red-soft: #fdecea;
      --g-yellow-soft: #fef7e0;
      --g-green-soft: #e6f4ea;
      --g-blue-soft: #e8f0fe;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--ink);
      font-size: 14px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    code, pre { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; }

    /* ── Header ──────────────────────────────────────────────────────── */
    header.report-header {
      padding: 32px 48px 24px;
      border-bottom: var(--border);
      background: var(--surface);
      position: relative;
      overflow: hidden;
    }
    header .ornament {
      position: absolute;
      pointer-events: none;
      opacity: 0.85;
    }
    header .ornament.asterisk {
      top: 22px;
      right: 80px;
      width: 36px;
      color: var(--g-yellow);
    }
    header .ornament.semicolon {
      bottom: 18px;
      right: 32px;
      width: 28px;
      color: var(--g-red);
    }
    header h1 {
      margin: 0 0 6px;
      font-size: 34px;
      font-weight: 900;
      letter-spacing: -0.025em;
      line-height: 1.05;
    }
    header h1 .braces {
      color: var(--g-blue);
      font-weight: 700;
    }
    header .subtitle {
      color: var(--ink-soft);
      font-size: 13px;
      margin-top: 4px;
    }
    header .agent-pill {
      display: inline-block;
      background: var(--g-green-soft);
      border: var(--border);
      border-radius: var(--radius-pill);
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
      vertical-align: middle;
    }

    /* ── Tabs ─────────────────────────────────────────────────────────── */
    nav.tabs {
      background: var(--surface);
      border-bottom: var(--border);
      padding: 16px 48px;
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    nav.tabs button {
      background: var(--surface);
      border: var(--border);
      border-radius: var(--radius-pill);
      padding: 8px 18px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: var(--ink);
      cursor: pointer;
      transition: background 120ms, transform 60ms;
      /* Keep button content (icon + label + count badge) on one line so
         the `6` count never wraps to its own line at narrow viewports. */
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    nav.tabs button:hover { background: var(--g-yellow-soft); }
    nav.tabs button:active { transform: translateY(1px); }
    nav.tabs button.active {
      background: var(--ink);
      color: var(--bg);
    }
    nav.tabs button .count {
      display: inline-block;
      background: var(--bg);
      color: var(--ink);
      padding: 1px 8px;
      border-radius: 10px;
      margin-left: 6px;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid var(--ink);
    }
    nav.tabs button.active .count {
      background: var(--g-yellow);
    }

    /* ── Main ─────────────────────────────────────────────────────────── */
    main { padding: 28px 48px 80px; max-width: 1280px; margin: 0 auto; }
    section.tab-content { display: none; }
    section.tab-content.active { display: block; }
    h2 {
      font-size: 20px;
      font-weight: 800;
      margin: 28px 0 12px;
      letter-spacing: -0.015em;
    }
    h2:first-child { margin-top: 4px; }
    h2 .accent {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      vertical-align: middle;
      margin-right: 8px;
    }
    h2 .accent.red { background: var(--g-red); }
    h2 .accent.yellow { background: var(--g-yellow); }
    h2 .accent.green { background: var(--g-green); }
    h2 .accent.blue { background: var(--g-blue); }

    /* ── Tiles ────────────────────────────────────────────────────────── */
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .tile {
      background: var(--surface);
      border: var(--border);
      border-radius: var(--radius);
      padding: 18px 20px;
      position: relative;
      overflow: hidden;
    }
    .tile::before {
      content: "";
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 6px;
      background: var(--g-blue);
    }
    .tile.color-red::before { background: var(--g-red); }
    .tile.color-yellow::before { background: var(--g-yellow); }
    .tile.color-green::before { background: var(--g-green); }
    .tile.color-blue::before { background: var(--g-blue); }
    .tile .label {
      color: var(--ink-soft);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      margin-top: 4px;
    }
    .tile .value {
      font-size: 28px;
      font-weight: 900;
      margin-top: 6px;
      letter-spacing: -0.025em;
      line-height: 1.1;
    }
    .tile .hint { color: var(--ink-soft); font-size: 11px; margin-top: 6px; }

    /* ── Cards ────────────────────────────────────────────────────────── */
    .card {
      background: var(--surface);
      border: var(--border);
      border-radius: var(--radius);
      padding: 22px 24px;
      margin-bottom: 16px;
    }
    .card h2:first-child { margin-top: 0; }
    .card-row { display: grid; grid-template-columns: 5fr 7fr; gap: 16px; }
    @media (max-width: 980px) { .card-row { grid-template-columns: 1fr; } }

    /* ── Tables ───────────────────────────────────────────────────────── */
    table.metrics {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.metrics th {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid var(--ink);
      font-weight: 700;
      color: var(--ink);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    table.metrics td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    table.metrics tr:last-child td { border-bottom: none; }
    table.metrics td.num, table.metrics th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .delta-good { color: var(--g-green); font-weight: 700; }
    .delta-bad { color: var(--g-red); font-weight: 700; }
    .delta-neutral { color: var(--ink-soft); font-weight: 500; }

    /* ── Pills ─────────────────────────────────────────────────────── */
    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid var(--ink);
    }
    .pill-good { background: var(--g-green-soft); color: var(--ink); }
    .pill-mixed { background: var(--g-yellow-soft); color: var(--ink); }
    .pill-bad { background: var(--g-red-soft); color: var(--ink); }
    .pill-skipped { background: var(--bg); color: var(--ink-soft); border-color: var(--ink-soft); }

    /* ── Heatmap ──────────────────────────────────────────────────────── */
    .heatmap-wrap { overflow-x: auto; padding: 4px; }
    table.heatmap { border-collapse: separate; border-spacing: 4px; font-size: 12px; }
    table.heatmap th, table.heatmap td {
      padding: 8px 10px;
      text-align: center;
      min-width: 80px;
      border-radius: 8px;
      border: 1.5px solid var(--ink);
      background: var(--surface);
    }
    table.heatmap th {
      background: var(--ink);
      color: var(--bg);
      font-weight: 700;
    }
    table.heatmap th.col-header {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      vertical-align: bottom;
      height: 150px;
      padding: 10px 6px;
      max-width: 36px;
    }
    table.heatmap td.qid {
      font-family: 'JetBrains Mono', monospace;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      background: var(--bg);
    }
    table.heatmap td.cell {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }

    /* ── Per-question accordion ───────────────────────────────────────── */
    .qa-item {
      background: var(--surface);
      border: var(--border);
      border-radius: var(--radius);
      margin-bottom: 10px;
      overflow: hidden;
    }
    .qa-summary {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    .qa-summary::-webkit-details-marker { display: none; }
    .qa-summary:hover { background: var(--g-yellow-soft); }
    .qa-summary .chevron {
      color: var(--ink);
      transition: transform 150ms;
      font-weight: 900;
      font-size: 14px;
    }
    .qa-item[open] .qa-summary .chevron { transform: rotate(90deg); }
    .qa-summary .qid {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      background: var(--bg);
      border: 1.5px solid var(--ink);
      border-radius: var(--radius-pill);
      padding: 3px 10px;
    }
    .qa-summary .prompt-preview {
      flex: 1;
      color: var(--ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .qa-detail {
      padding: 18px;
      border-top: 2px solid var(--ink);
      background: var(--bg);
    }
    .qa-detail h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink);
      margin: 0 0 6px;
      font-weight: 800;
    }
    .qa-detail h4:not(:first-of-type) { margin-top: 16px; }
    .qa-detail .text-block {
      background: var(--surface);
      border: 2px solid var(--ink);
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 260px;
      overflow-y: auto;
    }
    .qa-scores { display: flex; flex-wrap: wrap; gap: 8px; }
    .qa-score {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 600;
    }
    .qa-score b { font-weight: 800; }

    /* ── Verdict trees ────────────────────────────────────────────────── */
    .metric-block {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      border-radius: 12px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .metric-block-summary {
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      list-style: none;
      background: var(--bg);
      border-bottom: 1.5px solid var(--ink);
    }
    .metric-block-summary::-webkit-details-marker { display: none; }
    .metric-block .chevron { font-weight: 900; transition: transform 150ms; }
    .metric-block[open] .chevron { transform: rotate(90deg); }
    .metric-rubric-count {
      margin-left: auto;
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 600;
    }
    .metric-block-body { padding: 14px; }
    .metric-explanation {
      font-style: italic;
      color: var(--ink);
      background: var(--g-yellow-soft);
      border: 1.5px solid var(--ink);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      font-size: 13px;
      line-height: 1.55;
    }
    .verdict-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    @media (min-width: 1000px) { .verdict-grid { grid-template-columns: 1fr 1fr; } }
    .verdict-item {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .verdict-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .verdict-sym {
      font-weight: 900;
      font-size: 16px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--ink);
    }
    .verdict-pass { background: var(--g-green-soft); color: var(--g-green); }
    .verdict-fail { background: var(--g-red-soft); color: var(--g-red); }
    .verdict-na { background: var(--bg); color: var(--ink-soft); }
    .verdict-imp {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid var(--ink);
    }
    .imp-high { background: var(--g-red-soft); }
    .imp-medium { background: var(--g-yellow-soft); }
    .imp-low { background: var(--g-green-soft); }
    .verdict-type {
      font-size: 10px;
      background: var(--bg);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #ccc;
      font-family: 'JetBrains Mono', monospace;
    }
    .verdict-rubric {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      line-height: 1.45;
    }
    .verdict-reasoning {
      font-size: 12px;
      color: var(--ink-soft);
      line-height: 1.5;
      padding-top: 6px;
      border-top: 1px dashed #ddd;
    }

    /* ── Iteration cards ──────────────────────────────────────────────── */
    .iter-card {
      background: var(--surface);
      border: var(--border);
      border-radius: var(--radius);
      padding: 16px 20px;
      margin-bottom: 12px;
    }
    .iter-card.iter-current {
      border-color: var(--g-blue);
      box-shadow: 0 0 0 4px var(--g-blue-soft);
    }
    .iter-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 14px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .iter-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .iter-meta {
      font-size: 11px;
      color: var(--ink-soft);
      font-variant-numeric: tabular-nums;
    }
    .iter-meta code {
      background: var(--bg);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #ddd;
      margin-left: 6px;
      font-size: 11px;
    }
    .iter-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    @media (max-width: 760px) { .iter-body { grid-template-columns: 1fr; } }
    .iter-section-h {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 800;
      color: var(--ink-soft);
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid var(--ink);
    }
    .iter-metric {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.5;
    }
    .iter-metric b { font-weight: 700; }

    /* ── Per-question deep-dive blocks ────────────────────────────────── */
    .conv-thread {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 12px;
    }
    .conv-turn {
      border: 1.5px solid var(--ink);
      border-radius: 12px;
      padding: 10px 14px;
      max-width: 90%;
    }
    .conv-turn.turn-user {
      background: var(--g-blue-soft);
      align-self: flex-start;
    }
    .conv-turn.turn-model {
      background: var(--surface);
      align-self: flex-end;
    }
    .conv-role {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 800;
      color: var(--ink-soft);
      margin-bottom: 4px;
    }
    .conv-text {
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .tool-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .tool-item {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      border-radius: 10px;
      overflow: hidden;
    }
    .tool-head {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      list-style: none;
      background: var(--bg);
      border-bottom: 1.5px solid var(--ink);
    }
    .tool-head::-webkit-details-marker { display: none; }
    .tool-item:not([open]) .tool-head { border-bottom: none; }
    .tool-body {
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 760px) { .tool-body { grid-template-columns: 1fr; } }
    .tool-section pre {
      background: var(--ink);
      color: #f8f7f2;
      padding: 10px 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 11px;
      line-height: 1.4;
      max-height: 220px;
      overflow-y: auto;
      margin: 4px 0 0;
    }
    .tool-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 800;
      color: var(--ink-soft);
    }
    .state-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    @media (max-width: 760px) { .state-grid { grid-template-columns: 1fr; } }
    .state-card {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .state-card code {
      font-size: 12px;
      background: var(--g-yellow-soft);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e5d8a0;
    }
    .metric-strip {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 6px;
      margin-bottom: 14px;
    }
    .metric-cell {
      background: var(--surface);
      border: 1.5px solid var(--ink);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .metric-cell-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      color: var(--ink-soft);
    }
    .metric-cell-value {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.01em;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }

    /* ── Markdown ─────────────────────────────────────────────────────── */
    .md { font-size: 14px; line-height: 1.65; max-width: 880px; }
    .md h1, .md h2, .md h3, .md h4 { font-weight: 800; letter-spacing: -0.015em; margin-top: 24px; margin-bottom: 8px; }
    .md h1 { font-size: 24px; }
    .md h2 { font-size: 18px; margin-top: 0; }
    .md h2:not(:first-child) { margin-top: 28px; }
    .md h3 { font-size: 15px; }
    .md p { margin: 0 0 12px; }
    .md ul, .md ol { margin: 0 0 12px; padding-left: 24px; }
    .md li { margin-bottom: 4px; }
    .md code { background: var(--g-yellow-soft); padding: 1px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #e5d8a0; }
    .md pre { background: var(--ink); color: #f8f7f2; padding: 14px 18px; border-radius: 10px; overflow-x: auto; font-size: 12px; line-height: 1.5; border: var(--border); }
    .md pre code { background: transparent; padding: 0; color: inherit; border: none; }
    .md blockquote { border-left: 3px solid var(--g-blue); padding-left: 14px; color: var(--ink-soft); margin: 0 0 12px; }
    .md table { border-collapse: collapse; margin: 12px 0; }
    .md th, .md td { border: 1.5px solid var(--ink); padding: 6px 10px; }
    .md th { background: var(--bg); font-weight: 700; }

    /* ── Empty state ──────────────────────────────────────────────────── */
    .empty {
      padding: 48px 24px;
      text-align: center;
      color: var(--ink-soft);
      background: var(--bg);
      border: 2px dashed var(--ink);
      border-radius: var(--radius);
    }
    .error {
      padding: 14px 18px;
      background: var(--g-red-soft);
      border: var(--border);
      border-radius: var(--radius);
      margin-bottom: 16px;
    }

    /* ── Footer ───────────────────────────────────────────────────────── */
    footer.report-footer {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 48px 48px;
      color: var(--ink-soft);
      font-size: 12px;
      text-align: center;
    }
    footer .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      vertical-align: middle;
      margin: 0 1px;
    }
  </style>
</head>
<body>

<header class="report-header">
  <!-- Decorative ornaments — DevFest typography references -->
  <svg class="ornament asterisk" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2v8m0 4v8M4.93 4.93l5.66 5.66m2.82 2.82l5.66 5.66M2 12h8m4 0h8M4.93 19.07l5.66-5.66m2.82-2.82l5.66-5.66" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
  <svg class="ornament semicolon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8" r="2.5"/>
    <path d="M9 19c2-1 3-3 3-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </svg>
  <h1>
    <span class="braces">{</span> Agent Evaluation <span class="braces">}</span>
    <span class="agent-pill" id="agent-tag">—</span>
  </h1>
  <div class="subtitle" id="subtitle"></div>
</header>

<nav class="tabs">
  <button data-tab="overview" class="active">📊 Overview</button>
  <button data-tab="per-question">🔬 Per-Question <span class="count" id="pq-count"></span></button>
  <button data-tab="iterations">📈 Iteration History</button>
  <button data-tab="analysis">🤖 AI Analysis</button>
</nav>

<main>
  <div id="js-error-box"></div>

  <section id="overview" class="tab-content active">
    <h2><span class="accent yellow"></span>At a glance</h2>
    <div class="tiles" id="tiles"></div>

    <div class="card-row">
      <div class="card">
        <h2><span class="accent blue"></span>LLM-judge metrics</h2>
        <div id="radar-empty" class="empty" style="display:none">No LLM metrics scored.</div>
        <div style="position:relative;height:300px"><canvas id="radar"></canvas></div>
      </div>
      <div class="card">
        <h2><span class="accent green"></span>Score table</h2>
        <table class="metrics" id="llm-table"></table>
      </div>
    </div>

    <div class="card">
      <h2><span class="accent red"></span>Deterministic metrics</h2>
      <table class="metrics" id="det-table"></table>
    </div>

    <div class="card" id="per-source-card" style="display:none">
      <h2><span class="accent yellow"></span>By source · simulation vs interaction</h2>
      <div style="font-size:13px;color:#555;margin-bottom:10px">
        Same metrics, split by how the rows were collected. Big gaps between
        UserSim (multi-turn) and interact (single-turn) usually mean the
        agent behaves differently across context lengths.
      </div>
      <table class="metrics" id="per-source-table"></table>
    </div>
  </section>

  <section id="per-question" class="tab-content">
    <h2><span class="accent blue"></span>Score heatmap</h2>
    <div class="card">
      <div id="heatmap-empty" class="empty" style="display:none">No per-question data available.</div>
      <div class="heatmap-wrap"><table class="heatmap" id="heatmap"></table></div>
    </div>

    <h2><span class="accent green"></span>Per-question deep dive</h2>
    <p style="color:#555;margin:0 0 12px;font-size:13px">
      Click a question to expand: full conversation, tool calls with arguments + results,
      agent state at end of turn, per-metric scores with rubric verdicts and reasoning.
    </p>
    <div id="verdicts-list">
      <div class="empty">No per-question data available.</div>
    </div>
  </section>

  <section id="iterations" class="tab-content">
    <h2><span class="accent yellow"></span>Metrics over time</h2>
    <div class="card">
      <div id="iterations-chart-empty" class="empty" style="display:none">
        Only one run so far — chart needs ≥2 iterations to draw a trend line.
      </div>
      <div style="position:relative;height:340px"><canvas id="iterations-chart"></canvas></div>
    </div>

    <h2><span class="accent green"></span>Iteration history</h2>
    <div id="iterations-list">
      <div class="empty">No iterations recorded yet.</div>
    </div>
  </section>

  <section id="analysis" class="tab-content">
    <h2><span class="accent red"></span>AI analysis</h2>
    <div class="card md" id="gemini-md"></div>
  </section>
</main>

<footer class="report-footer">
  <span class="dot" style="background:#ea4335"></span>
  <span class="dot" style="background:#fbbc04"></span>
  <span class="dot" style="background:#34a853"></span>
  <span class="dot" style="background:#4285f4"></span>
  &nbsp;Generated by <code>agent-eval</code> · __GENERATED_AT__
</footer>

<script id="report-data" type="application/json">__DATA_JSON__</script>
<script>
(function() {
  // ── Helpers (defined first so everything below can use them safely) ──
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function showError(msg) {
    const box = document.getElementById('js-error-box');
    if (box) {
      box.innerHTML = '<div class="error"><b>Report error:</b> ' +
        escapeHtml(msg) + '<br><small>Open the browser console for the full stack.</small></div>';
    }
    console.error('[agent-eval report]', msg);
  }
  function safe(label, fn) {
    // Wrap each render section so a single bad row doesn't kill the page.
    try { fn(); } catch (e) {
      console.error('[agent-eval report] section "' + label + '" failed:', e);
      showError('Section "' + label + '" failed to render: ' + (e.message || e));
    }
  }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  // ── Parse the embedded data ──────────────────────────────────────────
  let data;
  try {
    const dataEl = document.getElementById('report-data');
    if (!dataEl) throw new Error('report-data <script> tag missing');
    data = JSON.parse(dataEl.textContent);
  } catch (e) {
    showError('Could not parse report data: ' + (e.message || e));
    return;
  }

  // ── Header ───────────────────────────────────────────────────────────
  safe('header', function() {
    $('#agent-tag').textContent = (data.meta && data.meta.agent_name) || '—';
    const m = data.meta || {};
    const parts = [];
    if (m.run_id) parts.push('Run: ' + m.run_id);
    if (m.run_type) parts.push(m.run_type);
    if (m.experiment_id) parts.push('Experiment: ' + m.experiment_id);
    if (m.interaction_datetime) {
      // Trim ISO seconds for readability — '2026-05-04T04:45:06.583922' → '2026-05-04 04:45'
      const d = String(m.interaction_datetime).replace('T', ' ').slice(0, 16);
      parts.push('Collected ' + d);
    }
    if (m.generated_at) parts.push('Report generated ' + m.generated_at);
    if (m.git_commit) {
      const g = m.git_commit + (m.git_branch ? ' on ' + m.git_branch : '') +
                (m.git_dirty ? ' (dirty)' : '');
      parts.push(g);
    }
    if (m.has_comparison && m.baseline_run) parts.push('Compared to: ' + m.baseline_run);
    $('#subtitle').textContent = parts.join('  ·  ');
    // Test description sits on its own row above the tiles when present.
    if (m.test_description) {
      const desc = document.createElement('div');
      desc.style.cssText = 'margin:-6px 0 14px 0;padding:10px 14px;background:#fff8e1;border:2px solid var(--ink);border-radius:10px;font-size:13px;color:#333;font-weight:500';
      desc.textContent = '📝 ' + m.test_description;
      const tiles = $('#tiles');
      if (tiles && tiles.parentNode) tiles.parentNode.insertBefore(desc, tiles);
    }
  });

  // ── Tab switching (bound EARLY so it works even if later sections fail) ──
  safe('tabs', function() {
    $$('nav.tabs button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        $$('nav.tabs button').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        $$('section.tab-content').forEach(function(s) { s.classList.remove('active'); });
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  });

  // ── Tiles ────────────────────────────────────────────────────────────
  safe('tiles', function() {
    const tilesEl = $('#tiles');
    (data.tiles || []).forEach(function(t) {
      const el = document.createElement('div');
      el.className = 'tile color-' + (t.color || 'blue');
      el.innerHTML = '<div class="label">' + escapeHtml(t.label) + '</div>' +
                     '<div class="value">' + escapeHtml(t.value) + '</div>' +
                     '<div class="hint">' + escapeHtml(t.hint || '') + '</div>';
      tilesEl.appendChild(el);
    });
  });

  // ── LLM metrics table ────────────────────────────────────────────────
  const hasComparison = !!(data.meta && data.meta.has_comparison);
  safe('llm-table', function() {
    const llmTable = $('#llm-table');
    let header = '<tr><th>Metric</th><th class="num">Score</th><th class="num">Range</th>';
    if (hasComparison) header += '<th class="num">Baseline</th><th class="num">Δ</th>';
    header += '<th>Status</th></tr>';
    llmTable.innerHTML = '<thead>' + header + '</thead><tbody></tbody>';
    const tbody = llmTable.querySelector('tbody');
    (data.llm_metrics || []).forEach(function(r) {
      const tr = document.createElement('tr');
      let html;
      if (r.skipped) {
        html = '<td>' + escapeHtml(r.name) + '</td>' +
               '<td class="num"><span class="pill pill-skipped">SKIPPED</span></td>' +
               '<td class="num">—</td>';
        if (hasComparison) html += '<td class="num">—</td><td class="num">—</td>';
        html += '<td><span class="pill pill-skipped">' + escapeHtml(r.reason || '') + '</span></td>';
      } else {
        const norm = r.score_normalized;
        let pill = 'pill-skipped', label = '—';
        if (norm != null) {
          if (norm >= 0.7) { pill = 'pill-good'; label = 'Pass'; }
          else if (norm >= 0.4) { pill = 'pill-mixed'; label = 'Mixed'; }
          else { pill = 'pill-bad'; label = 'Low'; }
        }
        html = '<td><b>' + escapeHtml(r.name) + '</b></td>' +
               '<td class="num">' + escapeHtml(r.score) + '</td>' +
               '<td class="num">' + escapeHtml(r.range) + '</td>';
        if (hasComparison) {
          const dpct = r.delta_pct;
          const dirCls = r.delta_direction === 'improvement' ? 'delta-good' :
                         r.delta_direction === 'regression' ? 'delta-bad' : 'delta-neutral';
          const dStr = dpct == null ? '—' : (dpct >= 0 ? '+' : '') + dpct.toFixed(1) + '%';
          html += '<td class="num">' + escapeHtml(r.baseline || '—') + '</td>' +
                  '<td class="num ' + dirCls + '">' + dStr + '</td>';
        }
        html += '<td><span class="pill ' + pill + '">' + label + '</span></td>';
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  });

  // ── Per-source side-by-side strip (simulation vs interaction) ────────
  safe('per-source', function() {
    const ps = data.per_source || { sources: [] };
    const sources = (ps.sources || []).filter(function(s) {
      return s.metrics && Object.keys(s.metrics).length;
    });
    if (sources.length < 2) return;  // single-source = nothing to compare.
    const card = $('#per-source-card');
    const table = $('#per-source-table');
    if (!card || !table) return;
    card.style.display = '';
    // Union of all metric names across sources, sim-friendly order:
    // headline LLM-judge first, then deterministic.
    const allMetrics = new Set();
    sources.forEach(function(s) {
      Object.keys(s.metrics).forEach(function(k) { allMetrics.add(k); });
    });
    const metricList = Array.from(allMetrics);
    let header = '<tr><th>Metric</th>';
    sources.forEach(function(s) {
      header += '<th class="num">' + escapeHtml(s.name) +
                ' <span style="color:#999;font-weight:400">(n)</span></th>';
    });
    header += '</tr>';
    let body = '';
    metricList.forEach(function(mname) {
      let row = '<tr><td>' + escapeHtml(mname) + '</td>';
      sources.forEach(function(s) {
        const m = s.metrics[mname];
        if (!m || m.average == null) {
          row += '<td class="num" style="color:#bbb">—</td>';
        } else {
          const v = m.average;
          let display;
          if (mname.indexOf('cost') >= 0) display = '$' + Number(v).toFixed(4);
          else if (mname.indexOf('latency') >= 0 || mname.indexOf('seconds') >= 0) display = Number(v).toFixed(2) + 's';
          else if (mname.indexOf('cache') >= 0 || mname.indexOf('reasoning') >= 0 || mname.indexOf('rate') >= 0) {
            // 0–1 ratio metrics get %.
            display = (v <= 1) ? (Number(v) * 100).toFixed(0) + '%' : Number(v).toFixed(2);
          }
          else if (typeof v === 'number') {
            display = v >= 1000 ? Math.round(v).toLocaleString()
                    : (v == Math.floor(v) ? String(v) : v.toFixed(2));
          }
          else display = String(v);
          const cnt = m.count != null ? ' <span style="color:#999;font-weight:400">(' + m.count + ')</span>' : '';
          row += '<td class="num">' + escapeHtml(display) + cnt + '</td>';
        }
      });
      row += '</tr>';
      body += row;
    });
    table.innerHTML = '<thead>' + header + '</thead><tbody>' + body + '</tbody>';
  });

  // ── Deterministic table ──────────────────────────────────────────────
  safe('det-table', function() {
    const detTable = $('#det-table');
    let header = '<tr><th>Metric</th><th class="num">Value</th>';
    if (hasComparison) header += '<th class="num">Baseline</th><th class="num">Δ</th>';
    header += '</tr>';
    detTable.innerHTML = '<thead>' + header + '</thead><tbody></tbody>';
    const tbody = detTable.querySelector('tbody');
    (data.deterministic_metrics || []).forEach(function(r) {
      const tr = document.createElement('tr');
      let html = '<td>' + escapeHtml(r.name) + '</td>' +
                 '<td class="num">' + escapeHtml(r.value) + '</td>';
      if (hasComparison) {
        const dpct = r.delta_pct;
        const dirCls = r.delta_direction === 'improvement' ? 'delta-good' :
                       r.delta_direction === 'regression' ? 'delta-bad' : 'delta-neutral';
        const dStr = dpct == null ? '—' : (dpct >= 0 ? '+' : '') + dpct.toFixed(1) + '%';
        html += '<td class="num">' + escapeHtml(r.baseline || '—') + '</td>' +
                '<td class="num ' + dirCls + '">' + dStr + '</td>';
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  });

  // ── Radar chart ──────────────────────────────────────────────────────
  // Current run is the solid blue polygon. If there's a previous iteration
  // in `data.iterations` (anything before the current one), draw it as a
  // dashed gray polygon underneath so the user sees the baseline at a
  // glance — same comparison story as the iteration history tab.
  safe('radar', function() {
    if (typeof Chart === 'undefined') {
      $('#radar-empty').textContent = 'Chart.js failed to load (offline?). Score table on the right has the same data.';
      $('#radar-empty').style.display = 'block';
      return;
    }
    const radarCanvas = $('#radar');
    const rows = (data.llm_metrics || [])
      .filter(function(r) { return !r.skipped && r.score_normalized != null; });
    const radarLabels = rows.map(function(r) { return r.name; });
    const radarValues = rows.map(function(r) { return r.score_normalized; });
    if (radarLabels.length === 0) {
      $('#radar-empty').style.display = 'block';
      radarCanvas.style.display = 'none';
      return;
    }
    // Pick the iteration immediately before this run as the baseline.
    // `data.iterations` is sorted oldest-first; find the entry flagged
    // is_current and take the one before it (if any).
    const its = data.iterations || [];
    let baseline = null;
    for (let i = 0; i < its.length; i++) {
      if (its[i].is_current && i > 0) { baseline = its[i - 1]; break; }
    }
    // Fallback: if no entry is marked current (single-run setup), use the
    // most recent iteration as long as its run_id differs from this one.
    if (!baseline && its.length >= 2) {
      const lastId = its[its.length - 1].run_id;
      const myId = (data.meta && data.meta.run_id) || '';
      if (lastId === myId) baseline = its[its.length - 2];
      else baseline = its[its.length - 1];
    }

    const datasets = [];
    if (baseline) {
      // Map current radar labels onto baseline values; missing metrics
      // fall back to the score we'd plot for the current run so the
      // polygon stays closed (Chart.js skips nulls and breaks the shape).
      const baseValues = radarLabels.map(function(label, i) {
        // Match by metric display name; baseline keeps SDK-style keys.
        const candidates = [label, label.replace(/ /g, '_').toLowerCase()];
        for (const k of Object.keys(baseline.llm_metrics || {})) {
          if (candidates.indexOf(k) >= 0) return baseline.llm_metrics[k];
          // Rough match: strip non-alphanumerics on both sides.
          const norm = function(s) { return String(s).replace(/[^a-z0-9]/gi, '').toLowerCase(); };
          if (norm(k) === norm(label)) return baseline.llm_metrics[k];
        }
        return null;
      });
      datasets.push({
        label: 'baseline · ' + (baseline.run_id || '—'),
        data: baseValues,
        backgroundColor: 'rgba(95, 99, 104, 0.10)',
        borderColor: '#5f6368',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointBackgroundColor: '#5f6368',
        pointRadius: 3,
      });
    }
    datasets.push({
      label: (data.meta && data.meta.run_id) || 'current',
      data: radarValues,
      backgroundColor: 'rgba(66, 133, 244, 0.20)',
      borderColor: '#4285f4',
      borderWidth: 2.5,
      pointBackgroundColor: '#4285f4',
      pointRadius: 4,
    });

    new Chart(radarCanvas, {
      type: 'radar',
      data: { labels: radarLabels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: { min: 0, max: 1, ticks: { stepSize: 0.2, font: { size: 10 } },
               pointLabels: { font: { size: 11, weight: '600' } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, weight: '600' } } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const v = ctx.parsed.r;
                return ctx.dataset.label + ': ' + (v == null ? '—' : v.toFixed(2));
              }
            }
          }
        }
      }
    });
  });

  // ── Heatmap + per-question accordion ─────────────────────────────────
  safe('heatmap', function() {
    const pq = data.per_question || { questions: [], metric_names: [], matrix: [] };
    const countEl = $('#pq-count');
    if (countEl) countEl.textContent = pq.questions.length || '';
    const heatmapEl = $('#heatmap');
    if (!pq.questions.length || !pq.metric_names.length) {
      $('#heatmap-empty').style.display = 'block';
      return;
    }
    // Row label = friendly id + prompt preview. Hex eval_ids from ADK
    // get renamed to "Sim #N" upstream so the heatmap reads cleanly.
    let html = '<thead><tr><th>Question</th>';
    pq.metric_names.forEach(function(m) {
      html += '<th class="col-header">' + escapeHtml(m) + '</th>';
    });
    html += '</tr></thead><tbody>';
    pq.matrix.forEach(function(row) {
      const label = row.label || row.id;
      const tag = row.source_type === 'simulation' ? 'sim' : 'turn';
      html += '<tr><td class="qid" title="' + escapeHtml(row.raw_id || '') + '">' +
                '<div style="font-weight:700">' + escapeHtml(row.id) + '</div>' +
                '<div style="color:#555;font-weight:400;margin-top:2px">' + escapeHtml(label) + '</div>' +
              '</td>';
      row.row.forEach(function(val, i) {
        const cellLabel = row.cells[i] != null ? row.cells[i] : '—';
        const bg = colorForScore(val);
        html += '<td class="cell" style="background:' + bg + '">' + escapeHtml(cellLabel) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    heatmapEl.innerHTML = html;
  });

  // Render question_answer_log.md as the rich per-question conversation view.
  // Per-question DEEP DIVE — full conversation, tool calls with args+results,
  // final state, agent trajectory, per-metric rubric verdicts. Replaces both
  // the old QA log markdown render AND the rubric-only verdict cards. One
  // collapsible card per question with internal subsections.
  safe('verdicts', function() {
    const pq = data.per_question || { verdicts: [] };
    const verdicts = pq.verdicts || [];
    const list = $('#verdicts-list');
    if (!verdicts.length) return;
    list.innerHTML = '';
    verdicts.forEach(function(q) {
      const item = document.createElement('details');
      item.className = 'qa-item';
      const tag = q.source_type === 'simulation' ? 'sim' : 'single-turn';
      const det = q.deterministic || {};
      const headerStats = [
        det['token_usage.total_tokens'] != null ? Math.round(det['token_usage.total_tokens']).toLocaleString() + ' tok' : null,
        det['latency_metrics.total_latency_seconds'] != null ? Number(det['latency_metrics.total_latency_seconds']).toFixed(1) + 's' : null,
        det['tool_utilization.total_tool_calls'] != null ? det['tool_utilization.total_tool_calls'] + ' tools' : null,
      ].filter(function(x) { return x; }).join(' · ');

      item.innerHTML =
        '<summary class="qa-summary">' +
          '<span class="chevron">›</span>' +
          '<span class="qid">' + escapeHtml(q.id) + '</span>' +
          '<span class="prompt-preview">' + escapeHtml(q.prompt_preview || '') + '</span>' +
          '<span style="font-size:11px;color:#555">[' + escapeHtml(tag) + ']</span>' +
          (headerStats ? ' <span style="font-size:11px;color:#555;font-family:JetBrains Mono,monospace">' + escapeHtml(headerStats) + '</span>' : '') +
        '</summary>' +
        '<div class="qa-detail">' +
          renderRunStats(q.deterministic) +
          renderConversation(q.conversation, q.final_response) +
          renderToolCalls(q.tool_calls) +
          renderStateAndTrajectory(q.state_vars, q.agents_invoked, q.trajectory, q.turn_latencies, q.deterministic) +
          renderThinking(q.thinking) +
          renderAgentSpec(q.system_instruction, q.tool_declarations) +
          renderMetricsBlock(q.metrics) +
        '</div>';
      list.appendChild(item);
    });
  });

  function renderRunStats(det) {
    if (!det || !Object.keys(det).length) return '';
    // Compact metric strip. Filter to NUMERIC cells — list/dict values
    // (models_used, agents_invoked_list, tool_counts) get rendered in
    // the State & trajectory section instead, where they have proper
    // typography. Showing them here as `[object Object]` was the bug.
    const cells = [
      ['Total tokens', det['token_usage.total_tokens'], 'n'],
      ['Prompt tokens', det['token_usage.prompt_tokens'], 'n'],
      ['Completion tokens', det['token_usage.completion_tokens'], 'n'],
      ['Cached tokens', det['token_usage.cached_tokens'], 'n'],
      ['Cost', det['token_usage.estimated_cost_usd'], 'cost'],
      ['Wall-clock', det['latency_metrics.total_latency_seconds'], 's'],
      ['LLM time', det['latency_metrics.llm_latency_seconds'], 's'],
      ['Tool time', det['latency_metrics.tool_latency_seconds'], 's'],
      ['LLM calls', det['token_usage.llm_calls'], 'n'],
      ['Tool calls', det['tool_utilization.total_tool_calls'], 'n'],
      ['Cache hit', det['cache_efficiency.cache_hit_rate'], 'pct'],
      ['Reasoning ratio', det['thinking_metrics.reasoning_ratio'], 'pct'],
      ['Thinking tokens', det['thinking_metrics.total_thinking_tokens'], 'n'],
      ['Tool success', det['tool_success_rate.tool_success_rate'], 'pct'],
      ['Failed tools', det['tool_success_rate.failed_tool_calls'], 'n'],
      ['Sub-agent handoffs', det['agent_handoffs.total_handoffs'], 'n'],
      ['Max ctx tokens', det['context_saturation.max_total_tokens'], 'n'],
    ].filter(function(c) {
      return typeof c[1] === 'number' && !isNaN(c[1]);
    });
    if (!cells.length) return '';
    let html = '<h4>📈 Run-time metrics</h4><div class="metric-strip">';
    cells.forEach(function(c) {
      let display;
      if (c[2] === 'cost') display = '$' + Number(c[1]).toFixed(4);
      else if (c[2] === 's') display = Number(c[1]).toFixed(2) + 's';
      else if (c[2] === 'pct') display = (Number(c[1]) * 100).toFixed(0) + '%';
      else if (c[1] >= 1000) display = c[1].toLocaleString();
      else display = c[1] == Math.floor(c[1]) ? String(c[1]) : c[1].toFixed(2);
      html += '<div class="metric-cell">' +
                '<div class="metric-cell-label">' + escapeHtml(c[0]) + '</div>' +
                '<div class="metric-cell-value">' + escapeHtml(display) + '</div>' +
              '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderThinking(th) {
    if (!th || !th.n_thoughts) return '';
    return '<h4>💭 Reasoning trace</h4>' +
      '<div class="text-block" style="font-size:12px">' +
        '<div style="font-weight:600;margin-bottom:6px">' + th.n_thoughts +
        ' thinking step' + (th.n_thoughts === 1 ? '' : 's') + '</div>' +
        (th.sample ? '<div style="color:#555">Sample: ' + escapeHtml(th.sample) + '</div>' : '') +
      '</div>';
  }

  function renderAgentSpec(systemInstruction, toolDecls) {
    if (!systemInstruction && !(toolDecls && toolDecls.length)) return '';
    let html = '<h4>📜 What the agent saw</h4><div class="state-grid">';
    if (systemInstruction) {
      html += '<div class="state-card" style="grid-column:1/-1">' +
                '<div class="tool-label">System instruction (what the LLM was told)</div>' +
                '<pre style="font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow-y:auto;background:var(--ink);color:#f8f7f2;padding:10px 12px;border-radius:8px;margin-top:6px">' +
                  escapeHtml(systemInstruction) +
                '</pre>' +
              '</div>';
    }
    if (toolDecls && toolDecls.length) {
      html += '<div class="state-card" style="grid-column:1/-1">' +
                '<div class="tool-label">Tools available to the LLM (' + toolDecls.length + ')</div>' +
                '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">' +
                toolDecls.map(function(td) {
                  // Python pre-flattens to {name, description}, but accept a
                  // bare string fallback in case some agent emits its own shape.
                  if (typeof td === 'string') return '<span class="qa-score"><code>' + escapeHtml(td) + '</code></span>';
                  const name = (td && td.name) || '?';
                  const desc = (td && td.description) || '';
                  const tip = desc ? ' title="' + escapeHtml(desc) + '"' : '';
                  return '<span class="qa-score"' + tip + '><code>' + escapeHtml(name) + '</code></span>';
                }).join('') +
                '</div>' +
              '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderConversation(turns, finalResp) {
    if ((!turns || !turns.length) && !finalResp) return '';
    let html = '<h4>💬 Conversation</h4><div class="conv-thread">';
    (turns || []).forEach(function(t) {
      const cls = t.role === 'user' ? 'turn-user' : 'turn-model';
      const tag = t.role === 'user' ? 'User' : 'Agent';
      const style = t.text && t.text.length > 500 ? ' style="max-height: 250px; overflow-y: auto;"' : '';
      html += '<div class="conv-turn ' + cls + '"' + style + '>' +
                '<div class="conv-role">' + tag + '</div>' +
                '<div class="conv-text">' + escapeHtml(t.text) + '</div>' +
              '</div>';
    });
    html += '</div>';
    if (finalResp) {
      const respStyle = finalResp.length > 500 ? ' style="max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-word;"' : '';
      html += '<h4>🎯 Final response</h4><div class="text-block"' + respStyle + '>' +
              escapeHtml(finalResp) + '</div>';
    }
    return html;
  }

  function renderToolCalls(calls) {
    if (!calls || !calls.length) return '';
    const failures = calls.filter(function(c) { return c.ok === false; }).length;
    const headerSuffix = failures
      ? ' <span style="color:var(--g-red);font-weight:700">· ' + failures + ' failed</span>'
      : '';
    let html = '<h4>🛠 Tool calls (' + calls.length + ')' + headerSuffix + '</h4><div class="tool-list">';
    calls.forEach(function(c, i) {
      const okSym = c.ok === false ? '✗' : '✓';
      const okCls = c.ok === false ? 'verdict-fail' : 'verdict-pass';
      // Tool calls with status==error or error/error_message keys in their
      // output_result auto-expand so the user sees the failure first.
      const openAttr = c.ok === false ? ' open' : '';
      html += '<details class="tool-item"' + openAttr + '>' +
                '<summary class="tool-head">' +
                  '<span class="verdict-sym ' + okCls + '">' + okSym + '</span>' +
                  '<code><b>' + escapeHtml(c.name) + '</b></code>' +
                  (c.call_id ? ' <span style="color:#888;font-size:10px;font-family:JetBrains Mono,monospace">' + escapeHtml(c.call_id) + '</span>' : '') +
                '</summary>' +
                '<div class="tool-body">' +
                  '<div class="tool-section"><div class="tool-label">Args</div><pre><code>' +
                    escapeHtml(c.args || '{}') +
                  '</code></pre></div>' +
                  '<div class="tool-section"><div class="tool-label">Result</div><pre><code>' +
                    escapeHtml(c.result || '(empty)') +
                  '</code></pre></div>' +
                '</div>' +
              '</details>';
    });
    html += '</div>';
    return html;
  }

  function renderStateAndTrajectory(state, agents, trajectory, latencies, det) {
    const hasState = state && Object.keys(state).length;
    const hasAgents = agents && agents.length;
    const hasLat = latencies && latencies.length;
    det = det || {};
    // Surface the non-numeric det fields that don't fit the metric strip:
    //   - models_used: ['gemini-3-flash-preview']
    //   - tool_counts: aggregated as flat 'tool_utilization.tool_counts.<name>' = N
    //   - agents_invoked_list: ['app']
    //   - peak_usage_span: where context peaked
    //   - failed_tools_list: relevant when tool_success_rate < 1
    const models = det['token_usage.models_used'] || [];
    const agentsList = det['agent_handoffs.agents_invoked_list'] || [];
    const peakSpan = det['context_saturation.peak_usage_span'];
    const failedTools = det['tool_success_rate.failed_tools_list'] || [];
    // Reconstruct tool_counts dict from flattened keys.
    const toolCounts = {};
    Object.keys(det).forEach(function(k) {
      const m = k.match(/^tool_utilization\.tool_counts\.(.+)$/);
      if (m && typeof det[k] === 'number') toolCounts[m[1]] = det[k];
    });
    const hasModels = Array.isArray(models) && models.length;
    const hasAgentsList = Array.isArray(agentsList) && agentsList.length;
    const hasToolCounts = Object.keys(toolCounts).length > 0;
    const hasFailedTools = Array.isArray(failedTools) && failedTools.length;
    const hasPeak = !!peakSpan;
    const hasAnyExtras = hasModels || hasAgentsList || hasToolCounts || hasFailedTools || hasPeak;
    if (!hasState && !hasAgents && !hasLat && !trajectory && !hasAnyExtras) return '';
    let html = '<h4>🧠 State &amp; trajectory</h4><div class="state-grid">';
    if (trajectory) {
      html += '<div class="state-card"><div class="tool-label">Agent path</div>' +
              '<code>' + escapeHtml(trajectory) + '</code></div>';
    }
    if (hasAgents) {
      html += '<div class="state-card"><div class="tool-label">Agents invoked (from trace)</div>' +
              agents.map(function(a) { return '<span class="qa-score">' + escapeHtml(a) + '</span>'; }).join(' ') +
              '</div>';
    }
    if (hasAgentsList) {
      html += '<div class="state-card"><div class="tool-label">Agents invoked (handoff metric)</div>' +
              agentsList.map(function(a) { return '<span class="qa-score">' + escapeHtml(a) + '</span>'; }).join(' ') +
              '</div>';
    }
    if (hasModels) {
      html += '<div class="state-card"><div class="tool-label">Models used</div>' +
              models.map(function(m) { return '<span class="qa-score"><code>' + escapeHtml(String(m)) + '</code></span>'; }).join(' ') +
              '</div>';
    }
    if (hasToolCounts) {
      html += '<div class="state-card"><div class="tool-label">Tool call counts</div>' +
              Object.entries(toolCounts)
                .sort(function(a, b) { return b[1] - a[1]; })
                .map(function(e) {
                  return '<span class="qa-score"><code>' + escapeHtml(e[0]) + '</code> ×' + e[1] + '</span>';
                }).join(' ') +
              '</div>';
    }
    if (hasFailedTools) {
      html += '<div class="state-card" style="border-color:var(--g-red)"><div class="tool-label">Failed tool calls</div>' +
              failedTools.map(function(t) { return '<span class="qa-score" style="background:var(--g-red-soft)"><code>' + escapeHtml(safeStringify(t)) + '</code></span>'; }).join(' ') +
              '</div>';
    }
    if (hasPeak) {
      html += '<div class="state-card"><div class="tool-label">Context peak span</div>' +
              '<code>' + escapeHtml(String(peakSpan)) + '</code></div>';
    }
    if (hasLat) {
      html += '<div class="state-card"><div class="tool-label">Per-turn latency</div>' +
              '<table class="metrics" style="font-size:11px"><thead><tr><th>Turn</th><th class="num">Total</th><th class="num">LLM</th><th class="num">Tools</th></tr></thead><tbody>' +
              latencies.map(function(t) {
                return '<tr><td>' + t.turn + '</td>' +
                  '<td class="num">' + (t.total_s != null ? Number(t.total_s).toFixed(2) + 's' : '—') + '</td>' +
                  '<td class="num">' + (t.llm_s != null ? Number(t.llm_s).toFixed(2) + 's' : '—') + '</td>' +
                  '<td class="num">' + (t.tool_s != null ? Number(t.tool_s).toFixed(2) + 's' : '—') + '</td></tr>';
              }).join('') +
              '</tbody></table></div>';
    }
    if (hasState) {
      html += '<div class="state-card" style="grid-column:1/-1"><div class="tool-label">Final session state</div>' +
              '<table class="metrics" style="font-size:12px"><tbody>' +
              Object.entries(state).map(function(e) {
                const s = typeof e[1] === 'string' ? e[1] : JSON.stringify(e[1]);
                const wrapped = s.length > 500 ? '<pre class="state-inspection" style="max-height: 250px; overflow-y: auto;">' + escapeHtml(s) + '</pre>' : escapeHtml(s);
                return '<tr><td><code style="font-size:11px">' + escapeHtml(e[0]) + '</code></td>' +
                       '<td>' + wrapped + '</td></tr>';
              }).join('') +
              '</tbody></table></div>';
    }
    html += '</div>';
    return html;
  }

  function renderMetricsBlock(metrics) {
    if (!metrics || !Object.keys(metrics).length) return '';
    return '<h4>📊 Per-metric scores &amp; rubric verdicts</h4>' +
           renderMetricVerdicts(metrics);
  }

  // ── Iteration history — native render (no markdown) ─────────────────
  // Trend line chart of LLM metrics over runs + per-iteration cards
  // with delta deltas. Replaces the old marked.js render of OPT_LOG.md
  // (markdown stays on disk for git/grep but isn't the source here).
  safe('iterations-chart', function() {
    const its = data.iterations || [];
    if (its.length < 2 || typeof Chart === 'undefined') {
      $('#iterations-chart-empty').style.display = 'block';
      return;
    }
    const labels = its.map(function(it) { return it.run_id; });
    // Pull every LLM metric name across all iterations.
    const metricNames = [];
    its.forEach(function(it) {
      Object.keys(it.llm_metrics || {}).forEach(function(n) {
        if (metricNames.indexOf(n) < 0) metricNames.push(n);
      });
    });
    const palette = ['#4285f4', '#ea4335', '#34a853', '#fbbc04',
                     '#9334e6', '#00897b', '#f57c00', '#5e35b1'];
    const datasets = metricNames.map(function(n, i) {
      return {
        label: n,
        data: its.map(function(it) { return it.llm_metrics[n] != null ? it.llm_metrics[n] : null; }),
        borderColor: palette[i % palette.length],
        backgroundColor: palette[i % palette.length] + '20',
        borderWidth: 2.5,
        tension: 0.25,
        spanGaps: true,
        pointRadius: 4,
      };
    });
    new Chart($('#iterations-chart'), {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 1, ticks: { stepSize: 0.2 } },
          x: { ticks: { font: { size: 11, weight: '600' } } }
        },
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11, weight: '600' } } } }
      }
    });
  });

  safe('iterations-list', function() {
    const its = data.iterations || [];
    const list = $('#iterations-list');
    if (!its.length) return;
    // Newest first for the card list (the chart is left-to-right oldest-first).
    const reversed = its.slice().reverse();
    list.innerHTML = reversed.map(function(it) {
      const isCurrent = it.is_current;
      const llmRows = Object.entries(it.llm_metrics || {}).map(function(e) {
        const n = e[0], v = e[1];
        const dpct = (it.deltas || {})[n];
        const score = (typeof v === 'number') ? v.toFixed(2) : '—';
        let pillCls = 'pill-skipped';
        if (typeof v === 'number') {
          if (v >= 0.7) pillCls = 'pill-good';
          else if (v >= 0.4) pillCls = 'pill-mixed';
          else pillCls = 'pill-bad';
        }
        const dStr = (typeof dpct === 'number') ?
          ' <span class="' + (dpct >= 0 ? 'delta-good' : 'delta-bad') + '">' +
            (dpct >= 0 ? '+' : '') + dpct.toFixed(1) + '%</span>'
          : '';
        return '<div class="iter-metric">' +
          '<span class="pill ' + pillCls + '">' + score + '</span>' +
          ' <b>' + escapeHtml(n) + '</b>' + dStr +
        '</div>';
      }).join('');
      const detRows = Object.entries(it.det_metrics || {}).map(function(e) {
        const n = e[0], v = e[1];
        const dpct = (it.deltas || {})[n];
        const dStr = (typeof dpct === 'number') ?
          ' <span class="' + (dpct >= 0 ? 'delta-bad' : 'delta-good') + '">' +
            (dpct >= 0 ? '+' : '') + dpct.toFixed(1) + '%</span>'
          : '';
        // For det_metrics, lower is generally better (latency, cost,
        // tokens), EXCEPT cache_hit_rate. Flip the sign there.
        const lowerBad = n.indexOf('cache_hit_rate') >= 0;
        let dirCls = '';
        if (typeof dpct === 'number') {
          dirCls = lowerBad ? (dpct >= 0 ? 'delta-good' : 'delta-bad') :
                              (dpct >= 0 ? 'delta-bad' : 'delta-good');
        }
        const dStr2 = (typeof dpct === 'number') ?
          ' <span class="' + dirCls + '">' + (dpct >= 0 ? '+' : '') + dpct.toFixed(1) + '%</span>'
          : '';
        return '<div class="iter-metric">' +
          escapeHtml(n.split('.').pop()) + ': <b>' + formatVal(v, n) + '</b>' + dStr2 +
        '</div>';
      }).join('');
      const gitInfo = it.git_commit ?
        '<span class="iter-git"><code>' + escapeHtml(it.git_commit) + '</code>' +
          (it.git_branch ? ' on ' + escapeHtml(it.git_branch) : '') + '</span>'
        : '';
      return '<div class="iter-card' + (isCurrent ? ' iter-current' : '') + '">' +
        '<div class="iter-head">' +
          '<div>' +
            '<span class="iter-id">' + escapeHtml(it.run_id) + '</span>' +
            (isCurrent ? ' <span class="pill pill-good">CURRENT</span>' : '') +
          '</div>' +
          '<div class="iter-meta">' + escapeHtml(it.datetime || '') + ' ' + gitInfo + '</div>' +
        '</div>' +
        '<div class="iter-body">' +
          '<div class="iter-section"><div class="iter-section-h">LLM-judge</div>' + llmRows + '</div>' +
          '<div class="iter-section"><div class="iter-section-h">Run-time</div>' + detRows + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  });
  safe('gemini-md', function() {
    const gem = data.gemini_analysis_md || '';
    const el = $('#gemini-md');
    if (typeof marked === 'undefined') {
      el.innerHTML = '<pre style="white-space:pre-wrap">' + escapeHtml(gem) + '</pre>';
    } else {
      marked.setOptions({ breaks: false, gfm: true });
      el.innerHTML = gem ? marked.parse(gem)
        : '<div class="empty">AI analysis not generated this run (use --skip-gemini to disable, or check for errors).</div>';
    }
  });

  // ── Verdict rendering ────────────────────────────────────────────────
  // Stringify any value safely — defends against [object Object] when a
  // metric's "explanation" is actually a list/dict (different metrics
  // have very different output shapes).
  function safeStringify(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      return JSON.stringify(v, null, 2);
    } catch (e) {
      return String(v);
    }
  }

  function renderMetricVerdicts(metrics) {
    if (!metrics || !Object.keys(metrics).length) {
      return '<div class="empty">No rubric verdicts for this question.</div>';
    }
    return Object.entries(metrics).map(function(entry) {
      const mname = entry[0], m = entry[1] || {};
      const score = m.score;
      const isFailed = !!m.error || (score == null && !m.explanation && !m.verdicts);
      const norm = (typeof score === 'number') ? Math.max(0, Math.min(1, score)) : null;
      let pillCls = 'pill-skipped', pillLabel = '—';
      if (isFailed) {
        pillCls = 'pill-bad';
        pillLabel = 'FAILED';
      } else if (norm != null) {
        if (norm >= 0.7) { pillCls = 'pill-good'; pillLabel = 'Pass · ' + score.toFixed(2); }
        else if (norm >= 0.4) { pillCls = 'pill-mixed'; pillLabel = 'Mixed · ' + score.toFixed(2); }
        else { pillCls = 'pill-bad'; pillLabel = 'Low · ' + score.toFixed(2); }
      }
      const verdictEntries = (Array.isArray(m.verdicts) ? m.verdicts : []).filter(function(v) {
        return v && typeof v === 'object';
      });

      // Build the body: per-rubric verdicts, plus the explanation (which
      // varies wildly across metrics — string, list of {response,score,
      // explanation}, or absent).
      let bodyHtml = '';
      if (m.error) {
        bodyHtml += '<div class="metric-explanation" style="background:var(--g-red-soft);border-color:var(--g-red)">' +
                    '<b>Autorater error:</b> ' + escapeHtml(safeStringify(m.error)) +
                    '</div>';
      }
      // Top-level explanation — ONLY when it's a string. List/dict
      // explanations get rendered separately below.
      if (typeof m.explanation === 'string' && m.explanation) {
        bodyHtml += '<div class="metric-explanation">' + escapeHtml(m.explanation) + '</div>';
      }
      // List-shape explanation = per-row sub-verdicts (e.g. hallucination
      // returns a list of {response, score, explanation} per claim).
      if (Array.isArray(m.explanation) && m.explanation.length) {
        bodyHtml += '<div class="verdict-grid">' +
          m.explanation.map(function(sub) {
            if (!sub || typeof sub !== 'object') {
              return '<div class="verdict-item"><div class="verdict-reasoning">' + escapeHtml(safeStringify(sub)) + '</div></div>';
            }
            let subScore = sub.score;
            if (typeof subScore !== 'number' && sub.label) {
              subScore = sub.label === 'supported' ? 1.0 : (sub.label === 'unsupported' ? 0.0 : null);
            }
            const responseVal = sub.response || sub.sentence;
            const explanationVal = sub.explanation || sub.rationale;
            const excerptVal = sub.excerpt || sub.supporting_excerpt;

            const subPass = (typeof subScore === 'number') ? subScore >= 0.5 : null;
            const sym = subPass === true ? '✓' : subPass === false ? '✗' : (sub.label === 'no_rad' ? '·' : '—');
            const cls = subPass === true ? 'verdict-pass' : subPass === false ? 'verdict-fail' : 'verdict-na';
            const scoreStr = (typeof subScore === 'number') ? subScore.toFixed(2) : (sub.label ? sub.label.toUpperCase() : '');

            return '<div class="verdict-item">' +
              '<div class="verdict-head">' +
                '<span class="verdict-sym ' + cls + '">' + sym + '</span>' +
                (scoreStr ? '<span class="verdict-imp">' + escapeHtml(scoreStr) + '</span>' : '') +
              '</div>' +
              (responseVal ? '<div class="verdict-rubric">' + escapeHtml(safeStringify(responseVal)) + '</div>' : '') +
              (explanationVal ? '<div class="verdict-reasoning">' + escapeHtml(safeStringify(explanationVal)) + '</div>' : '') +
              (excerptVal ? '<div class="verdict-reasoning" style="font-size:10px;color:var(--g-gray-dark)"><b>Excerpt:</b> ' + escapeHtml(safeStringify(excerptVal)) + '</div>' : '') +
              '</div>';
          }).join('') +
          '</div>';
      }
      // Dict-shape explanation = single object — pretty-print as JSON.
      if (m.explanation && typeof m.explanation === 'object' && !Array.isArray(m.explanation)) {
        bodyHtml += '<pre style="background:var(--ink);color:#f8f7f2;padding:10px;border-radius:8px;font-size:11px;overflow-x:auto">' +
                    escapeHtml(safeStringify(m.explanation)) + '</pre>';
      }
      // Per-rubric verdicts (custom_llm_judge metrics like tool_use_quality).
      if (verdictEntries.length) {
        bodyHtml += '<div class="verdict-grid">' +
          verdictEntries.map(function(v) {
            const verd = v.verdict;
            // Some metrics' verdicts have NO `verdict` field — they're
            // implicit pass-by-presence. Show '—' rather than ✗.
            const verdSym = verd === true ? '✓' : verd === false ? '✗' : '·';
            const verdCls = verd === true ? 'verdict-pass' : verd === false ? 'verdict-fail' : 'verdict-na';
            const importanceTag = v.importance ? '<span class="verdict-imp imp-' + escapeHtml(String(v.importance).toLowerCase()) + '">' + escapeHtml(v.importance) + '</span>' : '';
            const typeTag = v.type ? '<code class="verdict-type">' + escapeHtml(v.type) + '</code>' : '';
            return '<div class="verdict-item">' +
                '<div class="verdict-head">' +
                  '<span class="verdict-sym ' + verdCls + '">' + verdSym + '</span>' +
                  importanceTag + typeTag +
                '</div>' +
                (v.rubric ? '<div class="verdict-rubric">' + escapeHtml(safeStringify(v.rubric)) + '</div>' : '') +
                (v.reasoning ? '<div class="verdict-reasoning">' + escapeHtml(safeStringify(v.reasoning)) + '</div>' : '') +
              '</div>';
          }).join('') +
          '</div>';
      }
      // Final fallback for managed metrics with score-only output.
      if (!bodyHtml) {
        bodyHtml = '<div style="color:#555;font-size:12px">' +
          (norm != null
            ? 'Managed metric — score reported by Vertex without per-rubric breakdown. Open eval_summary.json for the raw output.'
            : 'No autorater output captured (metric may have been skipped).') +
          '</div>';
      }

      // Header subtitle: counts of what's available.
      const counts = [];
      if (verdictEntries.length) counts.push(verdictEntries.length + ' rubric' + (verdictEntries.length === 1 ? '' : 's'));
      if (Array.isArray(m.explanation) && m.explanation.length) counts.push(m.explanation.length + ' sub-verdict' + (m.explanation.length === 1 ? '' : 's'));
      if (m.error) counts.push('error');
      const countStr = counts.length ? counts.join(' · ') : '';

      return '<details class="metric-block" open>' +
        '<summary class="metric-block-summary">' +
          '<span class="chevron">›</span>' +
          '<b>' + escapeHtml(mname) + '</b>' +
          '<span class="pill ' + pillCls + '">' + pillLabel + '</span>' +
          (countStr ? '<span class="metric-rubric-count">' + escapeHtml(countStr) + '</span>' : '') +
        '</summary>' +
        '<div class="metric-block-body">' + bodyHtml + '</div>' +
      '</details>';
    }).join('');
  }

  // ── Helpers used by the safe() blocks above ──────────────────────────
  function colorForScore(v) {
    if (v == null) return '#ffffff';
    if (v >= 0.7) return 'rgba(52, 168, 83, ' + (0.20 + v * 0.40) + ')';
    if (v >= 0.4) return 'rgba(251, 188, 4, ' + (0.30 + v * 0.30) + ')';
    return 'rgba(234, 67, 53, ' + (0.30 + (1 - v) * 0.40) + ')';
  }
  function renderScoreChips(scores) {
    if (!scores || !Object.keys(scores).length) return '<span class="qa-score">No LLM scores</span>';
    return Object.entries(scores).map(function(entry) {
      const name = entry[0], val = entry[1];
      const v = (val && typeof val === 'object') ? val.score : val;
      const display = v == null ? '—' : (typeof v === 'number' ? v.toFixed(2) : v);
      return '<span class="qa-score"><b>' + escapeHtml(name) + ':</b> ' + escapeHtml(display) + '</span>';
    }).join('');
  }
  function renderDetSection(det) {
    if (!det || !Object.keys(det).length) return '';
    const interesting = ['token_usage.total_tokens', 'token_usage.estimated_cost_usd',
                         'latency_metrics.total_latency_seconds', 'tool_utilization.total_tool_calls'];
    const rows = interesting
      .filter(function(k) { return det[k] !== undefined; })
      .map(function(k) {
        return '<span class="qa-score"><b>' + escapeHtml(k.split('.').pop()) + ':</b> ' +
               escapeHtml(formatVal(det[k], k)) + '</span>';
      }).join('');
    if (!rows) return '';
    return '<h4>Run-time stats</h4><div class="qa-scores">' + rows + '</div>';
  }
  function formatVal(v, k) {
    if (k.indexOf('cost') >= 0) return '$' + Number(v).toFixed(4);
    if (k.indexOf('seconds') >= 0 || k.indexOf('latency') >= 0) return Number(v).toFixed(2) + 's';
    if (typeof v === 'number') {
      if (v >= 1000) return v.toLocaleString();
      return v == Math.floor(v) ? String(v) : v.toFixed(2);
    }
    return String(v);
  }
})();
</script>
</body>
</html>
"""

# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------


def generate_html_report(
    *,
    run_dir: Path,
    summary: Dict[str, Any],
    comparison: Optional[Dict[str, Any]] = None,
    gemini_analysis_md: Optional[str] = None,
    optimization_log_md: Optional[str] = None,
    qa_log_md: Optional[str] = None,
    results_csv: Optional[Path] = None,
    agent_name: Optional[str] = None,
    output_path: Optional[Path] = None,
) -> Path:
    """Write a self-contained HTML report and return its path."""
    output_path = output_path or (run_dir / "report.html")
    run_id = run_dir.name
    if not agent_name:
        try:
            agent_name = run_dir.parent.parent.parent.parent.name
        except Exception:
            agent_name = "agent"

    # Auto-load the three markdown sidecars from their conventional paths
    # if the caller didn't pass them. Symmetric: any one missing gets
    # silently empty before this fix, which is how the AI analysis tab
    # disappeared on report regeneration.
    def _autoload(name: str, current: Optional[str]) -> Optional[str]:
        if current is not None:
            return current
        p = run_dir / name
        if not p.exists():
            return None
        try:
            return p.read_text(encoding="utf-8")
        except OSError:
            return None

    qa_log_md = _autoload("question_answer_log.md", qa_log_md)
    gemini_analysis_md = _autoload("gemini_analysis.md", gemini_analysis_md)
    # OPTIMIZATION_LOG lives one level up — it's per-results-parent, not
    # per-run. The native iteration view replaced its rendering, but pass
    # it through anyway in case future code wants the raw text.
    if optimization_log_md is None:
        opt_path = run_dir.parent / "OPTIMIZATION_LOG.md"
        if opt_path.exists():
            try:
                optimization_log_md = opt_path.read_text(encoding="utf-8")
            except OSError:
                optimization_log_md = None

    # Build the cross-run iteration history natively from each
    # eval_summary.json under the parent results dir. This replaces
    # the markdown-rendered OPTIMIZATION_LOG.md as the canonical
    # iteration view in the HTML — the markdown stays on disk for
    # git/grep but isn't the source of truth here anymore.
    iterations = _build_iterations_data(run_dir.parent, current_run_id=run_id)

    payload = _build_payload(
        run_id=run_id,
        agent_name=agent_name,
        summary=summary,
        comparison=comparison,
        gemini_analysis_md=gemini_analysis_md,
        optimization_log_md=optimization_log_md,
        qa_log_md=qa_log_md,
        results_csv=results_csv,
        iterations=iterations,
    )

    # JSON encoding belt-and-suspenders for safe embedding in
    # `<script type="application/json">`:
    #   - ensure_ascii=True escapes all non-ASCII to \uXXXX (no UTF-8
    #     surprises in the parser)
    #   - Replace `</` with `<\/` so any literal `</script>` substring in
    #     the data (agent responses sometimes scrape full HTML pages with
    #     analytics tags) doesn't prematurely close our <script> tag
    data_json = json.dumps(payload, default=str, ensure_ascii=True).replace(
        "</", "<\\/"
    )

    html_text = (
        _HTML_TEMPLATE.replace("__RUN_ID__", html.escape(run_id))
        .replace("__GENERATED_AT__", payload["meta"]["generated_at"])
        .replace("__DATA_JSON__", data_json)
    )
    output_path.write_text(html_text, encoding="utf-8")
    return output_path
