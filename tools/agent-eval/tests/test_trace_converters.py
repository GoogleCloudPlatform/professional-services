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
"""Comprehensive unit tests for Contract C3 Trace Converters."""

import json
from pathlib import Path

import pytest

from agent_eval.core.data_mapper import _map_agents
from agent_eval.core.schema import AgentData
from agent_eval.core.trace_converters import (
    ADKTraceConverter,
    BaseTraceConverter,
    OpenInferenceOTelConverter,
    get_trace_converter,
)


class TestBaseTraceConverterContract:
    """Tests for BaseTraceConverter abstract base class and file ingestion."""

    def test_abstract_class_cannot_be_instantiated(self):
        with pytest.raises(TypeError):
            BaseTraceConverter()  # pytype: disable=not-instantiable

    def test_convert_file_non_existent_file_raises(self, tmp_path: Path):
        converter = ADKTraceConverter()
        missing_file = tmp_path / "non_existent.json"
        with pytest.raises(FileNotFoundError):
            converter.convert_file(missing_file)

    def test_convert_file_json_array(self, tmp_path: Path):
        converter = ADKTraceConverter()
        data = [
            {
                "session_id": "sess_1",
                "turns": [{
                    "role": "user",
                    "content": "Hello"
                }],
            },
            {
                "session_id": "sess_2",
                "turns": [{
                    "role": "model",
                    "content": "Hi there"
                }],
            },
        ]
        json_file = tmp_path / "traces.json"
        json_file.write_text(json.dumps(data), encoding="utf-8")

        results = converter.convert_file(json_file)
        assert len(results) == 2
        assert isinstance(results[0], AgentData)
        assert results[0].session_id == "sess_1"
        assert results[1].session_id == "sess_2"

    def test_convert_file_json_single_object(self, tmp_path: Path):
        converter = ADKTraceConverter()
        data = {
            "session_id": "sess_single",
            "turns": [{
                "role": "user",
                "content": "Ping"
            }],
        }
        json_file = tmp_path / "single.json"
        json_file.write_text(json.dumps(data), encoding="utf-8")

        results = converter.convert_file(json_file)
        assert len(results) == 1
        assert results[0].session_id == "sess_single"

    def test_convert_file_jsonl_streaming(self, tmp_path: Path):
        converter = ADKTraceConverter()
        records = [
            {
                "session_id": "line_1",
                "turns": [{
                    "role": "user",
                    "content": "L1"
                }]
            },
            {
                "session_id": "line_2",
                "turns": [{
                    "role": "model",
                    "content": "L2"
                }]
            },
        ]
        jsonl_file = tmp_path / "stream.jsonl"
        jsonl_file.write_text(
            "\n".join(json.dumps(r) for r in records) + "\n\n",
            encoding="utf-8",
        )

        results = converter.convert_file(jsonl_file)
        assert len(results) == 2
        assert results[0].session_id == "line_1"
        assert results[1].session_id == "line_2"

    def test_convert_file_jsonl_with_corrupted_lines(self, tmp_path: Path):
        converter = ADKTraceConverter()
        content = ('{"session_id": "valid_1", "turns": []}\n'
                   "CORRUPTED_JSON_LINE\n"
                   '{"session_id": "valid_2", "turns": []}\n')
        jsonl_file = tmp_path / "corrupted.jsonl"
        jsonl_file.write_text(content, encoding="utf-8")

        results = converter.convert_file(jsonl_file)
        # Should gracefully log a warning and convert the 2 valid lines
        assert len(results) == 2
        assert results[0].session_id == "valid_1"
        assert results[1].session_id == "valid_2"

    def test_convert_directory_globbing(self, tmp_path: Path):
        converter = ADKTraceConverter()
        trace_dir = tmp_path / "traces_dir"
        trace_dir.mkdir()

        # Create two json files and one jsonl file
        (trace_dir / "01_trace.json").write_text(json.dumps({
            "session_id": "s_01",
            "turns": []
        }),
                                                 encoding="utf-8")
        (trace_dir / "02_trace.jsonl").write_text(json.dumps({
            "session_id": "s_02",
            "turns": []
        }) + "\n",
                                                  encoding="utf-8")
        (trace_dir / "03_trace.json").write_text(
            json.dumps([{
                "session_id": "s_03_a"
            }, {
                "session_id": "s_03_b"
            }]),
            encoding="utf-8",
        )
        # Ignored non-json file
        (trace_dir / "readme.txt").write_text("ignore me", encoding="utf-8")

        results = converter.convert_file(trace_dir)
        assert len(results) == 4
        session_ids = [r.session_id for r in results]
        assert "s_01" in session_ids
        assert "s_02" in session_ids
        assert "s_03_a" in session_ids
        assert "s_03_b" in session_ids

        # Test convert_path alias
        results_alias = converter.convert_path(trace_dir)
        assert len(results_alias) == 4


