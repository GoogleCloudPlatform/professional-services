"""Contract C3: Framework-Agnostic TraceConverter Ingestion Bridge.

Provides a unified ingestion abstraction (BaseTraceConverter) that projects raw trace logs
from any agent framework (ADK, LangGraph, LlamaIndex, CrewAI, AutoGen) into canonical AgentData
via OpenInference / OpenTelemetry (OTel) semantic conventions.
"""

from __future__ import annotations

import contextlib
import json
import logging
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from agent_eval.core.schema import AgentData, AgentEvent, AgentTurn

logger = logging.getLogger(__name__)


class BaseTraceConverter(ABC):
    """Contract C3: Abstract protocol for projecting raw logs into canonical AgentData."""

    def __init__(self, questions_file: str | Path | None = None) -> None:
        self.questions_file = questions_file
        self.golden_map: dict[str, dict[str, Any]] = (
            self._load_golden_map(questions_file) if questions_file else {}
        )

    def _load_golden_map(self, filepath: str | Path) -> dict[str, dict[str, Any]]:
        """Loads Golden Dataset to merge reference data based on ID or prompt."""
        mapping: dict[str, dict[str, Any]] = {}
        path = Path(filepath)
        if not path.exists():
            return mapping
        try:
            if path.suffix.lower() == ".jsonl":
                from agent_eval.core.dataset_io import read_dataset

                rows = read_dataset(str(path))
                for r in rows:
                    if isinstance(r, dict):
                        if "id" in r:
                            mapping[str(r["id"])] = r
                        if "question_id" in r:
                            mapping[str(r["question_id"])] = r
                        if "session_id" in r:
                            mapping[str(r["session_id"])] = r
            else:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    questions = (
                        data.get("questions")
                        or data.get("golden_questions", [])
                        if isinstance(data, dict)
                        else data
                    )
                    if isinstance(questions, list):
                        for q in questions:
                            if isinstance(q, dict):
                                if "id" in q:
                                    mapping[str(q["id"])] = q
                                if "question_id" in q:
                                    mapping[str(q["question_id"])] = q
                                if "session_id" in q:
                                    mapping[str(q["session_id"])] = q
        except Exception as e:
            logger.warning(f"Could not load golden dataset from {filepath}: {e}")
        return mapping

    def _merge_golden_data(self, agent_data: AgentData) -> AgentData:
        """Enriches AgentData with reference_data and metadata from golden dataset."""
        if not self.golden_map:
            return agent_data

        match: dict[str, Any] | None = None
        # 1. Match by session_id / question_id
        if agent_data.session_id in self.golden_map:
            match = self.golden_map[agent_data.session_id]
        else:
            # 2. Match by prompt or first user input
            first_user_input = ""
            for turn in agent_data.turns:
                if turn.role in ("user", "human") and turn.content:
                    first_user_input = turn.content.strip()
                    break
            if not first_user_input and getattr(agent_data, "prompt", None):
                first_user_input = str(agent_data.prompt).strip()

            if first_user_input:
                for q in self.golden_map.values():
                    q_prompt = (
                        q.get("prompt")
                        or q.get("starting_prompt")
                        or q.get("input")
                        or ""
                    )
                    if isinstance(q_prompt, str) and q_prompt.strip() == first_user_input:
                        match = q
                        break

        if match:
            if "reference_data" in match and not getattr(agent_data, "reference_data", None):
                agent_data.reference_data = match["reference_data"]
            if "metadata" in match and not getattr(agent_data, "metadata", None):
                agent_data.metadata = match["metadata"]
            if "id" in match and not getattr(agent_data, "question_id", None):
                agent_data.question_id = str(match["id"])

        return agent_data

    @abstractmethod
    def convert_to_agent_data(self, raw_trace: dict[str, Any]) -> AgentData:
        """Transform a framework-specific log/span payload into canonical AgentData.

        Args:
            raw_trace: Dictionary representing a raw conversation log or OTel trace.

        Returns:
            Canonical AgentData object containing session_id, turns, and events.
        """
        ...

    def convert_file(
        self,
        filepath: str | Path,
        questions_file: str | Path | None = None,
    ) -> list[AgentData]:
        """Load and convert all trace records from a JSON or JSONL file or directory.

        Args:
            filepath: Path to input JSON or JSONL file, or directory containing trace files.
            questions_file: Optional path to golden questions file to merge reference data.

        Returns:
            List of converted AgentData instances.
        """
        if questions_file and not self.golden_map:
            self.golden_map = self._load_golden_map(questions_file)

        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(
                f"Trace file or directory not found: {path}")

        results: list[AgentData] = []
        if path.is_dir():
            # Glob all .json and .jsonl files in sorted order
            json_files = sorted([
                f for f in path.iterdir()
                if f.is_file() and f.suffix.lower() in (".json", ".jsonl")
            ])
            for f in json_files:
                results.extend(self.convert_file(f, questions_file=questions_file))
            return results

        if path.suffix.lower() == ".jsonl":
            with path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        ad = self.convert_to_agent_data(record)
                        ad = self._merge_golden_data(ad)
                        results.append(ad)
                    except Exception as e:
                        logger.warning(
                            f"Failed to convert JSONL line in {path}: {e}")
        else:
            with path.open("r", encoding="utf-8") as f:
                content = json.load(f)
            if isinstance(content, list):
                for item in content:
                    ad = self.convert_to_agent_data(item)
                    ad = self._merge_golden_data(ad)
                    results.append(ad)
            elif isinstance(content, dict):
                ad = self.convert_to_agent_data(content)
                ad = self._merge_golden_data(ad)
                results.append(ad)
        return results

    convert_path = convert_file


