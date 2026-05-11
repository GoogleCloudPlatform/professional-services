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
"""Canonical metric_definitions.json schema — single source of truth.

Mirrors the six metric patterns the Vertex AI Gen AI Evaluation SDK supports
(per https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval
and https://cloud.google.com/vertex-ai/generative-ai/docs/models/rubric-metric-details).

`metric_factory.build_metric`, `metric_generator` (Gemini prompts), the
validator, and the docs all reference the constants in this module so the
schema can never drift between layers.

────────────────────────────────────────────────────────────────────────────
Where every field lives (no duplication policy)
────────────────────────────────────────────────────────────────────────────

- ``kind`` constants + per-kind required-fields → THIS FILE (our vocabulary,
  not the SDK's).
- Per-managed-metric required columns → THIS FILE (the SDK doesn't expose
  this at runtime; it's a docs-mirror — exactly one copy).
- Default per-row column → trace-source mappings → THIS FILE (same reason).
- Default rating_scores convention → THIS FILE (our preference, not a
  docs-required value).
- Set of available managed/computation/translation metric NAMES →
  ``metric_families._supported_*()`` (already dynamically introspected from
  the installed SDK; never hardcoded here).
- Family classification per metric → ``metric_families.classify()``
  (introspected from the SDK; never duplicated).
- Doc URLs → THIS FILE.

Anything we add later that exists in the SDK at runtime should be introspected,
not copied. Add a constant here ONLY when the SDK doesn't expose it.

────────────────────────────────────────────────────────────────────────────
Canonical schema
────────────────────────────────────────────────────────────────────────────

Each entry under ``metrics`` in ``tests/eval/metrics/metric_definitions.json``
declares one of six ``kind`` values:

.. code-block:: jsonc

    {
      "metrics": {

        // 1. managed — types.RubricMetric.<NAME>
        "general_quality": {
          "kind": "managed",
          "base": "GENERAL_QUALITY",
          "version": "v1"            // optional
        },

        // 2. parametrized_managed — types.RubricMetric.<NAME>(metric_spec_parameters=...)
        "general_quality_styled": {
          "kind": "parametrized_managed",
          "base": "GENERAL_QUALITY",
          "guidelines": "The response must maintain a professional tone...",
          "rubric_groups": { ... },   // optional, dict
          "rubric_group_name": "..."  // optional, references generated rubrics
        },

        // 3. custom_llm_judge — types.LLMMetric(prompt_template=MetricPromptBuilder(...))
        "language_simplicity": {
          "kind": "custom_llm_judge",
          "instruction": "Evaluate the story's simplicity for a 5-year-old.",
          "criteria": {
            "Vocabulary": "Uses simple words.",
            "Sentences": "Uses short sentences."
          },
          "rating_scores": {
            "1": "Pass: meets all criteria",
            "0": "Fail: does not meet at least one criterion"
          }
        },

        // 4. computation — types.Metric(name='bleu' | 'rouge_l' | 'exact_match' | tool_*)
        //    The SET of valid metric_name values is introspected dynamically
        //    from metric_families._supported_computation() — never hardcoded.
        "bleu": {
          "kind": "computation",
          "metric_name": "bleu"
        },

        // 5. python_function — types.Metric(custom_function=callable)
        "keyword_check": {
          "kind": "python_function",
          "module": "tests/eval/custom_metrics.py",
          "function": "contains_keyword"
        },

        // 6. remote_code — types.Metric(remote_custom_function=code_snippet)
        "exact_check": {
          "kind": "remote_code",
          "code_snippet": "def evaluate(instance):\\n    return {'score': 1.0}"
        }
      }
    }

────────────────────────────────────────────────────────────────────────────
agent-eval extras (orthogonal to the SDK schema)
────────────────────────────────────────────────────────────────────────────

Every entry may also carry these optional ``agent-eval``-specific fields. They
control how rows are routed to metrics and how ADK trace columns are projected
into the SDK columns each metric needs:

- ``requires_reference`` (bool) — metric is only run on rows whose
  ``reference_data`` slot is populated. Used by metrics that compare against
  golden expected outputs.
- ``requires_multi_turn`` (bool) — metric is only run on rows that have
  multi-turn ``history`` / ``conversation_plan``. Used by ``MULTI_TURN_*`` and
  trajectory metrics.
- ``dataset_mapping`` (dict) — maps Vertex SDK column names (``prompt``,
  ``response``, ``reference``, ``history``, ``intermediate_events``,
  ``rubric_groups``, etc.) to the source columns in our ADK trace JSONL
  (``user_inputs``, ``final_response``, ``trace_summary``, etc.). When omitted
  the evaluator falls back to ``SDK_COLUMN_DEFAULTS`` per the metric family.
- ``reference_field`` (str) — for managed metrics that consume ``reference``,
  names which slot in the row's ``reference_data`` to compare against.

────────────────────────────────────────────────────────────────────────────
Legacy schema (still readable, never written)
────────────────────────────────────────────────────────────────────────────

Pre-2026-04-30 metric files used a flat-string ``template`` + numeric
``score_range``::

    {
      "metric_type": "llm",
      "score_range": {"min": 0, "max": 1, "type": "rubric"},
      "dataset_mapping": { ... },
      "template": "Evaluate...\\n\\nOutput JSON: {\\"score\\": <0|1>}"
    }

``metric_factory.build_metric`` adapts these on read into a synthetic
``custom_llm_judge`` (single criterion = the entire template, ``rating_scores``
derived from ``score_range``). New generation always emits the canonical
schema; the adapter is purely back-compat.
"""