class TestADKTraceConverter:
    """Tests for native ADK session history unmarshaling."""

    def test_adk_turn_and_event_mapping(self):
        raw_adk = {
            "session_id":
                "adk_session_789",
            "turns": [
                {
                    "turn_id":
                        "t_0",
                    "role":
                        "user",
                    "content":
                        "Where is the nearest cafe?",
                    "events": [{
                        "id": "ev_0_1",
                        "type": "USER_INPUT",
                        "status": "OK",
                        "author": "USER",
                        "content": "Where is the nearest cafe?",
                    }],
                },
                {
                    "turn_id":
                        "t_1",
                    "role":
                        "model",
                    "content":
                        "There is a cafe 200m away on Elm Street.",
                    "events": [
                        {
                            "id": "ev_1_1",
                            "type": "TOOL_CALL",
                            "status": "OK",
                            "payload": {
                                "tool_name": "map_search",
                                "arguments": {
                                    "query": "cafe"
                                },
                                "result": "Cafe Nero, 200m",
                            },
                        },
                        {
                            "id":
                                "ev_1_2",
                            "type":
                                "MODEL_INFERENCE",
                            "status":
                                "OK",
                            "content":
                                "There is a cafe 200m away on Elm Street.",
                        },
                    ],
                },
            ],
            "events": [{
                "id": "top_event_0",
                "type": "SESSION_INITIALIZED",
                "payload": {
                    "version": "2.0"
                },
            }],
        }

        converter = ADKTraceConverter()
        agent_data = converter.convert_to_agent_data(raw_adk)

        assert agent_data.session_id == "adk_session_789"
        assert len(agent_data.turns) == 2
        assert agent_data.turns[0].role == "user"
        assert agent_data.turns[0].content == "Where is the nearest cafe?"
        assert agent_data.turns[1].role == "model"
        assert len(agent_data.turns[1].events) == 2
        assert agent_data.turns[1].events[0].event_type == "TOOL_CALL"
        assert agent_data.turns[1].events[0].payload[
            "tool_name"] == "map_search"
        assert len(agent_data.events) == 1
        assert agent_data.events[0].event_id == "top_event_0"

    def test_adk_fallback_session_id(self):
        converter = ADKTraceConverter()
        raw = {"eval_id": "eval_run_99", "turns": []}
        agent_data = converter.convert_to_agent_data(raw)
        assert agent_data.session_id == "eval_run_99"


