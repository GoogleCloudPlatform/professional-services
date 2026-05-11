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
"""Runtime discovery of managed metrics and ADK evaluation knowledge.

Single source of truth for what metrics are available — introspects the
installed Vertex AI SDK and ADK packages directly. (A static
``managed_metrics_catalog.json`` predated this module; deleted 2026-05-01
during the canonical-schema sweep — runtime discovery has fully replaced it.)
"""

import inspect
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger("agent_eval")


# ---------------------------------------------------------------------------
# Metric metadata (descriptions, score ranges, placeholders)
# Derived from GCS YAML templates and SDK documentation.
# ---------------------------------------------------------------------------

_METRIC_DESCRIPTIONS: Dict[str, str] = {
    # API Predefined (server-side evaluation)
    "GENERAL_QUALITY": "Overall response quality across multiple rubric criteria.",
    "SAFETY": "Whether the response is safe and free of harmful content.",
    "HALLUCINATION": "Whether claims are false, contradictory, or unsupported by evidence.",
    "TOOL_USE_QUALITY": "Quality of tool selection, arguments, sequencing, and usage.",
    "FINAL_RESPONSE_MATCH": "Whether the final response matches a golden/expected response.",
    "FINAL_RESPONSE_QUALITY": "Quality of the agent's final response against rubric criteria.",
    "FINAL_RESPONSE_REFERENCE_FREE": "Response quality evaluation without requiring a reference answer.",
    "GROUNDING": "Whether claims are supported by the provided source/context.",
    "INSTRUCTION_FOLLOWING": "How well the response adheres to the user's instructions.",
    "TEXT_QUALITY": "Writing quality: grammar, clarity, structure, and readability.",
    "MULTI_TURN_GENERAL_QUALITY": "Overall quality across multi-turn conversations.",
    "MULTI_TURN_TEXT_QUALITY": "Writing quality across multi-turn conversations.",
    "GECKO_TEXT2IMAGE": "Text-to-image alignment quality.",
    "GECKO_TEXT2VIDEO": "Text-to-video alignment quality.",
    # GCS YAML (client-side LLM-as-judge)
    "COHERENCE": "Logical flow and consistency of the response.",
    "FLUENCY": "Language fluency and naturalness.",
    "GROUNDEDNESS": "Whether claims are supported by the provided context.",
    "VERBOSITY": "Response length appropriateness.",
    "MULTI_TURN_CHAT_QUALITY": "Multi-turn conversation quality including context retention and coherence.",
    "MULTI_TURN_SAFETY": "Safety across multi-turn conversations, including adversarial patterns.",
    "QUESTION_ANSWERING_QUALITY": "QA accuracy and completeness for factual questions.",
    "SUMMARIZATION_QUALITY": "Summarization coverage, accuracy, and conciseness.",
}

_SCORE_RANGES: Dict[str, Dict[str, Any]] = {
    # API Predefined — rubric-based (0-1 pass rate)
    "GENERAL_QUALITY": {"min": 0, "max": 1, "type": "rubric"},
    "SAFETY": {"min": 0, "max": 1, "type": "rubric"},
    "HALLUCINATION": {"min": 0, "max": 1, "type": "rubric"},
    "TOOL_USE_QUALITY": {"min": 0, "max": 1, "type": "rubric"},
    "FINAL_RESPONSE_MATCH": {"min": 0, "max": 1, "type": "rubric"},
    "FINAL_RESPONSE_QUALITY": {"min": 0, "max": 1, "type": "rubric"},
    "FINAL_RESPONSE_REFERENCE_FREE": {"min": 0, "max": 1, "type": "rubric"},
    "GROUNDING": {"min": 0, "max": 1, "type": "rubric"},
    "MULTI_TURN_GENERAL_QUALITY": {"min": 0, "max": 1, "type": "rubric"},
    # API Predefined — pointwise (1-5)
    "INSTRUCTION_FOLLOWING": {"min": 1, "max": 5, "type": "pointwise"},
    "TEXT_QUALITY": {"min": 1, "max": 5, "type": "pointwise"},
    "MULTI_TURN_TEXT_QUALITY": {"min": 1, "max": 5, "type": "pointwise"},
    # GCS YAML — pointwise (1-5)
    "COHERENCE": {"min": 1, "max": 5, "type": "pointwise"},
    "FLUENCY": {"min": 1, "max": 5, "type": "pointwise"},
    "GROUNDEDNESS": {"min": 1, "max": 5, "type": "pointwise"},
    "QUESTION_ANSWERING_QUALITY": {"min": 1, "max": 5, "type": "pointwise"},
    "SUMMARIZATION_QUALITY": {"min": 1, "max": 5, "type": "pointwise"},
    # GCS YAML — rubric-based
    "MULTI_TURN_CHAT_QUALITY": {"min": 0, "max": 1, "type": "rubric"},
    "MULTI_TURN_SAFETY": {"min": 0, "max": 1, "type": "rubric"},
    # Special
    "VERBOSITY": {"min": -2, "max": 2, "type": "special"},
    # Embedding
    "GECKO_TEXT2IMAGE": {"min": 0, "max": 1, "type": "similarity"},
    "GECKO_TEXT2VIDEO": {"min": 0, "max": 1, "type": "similarity"},
}

