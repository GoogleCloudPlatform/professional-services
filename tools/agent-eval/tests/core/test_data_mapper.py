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
"""Tests for data_mapper.py — normalize_input and map_dataset_columns."""

import json
import unittest

import pandas as pd

from agent_eval.core.data_mapper import map_dataset_columns, robust_json_loads


class TestRobustJsonLoads(unittest.TestCase):
    """Tests for the robust_json_loads helper."""

    def test_valid_json_string(self):
        assert robust_json_loads('{"key": "value"}') == {"key": "value"}

    def test_already_parsed(self):
        """Dicts and lists pass through unchanged."""
        assert robust_json_loads({"a": 1}) == {"a": 1}
        assert robust_json_loads([1, 2]) == [1, 2]

    def test_invalid_json(self):
        """Non-JSON strings are returned as-is."""
        assert robust_json_loads("not json") == "not json"

    def test_none(self):
        assert robust_json_loads(None) is None


class TestNormalizeInput(unittest.TestCase):
    """Tests for the normalize_input closure inside map_dataset_columns.

    We test indirectly through map_dataset_columns since normalize_input
    is a closure. Each test maps a custom placeholder to a column containing
    the data type we want to test.
    """

    def _map_single_column(self,
                           column_data,
                           placeholder="custom_field",
                           source_column="test_col"):
        """Helper: create a 1-row DataFrame with column_data and map it."""
        df = pd.DataFrame({
            "user_inputs": [["What is X?"]],
            "final_response": ["Response about X"],
            source_column: [column_data],
        })
        mapping = {placeholder: {"source_column": source_column}}
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")
        return result[placeholder].iloc[0]

    # ── List of dicts (tool_interactions, grounding context) ──────────

    def test_list_of_dicts_produces_valid_json_array(self):
        """tool_interactions-style data should become a parseable JSON array."""
        tool_interactions = [
            {
                "tool_name": "search",
                "input_arguments": {
                    "q": "test"
                },
                "output_result": "found 3"
            },
            {
                "tool_name": "fetch",
                "input_arguments": {
                    "url": "/doc/1"
                },
                "output_result": "content"
            },
        ]
        result = self._map_single_column(tool_interactions)
        parsed = json.loads(result)

        assert isinstance(parsed, list), "Should be a JSON array"
        assert len(parsed) == 2
        assert parsed[0]["tool_name"] == "search"
        assert parsed[1]["tool_name"] == "fetch"

    def test_single_dict_in_list(self):
        """A list with one dict should still be a JSON array."""
        data = [{"tool_name": "agent_a", "output_result": "response text"}]
        result = self._map_single_column(data)
        parsed = json.loads(result)

        assert isinstance(parsed, list)
        assert len(parsed) == 1

    def test_grounding_context_produces_json_array(self):
        """Grounding context (list of dicts) uses json.dumps — same as tool_interactions."""
        context = [{
            "text": "Document 1 content"
        }, {
            "text": "Document 2 content"
        }]
        result = self._map_single_column(context, placeholder="context")
        parsed = json.loads(result)

        assert isinstance(parsed, list)
        assert len(parsed) == 2
        assert parsed[0]["text"] == "Document 1 content"

    # ── List of simple values ────────────────────────────────────────

    def test_list_of_strings_produces_newline_joined(self):
        """Simple string lists should be newline-joined for template readability."""
        data = ["First turn", "Second turn", "Third turn"]
        result = self._map_single_column(data)

        assert result == "First turn\nSecond turn\nThird turn"
        # Should NOT be valid JSON
        with self.assertRaises(json.JSONDecodeError):
            json.loads(result)

    def test_list_of_numbers(self):
        """Numeric lists should be newline-joined."""
        result = self._map_single_column([1, 2, 3])
        assert result == "1\n2\n3"

    # ── Edge cases ───────────────────────────────────────────────────

    def test_empty_list(self):
        result = self._map_single_column([])
        assert result == ""

    def test_single_dict(self):
        """A plain dict (not in a list) should become a JSON object string."""
        data = {"key": "value", "nested": {"a": 1}}
        result = self._map_single_column(data)
        parsed = json.loads(result)
        assert parsed == data

    def test_none_value(self):
        result = self._map_single_column(None)
        assert result == ""

    def test_plain_string(self):
        result = self._map_single_column("hello world")
        assert result == "hello world"