class TestOpenInferenceOTelConverter:
    """Tests for OpenInference and OpenTelemetry GenAI trace ingestion."""

    def test_single_turn_with_tool_call(self):
        raw_otel = {
            "trace_id":
                "otel_trace_12345",
            "spans": [
                {
                    "span_id": "span_root",
                    "name": "agent_execution",
                    "attributes": {
                        "openinference.span.kind": "AGENT",
                        "gen_ai.turn.index": 0,
                        "input.value": "Check stock price for GOOG",
                        "role": "model",
                    },
                },
                {
                    "span_id": "span_tool_1",
                    "name": "get_stock_quote",
                    "status": {
                        "code": "OK"
                    },
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "tool.name": "get_stock_quote",
                        "tool.parameters": '{"symbol": "GOOG"}',
                        "tool.output": '{"price": 185.50, "currency": "USD"}',
                    },
                },
                {
                    "span_id": "span_llm_1",
                    "name": "gemini-pro",
                    "status": {
                        "code": "OK"
                    },
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "llm.model_name": "gemini-1.5-pro",
                        "output.value": "GOOG is trading at $185.50 USD.",
                    },
                },
            ],
        }

        converter = OpenInferenceOTelConverter()
        agent_data = converter.convert_to_agent_data(raw_otel)

        assert agent_data.session_id == "otel_trace_12345"
        assert len(agent_data.turns) == 1
        turn0 = agent_data.turns[0]
        assert turn0.turn_index == 0
        assert turn0.content == "GOOG is trading at $185.50 USD."

        # Verify Tool Call Event
        tool_events = [
            ev for ev in turn0.events if ev.event_type == "TOOL_CALL"
        ]
        assert len(tool_events) == 1
        tool_ev = tool_events[0]
        assert tool_ev.status == "OK"
        assert tool_ev.payload["tool_name"] == "get_stock_quote"
        assert tool_ev.payload["arguments"] == {"symbol": "GOOG"}
        assert tool_ev.payload["result"] == {"price": 185.50, "currency": "USD"}

    def test_multi_turn_otel_grouping(self):
        raw_otel = {
            "session_id":
                "multi_turn_trace",
            "spans": [
                # Turn 0: User input and Agent reply
                {
                    "span_id": "span_u0",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": "Hello!",
                    },
                },
                {
                    "span_id": "span_m0",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "Hello! How can I assist?",
                    },
                },
                # Turn 1: User follow-up and Agent reply with tool
                {
                    "span_id": "span_u1",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 1,
                        "input.value": "What time is it in London?",
                    },
                },
                {
                    "span_id": "span_t1",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 1,
                        "tool.name": "get_timezone",
                        "tool.parameters": {
                            "city": "London"
                        },
                        "tool.output": "14:00 UTC+1",
                    },
                },
                {
                    "span_id": "span_m1",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 1,
                        "output.value": "It is currently 14:00 in London.",
                    },
                },
            ],
        }

        converter = OpenInferenceOTelConverter()
        agent_data = converter.convert_to_agent_data(raw_otel)

        assert agent_data.session_id == "multi_turn_trace"
        assert len(agent_data.turns) == 2
        assert agent_data.turns[0].turn_index == 0
        assert agent_data.turns[1].turn_index == 1

        # Check turn 1 tool interaction
        t1_events = agent_data.turns[1].events
        tool_call_ev = next(
            ev for ev in t1_events if ev.event_type == "TOOL_CALL")
        assert tool_call_ev.payload["tool_name"] == "get_timezone"
        assert tool_call_ev.payload["arguments"] == {"city": "London"}
        assert tool_call_ev.payload["result"] == "14:00 UTC+1"

    def test_tool_call_error_status_mapping(self):
        raw_otel = {
            "trace_id":
                "err_trace",
            "spans": [{
                "span_id": "span_err_tool",
                "status": {
                    "code": "ERROR"
                },
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "database_query",
                    "tool.parameters": {
                        "sql": "SELECT * FROM non_existent"
                    },
                    "tool.output": "TableNotFoundException",
                },
            }],
        }

        converter = OpenInferenceOTelConverter()
        agent_data = converter.convert_to_agent_data(raw_otel)
        assert len(agent_data.turns) == 1
        ev = agent_data.turns[0].events[0]
        assert ev.event_type == "TOOL_CALL"
        assert ev.status == "ERROR"
        assert ev.payload["result"] == "TableNotFoundException"

    def test_raw_trace_as_list_of_spans(self):
        raw_spans = [{
            "span_id": "sp_1",
            "attributes": {
                "openinference.span.kind": "LLM",
                "output.value": "Direct span list output.",
            },
        }]
        converter = OpenInferenceOTelConverter()
        agent_data = converter.convert_to_agent_data(raw_spans)
        assert len(agent_data.turns) == 1
        assert agent_data.turns[0].content == "Direct span list output."


class TestTraceConverterFactory:
    """Tests for get_trace_converter factory method and framework aliases."""

    @pytest.mark.parametrize(
        "alias",
        [
            "adk",
            "ADK",
            "default",
            " adk ",
        ],
    )
    def test_adk_aliases(self, alias: str):
        converter = get_trace_converter(alias)
        assert isinstance(converter, ADKTraceConverter)

    @pytest.mark.parametrize(
        "alias",
        [
            "otel",
            "openinference",
            "langgraph",
            "llamaindex",
            "crewai",
            "autogen",
            "OTEL",
            "OpenInference",
            "LangGraph",
            "CrewAI",
            "AutoGen",
        ],
    )
    def test_openinference_aliases(self, alias: str):
        converter = get_trace_converter(alias)
        assert isinstance(converter, OpenInferenceOTelConverter)

    def test_unsupported_format_raises_value_error(self):
        with pytest.raises(ValueError) as excinfo:
            get_trace_converter("unsupported_framework")
        assert "Unsupported trace format type" in str(excinfo.value)
        assert "openinference" in str(excinfo.value)
        assert "autogen" in str(excinfo.value)