# Template placeholders required by GCS YAML metrics
_GCS_PLACEHOLDERS: Dict[str, List[str]] = {
    "COHERENCE": ["prompt", "response"],
    "FLUENCY": ["prompt", "response"],
    "GROUNDEDNESS": ["prompt", "response"],
    "VERBOSITY": ["prompt", "response"],
    "MULTI_TURN_CHAT_QUALITY": ["history", "prompt", "response"],
    "MULTI_TURN_SAFETY": ["history", "prompt", "response"],
    "QUESTION_ANSWERING_QUALITY": ["prompt", "response"],
    "SUMMARIZATION_QUALITY": ["prompt", "response"],
}

_MULTI_TURN_METRICS = {
    "MULTI_TURN_CHAT_QUALITY", "MULTI_TURN_SAFETY",
    "MULTI_TURN_GENERAL_QUALITY", "MULTI_TURN_TEXT_QUALITY",
}

# Metrics not useful for typical agent evaluation
_EXCLUDED_METRICS = {"GECKO_TEXT2IMAGE", "GECKO_TEXT2VIDEO"}

# Text-comparison metrics that need plain text on both sides (not the wrapped
# API response object). Derived dynamically from the family classifier — only
# `final_response_match_v2` falls into this category today, but using the
# classifier means any future text-comparison metric is handled automatically.
def requires_reference(managed_metric_name: str) -> bool:
    """Whether a managed metric needs reference data to score meaningfully.

    Delegates to ``metric_families.reference_requirement``. Treats both
    ``required`` (computation/translation: SDK raises ValueError) and
    ``expected`` (text-comparison rubrics) as needing reference.
    """
    from agent_eval.core import metric_families
    return metric_families.reference_requirement(managed_metric_name) in ("required", "expected")


def default_response_field(managed_metric_name: str) -> Optional[str]:
    """Preferred response-side column for a managed metric, if not the default.

    Returns ``"final_response"`` for text-comparison metrics (need plain text on
    both sides), else ``None`` (use the wrapped API ``response`` column).
    """
    from agent_eval.core import metric_families
    if metric_families.reference_requirement(managed_metric_name) == "expected":
        return "final_response"
    return None


# ---------------------------------------------------------------------------
# Core discovery functions
# ---------------------------------------------------------------------------

def _get_supported_predefined_metrics() -> set:
    """Get the set of API predefined metric spec names from the SDK."""
    try:
        from vertexai._genai._evals_constant import SUPPORTED_PREDEFINED_METRICS
        return SUPPORTED_PREDEFINED_METRICS
    except ImportError:
        # Hardcoded fallback
        return {
            "final_response_match_v2", "final_response_quality_v1",
            "final_response_reference_free_v1", "gecko_text2image_v1",
            "gecko_text2video_v1", "general_quality_v1", "grounding_v1",
            "hallucination_v1", "instruction_following_v1",
            "multi_turn_general_quality_v1", "multi_turn_text_quality_v1",
            "safety_v1", "text_quality_v1", "tool_use_quality_v1",
        }


