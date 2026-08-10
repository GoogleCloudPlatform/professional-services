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
"""Tests for agent_eval.core.metric_discovery module.

These tests verify the metric discovery logic against the installed SDK.
The conftest.py mocks vertexai/google modules, so we set up our own fixtures
that simulate the SDK's RubricMetric and constants.
"""

import sys
from unittest.mock import MagicMock

import pytest


# Build a mock RubricMetric class with LazyLoadedPrebuiltMetric-like attributes
def _make_mock_metric(name, api_spec_name=None):
    """Create a mock LazyLoadedPrebuiltMetric."""
    m = MagicMock()
    m.name = name
    type(m).__name__ = "LazyLoadedPrebuiltMetric"
    m._get_api_metric_spec_name.return_value = api_spec_name
    return m


class MockRubricMetric:
    COHERENCE = _make_mock_metric("COHERENCE")
    FLUENCY = _make_mock_metric("FLUENCY")
    GENERAL_QUALITY = _make_mock_metric("GENERAL_QUALITY", "general_quality_v1")
    GROUNDEDNESS = _make_mock_metric("GROUNDEDNESS")
    HALLUCINATION = _make_mock_metric("HALLUCINATION", "hallucination_v1")
    INSTRUCTION_FOLLOWING = _make_mock_metric(
        "INSTRUCTION_FOLLOWING", "instruction_following_v1"
    )
    MULTI_TURN_CHAT_QUALITY = _make_mock_metric("MULTI_TURN_CHAT_QUALITY")
    MULTI_TURN_GENERAL_QUALITY = _make_mock_metric(
        "MULTI_TURN_GENERAL_QUALITY", "multi_turn_general_quality_v1"
    )
    MULTI_TURN_SAFETY = _make_mock_metric("MULTI_TURN_SAFETY")
    MULTI_TURN_TEXT_QUALITY = _make_mock_metric(
        "MULTI_TURN_TEXT_QUALITY", "multi_turn_text_quality_v1"
    )
    SAFETY = _make_mock_metric("SAFETY", "safety_v1")
    TEXT_QUALITY = _make_mock_metric("TEXT_QUALITY", "text_quality_v1")
    TOOL_USE_QUALITY = _make_mock_metric("TOOL_USE_QUALITY", "tool_use_quality_v1")
    VERBOSITY = _make_mock_metric("VERBOSITY")
    SUMMARIZATION_QUALITY = _make_mock_metric("SUMMARIZATION_QUALITY")
    QUESTION_ANSWERING_QUALITY = _make_mock_metric("QUESTION_ANSWERING_QUALITY")
    FINAL_RESPONSE_MATCH = _make_mock_metric(
        "FINAL_RESPONSE_MATCH", "final_response_match_v2"
    )
    FINAL_RESPONSE_QUALITY = _make_mock_metric(
        "FINAL_RESPONSE_QUALITY", "final_response_quality_v1"
    )
    FINAL_RESPONSE_REFERENCE_FREE = _make_mock_metric(
        "FINAL_RESPONSE_REFERENCE_FREE", "final_response_reference_free_v1"
    )
    GROUNDING = _make_mock_metric("GROUNDING", "grounding_v1")


MOCK_SUPPORTED_PREDEFINED = {
    "final_response_match_v2",
    "final_response_quality_v1",
    "final_response_reference_free_v1",
    "general_quality_v1",
    "grounding_v1",
    "hallucination_v1",
    "instruction_following_v1",
    "multi_turn_general_quality_v1",
    "multi_turn_text_quality_v1",
    "safety_v1",
    "text_quality_v1",
    "tool_use_quality_v1",
}


@pytest.fixture(autouse=True)
def mock_sdk(monkeypatch):
    """Set up mock SDK types for all tests in this module."""
    # `from vertexai import types` accesses sys.modules["vertexai"].types
    vertexai_mod = sys.modules.get("vertexai")
    if vertexai_mod is not None:
        monkeypatch.setattr(
            vertexai_mod, "types", MagicMock(RubricMetric=MockRubricMetric)
        )

    # Also patch sys.modules["vertexai.types"] for direct imports
    mock_types = sys.modules.get("vertexai.types")
    if mock_types is not None:
        monkeypatch.setattr(mock_types, "RubricMetric", MockRubricMetric)

    # Patch SUPPORTED_PREDEFINED_METRICS
    evals_const_mod = MagicMock()
    evals_const_mod.SUPPORTED_PREDEFINED_METRICS = MOCK_SUPPORTED_PREDEFINED
    monkeypatch.setitem(sys.modules, "vertexai._genai._evals_constant", evals_const_mod)