class ADKTraceConverter(BaseTraceConverter):
    """Converts native Google ADK session history logs into canonical AgentData."""

    def convert_to_agent_data(self, raw_trace: dict[str, Any]) -> AgentData:
        if not isinstance(raw_trace, dict):
            return AgentData(session_id="adk_session", turns=[], events=[])

        session_id = (raw_trace.get("session_id") or raw_trace.get("id") or
                      raw_trace.get("eval_id") or "adk_session")
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
                                event_id=ev.get("id",
                                                f"ev_{idx}_{len(events)}"),
                                event_type=ev.get("type", "MODEL_INFERENCE"),
                                status=ev.get("status", "OK"),
                                payload=ev.get("payload") if isinstance(
                                    ev.get("payload"), dict) else {},
                                tool_calls=ev.get("tool_calls") if isinstance(
                                    ev.get("tool_calls"), list) else [],
                                tool_responses=ev.get("tool_responses")
                                if isinstance(ev.get("tool_responses"), list)
                                else [],
                                state_delta=ev.get("state_delta") if isinstance(
                                    ev.get("state_delta"), dict) else {},
                                author=ev.get(
                                    "author",
                                    "USER" if turn_data.get("role") == "user"
                                    else "model",
                                ),
                                content=ev.get("content", ""),
                            ))

                turns.append(
                    AgentTurn(
                        turn_id=turn_data.get("turn_id", idx),
                        turn_index=idx,
                        role=turn_data.get("role", "model"),
                        content=turn_data.get("content", ""),
                        events=events,
                    ))

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
                        payload=ev.get("payload") if isinstance(
                            ev.get("payload"), dict) else {},
                        tool_calls=ev.get("tool_calls") if isinstance(
                            ev.get("tool_calls"), list) else [],
                        tool_responses=ev.get("tool_responses") if isinstance(
                            ev.get("tool_responses"), list) else [],
                        state_delta=ev.get("state_delta") if isinstance(
                            ev.get("state_delta"), dict) else {},
                        author=ev.get("author", "model"),
                        content=ev.get("content", ""),
                    ))

        return AgentData(session_id=str(session_id),
                         turns=turns,
                         events=top_events)