def is_api_predefined(managed_metric_name: str) -> bool:
    """Check if a managed metric resolves as API Predefined (server-side).

    API Predefined metrics use raw request/response Content objects — the server
    auto-extracts prompt and history. GCS YAML metrics resolve to LLMMetric with
    prompt templates needing standard {prompt}/{response}/{history} columns.
    """
    supported = _get_supported_predefined_metrics()
    lower = managed_metric_name.lower()
    for suffix in ("_v1", "_v2"):
        if (lower + suffix) in supported:
            return True
    return False


def discover_managed_metrics(exclude_embedding: bool = True) -> Dict[str, Dict[str, Any]]:
    """Discover all available managed metrics from the installed SDK.

    Reads types.RubricMetric attributes and classifies each as either
    API Predefined (server-side) or GCS YAML (client-side LLM-as-judge).

    Args:
        exclude_embedding: If True, excludes GECKO_TEXT2* embedding metrics.

    Returns:
        Dict of lowercase_metric_name -> metric info dict.
    """
    try:
        from vertexai import types as vtx_types
    except ImportError:
        logger.warning("vertexai not installed, returning empty metrics catalog")
        return {}

    metrics: Dict[str, Dict[str, Any]] = {}

    for attr_name in dir(vtx_types.RubricMetric):
        if attr_name.startswith("_"):
            continue

        obj = getattr(vtx_types.RubricMetric, attr_name, None)
        if obj is None or type(obj).__name__ != "LazyLoadedPrebuiltMetric":
            continue

        name_upper = attr_name.upper()
        name_lower = attr_name.lower()

        if exclude_embedding and name_upper in _EXCLUDED_METRICS:
            continue

        api_pred = is_api_predefined(name_upper)
        resolution = "api_predefined" if api_pred else "gcs_yaml"
        is_multi_turn = name_upper in _MULTI_TURN_METRICS

        # Canonical schema (per core/metric_schema.py): kind="managed" + base.
        # The remaining fields (resolution, description, score_range, requires_*,
        # default_response_field) are agent-eval discovery metadata used by the
        # picker UI and the per-row routing — NOT part of the SDK metric
        # construction. They live alongside `kind`/`base` as agent-eval extras.
        entry: Dict[str, Any] = {
            "kind": "managed",
            "base": name_upper,
            "resolution": resolution,
            "description": _METRIC_DESCRIPTIONS.get(name_upper, ""),
            "score_range": _SCORE_RANGES.get(
                name_upper, {"min": 0, "max": 1, "type": "unknown"}
            ),
            "requires_reference": requires_reference(name_upper),
            "requires_multi_turn": is_multi_turn,
            "default_response_field": default_response_field(name_upper),
        }

        if not api_pred and name_upper in _GCS_PLACEHOLDERS:
            entry["template_placeholders"] = _GCS_PLACEHOLDERS[name_upper]

        metrics[name_lower] = entry

    api_count = sum(1 for m in metrics.values() if m["resolution"] == "api_predefined")
    gcs_count = sum(1 for m in metrics.values() if m["resolution"] == "gcs_yaml")
    logger.debug(
        "Discovered %d managed metrics (%d API predefined, %d GCS YAML)",
        len(metrics), api_count, gcs_count,
    )

    return metrics


# ---------------------------------------------------------------------------
# ADK evaluation knowledge extraction
# ---------------------------------------------------------------------------