from __future__ import annotations

from typing import Final


# ── Canonical kinds (our vocabulary, not the SDK's) ───────────────────────

KIND_MANAGED: Final[str] = "managed"
KIND_PARAMETRIZED_MANAGED: Final[str] = "parametrized_managed"
KIND_CUSTOM_LLM_JUDGE: Final[str] = "custom_llm_judge"
KIND_COMPUTATION: Final[str] = "computation"
KIND_PYTHON_FUNCTION: Final[str] = "python_function"
KIND_REMOTE_CODE: Final[str] = "remote_code"

ALL_KINDS: Final[frozenset[str]] = frozenset({
    KIND_MANAGED,
    KIND_PARAMETRIZED_MANAGED,
    KIND_CUSTOM_LLM_JUDGE,
    KIND_COMPUTATION,
    KIND_PYTHON_FUNCTION,
    KIND_REMOTE_CODE,
})

# Required fields per kind. Used by the validator. The SDK doesn't expose
# this — it's our schema's invariant.
REQUIRED_FIELDS: Final[dict[str, frozenset[str]]] = {
    KIND_MANAGED: frozenset({"base"}),
    KIND_PARAMETRIZED_MANAGED: frozenset({"base"}),
    KIND_CUSTOM_LLM_JUDGE: frozenset({"criteria", "rating_scores"}),
    KIND_COMPUTATION: frozenset({"metric_name"}),
    KIND_PYTHON_FUNCTION: frozenset({"module", "function"}),
    KIND_REMOTE_CODE: frozenset({"code_snippet"}),
}


# ── Per-row column defaults (docs-mirror; SDK doesn't expose) ─────────────
#
# Maps SDK FLATTEN-schema column names → source-column expression in our ADK
# trace JSONL. Read by ``evaluator._resolve_column_source`` when a metric
# omits ``dataset_mapping``. Moved here from evaluator.py so generator and
# scaffold can reference the same defaults.

SDK_COLUMN_DEFAULTS: Final[dict[str, str]] = {
    "prompt":              "user_inputs[-1]",
    "response":            "final_response",
    # Pull `reference` from the NESTED reference_data dict — single source of
    # truth for golden-comparison metrics. A metric can override the field
    # name via its `reference_field` setting (e.g. "expected_response" or
    # "expected_routing" — see _resolve_column_source). Pre-2026-05-02 the
    # scaffold mirrored expected_behavior to a top-level `reference` column;
    # that created two copies of the same content in user-facing files and
    # forced a "don't hand-edit `reference`" caveat in the editing guide.
    "reference":           "reference_data:expected_behavior",
    "history":             "extracted_data:conversation_history",
    # special: pulled from final_session_state.events
    "intermediate_events": "events",
}


# ── Per-managed-metric required columns (docs-mirror) ─────────────────────
#
# Verbatim from the rubric-metric-details doc. Used by:
#   1. evaluator: ensure the row has the columns the SDK will demand
#   2. validator: warn the user when a managed metric is selected but the
#      dataset_mapping doesn't satisfy its column requirements
#   3. generator: tell Gemini which columns to populate per metric choice
#
# Per the docs, ``developer_instruction`` and ``tool_declarations`` are
# AGENT-LEVEL (passed via ``agent_info=...`` on Agent Engine), NOT per-row,
# so they're omitted from this table.
#
# When the SDK adds a managed metric, the lookup falls through to
# ``DEFAULT_REQUIRED_COLUMNS`` — the metric still works, just without the
# stricter pre-flight check.

DEFAULT_REQUIRED_COLUMNS: Final[tuple[str, ...]] = ("prompt", "response")

