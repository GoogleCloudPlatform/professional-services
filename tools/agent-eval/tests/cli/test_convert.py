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
"""Comprehensive unit tests for `agent-eval convert` CLI command."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import pytest
from click.testing import CliRunner

from agent_eval.cli.commands.convert import convert


@pytest.fixture
def cli_runner() -> CliRunner:
    return CliRunner()


@pytest.fixture
def sample_adk_agent_dir(tmp_path: Path) -> Path:
    """Creates a mock ADK agent directory structure with .adk/eval_history."""
    agent_dir = tmp_path / "my_adk_agent"
    history_dir = agent_dir / ".adk" / "eval_history"
    history_dir.mkdir(parents=True)

    eval_data = {
        "eval_case_results": [
            {
                "eval_id": "case_101",
                "session_id": "sess_101",
                "session_details": {
                    "id": "sess_101",
                    "app_name": "weather_agent",
                    "user_id": "tester_1",
                    "state": {"location": "San Francisco"},
                    "events": [
                        {
                            "author": "user",
                            "timestamp": 1700000000.0,
                            "content": {"parts": [{"text": "What is the weather in SF?"}]},
                        },
                        {
                            "author": "weather_agent",
                            "timestamp": 1700000001.0,
                            "content": {
                                "parts": [
                                    {
                                        "functionCall": {
                                            "name": "get_weather",
                                            "args": {"city": "San Francisco"},
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            "author": "weather_agent",
                            "timestamp": 1700000002.0,
                            "content": {
                                "parts": [
                                    {
                                        "text": "It is currently 65F and sunny in San Francisco."
                                    }
                                ]
                            },
                        },
                    ],
                },
            }
        ]
    }

    history_file = history_dir / "eval_run_01.json"
    history_file.write_text(json.dumps(eval_data), encoding="utf-8")
    return agent_dir


@pytest.fixture
def sample_openinference_jsonl(tmp_path: Path) -> Path:
    """Creates a mock OpenInference JSONL trace file."""
    trace_file = tmp_path / "traces.jsonl"
    record = {
        "trace_id": "tr_openinf_01",
        "spans": [
            {
                "span_id": "s_user",
                "attributes": {
                    "openinference.span.kind": "USER",
                    "gen_ai.turn.index": 0,
                    "input.value": "What is the capital of Japan?",
                },
            },
            {
                "span_id": "s_tool",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "gen_ai.turn.index": 0,
                    "tool.name": "search_db",
                    "tool.parameters": '{"query": "Japan capital"}',
                    "tool.output": '{"capital": "Tokyo"}',
                },
            },
            {
                "span_id": "s_llm",
                "attributes": {
                    "openinference.span.kind": "LLM",
                    "gen_ai.turn.index": 0,
                    "output.value": "The capital of Japan is Tokyo.",
                },
            },
        ],
    }
    trace_file.write_text(json.dumps(record) + "\n", encoding="utf-8")
    return trace_file


@pytest.fixture
def sample_openinference_json(tmp_path: Path) -> Path:
    """Creates a mock OpenInference JSON trace file."""
    trace_file = tmp_path / "trace.json"
    data = [
        {
            "trace_id": "tr_openinf_json",
            "spans": [
                {
                    "span_id": "s_u",
                    "attributes": {
                        "openinference.span.kind": "USER",
                        "gen_ai.turn.index": 0,
                        "input.value": "Calculate 2 + 2",
                    },
                },
                {
                    "span_id": "s_t",
                    "attributes": {
                        "openinference.span.kind": "TOOL",
                        "gen_ai.turn.index": 0,
                        "tool.name": "calc",
                        "tool.parameters": {"operation": "add", "a": 2, "b": 2},
                        "tool.output": {"result": 4},
                    },
                },
                {
                    "span_id": "s_m",
                    "attributes": {
                        "openinference.span.kind": "LLM",
                        "gen_ai.turn.index": 0,
                        "output.value": "2 + 2 is 4.",
                    },
                },
            ],
        }
    ]
    trace_file.write_text(json.dumps(data), encoding="utf-8")
    return trace_file


def _find_output_jsonl(output_dir: Path) -> list[Path]:
    """Finds all JSONL files under output_dir."""
    return list(output_dir.glob("**/raw/*.jsonl"))


class TestConvertDefaultAndADK:
    """Tests for default trace-format omission and explicit ADK format."""

    def test_default_trace_format_omitted_uses_adk(
        self, cli_runner: CliRunner, sample_adk_agent_dir: Path, tmp_path: Path
    ):
        """When --trace-format is omitted, default to ADK and read .adk/eval_history."""
        output_dir = tmp_path / "results_default"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_adk_agent_dir),
                "--output-dir",
                str(output_dir),
            ],
        )

        assert result.exit_code == 0
        assert "Converting Trace History (Format: adk)" in result.output
        assert "SUCCESS: Converted 1 interactions" in result.output

        # Verify output directory and file creation
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        output_file = output_files[0]
        assert output_file.name == "processed_interaction_sim.jsonl"
        assert output_file.parent.name == "raw"

        # Verify content of output file
        lines = output_file.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 1
        record = json.loads(lines[0])
        assert record["session_id"] == "sess_101"
        assert record["app_name"] == "weather_agent"
        assert record["final_response"] == "It is currently 65F and sunny in San Francisco."

    def test_explicit_trace_format_adk(
        self, cli_runner: CliRunner, sample_adk_agent_dir: Path, tmp_path: Path
    ):
        """When --trace-format adk is explicitly passed."""
        output_dir = tmp_path / "results_adk"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_adk_agent_dir),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                "adk",
            ],
        )

        assert result.exit_code == 0
        assert "SUCCESS: Converted 1 interactions" in result.output
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1

    def test_case_insensitive_adk_format(
        self, cli_runner: CliRunner, sample_adk_agent_dir: Path, tmp_path: Path
    ):
        """Case insensitive ADK format handling (e.g. 'ADK', ' adk ')."""
        output_dir = tmp_path / "results_adk_case"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_adk_agent_dir),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                " ADK ",
            ],
        )

        assert result.exit_code == 0
        assert "SUCCESS: Converted 1 interactions" in result.output

    def test_adk_with_questions_file(
        self, cli_runner: CliRunner, sample_adk_agent_dir: Path, tmp_path: Path
    ):
        """Verify merging reference data with --questions-file."""
        questions_file = tmp_path / "golden.jsonl"
        questions_file.write_text(
            json.dumps({"id": "case_101", "reference_data": {"ground_truth": "65F and sunny"}}) + "\n",
            encoding="utf-8",
        )

        output_dir = tmp_path / "results_questions"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_adk_agent_dir),
                "--questions-file",
                str(questions_file),
                "--output-dir",
                str(output_dir),
            ],
        )

        assert result.exit_code == 0
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        record = json.loads(output_files[0].read_text(encoding="utf-8").strip())
        assert record["reference_data"] == {"ground_truth": "65F and sunny"}


class TestConvertOpenInferenceAndDirectPaths:
    """Tests for direct JSON/JSONL file paths and OpenInference trace conversion."""

    def test_openinference_direct_jsonl_file(
        self, cli_runner: CliRunner, sample_openinference_jsonl: Path, tmp_path: Path
    ):
        """Pass direct .jsonl file path to --agent-dir without expecting .adk dir."""
        output_dir = tmp_path / "results_oi_jsonl"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_jsonl),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        assert "Converting Trace History (Format: openinference)" in result.output
        assert "SUCCESS: Converted 1 interactions" in result.output

        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        record = json.loads(output_files[0].read_text(encoding="utf-8").strip())
        assert record["session_id"] == "tr_openinf_01"
        assert len(record["turns"]) == 1
        events = record["turns"][0]["events"]
        tool_events = [e for e in events if e["event_type"] == "TOOL_CALL"]
        assert len(tool_events) == 1
        assert tool_events[0]["payload"]["tool_name"] == "search_db"
        assert tool_events[0]["payload"]["arguments"] == {"query": "Japan capital"}
        assert tool_events[0]["payload"]["result"] == {"capital": "Tokyo"}

    def test_openinference_direct_json_file(
        self, cli_runner: CliRunner, sample_openinference_json: Path, tmp_path: Path
    ):
        """Pass direct .json file path to --agent-dir with --trace-format openinference."""
        output_dir = tmp_path / "results_oi_json"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_json),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        assert "SUCCESS: Converted 1 interactions" in result.output

        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        record = json.loads(output_files[0].read_text(encoding="utf-8").strip())
        assert record["session_id"] == "tr_openinf_json"
        assert record["turns"][0]["events"][1]["payload"]["tool_name"] == "calc"

    def test_openinference_directory_globbing(
        self, cli_runner: CliRunner, tmp_path: Path
    ):
        """Pass directory path containing multiple .json and .jsonl trace files."""
        traces_dir = tmp_path / "multi_traces"
        traces_dir.mkdir()

        (traces_dir / "trace1.jsonl").write_text(
            json.dumps({"trace_id": "t1", "spans": [{"span_id": "s1", "attributes": {"openinference.span.kind": "LLM", "output.value": "Ans 1"}}]}) + "\n",
            encoding="utf-8",
        )
        (traces_dir / "trace2.json").write_text(
            json.dumps({"trace_id": "t2", "spans": [{"span_id": "s2", "attributes": {"openinference.span.kind": "LLM", "output.value": "Ans 2"}}]}),
            encoding="utf-8",
        )

        output_dir = tmp_path / "results_dir_glob"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(traces_dir),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        assert "SUCCESS: Converted 2 interactions" in result.output
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        lines = output_files[0].read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 2
        session_ids = [json.loads(line)["session_id"] for line in lines]
        assert "t1" in session_ids
        assert "t2" in session_ids


class TestFrameworkAliases:
    """Tests for all supported framework aliases."""

    @pytest.mark.parametrize(
        "format_alias",
        [
            "langgraph",
            "crewai",
            "otel",
            "llamaindex",
            "autogen",
            "LangGraph",
            "CrewAI",
            "OTEL",
            "LlamaIndex",
            "AutoGen",
        ],
    )
    def test_framework_aliases_supported(
        self,
        cli_runner: CliRunner,
        sample_openinference_jsonl: Path,
        tmp_path: Path,
        format_alias: str,
    ):
        """Verify each framework alias runs through OpenInferenceOTelConverter seamlessly."""
        output_dir = tmp_path / f"results_alias_{format_alias.lower()}"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_jsonl),
                "--output-dir",
                str(output_dir),
                "--trace-format",
                format_alias,
            ],
        )

        assert result.exit_code == 0
        assert f"Converting Trace History (Format: {format_alias})" in result.output
        assert "SUCCESS: Converted 1 interactions" in result.output


class TestOutputDirectoryAndFileHandling:
    """Tests for custom output directory, custom output filename, and extension normalization."""

    def test_custom_output_file_jsonl(
        self, cli_runner: CliRunner, sample_openinference_jsonl: Path, tmp_path: Path
    ):
        """Custom --output-file with .jsonl extension."""
        output_dir = tmp_path / "custom_out"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_jsonl),
                "--output-dir",
                str(output_dir),
                "--output-file",
                "my_custom_traces.jsonl",
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        assert output_files[0].name == "my_custom_traces.jsonl"

    def test_output_file_csv_extension_normalized_to_jsonl(
        self, cli_runner: CliRunner, sample_openinference_jsonl: Path, tmp_path: Path
    ):
        """When --output-file is provided as .csv, normalize to .jsonl."""
        output_dir = tmp_path / "csv_norm_out"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_jsonl),
                "--output-dir",
                str(output_dir),
                "--output-file",
                "eval_results.csv",
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        assert output_files[0].name == "eval_results.jsonl"

    def test_output_file_without_extension_appends_jsonl(
        self, cli_runner: CliRunner, sample_openinference_jsonl: Path, tmp_path: Path
    ):
        """When --output-file is provided without extension, append .jsonl."""
        output_dir = tmp_path / "no_ext_out"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(sample_openinference_jsonl),
                "--output-dir",
                str(output_dir),
                "--output-file",
                "custom_basename",
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 0
        output_files = _find_output_jsonl(output_dir)
        assert len(output_files) == 1
        assert output_files[0].name == "custom_basename.jsonl"


class TestErrorHandlingAndValidation:
    """Tests for invalid formats, missing arguments, non-existent directories."""

    def test_missing_agent_dir_validation_error_exit_code_2(
        self, cli_runner: CliRunner
    ):
        """Missing required --agent-dir option must exit with Click validation code 2."""
        result = cli_runner.invoke(convert, [])
        assert result.exit_code == 2
        assert "Missing option '--agent-dir'" in result.output

    def test_invalid_trace_format_error_exit_code_1(
        self, cli_runner: CliRunner, tmp_path: Path
    ):
        """Unsupported --trace-format must exit with code 1 and descriptive error message."""
        dummy_dir = tmp_path / "dummy"
        dummy_dir.mkdir()

        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(dummy_dir),
                "--trace-format",
                "unsupported_framework_xyz",
            ],
        )

        assert result.exit_code == 1
        assert "Error converting history:" in result.output
        normalized_output = " ".join(result.output.split())
        assert "Unsupported trace format type: 'unsupported_framework_xyz'" in normalized_output
        assert "openinference" in normalized_output
        assert "autogen" in normalized_output

    def test_missing_agent_dir_path_adk_exit_code_1(
        self, cli_runner: CliRunner, tmp_path: Path
    ):
        """Non-existent agent-dir path in ADK mode exits with code 1."""
        non_existent = tmp_path / "non_existent_adk_dir"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(non_existent),
                "--trace-format",
                "adk",
            ],
        )

        assert result.exit_code == 1
        assert "Error converting history:" in result.output
        assert "History directory not found" in result.output

    def test_missing_agent_dir_path_openinference_exit_code_1(
        self, cli_runner: CliRunner, tmp_path: Path
    ):
        """Non-existent agent-dir file in OpenInference mode exits with code 1."""
        non_existent = tmp_path / "missing_traces.jsonl"
        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(non_existent),
                "--trace-format",
                "openinference",
            ],
        )

        assert result.exit_code == 1
        assert "Error converting history:" in result.output
        assert "Trace file or directory not found" in result.output

    def test_empty_adk_history_directory(
        self, cli_runner: CliRunner, tmp_path: Path
    ):
        """When ADK history directory exists but contains no .json files."""
        agent_dir = tmp_path / "empty_agent"
        (agent_dir / ".adk" / "eval_history").mkdir(parents=True)

        result = cli_runner.invoke(
            convert,
            [
                "--agent-dir",
                str(agent_dir),
                "--trace-format",
                "adk",
            ],
        )

        assert result.exit_code == 0
        assert "No history found to convert." in result.output