def extract_adk_eval_knowledge() -> Dict[str, Any]:
    """Extract evaluation knowledge from the installed ADK package.

    Returns a dict with ADK metric descriptions, rubric patterns, and field
    names — suitable for injection into Gemini prompts for metric generation.
    """
    knowledge: Dict[str, Any] = {
        "prebuilt_metrics": [],
        "rubric_patterns": [],
        "eval_field_names": {},
    }

    # 1. PrebuiltMetrics enum values and names
    try:
        from google.adk.evaluation.eval_metrics import PrebuiltMetrics
        for metric in PrebuiltMetrics:
            knowledge["prebuilt_metrics"].append({
                "name": metric.name,
                "value": metric.value,
            })
    except ImportError:
        logger.debug("ADK PrebuiltMetrics not available")

    # 2. Metric descriptions from provider classes
    try:
        from google.adk.evaluation import metric_info_providers as mip

        no_arg_providers = [
            ("trajectory", mip.TrajectoryEvaluatorMetricInfoProvider),
            ("safety_v1", mip.SafetyEvaluatorV1MetricInfoProvider),
            ("final_response_match_v2", mip.FinalResponseMatchV2EvaluatorMetricInfoProvider),
            ("rubric_final_response_quality_v1", mip.RubricBasedFinalResponseQualityV1EvaluatorMetricInfoProvider),
            ("hallucinations_v1", mip.HallucinationsV1EvaluatorMetricInfoProvider),
            ("rubric_tool_use_quality_v1", mip.RubricBasedToolUseV1EvaluatorMetricInfoProvider),
            ("per_turn_sim_quality_v1", mip.PerTurnUserSimulatorQualityV1MetricInfoProvider),
        ]

        for metric_key, cls in no_arg_providers:
            try:
                provider = cls()
                info = provider.get_metric_info()
                if info and info.description:
                    # Enrich the matching PrebuiltMetric entry with description
                    for entry in knowledge["prebuilt_metrics"]:
                        if metric_key.replace("rubric_", "").replace("per_turn_sim", "per_turn_user_simulator") in entry["value"]:
                            entry["description"] = info.description[:300]
                            break
            except Exception:
                continue
    except ImportError:
        logger.debug("ADK metric_info_providers not available")

    # 3. Rubric evaluation prompt patterns
    try:
        from google.adk.evaluation import rubric_based_tool_use_quality_v1 as tool_mod
        from google.adk.evaluation import rubric_based_final_response_quality_v1 as resp_mod

        for module, pattern_name in [
            (tool_mod, "tool_use_quality"),
            (resp_mod, "final_response_quality"),
        ]:
            try:
                source = inspect.getsource(module)
                match = re.search(
                    r"_RUBRIC_BASED_\w+_PROMPT\s*=\s*\"\"\"(.+?)\"\"\"",
                    source,
                    re.DOTALL,
                )
                if match:
                    knowledge["rubric_patterns"].append({
                        "name": pattern_name,
                        "template_excerpt": match.group(1)[:600],
                    })
            except Exception:
                continue
    except ImportError:
        logger.debug("ADK rubric evaluator modules not available")

    # 4. Standard evaluation field names
    try:
        from google.adk.evaluation.evaluation_constants import EvalConstants
        knowledge["eval_field_names"] = {
            attr: getattr(EvalConstants, attr)
            for attr in dir(EvalConstants)
            if not attr.startswith("_")
            and isinstance(getattr(EvalConstants, attr), str)
        }
    except ImportError:
        logger.debug("ADK evaluation_constants not available")

    return knowledge


# ---------------------------------------------------------------------------
# Prompt formatting helpers
# ---------------------------------------------------------------------------