MANAGED_METRIC_REQUIRED_COLUMNS: Final[dict[str, tuple[str, ...]]] = {
    # Adaptive rubric — no reference needed (judge generates rubrics adaptively)
    "GENERAL_QUALITY":                ("prompt", "response"),
    "TEXT_QUALITY":                   ("prompt", "response"),
    "INSTRUCTION_FOLLOWING":          ("prompt", "response"),
    "QUESTION_ANSWERING_QUALITY":     ("prompt", "response"),
    "SUMMARIZATION_QUALITY":          ("prompt", "response"),
    "VERBOSITY":                      ("prompt", "response"),
    "FLUENCY":                        ("response",),
    "GECKO_TEXT2IMAGE":               ("prompt", "response"),
    "GECKO_TEXT2VIDEO":               ("prompt", "response"),
    # Adaptive rubric — agent-specific (use intermediate_events)
    "FINAL_RESPONSE_QUALITY":         ("prompt", "response", "intermediate_events"),
    "FINAL_RESPONSE_REFERENCE_FREE":  ("prompt", "response"),
    "TOOL_USE_QUALITY":               ("prompt", "response", "intermediate_events"),
    # Adaptive rubric — multi-turn (history-based)
    "MULTI_TURN_GENERAL_QUALITY":     ("prompt", "response", "history"),
    "MULTI_TURN_TEXT_QUALITY":        ("prompt", "response", "history"),
    "MULTI_TURN_CHAT_QUALITY":        ("prompt", "response", "history"),
    "MULTI_TURN_SAFETY":              ("prompt", "response", "history"),
    # Adaptive rubric — multi-turn agent (full trace)
    "MULTI_TURN_TASK_SUCCESS":        ("agent_eval_data",),
    "MULTI_TURN_TOOL_USE_QUALITY":    ("agent_eval_data",),
    "MULTI_TURN_TRAJECTORY_QUALITY":  ("agent_eval_data",),
    # Static rubric
    "SAFETY":                         ("prompt", "response"),
    "GROUNDING":                      ("prompt", "response", "context"),
    "FINAL_RESPONSE_MATCH":           ("prompt", "response", "reference"),
    "HALLUCINATION":                  ("prompt", "response", "intermediate_events"),
}


def required_columns_for(managed_metric_name: str) -> tuple[str, ...]:
    """Look up required columns for a managed metric.

    Falls back to ``DEFAULT_REQUIRED_COLUMNS`` (``prompt``, ``response``)
    when the metric isn't in the docs-mirror table — keeps newly-added SDK
    metrics working while still passing the pre-flight check on the common
    columns. Case-insensitive.
    """
    return MANAGED_METRIC_REQUIRED_COLUMNS.get(
        managed_metric_name.upper(),
        DEFAULT_REQUIRED_COLUMNS,
    )


# ── Default rating_scores (our convention, not an SDK requirement) ────────
#
# Binary 2-key form. Consistent with how the SDK's static rubric managed
# metrics (SAFETY, FINAL_RESPONSE_MATCH) score; matches the inter-rater-
# reliability research that motivated the binary preference. The docs allow
# ANY string-int keys; 1-5 is shown in the determine-eval example but is not
# a constraint.

DEFAULT_BINARY_RATING_SCORES: Final[dict[str, str]] = {
    "1": "Pass: meets all criteria above",
    "0": "Fail: does not meet at least one criterion above",
}


# ── Read-side helpers (use these instead of raw .get() on legacy fields) ──
#
# Every call site that needs to know "is this a managed metric?" or "what's
# the SDK base name?" or "what's the score range to display?" should go
# through these helpers. That way the schema can evolve without 30
# scattered .get() calls breaking.

def is_managed_entry(info: dict) -> bool:
    """True for ``kind: managed`` and ``kind: parametrized_managed``."""
    return info.get("kind") in (KIND_MANAGED, KIND_PARAMETRIZED_MANAGED)


def is_custom_llm_entry(info: dict) -> bool:
    """True for ``kind: custom_llm_judge``."""
    return info.get("kind") == KIND_CUSTOM_LLM_JUDGE


def managed_base_name(info: dict) -> str:
    """Return the SDK-canonical managed metric name (uppercased), or ''.

    For canonical entries this is the ``base`` field. Empty string when the
    entry isn't a managed kind.
    """
    if not is_managed_entry(info):
        return ""
    return (info.get("base") or "").upper()


def metric_display_score_range(info: dict) -> dict:
    """Score range to display in pickers / docs for a metric.

    For managed entries discovered by ``metric_discovery``, the score_range
    is carried forward as agent-eval discovery metadata. For custom entries,
    it's derived from ``rating_scores`` (binary 0/1 if two integer keys,
    otherwise inferred min/max).
    """
    sr = info.get("score_range")
    if sr:
        return sr
    rating_scores = info.get("rating_scores") or {}
    if rating_scores:
        try:
            keys = sorted(int(k) for k in rating_scores.keys())
            return {"min": keys[0], "max": keys[-1], "type": "rubric"}
        except (TypeError, ValueError):
            pass
    return {"min": 0, "max": 1, "type": "rubric"}


# ── Doc URLs (referenced from prompts and user-facing copy) ───────────────

DOCS_DETERMINE_EVAL: Final[str] = (
    "https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval"
)
DOCS_RUBRIC_METRIC_DETAILS: Final[str] = (
    "https://cloud.google.com/vertex-ai/generative-ai/docs/models/rubric-metric-details"
)
