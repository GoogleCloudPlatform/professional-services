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
"""Unit tests for deterministic metrics."""

from __future__ import annotations

import json

import pytest

from agent_eval.core.deterministic_metrics import (
    calculate_agent_handoffs,
    calculate_cache_efficiency,
    calculate_context_saturation,
    calculate_grounding_utilization,
    calculate_latency_metrics,
    calculate_output_density,
    calculate_sandbox_usage,
    calculate_thinking_metrics,
    calculate_token_usage,
    calculate_tool_success_rate,
    calculate_tool_utilization,
    evaluate_deterministic_metrics,
)


def test_calculate_token_usage_success():
    """Verify token usage and cost calculation for known Gemini models."""
    # Trace containing 1 Gemini 3.1 Pro call and 1 Gemini 3.1 Flash Lite call
    mock_trace = [
        {
            "name": "call_llm",
            "attributes": {
                "gen_ai.request.model": "gemini-3.1-pro",
                "gcp.vertex.agent.llm_response": json.dumps(
                    {
                        "usage_metadata": {
                            "prompt_token_count": 1000,
                            "candidates_token_count": 500,
                            "cached_content_token_count": 200,
                            "total_token_count": 1500,
                        }
                    }
                ),
            },
        },
        {
            "name": "call_llm",
            "attributes": {
                "gen_ai.request.model": "gemini-3.1-flash-lite",
                "gcp.vertex.agent.llm_response": {  # Already parsed dict
                    "usage_metadata": {
                        "prompt_token_count": 2000,
                        "candidates_token_count": 1000,
                        "cached_content_token_count": 0,
                        "total_token_count": 3000,
                    }
                },
            },
        },
    ]

    cost, explanation, details = calculate_token_usage(mock_trace)

    # Gemini 3.1 Pro pricing: $2.00/1M prompt, $12.00/1M output
    # Cost = (1000/1000 * 0.002) + (500/1000 * 0.012) = 0.002 + 0.006 = 0.008
    # Gemini 3.1 Flash Lite pricing: $0.25/1M prompt, $1.50/1M output
    # Cost = (2000/1000 * 0.00025) + (1000/1000 * 0.0015) = 0.0005 + 0.0015 = 0.002
    # Total Cost = 0.008 + 0.002 = 0.010
    assert cost == pytest.approx(0.010)
    assert details["llm_calls"] == 2
    assert "gemini-3.1-pro" in details["models_used"]
    assert "gemini-3.1-flash-lite" in details["models_used"]
    assert details["total_tokens"] == 4500
    assert details["prompt_tokens"] == 3000
    assert details["completion_tokens"] == 1500
    assert details["cached_tokens"] == 200
    assert "Cost: $0.010000" in explanation


def test_calculate_token_usage_empty_and_errors():
    """Verify fallback behavior under empty traces or malformed metadata."""
    # 1. Empty trace
    cost, explanation, details = calculate_token_usage([])
    assert cost == 0.0
    assert "No trace data available" in explanation
    assert details == {}

    # 2. Malformed JSON
    mock_trace = [
        {
            "name": "call_llm",
            "attributes": {
                "gen_ai.request.model": "gemini-3.1-pro",
                "gcp.vertex.agent.llm_response": "invalid json",
            },
        }
    ]
    cost, explanation, details = calculate_token_usage(mock_trace)
    assert cost == 0.0
    assert details["llm_calls"] == 0


def test_calculate_latency_metrics():
    """Verify total, turn, first token, and component latency calculations."""
    # Spans in nanoseconds. Root start: 0, LLM call: 1s duration. Tool call: 2s.
    mock_trace = [
        {"name": "root", "start_time": 0, "end_time": 5_000_000_000},
        {"name": "call_llm", "start_time": 1_000_000_000, "end_time": 2_000_000_000},
        {
            "name": "execute_tool write_file",
            "start_time": 2_500_000_000,
            "end_time": 4_500_000_000,
        },
    ]

    # Latency summary data from turns (excluding user think time)
    mock_latency_data = [
        {"name": "invocation", "duration_seconds": 1.5},
        {"name": "invocation", "duration_seconds": 2.5},
    ]

    score, _explanation, details = calculate_latency_metrics(
        mock_trace, mock_latency_data
    )

    # Score should equal sum of turn latencies if latency_data is provided
    assert score == 4.0  # 1.5 + 2.5
    assert details["total_latency_seconds"] == 4.0
    assert details["average_turn_latency_seconds"] == 2.0
    assert details["llm_latency_seconds"] == 1.0  # (2 - 1)s
    assert details["tool_latency_seconds"] == 2.0  # (4.5 - 2.5)s
    assert (
        details["time_to_first_response_seconds"] == 2.0
    )  # First LLM end - root start = 2.0s


