"""Contract C3: Framework-Agnostic TraceConverter Ingestion Bridge.

Provides a unified ingestion abstraction (BaseTraceConverter) that projects raw trace logs
from any agent framework (ADK, LangGraph, LlamaIndex, CrewAI, AutoGen) into canonical AgentData
via OpenInference / OpenTelemetry (OTel) semantic conventions.
"""

from __future__ import annotations

import contextlib
import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from agent_eval.core.schema import AgentData, AgentEvent, AgentTurn

logger = logging.getLogger(__name__)


class BaseTraceConverter(ABC):
    """Contract C3: Abstract protocol for projecting raw logs into canonical AgentData."""

    @abstractmethod
    def convert_to_agent_data(self, raw_trace: dict[str, Any]) -> AgentData:
        """Transform a framework-specific log/span payload into canonical AgentData.

        Args:
            raw_trace: Dictionary representing a raw conversation log or OTel trace.

        Returns:
            Canonical AgentData object containing session_id, turns, and events.
        """
        ...

    def convert_file(self, filepath: str | Path) -> list[AgentData]:
        """Load and convert all trace records from a JSON or JSONL file or directory.

        Args:
            filepath: Path to input JSON or JSONL file, or directory containing trace files.

        Returns:
            List of converted AgentData instances.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Trace file or directory not found: {path}")

        results: list[AgentData] = []
        if path.is_dir():
            # Glob all .json and .jsonl files in sorted order
            json_files = sorted(
                [
                    f
                    for f in path.iterdir()
                    if f.is_file() and f.suffix.lower() in (".json", ".jsonl")
                ]
            )
            for f in json_files:
                results.extend(self.convert_file(f))
            return results

        if path.suffix.lower() == ".jsonl":
            with path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        results.append(self.convert_to_agent_data(record))
                    except Exception as e:
                        logger.warning(f"Failed to convert JSONL line in {path}: {e}")
        else:
            with path.open("r", encoding="utf-8") as f:
                content = json.load(f)
            if isinstance(content, list):
                for item in content:
                    results.append(self.convert_to_agent_data(item))
            elif isinstance(content, dict):
                results.append(self.convert_to_agent_data(content))
        return results

    convert_path = convert_file


class ADKTraceConverter(BaseTraceConverter):
    """Converts native Google ADK session history logs into canonical AgentData."""

    def convert_to_agent_data(self, raw_trace: dict[str, Any]) -> AgentData:
        if not isinstance(raw_trace, dict):
            return AgentData(session_id="adk_session", turns=[], events=[])

        session_id = (
            raw_trace.get("session_id")
            or raw_trace.get("id")
            or raw_trace.get("eval_id")
            or "adk_session"
        )
        turns: list[AgentTurn] = []

        raw_turns = raw_trace.get("turns")
        if isinstance(raw_turns, list):
            for idx, turn_data in enumerate(raw_turns):
                if not isinstance(turn_data, dict):
                    continue
                events: list[AgentEvent] = []
                turn_events = turn_data.get("events")
                if isinstance(turn_events, list):
                    for ev in turn_events:
                        if not isinstance(ev, dict):
                            continue
                        events.append(
                            AgentEvent(
                                event_id=ev.get("id", f"ev_{idx}_{len(events)}"),
                                event_type=ev.get("type", "MODEL_INFERENCE"),
                                status=ev.get("status", "OK"),
                                payload=ev.get("payload")
                                if isinstance(ev.get("payload"), dict)
                                else {},
                                tool_calls=ev.get("tool_calls")
                                if isinstance(ev.get("tool_calls"), list)
                                else [],
                                tool_responses=ev.get("tool_responses")
                                if isinstance(ev.get("tool_responses"), list)
                                else [],
                                state_delta=ev.get("state_delta")
                                if isinstance(ev.get("state_delta"), dict)
                                else {},
                                author=ev.get(
                                    "author",
                                    "USER"
                                    if turn_data.get("role") == "user"
                                    else "model",
                                ),
                                content=ev.get("content", ""),
                            )
                        )

                turns.append(
                    AgentTurn(
                        turn_id=turn_data.get("turn_id", idx),
                        turn_index=idx,
                        role=turn_data.get("role", "model"),
                        content=turn_data.get("content", ""),
                        events=events,
                    )
                )

        top_events: list[AgentEvent] = []
        raw_top_events = raw_trace.get("events")
        if isinstance(raw_top_events, list):
            for ev in raw_top_events:
                if not isinstance(ev, dict):
                    continue
                top_events.append(
                    AgentEvent(
                        event_id=ev.get("id", f"ev_top_{len(top_events)}"),
                        event_type=ev.get("type", "MODEL_INFERENCE"),
                        status=ev.get("status", "OK"),
                        payload=ev.get("payload")
                        if isinstance(ev.get("payload"), dict)
                        else {},
                        tool_calls=ev.get("tool_calls")
                        if isinstance(ev.get("tool_calls"), list)
                        else [],
                        tool_responses=ev.get("tool_responses")
                        if isinstance(ev.get("tool_responses"), list)
                        else [],
                        state_delta=ev.get("state_delta")
                        if isinstance(ev.get("state_delta"), dict)
                        else {},
                        author=ev.get("author", "model"),
                        content=ev.get("content", ""),
                    )
                )

        return AgentData(session_id=str(session_id), turns=turns, events=top_events)


class OpenInferenceOTelConverter(BaseTraceConverter):
    """Converts CNCF OpenTelemetry / OpenInference OTLP GenAI spans into canonical AgentData.

    Compatible with LangGraph, LlamaIndex, CrewAI, AutoGen, and any OpenInference-compliant tracer.
    Standardizes on attributes like 'gen_ai.turn.index', 'openinference.span.kind',
    'tool.name', 'tool.parameters', and 'output.value'.
    """

    def convert_to_agent_data(self, raw_trace: dict[str, Any]) -> AgentData:
        if isinstance(raw_trace, list):
            spans: list[dict[str, Any]] = [s for s in raw_trace if isinstance(s, dict)]
            session_id = "otel_trace_session"
        elif isinstance(raw_trace, dict):
            raw_spans = raw_trace.get("spans")
            if raw_spans is None and "span_id" in raw_trace:
                spans = [raw_trace]
            elif isinstance(raw_spans, list):
                spans = [s for s in raw_spans if isinstance(s, dict)]
            else:
                spans = []
            session_id = (
                raw_trace.get("trace_id")
                or raw_trace.get("session_id")
                or (spans[0].get("trace_id") if spans else None)
                or "otel_trace_session"
            )
        else:
            spans = []
            session_id = "otel_trace_session"

        turns: list[AgentTurn] = []

        # Group OTel spans by conversation turn using gen_ai.turn.index attribute
        turn_groups: dict[int, list[dict[str, Any]]] = {}
        for span in spans:
            if not isinstance(span, dict):
                continue
            attrs = span.get("attributes")
            if not isinstance(attrs, dict):
                attrs = {}
            try:
                t_idx = int(attrs.get("gen_ai.turn.index", 0))
            except (ValueError, TypeError):
                t_idx = 0
            turn_groups.setdefault(t_idx, []).append(span)

        for t_idx in sorted(turn_groups.keys()):
            events: list[AgentEvent] = []
            turn_content = ""
            turn_role = "model"

            for span in turn_groups[t_idx]:
                if not isinstance(span, dict):
                    continue
                attrs = span.get("attributes")
                if not isinstance(attrs, dict):
                    attrs = {}

                span_kind = (
                    attrs.get("openinference.span.kind")
                    or attrs.get("span_kind")
                    or span.get("span_kind")
                    or "LLM"
                )
                span_kind_str = (
                    str(span_kind).upper() if span_kind is not None else "LLM"
                )

                # Determine error / OK status
                status_code = "OK"
                span_status = span.get("status")
                if isinstance(span_status, dict):
                    code = span_status.get("code") or span_status.get("status_code")
                    if code in ("ERROR", "STATUS_CODE_ERROR", 2):
                        status_code = "ERROR"
                elif span_status in ("ERROR", 2):
                    status_code = "ERROR"

                if span_kind_str in ("TOOL", "TOOL_CALL"):
                    # Extract tool parameters
                    tool_params = next(
                        (
                            attrs[k]
                            for k in (
                                "tool.parameters",
                                "tool.call.parameters",
                                "input.value",
                                "input_arguments",
                            )
                            if k in attrs and attrs[k] is not None
                        ),
                        {},
                    )
                    if isinstance(tool_params, str):
                        s_params = tool_params.strip()
                        if s_params.startswith(("{", "[")):
                            with contextlib.suppress(Exception):
                                tool_params = json.loads(s_params)

                    tool_result = next(
                        (
                            attrs[k]
                            for k in (
                                "tool.output",
                                "output.value",
                                "output_result",
                            )
                            if k in attrs and attrs[k] is not None
                        ),
                        "",
                    )
                    if isinstance(tool_result, str):
                        s_res = tool_result.strip()
                        if s_res.startswith(("{", "[")):
                            with contextlib.suppress(Exception):
                                tool_result = json.loads(s_res)

                    tool_name = (
                        attrs.get("tool.name")
                        or attrs.get("tool_name")
                        or span.get("name", "unknown_tool")
                    )

                    events.append(
                        AgentEvent(
                            event_id=span.get("span_id", f"span_{t_idx}_{len(events)}"),
                            event_type="TOOL_CALL",
                            status=status_code,
                            payload={
                                "tool_name": tool_name,
                                "arguments": tool_params,
                                "result": tool_result,
                                "input_arguments": tool_params,
                                "output_result": tool_result,
                            },
                            tool_calls=[
                                {
                                    "name": tool_name,
                                    "args": tool_params
                                    if isinstance(tool_params, dict)
                                    else {"input": tool_params},
                                }
                            ],
                            tool_responses=[
                                {
                                    "name": tool_name,
                                    "response": tool_result
                                    if isinstance(tool_result, dict)
                                    else {"output": tool_result},
                                }
                            ],
                        )
                    )
                elif span_kind_str in ("USER", "HUMAN"):
                    user_text = (
                        attrs.get("input.value")
                        or attrs.get("output.value")
                        or attrs.get("prompt")
                        or ""
                    )
                    if user_text:
                        turn_content = str(user_text)
                    turn_role = "user"
                    events.append(
                        AgentEvent(
                            event_id=span.get("span_id", f"span_{t_idx}_{len(events)}"),
                            event_type="USER_INPUT",
                            status=status_code,
                            author="USER",
                            content=turn_content,
                            payload={"content": turn_content},
                        )
                    )
                elif span_kind_str in ("LLM", "CHAIN", "AGENT", "TASK"):
                    output_val = (
                        attrs.get("output.value")
                        or attrs.get("gen_ai.completion")
                        or attrs.get("llm.output_messages")
                        or span.get("output")
                        or ""
                    )
                    if output_val:
                        turn_content = str(output_val)
                    llm_role = str(attrs.get("role", "model"))
                    if attrs.get("gen_ai.system") or attrs.get("role"):
                        turn_role = llm_role

                    events.append(
                        AgentEvent(
                            event_id=span.get("span_id", f"span_{t_idx}_{len(events)}"),
                            event_type="MODEL_INFERENCE",
                            status=status_code,
                            author=llm_role,
                            content=str(output_val) if output_val else "",
                            payload={
                                "content": str(output_val) if output_val else "",
                                "model": attrs.get("llm.model_name", ""),
                            },
                        )
                    )

            turns.append(
                AgentTurn(
                    turn_id=t_idx,
                    turn_index=t_idx,
                    role=turn_role,
                    content=turn_content,
                    events=events,
                )
            )

        return AgentData(session_id=str(session_id), turns=turns, events=[])


def get_trace_converter(format_type: str = "adk") -> BaseTraceConverter:
    """Factory method returning a configured BaseTraceConverter instance.

    Args:
        format_type: Format name ('adk', 'otel', 'openinference', 'langgraph',
          'llamaindex', 'crewai', 'autogen').

    Returns:
        Configured BaseTraceConverter instance.
    """
    format_lower = format_type.lower().strip()
    if format_lower in ("adk", "default"):
        return ADKTraceConverter()
    elif format_lower in (
        "otel",
        "openinference",
        "langgraph",
        "llamaindex",
        "crewai",
        "autogen",
    ):
        return OpenInferenceOTelConverter()
    else:
        raise ValueError(
            f"Unsupported trace format type: '{format_type}'. "
            f"Valid options are: 'adk', 'otel', 'openinference', 'langgraph', 'llamaindex', 'crewai', 'autogen'."
        )
