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
"""Adversarial and Stress Test Suite for Contract C3 Trace Converters and Data Mapper.

Executed by Challenger M1-1 (Adversarial Schema & Span Challenger).
Tests edge cases, malformed payloads, unicode, out-of-order turns, and schema resiliency.
"""

import json

import pandas as pd
import pytest

from agent_eval.core.data_mapper import (
    _map_agents,
    convert_interactions_to_events,
    map_dataset_columns,
)
from agent_eval.core.schema import AgentData
from agent_eval.core.trace_converters import (
    ADKTraceConverter,
    OpenInferenceOTelConverter,
)


class TestAdversarialToolParametersAndOutputs:
    """Vector 1: Stress-testing tool parameter and output formats."""

    @pytest.fixture
    def converter(self):
        return OpenInferenceOTelConverter()

    def test_dict_parameters_and_output(self, converter):
        raw = {
            "trace_id":
                "tr_dict_params",
            "spans": [{
                "span_id": "sp_tool_dict",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "search_db",
                    "tool.parameters": {
                        "query": "weather",
                        "limit": 5,
                        "nested": {
                            "a": [1, 2]
                        },
                    },
                    "tool.output": {
                        "status": "ok",
                        "items": [{
                            "id": 1
                        }, {
                            "id": 2
                        }],
                    },
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        assert len(data.turns) == 1
        ev = data.turns[0].events[0]
        assert ev.event_type == "TOOL_CALL"
        assert ev.payload["arguments"] == {
            "query": "weather",
            "limit": 5,
            "nested": {
                "a": [1, 2]
            },
        }
        assert ev.payload["result"] == {
            "status": "ok",
            "items": [{
                "id": 1
            }, {
                "id": 2
            }]
        }
        assert ev.tool_calls[0]["args"] == {
            "query": "weather",
            "limit": 5,
            "nested": {
                "a": [1, 2]
            },
        }
        assert ev.tool_responses[0]["response"] == {
            "status": "ok",
            "items": [{
                "id": 1
            }, {
                "id": 2
            }],
        }

    def test_stringified_json_parameters_and_output(self, converter):
        raw = {
            "trace_id":
                "tr_str_json",
            "spans": [{
                "span_id": "sp_tool_str",
                "attributes": {
                    "openinference.span.kind":
                        "TOOL",
                    "gen_ai.turn.index":
                        0,
                    "tool.name":
                        "calc",
                    "tool.parameters":
                        '{"operation": "add", "operands": [10, 20]}',
                    "tool.output":
                        '{"result": 30}',
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["arguments"] == {
            "operation": "add",
            "operands": [10, 20]
        }
        assert ev.payload["result"] == {"result": 30}
        assert ev.tool_calls[0]["args"] == {
            "operation": "add",
            "operands": [10, 20]
        }
        assert ev.tool_responses[0]["response"] == {"result": 30}

    def test_malformed_non_json_string_parameters(self, converter):
        """Malformed JSON strings should not crash the converter and should be preserved as raw/fallback."""
        raw = {
            "trace_id":
                "tr_malformed_str",
            "spans": [{
                "span_id": "sp_tool_bad_json",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "raw_query",
                    "tool.parameters": "{invalid json: unquoted string",
                    "tool.output": "{broken output",
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["tool_name"] == "raw_query"
        assert ev.payload["arguments"] == "{invalid json: unquoted string"
        assert ev.payload["result"] == "{broken output"
        # Verify fallback wrapping in tool_calls and tool_responses
        assert ev.tool_calls[0]["args"] == {
            "input": "{invalid json: unquoted string"
        }
        assert ev.tool_responses[0]["response"] == {"output": "{broken output"}

    def test_plain_text_parameters(self, converter):
        raw = {
            "trace_id":
                "tr_plain_text",
            "spans": [{
                "span_id": "sp_tool_plain",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "sql_exec",
                    "tool.parameters": "SELECT * FROM users WHERE active = 1;",
                    "tool.output": "3 rows returned: alice, bob, charlie",
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload[
            "arguments"] == "SELECT * FROM users WHERE active = 1;"
        assert ev.payload["result"] == "3 rows returned: alice, bob, charlie"
        assert ev.tool_calls[0]["args"] == {
            "input": "SELECT * FROM users WHERE active = 1;"
        }
        assert ev.tool_responses[0]["response"] == {
            "output": "3 rows returned: alice, bob, charlie"
        }

    def test_attribute_key_aliases(self, converter):
        """Test variations in tool attributes: tool.call.parameters, input.value, input_arguments, etc."""
        raw = {
            "trace_id":
                "tr_aliases",
            "spans": [
                {
                    "span_id": "sp_alias_1",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "tool_name": "alias_tool",
                        "tool.call.parameters": {
                            "p1": "v1"
                        },
                        "tool.output": "out1",
                    },
                },
                {
                    "span_id": "sp_alias_2",
                    "name": "span_name_as_tool",
                    "attributes": {
                        "openinference.span.kind": "TOOL_CALL",
                        "gen_ai.turn.index": 0,
                        "input.value": '{"p2": "v2"}',
                        "output.value": '{"res2": "val2"}',
                    },
                },
                {
                    "span_id": "sp_alias_3",
                    "name": "span_name_3",
                    "attributes": {
                        "span_kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "input_arguments": "simple_arg",
                        "output_result": "simple_result",
                    },
                },
            ],
        }
        data = converter.convert_to_agent_data(raw)
        assert len(data.turns) == 1
        events = data.turns[0].events
        assert len(events) == 3

        assert events[0].payload["tool_name"] == "alias_tool"
        assert events[0].payload["arguments"] == {"p1": "v1"}

        assert events[1].payload["tool_name"] == "span_name_as_tool"
        assert events[1].payload["arguments"] == {"p2": "v2"}
        assert events[1].payload["result"] == {"res2": "val2"}

        assert events[2].payload["tool_name"] == "span_name_3"
        assert events[2].payload["arguments"] == "simple_arg"
        assert events[2].payload["result"] == "simple_result"


class TestAdversarialStatusFormats:
    """Vector 2: Stress-testing status field representations across OTel conventions."""

    @pytest.fixture
    def converter(self):
        return OpenInferenceOTelConverter()

    @pytest.mark.parametrize(
        "status_val,expected_code",
        [
            ({
                "code": "ERROR"
            }, "ERROR"),
            ({
                "code": "STATUS_CODE_ERROR"
            }, "ERROR"),
            ({
                "code": 2
            }, "ERROR"),
            ({
                "status_code": "ERROR"
            }, "ERROR"),
            ({
                "status_code": 2
            }, "ERROR"),
            ("ERROR", "ERROR"),
            (2, "ERROR"),
            ({
                "code": "OK"
            }, "OK"),
            ({
                "code": "STATUS_CODE_OK"
            }, "OK"),
            ({
                "code": 1
            }, "OK"),
            ({
                "code": 0
            }, "OK"),
            ("OK", "OK"),
            (1, "OK"),
            (None, "OK"),
            ({}, "OK"),
            ("UNKNOWN", "OK"),
        ],
    )
    def test_status_parsing_resilience(self, converter, status_val,
                                       expected_code):
        raw = {
            "trace_id":
                "tr_status",
            "spans": [{
                "span_id": "sp_status_test",
                "status": status_val,
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "status_check",
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        assert data.turns[0].events[0].status == expected_code


class TestAdversarialMultiTurnAndInterleaving:
    """Vector 3: Multi-turn traces with interleaved tool calls, multiple tool calls, out-of-order indices."""

    @pytest.fixture
    def converter(self):
        return OpenInferenceOTelConverter()

    def test_out_of_order_turn_indices(self, converter):
        """Spans arrive in order Turn 2 -> Turn 0 -> Turn 1. Converter should sort turns properly."""
        raw = {
            "trace_id":
                "tr_out_of_order",
            "spans": [
                {
                    "span_id": "sp_t2",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 2,
                        "output.value": "Turn 2 Final Answer",
                    },
                },
                {
                    "span_id": "sp_t0_u",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": "Turn 0 Prompt",
                    },
                },
                {
                    "span_id": "sp_t0_m",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "Turn 0 Response",
                    },
                },
                {
                    "span_id": "sp_t1_tool",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 1,
                        "tool.name": "fetch_data",
                        "tool.parameters": {
                            "id": 101
                        },
                        "tool.output": "data_101",
                    },
                },
            ],
        }
        data = converter.convert_to_agent_data(raw)
        assert len(data.turns) == 3
        assert data.turns[0].turn_index == 0
        assert data.turns[1].turn_index == 1
        assert data.turns[2].turn_index == 2
        assert data.turns[0].content == "Turn 0 Response"
        assert data.turns[2].content == "Turn 2 Final Answer"

    def test_multiple_tool_calls_in_single_turn(self, converter):
        """5 parallel/sequential tool calls within a single turn."""
        spans = [{
            "span_id": f"sp_tool_{i}",
            "attributes": {
                "openinference.span.kind": "TOOL",
                "gen_ai.turn.index": 0,
                "tool.name": f"tool_op_{i}",
                "tool.parameters": {
                    "arg": i
                },
                "tool.output": {
                    "res": i * 10
                },
            },
        } for i in range(5)]
        spans.append({
            "span_id": "sp_llm_final",
            "attributes": {
                "openinference.span.kind": "LLM",
                "gen_ai.turn.index": 0,
                "output.value": "Completed all 5 tool operations.",
            },
        })
        raw = {"trace_id": "tr_multi_tools", "spans": spans}
        data = converter.convert_to_agent_data(raw)
        assert len(data.turns) == 1
        turn0 = data.turns[0]
        assert len(turn0.events) == 6
        tool_events = [
            ev for ev in turn0.events if ev.event_type == "TOOL_CALL"
        ]
        assert len(tool_events) == 5
        for i, ev in enumerate(tool_events):
            assert ev.payload["tool_name"] == f"tool_op_{i}"
            assert ev.payload["arguments"] == {"arg": i}
            assert ev.payload["result"] == {"res": i * 10}

    def test_missing_or_non_integer_turn_index_fallback(self, converter):
        """Spans with missing, string, or invalid turn indices."""
        raw = {
            "trace_id":
                "tr_invalid_turns",
            "spans": [
                {
                    "span_id": "sp_no_idx",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "output.value": "No turn index specified",
                    },
                },
                {
                    "span_id": "sp_str_idx",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": "1",
                        "output.value": "String turn index '1'",
                    },
                },
                {
                    "span_id": "sp_bad_str_idx",
                    "attributes": {
                        "openinference.span.kind":
                            "LLM",
                        "gen_ai.turn.index":
                            "invalid_number",
                        "output.value":
                            "Invalid string turn index fallback to 0",
                    },
                },
            ],
        }
        data = converter.convert_to_agent_data(raw)
        assert len(data.turns) == 2
        assert data.turns[0].turn_index == 0
        assert (len(data.turns[0].events) == 2
               )  # sp_no_idx and sp_bad_str_idx grouped in 0
        assert data.turns[1].turn_index == 1


class TestAdversarialOutputAndCompletionFields:
    """Vector 4: Missing output.value, gen_ai.completion, empty strings, nulls."""

    @pytest.fixture
    def converter(self):
        return OpenInferenceOTelConverter()

    def test_completion_attribute_fallback(self, converter):
        raw = {
            "trace_id":
                "tr_gen_ai_completion",
            "spans": [{
                "span_id": "sp_gen_ai",
                "attributes": {
                    "openinference.span.kind":
                        "LLM",
                    "gen_ai.turn.index":
                        0,
                    "gen_ai.completion":
                        "Output via gen_ai.completion convention",
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        assert data.turns[
            0].content == "Output via gen_ai.completion convention"
        assert (data.turns[0].events[0].content ==
                "Output via gen_ai.completion convention")

    def test_llm_output_messages_fallback(self, converter):
        raw = {
            "trace_id":
                "tr_output_msgs",
            "spans": [{
                "span_id": "sp_msgs",
                "attributes": {
                    "openinference.span.kind": "LLM",
                    "gen_ai.turn.index": 0,
                    "llm.output_messages": "Output via llm.output_messages",
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        assert data.turns[0].content == "Output via llm.output_messages"

    def test_empty_string_and_none_outputs(self, converter):
        raw = {
            "trace_id":
                "tr_empty_outputs",
            "spans": [
                {
                    "span_id": "sp_empty_llm",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "",
                    },
                },
                {
                    "span_id": "sp_none_tool_output",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "tool.name": "no_output_tool",
                        "tool.output": None,
                    },
                },
            ],
        }
        data = converter.convert_to_agent_data(raw)
        assert data.turns[0].content == ""
        tool_ev = next(
            ev for ev in data.turns[0].events if ev.event_type == "TOOL_CALL")
        assert tool_ev.payload["result"] == ""
        assert tool_ev.tool_responses[0]["response"] == {"output": ""}


class TestAdversarialUnicodeAndSpecialCharacters:
    """Vector 5: Unicode, emojis, non-Latin alphabets, escaped quotes, newlines, and huge payloads."""

    @pytest.fixture
    def converter(self):
        return OpenInferenceOTelConverter()

    def test_emojis_and_multilingual_characters(self, converter):
        multilingual_prompt = (
            "你好 🤖 What is the forecast in 東京, München & القاهرة? 🚀")
        multilingual_tool_out = {
            "status": "success ✨",
            "locations": ["東京 🇯🇵", "München 🇩🇪", "القاهرة 🇪🇬"],
            "notes": "Weather is sunny ☀️ with 25°C temperature.",
        }
        multilingual_response = "Here is the weather: 東京 is 25°C ☀️, München is 18°C ⛅, القاهرة is 32°C 🏜️."

        raw = {
            "trace_id":
                "tr_unicode_✨_123",
            "spans": [
                {
                    "span_id": "sp_u_multi",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": multilingual_prompt,
                    },
                },
                {
                    "span_id": "sp_t_multi",
                    "attributes": {
                        "openinference.span.kind":
                            "TOOL",
                        "gen_ai.turn.index":
                            0,
                        "tool.name":
                            "weather_service_🌍",
                        "tool.parameters": {
                            "locations": ["東京", "München", "القاهرة"]
                        },
                        "tool.output":
                            json.dumps(multilingual_tool_out,
                                       ensure_ascii=False),
                    },
                },
                {
                    "span_id": "sp_m_multi",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": multilingual_response,
                    },
                },
            ],
        }
        data = converter.convert_to_agent_data(raw)
        assert data.session_id == "tr_unicode_✨_123"
        assert len(data.turns) == 1
        turn0 = data.turns[0]
        assert turn0.content == multilingual_response

        # Check tool event preservation
        tool_ev = next(
            ev for ev in turn0.events if ev.event_type == "TOOL_CALL")
        assert tool_ev.payload["tool_name"] == "weather_service_🌍"
        assert tool_ev.payload["arguments"] == {
            "locations": ["東京", "München", "القاهرة"]
        }
        assert tool_ev.payload["result"] == multilingual_tool_out

        # Pipeline to _map_agents
        rows = _map_agents([data])
        assert len(rows) == 1
        row = rows[0]
        assert row["prompt"] == multilingual_prompt
        assert row["response"] == multilingual_response
        assert (row["extracted_data"]["tool_interactions"][0]["tool_name"] ==
                "weather_service_🌍")

    def test_special_escaped_characters_and_newlines(self, converter):
        complex_sql = "SELECT 'line1\\nline2\\t\"quoted\"\\r\\0' AS col\nFROM db.table\nWHERE col LIKE '%test%';"
        raw = {
            "trace_id":
                "tr_escaped",
            "spans": [{
                "span_id": "sp_sql",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "sql_engine",
                    "tool.parameters": complex_sql,
                    "tool.output": 'Result: 1 row with \n\t tabs and quotes ""',
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["arguments"] == complex_sql
        assert ev.payload[
            "result"] == 'Result: 1 row with \n\t tabs and quotes ""'

    def test_large_payload_stress(self, converter):
        """Large payload stress test (10,000 character arguments and outputs)."""
        large_input = "A" * 10000
        large_output = "B" * 10000
        raw = {
            "trace_id":
                "tr_large",
            "spans": [{
                "span_id": "sp_large",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "big_processor",
                    "tool.parameters": {
                        "data": large_input
                    },
                    "tool.output": {
                        "data": large_output
                    },
                },
            }],
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert len(ev.payload["arguments"]["data"]) == 10000
        assert len(ev.payload["result"]["data"]) == 10000

        rows = _map_agents([data])
        assert (len(rows[0]["extracted_data"]["tool_interactions"][0]
                    ["input_arguments"]["data"]) == 10000)


class TestAdversarialDataMapperBridge:
    """Vector 6: Stress testing the bridge between Converted AgentData and Evaluator / AutoRaters."""

    def test_data_mapper_with_empty_agent_data(self):
        empty_data = AgentData(session_id="empty_sess", turns=[], events=[])
        rows = _map_agents([empty_data])
        assert len(rows) == 1
        row = rows[0]
        assert row["session_id"] == "empty_sess"
        assert row["prompt"] == ""
        assert row["response"] == ""
        assert row["user_inputs"] == []
        assert row["extracted_data"]["tool_interactions"] == []
        assert row["extracted_data"]["sub_agent_trace"] == []
        assert row["final_session_state"] == {}

    def test_convert_interactions_to_events_robustness(self):
        """Test converting various malformed tool interaction lists to Vertex SDK Event dicts."""
        # 1. Normal tool interaction
        normal = [{
            "tool_name": "calc",
            "input_arguments": {
                "x": 1
            },
            "output_result": {
                "y": 2
            },
        }]
        events = convert_interactions_to_events(normal)
        assert len(
            events) == 2  # 1 function_call (model) + 1 function_response (tool)
        assert events[0]["author"] == "model"
        assert events[0]["content"]["parts"][0]["function_call"][
            "name"] == "calc"
        assert events[1]["author"] == "tool"
        assert events[1]["content"]["parts"][0]["function_response"][
            "name"] == "calc"

        # 2. Non-dict arguments and responses
        non_dict = [{
            "tool_name": "raw_tool",
            "input_arguments": "raw_str_arg",
            "output_result": "raw_str_res",
        }]
        events = convert_interactions_to_events(non_dict)
        assert len(events) == 2
        assert events[0]["content"]["parts"][0]["function_call"]["args"] == {
            "value": "raw_str_arg"
        }
        assert events[1]["content"]["parts"][0]["function_response"][
            "response"] == {
                "result": "raw_str_res"
            }

        # 3. None / Empty inputs
        assert convert_interactions_to_events(None) == []
        assert convert_interactions_to_events([]) == []
        assert convert_interactions_to_events("invalid json string") == []

    def test_map_dataset_columns_with_converted_trace(self):
        """Ensure converted data flows smoothly into map_dataset_columns for AutoRaters."""
        raw_otel = {
            "trace_id":
                "autorater_test_sess",
            "spans": [
                {
                    "span_id": "sp_u",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": "What is the capital of France?",
                    },
                },
                {
                    "span_id": "sp_t",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "tool.name": "geo_lookup",
                        "tool.parameters": '{"country": "France"}',
                        "tool.output": '{"capital": "Paris"}',
                    },
                },
                {
                    "span_id": "sp_m",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "The capital of France is Paris.",
                    },
                },
            ],
        }
        converter = OpenInferenceOTelConverter()
        agent_data = converter.convert_to_agent_data(raw_otel)
        eval_rows = _map_agents([agent_data])
        agent_df = pd.DataFrame(eval_rows)
        original_df = agent_df.copy()

        # Test mapping for TOOL_USE_QUALITY AutoRater metric
        mapping = {
            "prompt": {
                "source_column": "prompt"
            },
            "response": {
                "source_column": "response"
            },
            "intermediate_events": {
                "source_column": "extracted_data:tool_interactions"
            },
        }
        mapped_df = map_dataset_columns(
            agent_df=agent_df,
            original_df=original_df,
            mapping=mapping,
            metric_name="TOOL_USE_QUALITY",
            is_managed_metric=True,
        )

        assert "prompt" in mapped_df.columns
        assert mapped_df["prompt"].iloc[0] == "What is the capital of France?"
        assert "response" in mapped_df.columns
        assert mapped_df["response"].iloc[
            0] == "The capital of France is Paris."
        assert "intermediate_events" in mapped_df.columns
        events = mapped_df["intermediate_events"].iloc[0]
        # Should contain 1 model text event + 1 tool call event + 1 tool response event = 3 events
        assert len(events) == 3
        assert events[0]["author"] == "model"
        assert (events[0]["content"]["parts"][0]["text"] ==
                "The capital of France is Paris.")
        assert events[1]["author"] == "model"
        assert events[1]["content"]["parts"][0]["function_call"][
            "name"] == "geo_lookup"
        assert events[2]["author"] == "tool"
        assert (events[2]["content"]["parts"][0]["function_response"]["name"] ==
                "geo_lookup")


class TestAdversarialRemediatedBugSuite:
    """Explicit regression test suite covering all 19 bug failure modes (BUG-01 to BUG-19)."""

    def test_bug_01_otel_numeric_span_kind_int_3(self):
        """BUG-01: OTel span with integer span_kind = 3 (CLIENT)."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data({"spans": [{"span_kind": 3}]})
        assert isinstance(data, AgentData)

    def test_bug_02_otel_numeric_openinference_span_kind_int_1(self):
        """BUG-02: OTel span with integer openinference.span.kind = 1 (INTERNAL)."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data(
            {"spans": [{
                "attributes": {
                    "openinference.span.kind": 1
                }
            }]})
        assert isinstance(data, AgentData)

    def test_bug_03_otel_null_spans_attribute(self):
        """BUG-03: OTel trace with {'spans': None}."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data({"spans": None})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 0

    def test_bug_04_otel_null_span_in_span_list(self):
        """BUG-04: OTel trace with {'spans': [None]}."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data({"spans": [None]})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 0

    def test_bug_05_otel_raw_span_list_with_none(self):
        """BUG-05: OTel trace as raw list [None]."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data([None])
        assert isinstance(data, AgentData)
        assert len(data.turns) == 0

    def test_bug_06_otel_null_attributes_in_span(self):
        """BUG-06: OTel span with {'attributes': None}."""
        converter = OpenInferenceOTelConverter()
        data = converter.convert_to_agent_data(
            {"spans": [{
                "attributes": None,
                "span_id": "sp_null_attr"
            }]})
        assert isinstance(data, AgentData)

    def test_bug_07_adk_null_trace_payload(self):
        """BUG-07: ADK trace with None payload."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data(None)
        assert isinstance(data, AgentData)
        assert data.session_id == "adk_session"
        assert len(data.turns) == 0

    def test_bug_08_adk_null_turns_attribute(self):
        """BUG-08: ADK trace with {'turns': None}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"turns": None})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 0

    def test_bug_09_adk_null_item_in_turns(self):
        """BUG-09: ADK trace with {'turns': [None]}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"turns": [None]})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 0

    def test_bug_10_adk_null_events_in_turn(self):
        """BUG-10: ADK trace with {'turns': [{'events': None}]}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"turns": [{"events": None}]})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 1
        assert len(data.turns[0].events) == 0

    def test_bug_11_adk_null_item_in_turn_events(self):
        """BUG-11: ADK trace with {'turns': [{'events': [None]}]}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"turns": [{"events": [None]}]})
        assert isinstance(data, AgentData)
        assert len(data.turns) == 1
        assert len(data.turns[0].events) == 0

    def test_bug_12_adk_null_top_level_events(self):
        """BUG-12: ADK trace with {'events': None}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"events": None})
        assert isinstance(data, AgentData)
        assert len(data.events) == 0

    def test_bug_13_adk_null_item_in_top_level_events(self):
        """BUG-13: ADK trace with {'events': [None]}."""
        converter = ADKTraceConverter()
        data = converter.convert_to_agent_data({"events": [None]})
        assert isinstance(data, AgentData)
        assert len(data.events) == 0

    def test_bug_14_falsy_zero_tool_parameters(self):
        """BUG-14: Tool parameters with numeric value 0 are preserved with full fidelity."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "math_offset",
                    "tool.parameters": 0,
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["arguments"] == 0
        assert ev.payload["input_arguments"] == 0

        # Verify mapping through _map_agents
        rows = _map_agents([data])
        assert rows[0]["extracted_data"]["tool_interactions"][0][
            "arguments"] == 0
        assert rows[0]["extracted_data"]["tool_interactions"][0][
            "input_arguments"] == 0

    def test_bug_15_falsy_zero_tool_output(self):
        """BUG-15: Tool output with numeric value 0 is preserved with full fidelity."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "exit_code_checker",
                    "tool.parameters": {
                        "cmd": "test"
                    },
                    "tool.output": 0,
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["result"] == 0
        assert ev.payload["output_result"] == 0

        # Verify mapping through _map_agents
        rows = _map_agents([data])
        assert rows[0]["extracted_data"]["tool_interactions"][0]["result"] == 0
        assert rows[0]["extracted_data"]["tool_interactions"][0][
            "output_result"] == 0

    def test_bug_16_falsy_false_tool_parameters(self):
        """BUG-16: Tool parameters with boolean False are preserved without being converted to empty dict."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "toggle_feature",
                    "tool.parameters": False,
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["arguments"] is False
        assert ev.payload["input_arguments"] is False

        rows = _map_agents([data])
        assert rows[0]["extracted_data"]["tool_interactions"][0][
            "arguments"] is False
        assert (
            rows[0]["extracted_data"]["tool_interactions"][0]["input_arguments"]
            is False)

    def test_bug_17_falsy_false_tool_output(self):
        """BUG-17: Tool output with boolean False is preserved without being converted to empty string."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "is_valid",
                    "tool.parameters": {
                        "input": "bad"
                    },
                    "tool.output": False,
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["result"] is False
        assert ev.payload["output_result"] is False

        rows = _map_agents([data])
        assert rows[0]["extracted_data"]["tool_interactions"][0][
            "result"] is False
        assert (
            rows[0]["extracted_data"]["tool_interactions"][0]["output_result"]
            is False)

    def test_bug_18_whitespace_json_parameters(self):
        """BUG-18: Formatted JSON parameters with leading/trailing whitespace and newlines deserialize cleanly."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind":
                        "TOOL",
                    "gen_ai.turn.index":
                        0,
                    "tool.name":
                        "query_db",
                    "tool.parameters":
                        '  \n  {"query": "find_users", "limit": 10} \t \n',
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["arguments"] == {"query": "find_users", "limit": 10}
        assert ev.tool_calls[0]["args"] == {"query": "find_users", "limit": 10}

    def test_bug_19_whitespace_json_output(self):
        """BUG-19: Formatted JSON output with leading/trailing whitespace and newlines deserializes cleanly."""
        converter = OpenInferenceOTelConverter()
        raw = {
            "spans": [{
                "attributes": {
                    "openinference.span.kind":
                        "TOOL",
                    "gen_ai.turn.index":
                        0,
                    "tool.name":
                        "query_db",
                    "tool.parameters": {
                        "query": "test"
                    },
                    "tool.output":
                        '  \r\n  {"status": "success", "count": 42}  \n',
                }
            }]
        }
        data = converter.convert_to_agent_data(raw)
        ev = data.turns[0].events[0]
        assert ev.payload["result"] == {"status": "success", "count": 42}
        assert ev.tool_responses[0]["response"] == {
            "status": "success",
            "count": 42
        }
