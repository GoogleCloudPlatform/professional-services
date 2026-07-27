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
"""Metrics must not be bound to columns a built-in-tool agent can never fill.

Gemini built-ins (google_search and friends) execute server-side and surface as
grounding metadata, never as ADK functionCall events, so
``get_tool_interactions()`` always returns ``[]``. Metrics generated against
``extracted_data:tool_interactions`` for such an agent fail with "Response is
required but missing" — an error that sends the user debugging their agent
instead of the metric.
"""

from agent_eval.core.metric_generator import (
    _warn_unsatisfiable_tool_metrics,
    function_tool_names,
    tool_interactions_available,
)

BUILTIN_ONLY = {"tools": [{"name": "google_search"}]}
FUNCTION_TOOLS = {"tools": [{"name": "approve_discount"}, {"name": "modify_cart"}]}
MIXED = {"tools": [{"name": "google_search"}, {"name": "approve_discount"}]}

TOOL_METRIC = {
    "kind": "custom_llm_judge",
    "dataset_mapping": {
        "prompt": {"source_column": "user_inputs"},
        "response": {"source_column": "extracted_data:tool_interactions"},
    },
}


def test_builtin_only_agent_has_no_function_tools():
    assert function_tool_names(BUILTIN_ONLY) == []
    assert tool_interactions_available(BUILTIN_ONLY) is False


def test_function_tools_are_detected():
    assert tool_interactions_available(FUNCTION_TOOLS) is True


def test_mixed_counts_as_available():
    # One real function tool is enough to populate the column.
    assert function_tool_names(MIXED) == ["approve_discount"]
    assert tool_interactions_available(MIXED) is True


def test_agent_with_no_tools_has_none_available():
    assert tool_interactions_available({"tools": []}) is False
    assert tool_interactions_available({}) is False


def test_plain_string_tool_entries_are_handled():
    assert tool_interactions_available({"tools": ["google_search"]}) is False
    assert tool_interactions_available({"tools": ["approve_discount"]}) is True


def test_warns_when_metric_reads_tool_interactions_on_builtin_agent():
    warnings = _warn_unsatisfiable_tool_metrics({"m": TOOL_METRIC}, BUILTIN_ONLY)
    assert len(warnings) == 1
    assert "tool_interactions" in warnings[0]
    assert "grounding_chunks" in warnings[0]  # points at the alternative


def test_no_warning_when_agent_has_function_tools():
    assert _warn_unsatisfiable_tool_metrics({"m": TOOL_METRIC}, FUNCTION_TOOLS) == []


def test_template_source_columns_are_also_checked():
    metric = {
        "dataset_mapping": {
            "response": {
                "template": "Calls: {extracted_data_tool_interactions}",
                "source_columns": ["extracted_data:tool_interactions"],
            }
        }
    }
    assert _warn_unsatisfiable_tool_metrics({"m": metric}, BUILTIN_ONLY)


def test_metric_avoiding_tool_columns_is_not_flagged():
    metric = {
        "dataset_mapping": {
            "prompt": {"source_column": "user_inputs"},
            "response": {"source_column": "extracted_data:grounding_chunks"},
        }
    }
    assert _warn_unsatisfiable_tool_metrics({"m": metric}, BUILTIN_ONLY) == []