class TestMapDatasetColumnsDefaults(unittest.TestCase):
    """Tests for auto-added prompt/response columns."""

    def _make_df(self, **kwargs):
        return pd.DataFrame(kwargs)

    def test_auto_adds_prompt_from_user_inputs(self):
        """When 'prompt' is not in mapping, it's auto-populated from user_inputs."""
        df = self._make_df(
            user_inputs=[["Turn 1", "Turn 2"]],
            final_response=["Agent response"],
        )
        result = map_dataset_columns(df, df, {}, "TEST_METRIC")

        assert "prompt" in result.columns
        assert result["prompt"].iloc[0] == "Turn 1\nTurn 2"

    def test_auto_adds_response_from_final_response(self):
        """When 'response' is not in mapping, it's auto-populated from final_response."""
        df = self._make_df(
            user_inputs=[["Question"]],
            final_response=["The answer is 42"],
        )
        result = map_dataset_columns(df, df, {}, "TEST_METRIC")

        assert "response" in result.columns
        assert result["response"].iloc[0] == "The answer is 42"

    def test_explicit_mapping_overrides_auto_response(self):
        """When mapping explicitly maps 'response', auto-add is skipped."""
        tool_data = [{"tool_name": "search", "output_result": "found it"}]
        df = self._make_df(
            user_inputs=[["Question"]],
            final_response=["The answer is 42"],
            tool_interactions=[tool_data],
        )
        mapping = {"response": {"source_column": "tool_interactions"}}
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        # response should be the tool_interactions JSON, NOT "The answer is 42"
        parsed = json.loads(result["response"].iloc[0])
        assert isinstance(parsed, list)
        assert parsed[0]["tool_name"] == "search"


class TestMapDatasetColumnsExtractedData(unittest.TestCase):
    """Tests for mapping extracted_data sub-fields via colon-separated paths."""

    def test_extracted_data_tool_interactions_via_flattened_column(self):
        """Simulate how json_normalize creates 'extracted_data.tool_interactions' column."""
        tool_interactions = [
            {
                "tool_name": "agent_a",
                "input_arguments": {
                    "request": "find docs"
                }
            },
            {
                "tool_name": "search_tool",
                "input_arguments": {
                    "query": "test"
                }
            },
        ]
        df = pd.DataFrame({
            "user_inputs": [["Find documents about X"]],
            "final_response": ["Here are the results..."],
            "extracted_data.tool_interactions": [tool_interactions],
        })
        mapping = {
            "response": {
                "source_column": "extracted_data:tool_interactions"
            }
        }
        result = map_dataset_columns(df, df, mapping, "tool_trajectory")

        parsed = json.loads(result["response"].iloc[0])
        assert len(parsed) == 2
        assert parsed[0]["tool_name"] == "agent_a"
        assert parsed[1]["tool_name"] == "search_tool"

    def test_extracted_data_nested_lookup_fallback(self):
        """When flattened column doesn't exist, falls back to nested dict lookup."""
        extracted_data = {
            "tool_interactions": [{
                "tool_name": "search",
                "output_result": "3 results"
            }],
            "sub_agent_trace": [{
                "agent_name": "root_agent",
                "text_response": "done"
            }],
        }
        df = pd.DataFrame({
            "user_inputs": [["Query"]],
            "final_response": ["Response"],
            "extracted_data": [extracted_data],
        })
        mapping = {
            "tools": {
                "source_column": "extracted_data:tool_interactions"
            }
        }
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        parsed = json.loads(result["tools"].iloc[0])
        assert len(parsed) == 1
        assert parsed[0]["tool_name"] == "search"


class TestCustomPlaceholders(unittest.TestCase):
    """Tests for arbitrary placeholder names in dataset_mapping.

    The SDK supports any valid Python identifier as a placeholder name,
    not just prompt/response/reference. Each mapping key becomes a
    DataFrame column that's substituted into {key} in the template.
    """

    def test_custom_placeholder_names(self):
        """Placeholders beyond prompt/response/reference work."""
        df = pd.DataFrame({
            "user_inputs": [["What tools are available?"]],
            "final_response": ["Here's what I found"],
            "extracted_data.tool_interactions": [[{
                "tool_name": "search",
                "output_result": "ok"
            }]],
            "extracted_data.tool_declarations": [[{
                "name": "search",
                "description": "Search docs"
            }]],
        })
        mapping = {
            "prompt": {
                "source_column": "user_inputs"
            },
            "response": {
                "source_column": "final_response"
            },
            "tool_calls": {
                "source_column": "extracted_data:tool_interactions"
            },
            "available_tools": {
                "source_column": "extracted_data:tool_declarations"
            },
        }
        result = map_dataset_columns(df, df, mapping, "tool_use_quality")

        # All 4 placeholders should be columns in the result
        assert set(mapping.keys()).issubset(set(result.columns))

        # Structured data in custom placeholders should be valid JSON
        calls = json.loads(result["tool_calls"].iloc[0])
        assert calls[0]["tool_name"] == "search"

        tools = json.loads(result["available_tools"].iloc[0])
        assert tools[0]["name"] == "search"


