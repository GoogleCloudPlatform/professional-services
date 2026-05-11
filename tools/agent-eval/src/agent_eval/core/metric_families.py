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
"""SDK-introspecting metric family classifier.

Classifies any metric name into one of five families by reading the
installed Vertex AI GenAI Eval SDK directly. Replaces hardcoded sets so
the classifier stays current with whatever SDK version is installed.

Families mirror ``_evals_metric_handlers._METRIC_HANDLER_MAPPING``:
  - ``computation``     — deterministic (BLEU, ROUGE, exact_match, tool_*)
  - ``translation``     — comet, metricx
  - ``static_rubric``   — fixed criteria (GROUNDING, SAFETY, FINAL_RESPONSE_MATCH, HALLUCINATION)
  - ``adaptive_rubric`` — LLM-generated rubrics per prompt (GENERAL_QUALITY, etc.)
  - ``custom``          — anything else (user-defined LLMMetric, etc.)
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger("agent_eval")

# Static rubrics use fixed criteria (no LLM-generated rubric step). Per docs:
# https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/rubric-metric-details
_STATIC_RUBRIC: frozenset = frozenset({
    "grounding_v1",
    "safety_v1",
    "final_response_match_v2",
    "hallucination_v1",
})


def _normalize(name: str) -> str:
    """Lowercase + ensure version suffix.

    Accepts both internal style (``FINAL_RESPONSE_MATCH``) and SDK
    canonical style (``final_response_match_v2``).
    """
    n = name.lower()
    # Already has a version suffix
    if n.endswith("_v1") or n.endswith("_v2"):
        return n
    return n


def _supported_predefined() -> frozenset:
    try:
        from vertexai._genai import _evals_constant
        return _evals_constant.SUPPORTED_PREDEFINED_METRICS
    except ImportError:
        logger.debug("vertexai._genai._evals_constant not importable")
        return frozenset()


def _supported_computation() -> frozenset:
    try:
        from vertexai._genai._evals_metric_handlers import ComputationMetricHandler
        return ComputationMetricHandler.SUPPORTED_COMPUTATION_METRICS
    except ImportError:
        logger.debug("ComputationMetricHandler not importable")
        return frozenset()


def _supported_translation() -> frozenset:
    try:
        from vertexai._genai._evals_metric_handlers import TranslationMetricHandler
        return TranslationMetricHandler.SUPPORTED_TRANSLATION_METRICS
    except ImportError:
        logger.debug("TranslationMetricHandler not importable")
        return frozenset()


def _matches_predefined(n: str, supported: frozenset) -> Optional[str]:
    """Return the canonical SDK name (e.g. ``general_quality_v1``) if ``n``
    matches a predefined metric; otherwise None.
    """
    if n in supported:
        return n
    for suffix in ("_v1", "_v2"):
        candidate = n + suffix
        if candidate in supported:
            return candidate
    return None


def classify(name: str) -> str:
    """Return the family name for ``name``.

    One of: ``computation``, ``translation``, ``static_rubric``,
    ``adaptive_rubric``, ``custom``.
    """
    n = _normalize(name)

    if n in _supported_computation():
        return "computation"
    if n in _supported_translation():
        return "translation"

    canonical = _matches_predefined(n, _supported_predefined())
    if canonical is not None:
        return "static_rubric" if canonical in _STATIC_RUBRIC else "adaptive_rubric"

    return "custom"


def reference_requirement(name: str) -> str:
    """Whether a metric needs ``reference`` to score.

    Returns one of:
      - ``required`` — SDK raises ValueError if missing (computation, translation)
      - ``expected`` — text-comparison rubric (final_response_match_v2)
      - ``optional`` — works without reference
    """
    family = classify(name)
    if family in ("computation", "translation"):
        return "required"
    n = _normalize(name)
    canonical = _matches_predefined(n, _supported_predefined()) or n
    if canonical == "final_response_match_v2":
        return "expected"
    return "optional"


def is_multi_turn(name: str) -> bool:
    """Whether the metric's predefined name targets multi-turn conversations."""
    n = _normalize(name)
    canonical = _matches_predefined(n, _supported_predefined())
    return bool(canonical and canonical.startswith("multi_turn_"))
