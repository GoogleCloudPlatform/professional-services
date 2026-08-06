"""Contract C3: Framework-Agnostic TraceConverter Ingestion Bridge.

Provides a unified ingestion abstraction (BaseTraceConverter) that projects raw trace logs
from any agent framework (ADK, LangGraph, LlamaIndex, CrewAI, AutoGen) into canonical AgentData
via OpenInference / OpenTelemetry (OTel) semantic conventions.
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent_eval.core.schema import AgentData, AgentEvent, AgentTurn

logger = logging.getLogger(__name__)


class BaseTraceConverter(ABC):
    """Contract C3: Abstract protocol for projecting raw logs into canonical AgentData."""

    @abstractmethod
    def convert_to_agent_data(self, raw_trace: Dict[str, Any]) -> AgentData:
        """Transform a framework-specific log/span payload into canonical AgentData.

        Args:
            raw_trace: Dictionary representing a raw conversation log or OTel trace.

        Returns:
            Canonical AgentData object containing session_id, turns, and events.
        """
        ...

    def convert_file(self, filepath: str | Path) -> List[AgentData]:
        """Load and convert all trace records from a JSON or JSONL file.

        Args:
            filepath: Path to input JSON or JSONL file.

        Returns:
            List of converted AgentData instances.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Trace file not found: {path}")

        results: List[AgentData] = []
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


class ADKTraceConverter(BaseTraceConverter):
    """Converts native Google ADK session history logs into canonical AgentData."""

    def convert_to_agent_data(self, raw_trace: Dict[str, Any]) -> AgentData:
        session_id = raw_trace.get("session_id") or raw_trace.get("id", "adk_session")
        turns: List[AgentTurn] = []

        raw_turns = raw_trace.get("turns", [])
        for idx, turn_data in enumerate(raw_turns):
            events: List[AgentEvent] = []
            for ev in turn_data.get("events", []):
                events.append(
                    AgentEvent(
                        event_id=ev.get("id", f"ev_{idx}_{len(events)}"),
                        event_type=ev.get("type", "MODEL_INFERENCE"),
                        status=ev.get("status", "OK"),
                        payload=ev.get("payload", {}),
                    )
                )

            turns.append(
                AgentTurn(
                    turn_index=idx,
                    role=turn_data.get("role", "model"),
                    content=turn_data.get("content", ""),
                    events=events,
                )
            )

        return AgentData(session_id=str(session_id), turns=turns, events=[])


class OpenInferenceOTelConverter(BaseTraceConverter):
    """Converts CNCF OpenTelemetry / OpenInference OTLP GenAI spans into canonical AgentData.

    Compatible with LangGraph, LlamaIndex, CrewAI, and any OpenInference-compliant tracer.
    Standardizes on attributes like 'gen_ai.turn.index', 'openinference.span.kind',
    'tool.name', 'tool.parameters', and 'output.value'.
    """

    def convert_to_agent_data(self, raw_trace: Dict[str, Any]) -> AgentData:
        spans: List[Dict[str, Any]] = raw_trace.get("spans", [])
        session_id = (
            raw_trace.get("trace_id")
            or raw_trace.get("session_id")
            or "otel_trace_session"
        )
        turns: List[AgentTurn] = []

        # Group OTel spans by conversation turn using gen_ai.turn.index attribute
        turn_groups: Dict[int, List[Dict[str, Any]]] = {}
        for span in spans:
            attrs = span.get("attributes", {})
            try:
                t_idx = int(attrs.get("gen_ai.turn.index", 0))
            except (ValueError, TypeError):
                t_idx = 0
            turn_groups.setdefault(t_idx, []).append(span)

        for t_idx in sorted(turn_groups.keys()):
            events: List[AgentEvent] = []
            turn_content = ""
            turn_role = "model"

            for span in turn_groups[t_idx]:
                attrs = span.get("attributes", {})
                span_kind = (
                    attrs.get("openinference.span.kind")
                    or attrs.get("span_kind")
                    or "LLM"
                )

                if span_kind.upper() == "TOOL":
                    status_code = "OK"
                    span_status = span.get("status", {})
                    if isinstance(span_status, dict):
                        if span_status.get("code") == "ERROR":
                            status_code = "ERROR"
                    elif span_status == "ERROR":
                        status_code = "ERROR"

                    events.append(
                        AgentEvent(
                            event_id=span.get("span_id", f"span_{t_idx}_{len(events)}"),
                            event_type="TOOL_CALL",
                            status=status_code,
                            payload={
                                "tool_name": attrs.get("tool.name", "unknown_tool"),
                                "arguments": attrs.get("tool.parameters", {}),
                                "result": attrs.get("tool.output", ""),
                            },
                        )
                    )
                elif span_kind.upper() in ("LLM", "CHAIN", "AGENT"):
                    output_val = (
                        attrs.get("output.value")
                        or attrs.get("gen_ai.completion")
                        or ""
                    )
                    if output_val:
                        turn_content = str(output_val)
                    if attrs.get("gen_ai.system") or attrs.get("role"):
                        turn_role = str(attrs.get("role", "model"))

            turns.append(
                AgentTurn(
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
          'llamaindex', 'crewai').

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
            f"Valid options are: 'adk', 'otel', 'openinference', 'langgraph', 'llamaindex', 'crewai'."
        )