class TestTemplateCombinedColumns(unittest.TestCase):
    """Tests for the template-based meta-column feature.

    dataset_mapping supports combining multiple columns into one
    placeholder using the "template" + "source_columns" syntax:

        "combined_context": {
            "template": "Query: {user_inputs}\\nResults: {search_results}",
            "source_columns": ["user_inputs", "extracted_data:search_results"]
        }

    Colons in source_columns are replaced with underscores in the
    template variables (e.g., extracted_data:field → {extracted_data_field}).
    """

    def test_combine_two_columns_into_one(self):
        """Two source columns merged via template into a single placeholder."""
        df = pd.DataFrame({
            "user_inputs": [["What is the weather?"]],
            "final_response": ["It's sunny today"],
            "agent_reasoning": ["I checked the weather API"],
        })
        mapping = {
            "response": {
                "template":
                    "Answer: {final_response}\nReasoning: {agent_reasoning}",
                "source_columns": ["final_response", "agent_reasoning"],
            }
        }
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        assert "Answer: It's sunny today" in result["response"].iloc[0]
        assert "Reasoning: I checked the weather API" in result[
            "response"].iloc[0]

    def test_combine_with_extracted_data_column(self):
        """source_columns with colon notation are resolved and underscored in template."""
        df = pd.DataFrame({
            "user_inputs": [["Analyze this"]],
            "final_response": ["Analysis complete"],
            "extracted_data.search_results": ["3 documents found"],
        })
        # Colons in source_columns → underscores in template vars
        mapping = {
            "context": {
                "template":
                    "Query: {user_inputs}\nSearch output: {extracted_data_search_results}",
                "source_columns": [
                    "user_inputs", "extracted_data:search_results"
                ],
            }
        }
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        val = result["context"].iloc[0]
        assert "Search output: 3 documents found" in val

    def test_structured_data_serialized_as_json(self):
        """Lists and dicts in template source_columns are JSON-serialized, not Python repr."""
        tool_interactions = [
            {
                "tool_name": "search",
                "output_result": "found it"
            },
        ]
        df = pd.DataFrame({
            "user_inputs": [["Query"]],
            "final_response": ["Response"],
            "extracted_data.tool_interactions": [tool_interactions],
            "trace_summary": [["agent:root_agent", "tool:search"]],
        })
        mapping = {
            "combined": {
                "template":
                    "Tools: {extracted_data_tool_interactions}\nTrajectory: {trace_summary}",
                "source_columns": [
                    "extracted_data:tool_interactions", "trace_summary"
                ],
            }
        }
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        val = result["combined"].iloc[0]
        # Should use JSON double quotes, not Python single quotes
        assert '"tool_name"' in val
        assert "'tool_name'" not in val
        # The tool_interactions portion should be parseable JSON
        tools_line = val.split("\n")[0].replace("Tools: ", "")
        parsed = json.loads(tools_line)
        assert parsed[0]["tool_name"] == "search"


