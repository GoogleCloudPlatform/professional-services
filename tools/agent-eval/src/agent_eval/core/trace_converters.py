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


def get_trace_converter(
    format_type: str = "adk",
    questions_file: str | Path | None = None,
) -> BaseTraceConverter:
    """Factory method returning a configured BaseTraceConverter instance.

    Args:
        format_type: Format name ('adk', 'otel', 'openinference', 'langgraph',
          'llamaindex', 'crewai', 'autogen').
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
    else:
        raise ValueError(
            f"Unsupported trace format type: '{format_type}'. "
            f"Valid options are: 'adk', 'otel', 'openinference', 'langgraph', 'llamaindex', 'crewai', 'autogen'."
        )