def test_calculate_latency_metrics_fallbacks():
    """Verify wall-clock duration fallback when turn latency data is absent."""
    mock_trace = [
        {"name": "root", "start_time": 10_000_000_000, "end_time": 15_000_000_000},
    ]

    # No latency_data provided -> falls back to trace wall-clock duration
    score, _, details = calculate_latency_metrics(mock_trace, None)
    assert score == 5.0  # (15 - 10)s
    assert details["total_latency_seconds"] == 5.0
    assert details["average_turn_latency_seconds"] == 0.0

    # No timestamps in trace
    score, explanation, details = calculate_latency_metrics([{"name": "root"}], None)
    assert score == 0.0
    assert "no timestamps" in explanation


def test_calculate_cache_efficiency():
    """Verify cache hit rate calculation."""
    mock_trace = [
        {
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {
                        "prompt_token_count": 300,
                        "cached_content_token_count": 700,
                    }
                }
            }
        }
    ]

    score, explanation, details = calculate_cache_efficiency(mock_trace)

    # Hit rate = 700 / (300 + 700) = 0.70 (70%)
    assert score == 0.70
    assert details["cache_hit_rate"] == 0.70
    assert details["total_cached_tokens"] == 700
    assert details["total_fresh_prompt_tokens"] == 300
    assert "Cache Hit Rate: 70.00%" in explanation


def test_calculate_thinking_metrics():
    """Verify model reasoning ratio calculation."""
    mock_trace = [
        {
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {
                        "thoughts_token_count": 400,
                        "candidates_token_count": 600,
                    }
                }
            }
        }
    ]

    score, explanation, details = calculate_thinking_metrics(mock_trace)

    # Reasoning ratio = 400 / (400 + 600) = 0.40 (40%)
    assert score == 0.40
    assert details["reasoning_ratio"] == 0.40
    assert details["total_thinking_tokens"] == 400
    assert details["total_candidate_tokens"] == 600
    assert "Reasoning Ratio: 40.00%" in explanation


def test_calculate_tool_utilization():
    """Verify tool execution count and unique tool breakdown."""
    mock_trace = [
        {"name": "execute_tool search_web"},
        {"name": "execute_tool read_file"},
        {"name": "execute_tool search_web"},
        {
            "name": "generic_tool_call",
            "attributes": {"gen_ai.tool.name": "custom_api"},
        },
    ]

    score, explanation, details = calculate_tool_utilization(mock_trace)

    assert score == 4.0
    assert details["total_tool_calls"] == 4
    assert details["unique_tools_used"] == 3
    assert details["tool_counts"]["search_web"] == 2
    assert details["tool_counts"]["read_file"] == 1
    assert details["tool_counts"]["custom_api"] == 1
    assert "search_web: 2" in explanation


def test_calculate_tool_success_rate():
    """Verify tool success/failure rate calculations."""
    mock_trace = [
        {
            "name": "execute_tool read_file",
            "attributes": {
                "gcp.vertex.agent.tool_response": json.dumps(
                    {"content": "file contents"}
                )
            },
        },
        {
            "name": "execute_tool save_artifact",
            "attributes": {
                "gcp.vertex.agent.tool_response": json.dumps(
                    {"status": "error", "message": "disk full"}
                )
            },
        },
        {
            "name": "execute_tool run_command",
            "attributes": {
                "gcp.vertex.agent.tool_response": json.dumps(
                    {"error": "command not found"}
                )
            },
        },
    ]

    score, _explanation, details = calculate_tool_success_rate(mock_trace)

    # 3 total tool calls, 2 errors (save_artifact and run_command) -> Success rate = 1/3 = 33.33%
    assert score == pytest.approx(1 / 3)
    assert details["total_tool_calls"] == 3
    assert details["failed_tool_calls"] == 2
    assert "save_artifact" in details["failed_tools_list"]
    assert "run_command" in details["failed_tools_list"]

    # Test empty trace (returns 0.0 due to early exit)
    score_empty, _, _ = calculate_tool_success_rate([])
    assert score_empty == 0.0

    # Test non-empty trace with no tool calls (returns 1.0 default)
    score_no_tools, _, _ = calculate_tool_success_rate([{"name": "root"}])
    assert score_no_tools == 1.0