class OpenInferenceOTelConverter(BaseTraceConverter):
    """Converts CNCF OpenTelemetry / OpenInference OTLP GenAI spans into canonical AgentData.

    Compatible with LangGraph, LlamaIndex, CrewAI, AutoGen, and any OpenInference-compliant tracer.
    Standardizes on attributes like 'gen_ai.turn.index', 'openinference.span.kind',
    'tool.name', 'tool.parameters', and 'output.value'.
    """

    def _normalize_span(self, span: dict[str, Any]) -> dict[str, Any]:
        """Normalize span dict to standard shape with dictionary attributes."""
        norm = dict(span)
        attrs = norm.get("attributes")
        if isinstance(attrs, list):
            # OTLP protobuf style key/value pairs
            attr_dict = {}
            for item in attrs:
                if isinstance(item, dict) and "key" in item:
                    val = item.get("value")
                    if isinstance(val, dict):
                        # extract stringValue, intValue, boolValue, etc.
                        val = next(iter(val.values())) if val else None
                    attr_dict[item["key"]] = val
            norm["attributes"] = attr_dict
        elif not isinstance(attrs, dict):
            norm["attributes"] = {}
        return norm

    def convert_to_agent_data(self, raw_trace: dict[str, Any] | list[Any]) -> AgentData:
        if isinstance(raw_trace, list):
            spans = [
                self._normalize_span(s) for s in raw_trace if isinstance(s, dict)
            ]
            session_id = "otel_trace_session"
        elif isinstance(raw_trace, dict):
            raw_spans = raw_trace.get("spans")
            if raw_spans is None and ("span_id" in raw_trace or "name" in raw_trace):
                spans = [self._normalize_span(raw_trace)]
            elif isinstance(raw_spans, list):
                spans = [
                    self._normalize_span(s) for s in raw_spans if isinstance(s, dict)
                ]
            else:
                # Check for OTLP resourceSpans
                resource_spans = raw_trace.get("resourceSpans")
                if isinstance(resource_spans, list):
                    spans = []
                    for rs in resource_spans:
                        for ss in rs.get("scopeSpans", []):
                            for sp in ss.get("spans", []):
                                if isinstance(sp, dict):
                                    spans.append(self._normalize_span(sp))
                else:
                    spans = []

            session_id = (
                raw_trace.get("trace_id")
                or raw_trace.get("session_id")
                or raw_trace.get("run_id")
                or (spans[0].get("attributes", {}).get("session_id") if spans else None)
                or (spans[0].get("attributes", {}).get("openinference.session.id") if spans else None)
                or (spans[0].get("attributes", {}).get("traceloop.session.id") if spans else None)
                or (spans[0].get("attributes", {}).get("session.id") if spans else None)
                or (spans[0].get("attributes", {}).get("run_id") if spans else None)
                or (spans[0].get("attributes", {}).get("conversation_id") if spans else None)
                or (spans[0].get("trace_id") if spans else None)
                or "otel_trace_session"
            )
        else:
            spans = []
            session_id = "otel_trace_session"

        # Check if session_id is present inside any span's attributes
        for s in spans:
            s_attrs = s.get("attributes", {})
            for sid_key in (
                "session_id",
                "openinference.session.id",
                "traceloop.session.id",
                "session.id",
                "run_id",
                "conversation_id",
            ):
                if s_attrs.get(sid_key):
                    session_id = str(s_attrs[sid_key])
                    break
            if session_id != "otel_trace_session":
                break

        # Check if explicit gen_ai.turn.index is provided on any span
        has_explicit_turn_index = any(
            "gen_ai.turn.index" in s.get("attributes", {}) for s in spans
        )

        turns: list[AgentTurn] = []

        if has_explicit_turn_index:
            # Group OTel spans by conversation turn using gen_ai.turn.index attribute
            turn_groups: dict[int, list[dict[str, Any]]] = {}
            for span in spans:
                attrs = span.get("attributes", {})
                try:
                    t_idx = int(attrs.get("gen_ai.turn.index", 0))
                except (ValueError, TypeError):
                    t_idx = 0
                turn_groups.setdefault(t_idx, []).append(span)

            for t_idx in sorted(turn_groups.keys()):
                events, turn_content, turn_role = self._process_span_group(
                    turn_groups[t_idx], t_idx
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
        else:
            # Reconstruct turns from hierarchy and timestamps (LangGraph / OpenInference default)
            turns = self._reconstruct_hierarchical_turns(spans)

        agent_data = AgentData(session_id=str(session_id), turns=turns, events=[])
        # Attach raw spans to session_trace for deterministic metrics
        agent_data.session_trace = spans
        return agent_data

    def _process_span_group(
        self,
        group_spans: list[dict[str, Any]],
        turn_index: int,
    ) -> tuple[list[AgentEvent], str, str]:
        """Process a list of spans within a turn into events, content, and role."""
        events: list[AgentEvent] = []
        turn_content = ""
        turn_role = "model"

        for span in group_spans:
            attrs = span.get("attributes", {})
            span_kind = (
                attrs.get("openinference.span.kind")
                or attrs.get("span_kind")
                or span.get("span_kind")
                or "LLM"
            )
            span_kind_str = str(span_kind).upper() if span_kind is not None else "LLM"

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

                raw_name = (
                    attrs.get("tool.name")
                    or attrs.get("tool_name")
                    or span.get("name", "unknown_tool")
                )
                tool_name = raw_name[5:] if raw_name.startswith("tool.") else raw_name

                events.append(
                    AgentEvent(
                        event_id=span.get("span_id", f"span_{turn_index}_{len(events)}"),
                        event_type="TOOL_CALL",
                        status=status_code,
                        payload={
                            "tool_name": tool_name,
                            "arguments": tool_params,
                            "result": tool_result,
                            "input_arguments": tool_params,
                            "output_result": tool_result,
                        },
                        tool_calls=[{
                            "name": tool_name,
                            "args": (
                                tool_params
                                if isinstance(tool_params, dict)
                                else {"input": tool_params}
                            ),
                        }],
                        tool_responses=[{
                            "name": tool_name,
                            "response": (
                                tool_result
                                if isinstance(tool_result, dict)
                                else {"output": tool_result}
                            ),
                        }],
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
                        event_id=span.get("span_id", f"span_{turn_index}_{len(events)}"),
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
                        event_id=span.get("span_id", f"span_{turn_index}_{len(events)}"),
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

        return events, turn_content, turn_role

    def _reconstruct_hierarchical_turns(
        self,
        spans: list[dict[str, Any]],
    ) -> list[AgentTurn]:
        """Reconstruct conversation turns from hierarchical OpenInference / LangGraph traces."""
        if not spans:
            return []

        # Sort spans chronologically if start_time is available
        sorted_spans = sorted(
            spans,
            key=lambda s: (
                s.get("start_time")
                if s.get("start_time") is not None
                else 0
            ),
        )

        # Check if there are multiple USER spans
        user_spans = [
            s for s in sorted_spans
            if str(s.get("attributes", {}).get("openinference.span.kind", "")).upper() in ("USER", "HUMAN")
        ]

        # If multiple user spans exist, partition by user spans
        if len(user_spans) > 1:
            turns: list[AgentTurn] = []
            cur_group: list[dict[str, Any]] = []
            t_idx = 0
            for s in sorted_spans:
                kind = str(s.get("attributes", {}).get("openinference.span.kind", "")).upper()
                if kind in ("USER", "HUMAN") and cur_group:
                    events, content, role = self._process_span_group(cur_group, t_idx)
                    turns.append(
                        AgentTurn(
                            turn_id=t_idx,
                            turn_index=t_idx,
                            role=role,
                            content=content,
                            events=events,
                        )
                    )
                    t_idx += 1
                    cur_group = [s]
                else:
                    cur_group.append(s)
            if cur_group:
                events, content, role = self._process_span_group(cur_group, t_idx)
                turns.append(
                    AgentTurn(
                        turn_id=t_idx,
                        turn_index=t_idx,
                        role=role,
                        content=content,
                        events=events,
                    )
                )
            return turns

        # Single execution graph (e.g. LangGraph agent run on repo/input)
        # Find root span (AGENT or CHAIN without parent, or highest level span)
        root_span = None
        for s in sorted_spans:
            parent_id = s.get("parent_id") or s.get("parent_span_id")
            if parent_id is None:
                root_span = s
                break
        if root_span is None and sorted_spans:
            root_span = sorted_spans[0]

        root_attrs = root_span.get("attributes", {}) if root_span else {}

        # Extract prompt from root input or USER span
        prompt_text = (
            root_attrs.get("input.value")
            or root_attrs.get("prompt")
            or (user_spans[0].get("attributes", {}).get("input.value") if user_spans else "")
            or ""
        )

        # Extract final response from root output or last LLM output
        final_response_text = root_attrs.get("output.value") or ""
        if not final_response_text:
            for s in reversed(sorted_spans):
                s_out = s.get("attributes", {}).get("output.value")
                if s_out:
                    final_response_text = str(s_out)
                    break

        # Process all spans into events
        events: list[AgentEvent] = []
        for span in sorted_spans:
            attrs = span.get("attributes", {})
            span_kind = (
                attrs.get("openinference.span.kind")
                or attrs.get("span_kind")
                or span.get("span_kind")
                or "LLM"
            )
            span_kind_str = str(span_kind).upper() if span_kind is not None else "LLM"

            status_code = "OK"
            span_status = span.get("status")
            if isinstance(span_status, dict):
                code = span_status.get("code") or span_status.get("status_code")
                if code in ("ERROR", "STATUS_CODE_ERROR", 2):
                    status_code = "ERROR"
            elif span_status in ("ERROR", 2):
                status_code = "ERROR"

            if span_kind_str in ("TOOL", "TOOL_CALL"):
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

                raw_name = (
                    attrs.get("tool.name")
                    or attrs.get("tool_name")
                    or span.get("name", "unknown_tool")
                )
                tool_name = raw_name[5:] if raw_name.startswith("tool.") else raw_name

                events.append(
                    AgentEvent(
                        event_id=span.get("span_id", f"span_{len(events)}"),
                        event_type="TOOL_CALL",
                        status=status_code,
                        payload={
                            "tool_name": tool_name,
                            "arguments": tool_params,
                            "result": tool_result,
                            "input_arguments": tool_params,
                            "output_result": tool_result,
                        },
                        tool_calls=[{
                            "name": tool_name,
                            "args": (
                                tool_params
                                if isinstance(tool_params, dict)
                                else {"input": tool_params}
                            ),
                        }],
                        tool_responses=[{
                            "name": tool_name,
                            "response": (
                                tool_result
                                if isinstance(tool_result, dict)
                                else {"output": tool_result}
                            ),
                        }],
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
                llm_role = str(attrs.get("role", "model"))
                events.append(
                    AgentEvent(
                        event_id=span.get("span_id", f"span_{len(events)}"),
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

        if prompt_text:
            turn0 = AgentTurn(
                turn_id=0,
                turn_index=0,
                role="user",
                content=str(prompt_text),
                events=[
                    AgentEvent(
                        event_id="user_prompt_event",
                        event_type="USER_INPUT",
                        author="USER",
                        content=str(prompt_text),
                        payload={"content": str(prompt_text)},
                    )
                ],
            )
            turn1 = AgentTurn(
                turn_id=1,
                turn_index=1,
                role="model",
                content=str(final_response_text),
                events=events,
            )
            return [turn0, turn1]
        else:
            turn0 = AgentTurn(
                turn_id=0,
                turn_index=0,
                role="model",
                content=str(final_response_text),
                events=events,
            )
            return [turn0]


def _decode_proto_value(obj: Any) -> Any:
    """Recursively converts Protobuf JSON Value / Struct / ListValue into native Python types."""
    if not isinstance(obj, dict):
        return [_decode_proto_value(x) for x in obj] if isinstance(obj, list) else obj
    if "nullValue" in obj:
        return None
    if "boolValue" in obj:
        return bool(obj["boolValue"])
    if "numberValue" in obj:
        val = obj["numberValue"]
        return int(val) if isinstance(val, float) and val.is_integer() else val
    if "stringValue" in obj:
        return str(obj["stringValue"])
    if "listValue" in obj:
        lv = obj["listValue"]
        vals = (
            lv.get("values", [])
            if isinstance(lv, dict)
            else (lv if isinstance(lv, list) else [])
        )
        return [_decode_proto_value(x) for x in vals]
    if "structValue" in obj:
        return _decode_proto_value(obj["structValue"])
    if (
        "fields" in obj
        and isinstance(obj["fields"], list)
        and all(isinstance(f, dict) and "name" in f for f in obj["fields"])
    ):
        return {f["name"]: _decode_proto_value(f.get("value")) for f in obj["fields"]}
    return {k: _decode_proto_value(v) for k, v in obj.items()}


class GEStreamTraceConverter(BaseTraceConverter):
    """Converts Gemini Enterprise (GE Agent) TaskService `:stream` snapshots and VM `transcript.jsonl` logs into canonical AgentData."""

    _SKILL_PATH_RE = re.compile(r"/skills/([a-zA-Z0-9_.-]+)/SKILL\.md")

    def convert_file(
        self,
        filepath: str | Path,
        questions_file: str | Path | None = None,
    ) -> list[AgentData]:
        """Load and convert GE Agent `:stream` JSON or `transcript.jsonl` files."""
        if questions_file and not self.golden_map:
            self.golden_map = self._load_golden_map(questions_file)

        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Trace file or directory not found: {path}")

        if path.is_dir():
            results: list[AgentData] = []
            json_files = sorted(
                f
                for f in path.iterdir()
                if f.is_file() and f.suffix.lower() in (".json", ".jsonl")
            )
            for f in json_files:
                results.extend(self.convert_file(f, questions_file=questions_file))
            return results

        if path.suffix.lower() == ".jsonl":
            records: list[dict[str, Any]] = []
            with path.open("r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if not stripped:
                        continue
                    with contextlib.suppress(Exception):
                        obj = json.loads(stripped)
                        if isinstance(obj, dict):
                            records.append(obj)

            # In-VM transcript.jsonl stores one step per line with `type` in
            # {"USER_INPUT", "PLANNER_RESPONSE", "TOOL_RESPONSE", "TOOL_RESULT"}.
            if records and all(
                "type" in r and "events" not in r and "chunks" not in r
                for r in records
            ):
                ad = self.convert_to_agent_data(
                    {"session_id": path.stem, "steps": records}
                )
                return [self._merge_golden_data(ad)]

            return [
                self._merge_golden_data(self.convert_to_agent_data(r))
                for r in records
            ]

        with path.open("r", encoding="utf-8") as f:
            content = json.load(f)

        # A raw `:stream` snapshot is a JSON array of chunk dicts containing `"events"`.
        if isinstance(content, list) and content and all(
            isinstance(c, dict) and "events" in c for c in content
        ):
            ad = self.convert_to_agent_data(
                {"session_id": path.stem, "chunks": content}
            )
            return [self._merge_golden_data(ad)]

        if isinstance(content, list):
            return [
                self._merge_golden_data(self.convert_to_agent_data(item))
                for item in content
                if isinstance(item, dict)
            ]
        if isinstance(content, dict):
            ad = self.convert_to_agent_data(content)
            return [self._merge_golden_data(ad)]
        return []

    def _steps_to_stream_events(
        self, steps: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], list[str]]:
        """Normalize in-VM `transcript.jsonl` steps into TaskService `:stream` event dicts."""
        stream_events: list[dict[str, Any]] = []
        user_prompts: list[str] = []
        pending_calls: list[tuple[str, str]] = []
        seq = 1

        for step_obj in steps:
            if not isinstance(step_obj, dict):
                continue
            stype = str(step_obj.get("type") or "")
            if stype == "USER_INPUT":
                txt = str(step_obj.get("content") or "").strip()
                if txt:
                    user_prompts.append(txt)
                    stream_events.append(
                        {
                            "seqNum": str(seq),
                            "step": {
                                "content": {
                                    "role": "user",
                                    "content": [{"text": {"text": txt}}],
                                }
                            },
                        }
                    )
                    seq += 1
            elif stype == "PLANNER_RESPONSE":
                th = str(step_obj.get("thinking") or "").strip()
                if th:
                    stream_events.append(
                        {
                            "seqNum": str(seq),
                            "step": {
                                "thought": {"summary": [{"text": {"text": th}}]}
                            },
                        }
                    )
                    seq += 1
                for tc in step_obj.get("tool_calls") or []:
                    if not isinstance(tc, dict):
                        continue
                    cid = str(tc.get("id") or f"tc_{seq}")
                    fname = str(
                        tc.get("name")
                        or (tc.get("function") or {}).get("name")
                        or "tool"
                    )
                    fargs = (
                        tc.get("args")
                        or tc.get("arguments")
                        or (tc.get("function") or {}).get("arguments")
                        or {}
                    )
                    if isinstance(fargs, str):
                        try:
                            fargs = json.loads(fargs)
                        except Exception:
                            fargs = {"raw": fargs}
                    stream_events.append(
                        {
                            "seqNum": str(seq),
                            "step": {
                                "toolCall": {
                                    "id": cid,
                                    "functionCall": {
                                        "name": fname,
                                        "arguments": fargs,
                                    },
                                }
                            },
                        }
                    )
                    pending_calls.append((cid, fname))
                    seq += 1
                txt = str(step_obj.get("content") or "").strip()
                if txt:
                    stream_events.append(
                        {
                            "seqNum": str(seq),
                            "step": {
                                "content": {
                                    "role": "model",
                                    "content": [{"text": {"text": txt}}],
                                }
                            },
                        }
                    )
                    seq += 1
            elif stype in ("TOOL_RESPONSE", "TOOL_RESULT") or (
                pending_calls and step_obj.get("source") == "TOOL"
            ):
                cid, fname = (
                    pending_calls.pop(0)
                    if pending_calls
                    else (f"tc_{seq}", str(step_obj.get("name") or "tool"))
                )
                raw_c = step_obj.get("content")
                res_obj: Any = raw_c
                if isinstance(raw_c, str):
                    try:
                        res_obj = json.loads(raw_c)
                    except Exception:
                        res_obj = {"output": raw_c}
                stream_events.append(
                    {
                        "seqNum": str(seq),
                        "step": {
                            "toolResult": {
                                "callId": cid,
                                "functionResult": {
                                    "name": fname,
                                    "result": res_obj,
                                },
                            }
                        },
                    }
                )
                seq += 1

        return stream_events, user_prompts

    def convert_to_agent_data(
        self, raw_trace: dict[str, Any] | list[Any]
    ) -> AgentData:
        """Convert a GE Agent `:stream` payload or normalized `transcript.jsonl` dict into `AgentData`."""
        if isinstance(raw_trace, list):
            raw_trace = {"chunks": [c for c in raw_trace if isinstance(c, dict)]}
        if not isinstance(raw_trace, dict):
            return AgentData(session_id="ge_agent_session", turns=[], events=[])

        session_id = str(
            raw_trace.get("session_id")
            or raw_trace.get("task_id")
            or raw_trace.get("name")
            or raw_trace.get("id")
            or "ge_agent_session"
        )

        prompt_override = raw_trace.get("prompt") or raw_trace.get("user_input") or ""
        stream_events: list[dict[str, Any]] = []
        user_prompts: list[str] = []

        if isinstance(raw_trace.get("steps"), list):
            stream_events, user_prompts = self._steps_to_stream_events(
                raw_trace["steps"]
            )
        elif isinstance(raw_trace.get("chunks"), list):
            for chunk in raw_trace["chunks"]:
                if isinstance(chunk, dict):
                    stream_events.extend(chunk.get("events") or [])
        elif isinstance(raw_trace.get("events"), list):
            stream_events = list(raw_trace["events"])

        usage = {
            "prompt_token_count": 0,
            "candidates_token_count": 0,
            "cached_content_token_count": 0,
            "total_token_count": 0,
            "thoughts_token_count": 0,
        }
        invoked_skills: list[str] = []
        thoughts: list[str] = []
        calls_by_id: dict[str, dict[str, Any]] = {}
        anon_seq = 0
        synthetic_spans: list[dict[str, Any]] = []

        turns: list[AgentTurn] = []
        current_events: list[AgentEvent] = []
        current_model_texts: list[str] = []
        turn_idx = 0

        def _record_skills(blob: str) -> None:
            for m in self._SKILL_PATH_RE.findall(blob or ""):
                if m not in invoked_skills:
                    invoked_skills.append(m)

        def _flush_model_turn() -> None:
            nonlocal turn_idx, current_events, current_model_texts
            if not current_events and not current_model_texts:
                return
            turns.append(
                AgentTurn(
                    turn_id=turn_idx,
                    turn_index=turn_idx,
                    role="model",
                    content=current_model_texts[-1] if current_model_texts else "",
                    events=current_events,
                )
            )
            turn_idx += 1
            current_events = []
            current_model_texts = []

        for ev in stream_events:
            if not isinstance(ev, dict):
                continue
            u = ev.get("stepUsage")
            if isinstance(u, dict):
                usage["total_token_count"] += int(u.get("totalTokens") or 0)
                usage["prompt_token_count"] += int(u.get("totalInputTokens") or 0)
                usage["candidates_token_count"] += int(u.get("totalOutputTokens") or 0)
                usage["cached_content_token_count"] += int(u.get("totalCachedTokens") or 0)
                usage["thoughts_token_count"] += int(u.get("totalThoughtTokens") or 0)

            step = ev.get("step") or {}
            if not isinstance(step, dict):
                continue

            if "thought" in step:
                seg = []
                for tp in (step.get("thought") or {}).get("summary") or []:
                    if isinstance(tp, dict):
                        tf = tp.get("text")
                        if isinstance(tf, dict) and tf.get("text"):
                            seg.append(str(tf["text"]))
                        elif isinstance(tf, str) and tf.strip():
                            seg.append(tf)
                if seg:
                    thought_text = "\n".join(seg).strip()
                    thoughts.append(thought_text)
                    current_events.append(
                        AgentEvent(
                            event_id=f"ge_thought_{len(current_events)}",
                            event_type="MODEL_THOUGHT",
                            status="OK",
                            author="thought",
                            content=thought_text,
                            payload={"thought": True, "text": thought_text},
                        )
                    )

            if "content" in step:
                c = step.get("content") or {}
                role = str(c.get("role") or "model").lower()
                seg_c = []
                for pt in c.get("content") or c.get("parts") or []:
                    if isinstance(pt, dict):
                        tf = pt.get("text")
                        if isinstance(tf, dict) and tf.get("text"):
                            seg_c.append(str(tf["text"]))
                        elif isinstance(tf, str) and tf.strip():
                            seg_c.append(tf)
                if seg_c:
                    txt_c = "\n".join(seg_c).strip()
                    if role == "user":
                        _flush_model_turn()
                        turns.append(
                            AgentTurn(
                                turn_id=turn_idx,
                                turn_index=turn_idx,
                                role="user",
                                content=txt_c,
                                events=[
                                    AgentEvent(
                                        event_id=f"ge_user_{turn_idx}",
                                        event_type="USER_INPUT",
                                        status="OK",
                                        author="USER",
                                        content=txt_c,
                                        payload={"content": txt_c},
                                    )
                                ],
                            )
                        )
                        turn_idx += 1
                    else:
                        current_model_texts.append(txt_c)
                        current_events.append(
                            AgentEvent(
                                event_id=f"ge_model_{len(current_events)}",
                                event_type="MODEL_INFERENCE",
                                status="OK",
                                author=role,
                                content=txt_c,
                                payload={"content": txt_c},
                            )
                        )

            if "toolCall" in step:
                tc = step.get("toolCall") or {}
                anon_seq += 1
                cid = str(tc.get("id") or f"anon_{anon_seq}")
                fc = tc.get("functionCall") or {}
                fname = str(fc.get("name") or "tool")
                raw_args = fc.get("arguments") if "arguments" in fc else fc.get("args")
                fargs = _decode_proto_value(raw_args if raw_args is not None else {})
                if isinstance(fargs, str):
                    try:
                        fargs = json.loads(fargs)
                    except Exception:
                        fargs = {"raw": fargs}
                if not isinstance(fargs, dict):
                    fargs = {"value": fargs}
                _record_skills(json.dumps(fargs, ensure_ascii=False))
                calls_by_id[cid] = {"name": fname, "args": fargs}

            elif "toolResult" in step:
                tr = step.get("toolResult") or {}
                cid = str(tr.get("callId") or "")
                fr = tr.get("functionResult") or {}
                fr_name = str(fr.get("name") or "tool")
                raw_res = fr.get("result") if "result" in fr else fr.get("response")
                fres = _decode_proto_value(raw_res if raw_res is not None else {})

                if cid and cid in calls_by_id:
                    cmeta = calls_by_id.pop(cid)
                else:
                    mk = next(
                        (
                            k
                            for k in reversed(list(calls_by_id.keys()))
                            if calls_by_id[k]["name"] == fr_name
                        ),
                        next(iter(calls_by_id.keys()), ""),
                    )
                    cmeta = calls_by_id.pop(mk) if mk else {"name": fr_name, "args": {}}

                cname = str(cmeta.get("name") or fr_name)
                clean_name = cname.split("__")[-1]
                cargs = cmeta.get("args") if isinstance(cmeta.get("args"), dict) else {}
                resp_dict = fres if isinstance(fres, dict) else {"result": fres}
                is_error = (
                    isinstance(resp_dict, dict)
                    and (
                        resp_dict.get("isError") is True
                        or resp_dict.get("status") in ("ERROR", "FAILED")
                    )
                )
                status_str = "ERROR" if is_error else "OK"

                current_events.append(
                    AgentEvent(
                        event_id=cid or f"ge_tool_{len(current_events)}",
                        event_type="TOOL_CALL",
                        status=status_str,
                        author="model",
                        payload={
                            "tool_name": clean_name,
                            "arguments": cargs,
                            "result": resp_dict,
                            "input_arguments": cargs,
                            "output_result": resp_dict,
                        },
                        tool_calls=[{"name": clean_name, "args": cargs}],
                        tool_responses=[{"name": clean_name, "response": resp_dict}],
                    )
                )
                synthetic_spans.append(
                    {
                        "name": f"tool.{clean_name}",
                        "attributes": {
                            "Tool Name": clean_name,
                            "Tool Status": "ERROR" if is_error else "SUCCESS",
                        },
                    }
                )

        _flush_model_turn()

        if prompt_override and not any(t.role == "user" for t in turns):
            user_turn = AgentTurn(
                turn_id=0,
                turn_index=0,
                role="user",
                content=str(prompt_override),
                events=[
                    AgentEvent(
                        event_id="ge_user_0",
                        event_type="USER_INPUT",
                        status="OK",
                        author="USER",
                        content=str(prompt_override),
                        payload={"content": str(prompt_override)},
                    )
                ],
            )
            for idx, t in enumerate(turns, start=1):
                t.turn_id = idx
                t.turn_index = idx
            turns.insert(0, user_turn)
        elif user_prompts and not any(t.role == "user" for t in turns):
            pass

        if any(usage.values()):
            synthetic_spans.append(
                {
                    "name": "call_llm",
                    "attributes": {
                        "gcp.vertex.agent.llm_response": json.dumps(
                            {"usage_metadata": usage}
                        )
                    },
                }
            )

        metadata = dict(raw_trace.get("metadata") or {})
        if invoked_skills:
            metadata["invoked_skills"] = invoked_skills
        if thoughts:
            metadata["thoughts"] = thoughts

        agent_data = AgentData(
            session_id=session_id,
            turns=turns,
            events=[],
            metadata=metadata,
        )
        if synthetic_spans:
            agent_data.session_trace = synthetic_spans
        return agent_data


def get_trace_converter(
    format_type: str = "adk",
    questions_file: str | Path | None = None,
) -> BaseTraceConverter:
    """Factory method returning a configured BaseTraceConverter instance.

    Args:
        format_type: Format name ('adk', 'otel', 'openinference', 'langgraph',
          'llamaindex', 'crewai', 'autogen', 'ge-agent', 'ge-stream', 'ge-transcript').
        questions_file: Optional path to golden dataset to merge reference data.

    Returns:
        Configured BaseTraceConverter instance.
    """
    format_lower = format_type.lower().strip()
    if format_lower in ("adk", "default"):
        return ADKTraceConverter(questions_file=questions_file)
    elif format_lower in (
        "otel",
        "openinference",
        "langgraph",
        "llamaindex",
        "crewai",
        "autogen",
    ):
        return OpenInferenceOTelConverter(questions_file=questions_file)
    elif format_lower in ("ge-agent", "ge-stream", "ge-transcript"):
        return GEStreamTraceConverter(questions_file=questions_file)
    else:
        raise ValueError(
            f"Unsupported trace format type: '{format_type}'. "
            f"Valid options are: 'adk', 'otel', 'openinference', 'langgraph', "
            f"'llamaindex', 'crewai', 'autogen', 'ge-agent', 'ge-stream', 'ge-transcript'."
        )