class TestIsApiPredefined:
    """Test API Predefined vs GCS YAML classification."""

    def test_general_quality_is_api_predefined(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("GENERAL_QUALITY") is True

    def test_safety_is_api_predefined(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("SAFETY") is True

    def test_tool_use_quality_is_api_predefined(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("TOOL_USE_QUALITY") is True

    def test_hallucination_is_api_predefined(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("HALLUCINATION") is True

    def test_coherence_is_gcs_yaml(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("COHERENCE") is False

    def test_fluency_is_gcs_yaml(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("FLUENCY") is False

    def test_multi_turn_chat_quality_is_gcs_yaml(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("MULTI_TURN_CHAT_QUALITY") is False

    def test_verbosity_is_gcs_yaml(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("VERBOSITY") is False

    def test_case_insensitive(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("general_quality") is True
        assert is_api_predefined("coherence") is False

    def test_unknown_metric(self):
        from agent_eval.core.metric_discovery import is_api_predefined

        assert is_api_predefined("NONEXISTENT_METRIC") is False


class TestDiscoverManagedMetrics:
    """Test runtime metric discovery from the SDK."""

    def test_discovers_metrics(self):
        from agent_eval.core.metric_discovery import discover_managed_metrics

        metrics = discover_managed_metrics()
        # MockRubricMetric has 20 attributes, minus GECKO_TEXT2* (excluded default) = 18
        # But our mock doesn't have GECKO, so all 20 non-_ attrs are LazyLoadedPrebuiltMetric
        assert len(metrics) >= 16

    def test_api_predefined_metrics_carry_resolution(self):
        # `resolution` is agent-eval discovery metadata that distinguishes the
        # two server-side resolution paths (api_predefined vs gcs_yaml).
        # Post-canonical-schema, the legacy `use_gemini_format` boolean is gone —
        # the kind+base IS the SDK contract.
        from agent_eval.core.metric_discovery import discover_managed_metrics

        metrics = discover_managed_metrics()
        api = [
            info for info in metrics.values() if info["resolution"] == "api_predefined"
        ]
        assert api, "expected at least one api_predefined metric in the catalog"

    def test_gcs_yaml_metrics_carry_resolution(self):
        from agent_eval.core.metric_discovery import discover_managed_metrics

        metrics = discover_managed_metrics()
        gcs = [info for info in metrics.values() if info["resolution"] == "gcs_yaml"]
        assert gcs, "expected at least one gcs_yaml metric in the catalog"

    def test_multi_turn_metrics_have_requires_multi_turn_flag(self):
        from agent_eval.core.metric_discovery import (
            _MULTI_TURN_METRICS,
            discover_managed_metrics,
        )

        metrics = discover_managed_metrics()
        for name in _MULTI_TURN_METRICS:
            key = name.lower()
            if key in metrics:
                assert metrics[key]["requires_multi_turn"] is True, (
                    f"{key} should set requires_multi_turn=True"
                )

    def test_single_turn_metrics_do_not_require_multi_turn(self):
        from agent_eval.core.metric_discovery import (
            _MULTI_TURN_METRICS,
            discover_managed_metrics,
        )

        metrics = discover_managed_metrics()
        for key, info in metrics.items():
            if info["base"] not in _MULTI_TURN_METRICS:
                assert info["requires_multi_turn"] is False, (
                    f"{key} should not require multi-turn"
                )

    def test_all_entries_have_required_fields(self):
        # Canonical schema: every discovered metric is a `kind: managed` entry
        # with `base` (the SDK metric name). `score_range` / `requires_*` are
        # agent-eval discovery metadata carried alongside.
        from agent_eval.core.metric_discovery import discover_managed_metrics

        metrics = discover_managed_metrics()
        for key, info in metrics.items():
            assert info.get("kind") == "managed", f"{key} should be kind=managed"
            assert "base" in info, f"{key} missing base"
            assert "resolution" in info, f"{key} missing resolution"
            assert "score_range" in info, f"{key} missing score_range"
            assert "requires_reference" in info, f"{key} missing requires_reference"
            assert "requires_multi_turn" in info, f"{key} missing requires_multi_turn"


class TestGetMetricDefinitionEntry:
    """Test generating metric_definitions.json entries."""

    def test_returns_entry_for_known_metric(self):
        from agent_eval.core.metric_discovery import get_metric_definition_entry

        entry = get_metric_definition_entry("general_quality")
        assert entry is not None
        assert entry["kind"] == "managed"
        assert entry["base"] == "GENERAL_QUALITY"

    def test_returns_none_for_unknown_metric(self):
        from agent_eval.core.metric_discovery import get_metric_definition_entry

        entry = get_metric_definition_entry("nonexistent")
        assert entry is None

    def test_gcs_metric_has_correct_format(self):
        # GCS-resolved metrics still emit canonical kind=managed; the resolution
        # path is internal discovery metadata (not part of the SDK schema).
        from agent_eval.core.metric_discovery import get_metric_definition_entry

        entry = get_metric_definition_entry("coherence")
        assert entry is not None
        assert entry["kind"] == "managed"

    def test_case_insensitive(self):
        from agent_eval.core.metric_discovery import get_metric_definition_entry

        entry = get_metric_definition_entry("SAFETY")
        assert entry is not None
        assert entry["base"] == "SAFETY"


class TestFormatting:
    """Test prompt formatting functions."""

    def test_format_metrics_for_prompt(self):
        from agent_eval.core.metric_discovery import format_metrics_for_prompt

        text = format_metrics_for_prompt()
        assert "Server-Side Metrics" in text
        assert "Client-Side Metrics" in text

    def test_format_metrics_includes_both_types(self):
        from agent_eval.core.metric_discovery import (
            discover_managed_metrics,
            format_metrics_for_prompt,
        )

        metrics = discover_managed_metrics()
        text = format_metrics_for_prompt(metrics)
        # Check at least one API predefined and one GCS YAML are present
        has_api = any(
            info["base"] in text
            for info in metrics.values()
            if info["resolution"] == "api_predefined"
        )
        has_gcs = any(
            info["base"] in text
            for info in metrics.values()
            if info["resolution"] == "gcs_yaml"
        )
        assert has_api, "Should include API predefined metrics"
        assert has_gcs, "Should include GCS YAML metrics"