def format_metrics_for_prompt(metrics: Optional[Dict[str, Dict]] = None) -> str:
    """Format discovered metrics as text for inclusion in Gemini prompts.

    Groups by resolution type, includes descriptions and score ranges.
    If *metrics* is None, discovers them first.
    """
    if metrics is None:
        metrics = discover_managed_metrics()

    api_predefined = {
        k: v for k, v in metrics.items() if v.get("resolution") == "api_predefined"
    }
    gcs_yaml = {
        k: v for k, v in metrics.items() if v.get("resolution") == "gcs_yaml"
    }

    lines = [
        "## Available Managed (Predefined) Metrics",
        "",
        "These are pre-built metrics from the Vertex AI GenAI Evaluation SDK.",
        "Users can select any of these — no custom template is needed.",
        "",
        "### Server-Side Metrics (API Predefined)",
        "Evaluated server-side using raw request/response Content objects.",
        "",
        f"{'Name':<35} {'Score':<15} {'Runs On':<14} Description",
        "-" * 105,
    ]

    for name in sorted(api_predefined):
        info = api_predefined[name]
        sr = info.get("score_range", {})
        score_str = f"{sr.get('min', '?')}-{sr.get('max', '?')} ({sr.get('type', '?')})"
        runs_on = "multi-turn" if info.get("requires_multi_turn") else "any row"
        lines.append(
            f"{info['base']:<35} {score_str:<15} "
            f"{runs_on:<14} {info['description'][:50]}"
        )

    lines += [
        "",
        "### Client-Side Metrics (GCS YAML)",
        "Evaluated client-side; prompt templates are downloaded from GCS.",
        "These need standard prompt/response columns (NOT raw request/response).",
        "",
        f"{'Name':<35} {'Score':<15} {'Runs On':<14} Description",
        "-" * 105,
    ]

    for name in sorted(gcs_yaml):
        info = gcs_yaml[name]
        sr = info.get("score_range", {})
        score_str = f"{sr.get('min', '?')}-{sr.get('max', '?')} ({sr.get('type', '?')})"
        placeholders = info.get("template_placeholders", [])
        ph_str = f" [needs: {', '.join(placeholders)}]" if placeholders else ""
        runs_on = "multi-turn" if info.get("requires_multi_turn") else "any row"
        lines.append(
            f"{info['base']:<35} {score_str:<15} "
            f"{runs_on:<14} {info['description'][:40]}{ph_str}"
        )

    return "\n".join(lines)


def format_adk_knowledge_for_prompt(
    knowledge: Optional[Dict[str, Any]] = None,
) -> str:
    """Format ADK evaluation knowledge as text for inclusion in Gemini prompts.

    If *knowledge* is None, extracts it first.
    """
    if knowledge is None:
        knowledge = extract_adk_eval_knowledge()

    lines = ["## ADK Evaluation Knowledge", ""]

    if knowledge.get("prebuilt_metrics"):
        lines.append("### ADK PrebuiltMetrics (used by ADK's built-in evaluation)")
        for m in knowledge["prebuilt_metrics"]:
            desc = m.get("description", "")
            desc_str = f" — {desc[:120]}" if desc else ""
            lines.append(f"  - {m['name']} ({m['value']}){desc_str}")
        lines.append("")

    if knowledge.get("rubric_patterns"):
        lines.append("### Rubric Evaluation Patterns")
        lines.append(
            "The ADK uses rubric-based evaluation with yes/no verdicts per property."
        )
        lines.append(
            "Each rubric criterion is evaluated independently; scores are aggregated."
        )
        lines.append("")
        for pattern in knowledge["rubric_patterns"]:
            lines.append(f"**{pattern['name']} rubric pattern (excerpt):**")
            lines.append(f"```\n{pattern['template_excerpt']}\n```")
            lines.append("")

    if knowledge.get("eval_field_names"):
        lines.append("### Standard Evaluation Field Names")
        for name, value in knowledge["eval_field_names"].items():
            lines.append(f'  - {name}: "{value}"')

    return "\n".join(lines)


def get_metric_definition_entry(metric_key: str, metrics: Optional[Dict] = None) -> Optional[Dict]:
    """Get a ready-to-use metric_definitions.json entry for a managed metric.

    Returns a dict suitable for direct inclusion in the metrics JSON file,
    or None if the metric is not found.
    """
    if metrics is None:
        metrics = discover_managed_metrics()

    info = metrics.get(metric_key.lower())
    if not info:
        return None

    # Canonical schema (per core/metric_schema.py): kind="managed" + base.
    # We carry forward the discovery metadata (score_range / requires_* /
    # default_response_field) because the evaluator and picker still consume
    # those — they're not part of the SDK metric construction.
    entry = {
        "kind": "managed",
        "base": info["base"],
        "requires_reference": info.get("requires_reference", False),
        "requires_multi_turn": info.get("requires_multi_turn", False),
    }
    if info.get("score_range"):
        entry["score_range"] = info["score_range"]
    default_resp = info.get("default_response_field")
    if default_resp:
        entry["default_response_field"] = default_resp

    return entry