class TestToolTrajectoryEndToEnd(unittest.TestCase):
    """Integration test for tool trajectory metric evaluation.

    Reproduces the exact evaluator flow: DataFrame creation,
    json_normalize expansion, then map_dataset_columns with a
    tool_trajectory metric mapping. Verifies the response column
    contains a valid JSON array (not newline-separated JSONL).
    """

    def test_single_tool_call_produces_valid_json(self):
        """Single tool interaction → JSON array with one element."""
        record = {
            "user_inputs": ["Find documents about server maintenance"],
            "final_response": "No results were found matching those criteria.",
            "agents_evaluated": ["app"],
            "reference_data": {
                "expected_agent": "search_agent",
                "expected_document_id": "DOC-001",
                "expected_tool_trajectory": ["search_agent", "vector_search"],
            },
            "extracted_data": {
                "tool_interactions": [{
                    "tool_name": "search_agent",
                    "input_arguments": {
                        "request": "Find server maintenance docs"
                    },
                    "call_id": "call-abc-123",
                    "output_result": "No results were returned.",
                }],
                "sub_agent_trace": [{
                    "agent_name": "root_agent",
                    "text_response": "No results found."
                }],
            },
        }

        # Simulate evaluator flow: DataFrame + json_normalize
        df = pd.DataFrame([record])
        expanded = pd.json_normalize(
            df["extracted_data"]).add_prefix("extracted_data.")
        agent_df = pd.concat([df, expanded], axis=1)

        mapping = {
            "prompt": {
                "source_column": "user_inputs"
            },
            "response": {
                "source_column": "extracted_data:tool_interactions"
            },
            "reference": {
                "source_column": "reference_data"
            },
        }

        result = map_dataset_columns(agent_df, df, mapping, "tool_trajectory")

        # The response column must be a valid JSON array
        response_val = result["response"].iloc[0]
        parsed = json.loads(response_val)
        assert isinstance(parsed, list), f"Expected list, got {type(parsed)}"
        assert len(parsed) == 1
        assert parsed[0]["tool_name"] == "search_agent"

        # The reference column must be a valid JSON object
        ref_parsed = json.loads(result["reference"].iloc[0])
        assert ref_parsed["expected_tool_trajectory"] == [
            "search_agent", "vector_search"
        ]

    def test_multi_tool_trajectory_preserves_order(self):
        """Multiple tool calls should appear in order in the JSON array."""
        record = {
            "user_inputs": ["Search docs and generate summary"],
            "final_response": "Here is the summary...",
            "agents_evaluated": ["app"],
            "reference_data": {
                "expected_tool_trajectory": [
                    "search_agent",
                    "vector_search",
                    "summary_agent",
                    "generate_report",
                ]
            },
            "extracted_data": {
                "tool_interactions": [
                    {
                        "tool_name": "search_agent",
                        "input_arguments": {
                            "request": "search"
                        }
                    },
                    {
                        "tool_name": "vector_search",
                        "input_arguments": {
                            "query": "docs"
                        }
                    },
                    {
                        "tool_name": "summary_agent",
                        "input_arguments": {
                            "type": "brief"
                        }
                    },
                    {
                        "tool_name": "generate_report",
                        "input_arguments": {
                            "format": "md"
                        }
                    },
                ],
            },
        }

        df = pd.DataFrame([record])
        expanded = pd.json_normalize(
            df["extracted_data"]).add_prefix("extracted_data.")
        agent_df = pd.concat([df, expanded], axis=1)

        mapping = {
            "response": {
                "source_column": "extracted_data:tool_interactions"
            },
        }
        result = map_dataset_columns(agent_df, df, mapping, "tool_trajectory")

        parsed = json.loads(result["response"].iloc[0])
        tool_names = [t["tool_name"] for t in parsed]
        assert tool_names == [
            "search_agent",
            "vector_search",
            "summary_agent",
            "generate_report",
        ]


class TestMapDatasetColumnsMultiRow(unittest.TestCase):
    """Tests with multiple rows to verify per-row normalization."""

    def test_mixed_row_types(self):
        """Each row is normalized independently."""
        df = pd.DataFrame({
            "user_inputs": [["Q1"], ["Q2"], ["Q3"]],
            "final_response": ["R1", "R2", "R3"],
            "tools": [
                [{
                    "tool_name": "search"
                }, {
                    "tool_name": "fetch"
                }],  # 2 dicts
                [{
                    "tool_name": "analyze"
                }],  # 1 dict
                [],  # empty
            ],
        })
        mapping = {"tool_data": {"source_column": "tools"}}
        result = map_dataset_columns(df, df, mapping, "TEST_METRIC")

        # Row 0: 2 tool interactions → JSON array
        parsed_0 = json.loads(result["tool_data"].iloc[0])
        assert len(parsed_0) == 2

        # Row 1: 1 tool interaction → JSON array with 1 element
        parsed_1 = json.loads(result["tool_data"].iloc[1])
        assert len(parsed_1) == 1

        # Row 2: empty list → empty string
        assert result["tool_data"].iloc[2] == ""


if __name__ == "__main__":
    unittest.main()