class TestE2ETraceToDataMapperPipeline:
    """Tests full pipeline: TraceConverter -> AgentData -> _map_agents -> Evaluation Row."""

    def test_openinference_to_evaluation_dataset(self, tmp_path: Path):
        raw_trace = {
            "trace_id":
                "e2e_trace_001",
            "spans": [
                {
                    "span_id": "s_user",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": "Calculate 15% tip on $80",
                    },
                },
                {
                    "span_id": "s_tool",
                    "attributes": {
                        "openinference.span.kind":
                            "TOOL",
                        "gen_ai.turn.index":
                            0,
                        "tool.name":
                            "calculator",
                        "tool.parameters":
                            '{"operation": "multiply", "a": 80, "b": 0.15}',
                        "tool.output":
                            '{"result": 12.0}',
                    },
                },
                {
                    "span_id": "s_llm",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "The 15% tip on $80 is $12.00.",
                    },
                },
            ],
        }
        trace_file = tmp_path / "openinference_sample.jsonl"
        trace_file.write_text(json.dumps(raw_trace) + "\n", encoding="utf-8")

        # 1. Convert using factory
        converter = get_trace_converter("openinference")
        agent_data_list = converter.convert_file(trace_file)
        assert len(agent_data_list) == 1

        # 2. Project into canonical evaluation rows
        eval_rows = _map_agents(agent_data_list)
        assert len(eval_rows) == 1
        row = eval_rows[0]

        assert row["session_id"] == "e2e_trace_001"
        assert row["prompt"] == "Calculate 15% tip on $80"
        assert row["response"] == "The 15% tip on $80 is $12.00."
        assert len(row["extracted_data"]["tool_interactions"]) == 1
        ti = row["extracted_data"]["tool_interactions"][0]
        assert ti["tool_name"] == "calculator"
        assert ti["input_arguments"] == {
            "operation": "multiply",
            "a": 80,
            "b": 0.15
        }
        assert ti["output_result"] == {"result": 12.0}

    def test_langgraph_hierarchical_trace_conversion(self, tmp_path: Path):
        """Test hierarchical LangGraph trace without gen_ai.turn.index."""
        langgraph_trace = {
            "trace_id": "lg_trace_456",
            "spans": [
                {
                    "span_id": "root_agent",
                    "parent_id": None,
                    "name": "hierarchical.agent",
                    "start_time": 1000000000,
                    "end_time": 3500000000,
                    "attributes": {
                        "openinference.span.kind": "AGENT",
                        "input.value": "How do I configure Redis cache?",
                        "output.value": "To configure Redis cache, set REDIS_URL in .env.",
                        "session_id": "lg_session_001",
                    },
                },
                {
                    "span_id": "tool_search",
                    "parent_id": "root_agent",
                    "name": "tool.search_documentation",
                    "start_time": 1200000000,
                    "end_time": 1800000000,
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "tool.name": "search_documentation",
                        "tool.parameters": '{"query": "Redis cache configuration"}',
                        "tool.output": '{"results": ["Set REDIS_URL=redis://localhost:6379 in your environment."]}',
                    },
                },
                {
                    "span_id": "llm_generate",
                    "parent_id": "root_agent",
                    "name": "ChatOpenAI",
                    "start_time": 2000000000,
                    "end_time": 3400000000,
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "llm.model_name": "gemini-2.5-flash",
                        "llm.token_count.prompt": 250,
                        "llm.token_count.completion": 45,
                        "llm.token_count.total": 295,
                        "output.value": "To configure Redis cache, set REDIS_URL in .env.",
                    },
                },
            ],
        }

        trace_file = tmp_path / "langgraph_trace.jsonl"
        trace_file.write_text(json.dumps(langgraph_trace) + "\n", encoding="utf-8")

        golden_dataset = tmp_path / "golden.jsonl"
        golden_dataset.write_text(
            json.dumps({
                "id": "lg_session_001",
                "prompt": "How do I configure Redis cache?",
                "reference_data": {
                    "reference_answer": "Configure REDIS_URL in environment variables.",
                    "ground_truth_tools": ["search_documentation"],
                },
                "metadata": {"category": "configuration"},
            }) + "\n",
            encoding="utf-8",
        )

        converter = get_trace_converter("langgraph", questions_file=golden_dataset)
        agent_data_list = converter.convert_file(trace_file)
        assert len(agent_data_list) == 1
        agent_data = agent_data_list[0]

        assert agent_data.session_id == "lg_session_001"
        assert len(agent_data.turns) == 2
        assert agent_data.turns[0].role == "user"
        assert "How do I configure Redis cache" in agent_data.turns[0].content
        assert agent_data.turns[1].role == "model"
        assert "To configure Redis cache" in agent_data.turns[1].content

        # Project to evaluation rows
        eval_rows = _map_agents(agent_data_list)
        assert len(eval_rows) == 1
        row = eval_rows[0]

        assert row["session_id"] == "lg_session_001"
        assert row["prompt"] == "How do I configure Redis cache?"
        assert row["response"] == "To configure Redis cache, set REDIS_URL in .env."
        assert row["reference_data"]["reference_answer"] == "Configure REDIS_URL in environment variables."
        assert row["metadata"]["category"] == "configuration"
        assert len(row["session_trace"]) == 3

    def test_openinference_deterministic_metrics(self):
        """Test deterministic metrics calculation on OpenInference traces."""
        from agent_eval.core.deterministic_metrics import (
            calculate_latency_metrics,
            calculate_token_usage,
            calculate_tool_success_rate,
            calculate_tool_utilization,
        )

        spans = [
            {
                "span_id": "root",
                "parent_id": None,
                "start_time": 1000000000,
                "end_time": 4000000000,
                "attributes": {"openinference.span.kind": "AGENT"},
            },
            {
                "span_id": "tool1",
                "name": "tool.lookup_docs",
                "start_time": 1200000000,
                "end_time": 1800000000,
                "status": {"code": "OK"},
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "tool.name": "lookup_docs",
                    "tool.output": '{"status": "success", "content": "Sample docs"}',
                },
            },
            {
                "span_id": "llm1",
                "name": "ChatVertexAI",
                "start_time": 2000000000,
                "end_time": 3500000000,
                "attributes": {
                    "openinference.span.kind": "LLM",
                    "llm.model_name": "gemini-2.5-pro",
                    "llm.token_count.prompt": 500,
                    "llm.token_count.completion": 100,
                    "llm.token_count.total": 600,
                },
            },
        ]

        # 1. Token usage
        cost, _expl, details = calculate_token_usage(spans)
        assert details["llm_calls"] == 1
        assert details["prompt_tokens"] == 500
        assert details["completion_tokens"] == 100
        assert details["total_tokens"] == 600
        assert cost > 0.0

        # 2. Tool utilization
        total_tools, _expl_tool, details_tool = calculate_tool_utilization(spans)
        assert total_tools == 1.0
        assert details_tool["unique_tools_used"] == 1
        assert details_tool["tool_counts"]["lookup_docs"] == 1

        # 3. Tool success rate
        success_rate, _expl_sr, details_sr = calculate_tool_success_rate(spans)
        assert success_rate == 1.0
        assert details_sr["failed_tool_calls"] == 0

        # 4. Latency
        _latency_score, _expl_lat, details_lat = calculate_latency_metrics(spans)
        assert details_lat["total_latency_seconds"] == 3.0
        assert details_lat["llm_latency_seconds"] == 1.5
        assert details_lat["tool_latency_seconds"] == 0.6

    def test_cli_convert_openinference_with_golden_file(self, tmp_path: Path):
        """Test CLI convert command on OpenInference file with --questions-file."""
        from click.testing import CliRunner
        from agent_eval.cli.commands.convert import convert

        raw_trace = {
            "trace_id": "cli_trace_123",
            "spans": [
                {
                    "span_id": "s_root",
                    "parent_id": None,
                    "attributes": {
                        "openinference.span.kind": "AGENT",
                        "input.value": "Test CLI prompt",
                        "output.value": "Test CLI response",
                    },
                }
            ],
        }
        trace_file = tmp_path / "cli_trace.jsonl"
        trace_file.write_text(json.dumps(raw_trace) + "\n", encoding="utf-8")

        golden_file = tmp_path / "cli_golden.jsonl"
        golden_file.write_text(
            json.dumps({
                "id": "cli_trace_123",
                "prompt": "Test CLI prompt",
                "reference_data": {"golden_answer": "Golden answer"},
            }) + "\n",
            encoding="utf-8",
        )

        out_dir = tmp_path / "results"
        runner = CliRunner()
        result = runner.invoke(
            convert,
            [
                "--agent-dir",
                str(trace_file),
                "--questions-file",
                str(golden_file),
                "--trace-format",
                "langgraph",
                "--output-dir",
                str(out_dir),
                "--output-file",
                "test_out.jsonl",
            ],
        )
        assert result.exit_code == 0
        converted_files = list(out_dir.glob("**/test_out.jsonl"))
        assert len(converted_files) == 1
        with converted_files[0].open(encoding="utf-8") as f:
            lines = [json.loads(line) for line in f if line.strip()]
        assert len(lines) == 1
        assert lines[0]["session_id"] == "cli_trace_123"
        assert lines[0]["prompt"] == "Test CLI prompt"
        assert lines[0]["response"] == "Test CLI response"
        assert lines[0]["reference_data"]["golden_answer"] == "Golden answer"