def test_calculate_grounding_utilization():
    """Verify grounding metadata citation chunk counting."""
    mock_trace = [
        {
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "candidates": [
                        {
                            "grounding_metadata": {
                                "grounding_chunks": [
                                    {"web": {"uri": "http://google.com"}},
                                    {"web": {"uri": "http://wikipedia.org"}},
                                ]
                            }
                        }
                    ]
                }
            }
        }
    ]

    score, _explanation, details = calculate_grounding_utilization(mock_trace)

    assert score == 2.0
    assert details["total_grounding_chunks"] == 2
    assert details["total_grounded_responses"] == 1


def test_calculate_context_saturation():
    """Verify tracking of maximum context saturation across turns."""
    mock_trace = [
        {
            "name": "turn_1",
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {"total_token_count": 800}
                }
            },
        },
        {
            "name": "turn_2",
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {"total_token_count": 2500}
                }
            },
        },
        {
            "name": "turn_3",
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {"total_token_count": 1200}
                }
            },
        },
    ]

    score, _explanation, details = calculate_context_saturation(mock_trace)

    assert score == 2500.0
    assert details["max_total_tokens"] == 2500
    assert details["peak_usage_span"] == "turn_2"


def test_calculate_agent_handoffs():
    """Verify counting of agent handoffs and sub-agent invocations."""
    mock_trace = [
        {"name": "invoke_agent SupportAgent"},
        {"name": "execute_tool BillingAgent"},
        {"name": "execute_tool search_web"},  # Not an agent
    ]

    score, _explanation, details = calculate_agent_handoffs(mock_trace)

    assert score == 2.0
    assert details["total_handoffs"] == 2
    assert "SupportAgent" in details["agents_invoked_list"]
    assert "BillingAgent" in details["agents_invoked_list"]


def test_calculate_output_density():
    """Verify average output token density calculation."""
    mock_trace = [
        {
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {"candidates_token_count": 150}
                }
            }
        },
        {
            "attributes": {
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {"candidates_token_count": 250}
                }
            }
        },
    ]

    score, _explanation, details = calculate_output_density(mock_trace)

    # Average density = (150 + 250) / 2 = 200.0
    assert score == 200.0
    assert details["average_output_tokens"] == 200.0
    assert details["llm_calls_count"] == 2


def test_calculate_sandbox_usage():
    """Verify sandbox and file system tool usage tracking."""
    mock_trace = [
        {"name": "execute_tool write_file"},
        {"name": "execute_tool run_python_script"},
        {"name": "execute_tool search_web"},  # Non-sandbox
    ]

    score, _explanation, details = calculate_sandbox_usage(mock_trace)

    assert score == 2.0
    assert details["total_sandbox_ops"] == 2
    assert details["unique_ops_used"] == 2
    assert "write_file" in details["sandbox_tools_used"]
    assert "run_python_script" in details["sandbox_tools_used"]


def test_evaluate_deterministic_metrics_registry():
    """Verify the orchestrator executes and aggregates all metrics."""
    mock_trace = [
        {
            "name": "call_llm",
            "attributes": {
                "gen_ai.request.model": "gemini-3.1-pro",
                "gcp.vertex.agent.llm_response": {
                    "usage_metadata": {
                        "prompt_token_count": 100,
                        "candidates_token_count": 50,
                        "total_token_count": 150,
                    }
                },
            },
        }
    ]

    results = evaluate_deterministic_metrics(
        session_state={},
        session_trace=mock_trace,
        agents_evaluated=["my_agent"],
        question_metadata={},
        metrics_to_run=["token_usage", "context_saturation"],
    )

    # Assert correct execution of both selected metrics
    assert "token_usage" in results
    assert "context_saturation" in results
    assert results["token_usage"]["score"] > 0.0
    assert results["context_saturation"]["score"] == 150.0

    # Unselected metrics should not be in the output dict
    assert "latency_metrics" not in results
