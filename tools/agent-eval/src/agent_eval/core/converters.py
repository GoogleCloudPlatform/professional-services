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
import json
import logging
import os
import glob
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# Import AgentClient for consistent trace analysis logic
from agent_eval.core.agent_client import AgentClient

logger = logging.getLogger("agent_eval.converters")


def robust_json_load(file_path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        data = json.loads(content)
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                pass
        if not isinstance(data, dict):
            logger.warning("Skipping %s: Root content is not a dictionary.",
                           file_path)
            return None
        return data
    except Exception as e:
        logger.warning("Failed to parse %s: %s", file_path, e)
        return None


def to_camel_case(snake_str: str) -> str:
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def convert_keys_to_camel_case(data: Any) -> Any:
    """Recursively converts dictionary keys from snake_case to camelCase."""
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            new_key = to_camel_case(k)
            new_dict[new_key] = convert_keys_to_camel_case(v)
        return new_dict
    elif isinstance(data, list):
        return [convert_keys_to_camel_case(i) for i in data]
    return data


def synthesize_trace_from_events(events: List[Dict[str, Any]], session_id: str,
                                 agent_name: str) -> List[Dict[str, Any]]:
    """
    Constructs a synthetic OpenTelemetry-style span trace from a flat list of ADK events.
    Compatible with AgentClient analysis methods.
    """
    spans = []

    def create_span(name, start_time, end_time, parent_id, attributes):
        return {
            "name": name,
            "span_id": str(uuid.uuid4().int)[:16],
            "trace_id": str(uuid.uuid4().int)[:32],
            "parent_span_id": parent_id,
            "start_time": int(start_time * 1e9),
            "end_time": int(end_time * 1e9),
            "attributes": attributes,
        }

    current_invocation_span = None
    current_agent_span = None

    for i, event in enumerate(events):
        timestamp = event.get("timestamp", time.time())
        role = event.get("author")

        if role == "user":
            if current_invocation_span:
                current_invocation_span["end_time"] = int(timestamp * 1e9)
                if current_agent_span:
                    current_agent_span["end_time"] = int(timestamp * 1e9)
                    spans.append(current_agent_span)
                spans.append(current_invocation_span)

            current_invocation_span = create_span("invocation", timestamp,
                                                  timestamp + 1, None, {})
            current_agent_span = create_span(
                f"invoke_agent {agent_name}",
                timestamp,
                timestamp + 1,
                current_invocation_span["span_id"],
                {
                    "gen_ai.agent.name": agent_name,
                    "gen_ai.conversation.id": session_id
                },
            )

        elif role != "user" and current_agent_span:
            content = event.get("content") or {}
            parts = content.get("parts") or []

            is_tool = False
            tool_name = "unknown"

            for part in parts:
                if "functionCall" in part or "function_call" in part:
                    fc = part.get("functionCall") or part.get("function_call")
                    if fc:
                        is_tool = True
                        tool_name = fc.get("name")
                        break
                if "functionResponse" in part or "function_response" in part:
                    fr = part.get("functionResponse") or part.get(
                        "function_response")
                    if fr:
                        is_tool = True
                        tool_name = fr.get("name")
                        break

            span_name = f"execute_tool {tool_name}" if is_tool else "call_llm"
            attrs = {
                "gen_ai.system": "gcp.vertex.agent",
                "gen_ai.request.model": event.get("model_version", "unknown"),
            }

            # Map tool attributes for AgentClient analysis
            if is_tool:
                attrs["gen_ai.tool.name"] = tool_name
                # Try to extract args/response for proper trace analysis
                for part in parts:
                    if "functionCall" in part or "function_call" in part:
                        fc = part.get("functionCall") or part.get(
                            "function_call")
                        if fc:
                            attrs[
                                "gcp.vertex.agent.tool_call_args"] = json.dumps(
                                    fc.get("args"))
                    if "functionResponse" in part or "function_response" in part:
                        fr = part.get("functionResponse") or part.get(
                            "function_response")
                        if fr:
                            attrs[
                                "gcp.vertex.agent.tool_response"] = json.dumps(
                                    fr.get("response") or fr.get("content"))

            # Capture finish reason if available
            finish_reason = None
            if "candidates" in content:
                # Some formats nest finishReason under candidates
                candidates = content.get("candidates", [])
                if candidates:
                    finish_reason = candidates[0].get(
                        "finishReason") or candidates[0].get("finish_reason")

            # Fallback: check top-level of event or content (ADK variations)
            if not finish_reason:
                finish_reason = event.get("finish_reason") or content.get(
                    "finish_reason")

            if finish_reason:
                attrs["gen_ai.response.finish_reason"] = finish_reason

            usage = event.get("usage_metadata")
            if usage:
                attrs["gen_ai.usage.input_tokens"] = usage.get(
                    "prompt_token_count")
                attrs["gen_ai.usage.output_tokens"] = usage.get(
                    "candidates_token_count")
                # LLM Response for token counting
                attrs["gcp.vertex.agent.llm_response"] = json.dumps(
                    {"usage_metadata": usage})

            step_span = create_span(
                span_name,
                timestamp,
                timestamp + 1.0,
                current_agent_span["span_id"],
                attrs,
            )
            spans.append(step_span)

            current_agent_span["end_time"] = step_span["end_time"]
            current_invocation_span["end_time"] = step_span["end_time"]

    if current_agent_span:
        spans.append(current_agent_span)
    if current_invocation_span:
        spans.append(current_invocation_span)

    return spans


class AdkHistoryConverter:

    def __init__(
        self,
        agent_dir: str,
        questions_file: Optional[str] = None,
        prompt_to_reference: Optional[Dict[str, Dict[str, Any]]] = None,
    ):
        self.agent_dir = agent_dir
        self.golden_map = self._load_golden_map(
            questions_file) if questions_file else {}
        # ADK auto-assigns its own `eval_id` per case (a random hex like
        # `d80d2c8b`) — so the golden_map (keyed by our `id`) won't match
        # sim traces. The prompt_to_reference fallback is keyed by the
        # scenario's `starting_prompt` (which IS preserved verbatim as the
        # first user message in the trace), so multi-turn rows with
        # reference_data flow through. Built by run.py from dataset.jsonl
        # before invoking the converter.
        self.prompt_to_reference: Dict[str,
                                       Dict[str,
                                            Any]] = prompt_to_reference or {}

    def _load_golden_map(self, filepath: str) -> Dict[str, Dict[str, Any]]:
        """Loads Golden Dataset to merge reference data based on ID."""
        mapping = {}
        try:
            with open(filepath) as f:
                data = json.load(f)
                questions = data.get("questions") or data.get(
                    "golden_questions", [])
                for q in questions:
                    if "id" in q:
                        mapping[q["id"]] = q
        except Exception as e:
            logger.warning("Could not load golden dataset: %s", e)
        return mapping

    def _resolve_reference_data(self, eval_id: str,
                                user_inputs: List[str]) -> Dict[str, Any]:
        """Try the golden_map (keyed by row id) first; fall back to
        prompt_to_reference (keyed by the scenario's starting_prompt) so
        sim traces inherit reference_data from the source dataset row."""
        golden_q = self.golden_map.get(eval_id, {})
        if golden_q.get("reference_data"):
            return golden_q["reference_data"]
        if user_inputs and user_inputs[0] in self.prompt_to_reference:
            return self.prompt_to_reference[user_inputs[0]]
        return {}

    def process_file(self, file_path: str) -> List[Dict[str, Any]]:
        data = robust_json_load(file_path)
        if not data:
            return []

        case_results = data.get("eval_case_results", [])
        extracted_rows = []

        for case in case_results:
            eval_id = case.get("eval_id")
            session_id = case.get("session_id")

            # Try two different data formats:
            # Format 1: session_details (customer-service style)
            # Format 2: eval_metric_result_per_invocation (retail-ai style)

            session_details = case.get("session_details")

            if not session_details:
                # Format 2: eval_metric_result_per_invocation (no session_details)
                per_invocation = case.get("eval_metric_result_per_invocation")
                if per_invocation:
                    row = self._process_per_invocation_format(
                        eval_id, session_id, per_invocation, case)
                    if row:
                        extracted_rows.append(row)
                    continue

                # No session_details and no per_invocation — configuration problem
                logger.error(
                    "session_details is empty for eval case: %s\n"
                    "This usually means the 'app_name' in your evalset.json file "
                    "does not match the folder name containing your agent.\n"
                    "The app_name MUST match the folder name, NOT the agent's internal name.\n"
                    "Example:\n"
                    "  If your agent is in: retail-ai-location-strategy/app/agent.py\n"
                    "  Then app_name must be: \"app\"\n"
                    "To fix: change 'app_name' in evalset.json, clear .adk/, re-run simulation.",
                    eval_id,
                )

                # Skip this case - don't process with incomplete data
                continue

            # Format 1: session_details is available (correct configuration)
            events = session_details.get("events", [])
            state = session_details.get("state", {})
            app_name = session_details.get("app_name")
            session_id = session_details.get("id") or session_id
            user_id = session_details.get("user_id")

            if not events:
                continue

            # 1. Synthesize Trace
            synthetic_trace = synthesize_trace_from_events(
                events, session_id, app_name)

            # 2. Analyze Trace (using AgentClient logic)
            analyzed_trace = AgentClient.analyze_trace_and_extract_spans(
                synthetic_trace)
            latency_data = AgentClient.get_latency_from_spans(analyzed_trace)
            trace_summary = AgentClient.get_agent_trajectory(analyzed_trace)

            # 3. Reconstruct Session Object (CamelCase for consistency with runtime)
            camel_events = convert_keys_to_camel_case(events)
            final_session_state = {
                "id":
                    session_id,
                "appName":
                    app_name,
                "userId":
                    user_id,
                "state":
                    state,
                "events":
                    camel_events,
                "lastUpdateTime":
                    events[-1].get("timestamp") if events else None,
            }

            # 4. Extracted Data
            # Use AgentClient helpers to ensure consistency
            tool_interactions = AgentClient.get_tool_interactions(
                final_session_state)
            sub_agent_trace = AgentClient.get_sub_agent_trace(
                final_session_state)

            # 4a. Generate tool_declarations from tools found in events
            # SDK format: [{"function_declarations": [{"name": "tool_name", ...}]}]
            tool_names = set()
            for ti in tool_interactions:
                if isinstance(ti, dict) and "tool_name" in ti:
                    tool_names.add(ti["tool_name"])

            tool_declarations = []
            for tool_name in sorted(tool_names):
                tool_declarations.append({
                    "function_declarations": [{
                        "name": tool_name,
                        "description": f"Tool: {tool_name}"
                    }]
                })

            # 4b. Generate system_instruction from app_name
            # In a full implementation, this could come from the agent definition
            system_instruction = f"You are the {app_name} agent."

            # --- NEW DATA EXTRACTION FOR OPTIMIZATION SIGNALS ---
            thinking_trace = []
            grounding_chunks = []
            per_turn_tokens = []
            stop_reasons = []

            for event in events:
                # Extract Thinking Process
                content = event.get("content") or {}
                parts = content.get("parts") or []
                for part in parts:
                    if part.get("thought"):
                        thinking_trace.append(part.get("text", ""))

                # Extract Grounding Metadata (often in candidates[0])
                candidates = content.get("candidates") or []
                if candidates:
                    candidate = candidates[0]
                    gm = candidate.get("grounding_metadata") or candidate.get(
                        "groundingMetadata")
                    if gm:
                        chunks = gm.get("grounding_chunks") or gm.get(
                            "groundingChunks")
                        if chunks:
                            grounding_chunks.extend(chunks)

                    # Extract Stop Reasons
                    finish_reason = candidate.get(
                        "finish_reason") or candidate.get("finishReason")
                    if finish_reason:
                        stop_reasons.append(finish_reason)

                # Extract Per-Turn Usage
                usage = event.get("usage_metadata")
                if usage:
                    per_turn_tokens.append(usage)

            extracted_data = {
                "state_variables": state,
                "tool_interactions": tool_interactions,
                "sub_agent_trace": sub_agent_trace,
                "tool_declarations": tool_declarations,
                "system_instruction": system_instruction,
                # New fields for Root Cause Analysis
                "thinking_trace": thinking_trace,
                "grounding_chunks": grounding_chunks,
                "per_turn_tokens": per_turn_tokens,
                "stop_reasons": stop_reasons
            }
            # Flatten state for legacy support if needed, but keeping clean is better.
            # Live path flattens it, so we should too for consistency.
            extracted_data.update(state)

            # 4b. Extract final_response (last agent text response)
            final_response = ""
            if sub_agent_trace:
                # Get the last agent turn with a text response
                for turn in reversed(sub_agent_trace):
                    if turn.get("text_response"):
                        final_response = turn["text_response"]
                        break

            # 5. User Inputs
            user_inputs = []
            for e in events:
                if e.get("author") == "user":
                    content = e.get("content") or {}
                    parts = content.get("parts") or []
                    text = "".join([p.get("text", "") for p in parts])
                    if text:
                        user_inputs.append(text)

            # 6. Merge with reference data — try the id-keyed golden_map
            # first (legacy questions_file), fall back to the prompt-keyed
            # map (sim path: ADK assigns its own eval_id, so we join by
            # the trace's first user message back to the source dataset row).
            reference_data = self._resolve_reference_data(eval_id, user_inputs)
            golden_q = self.golden_map.get(eval_id, {})
            question_metadata = golden_q.get("metadata", {})

            # 7. Build contents for Gemini batch format (multi-turn conversations)
            # The SDK auto-extracts conversation_history and prompt from this format.
            # See: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-dataset
            text_responses = [
                t.get("text_response", "")
                for t in sub_agent_trace
                if t.get("text_response")
            ]

            # Build full conversation as Content objects
            contents = []
            for i, user_input in enumerate(user_inputs):
                # Add user turn
                contents.append({
                    "role": "user",
                    "parts": [{
                        "text": user_input
                    }]
                })
                # Add corresponding model response if available (except after last user input)
                if i < len(text_responses):
                    contents.append({
                        "role": "model",
                        "parts": [{
                            "text": text_responses[i]
                        }]
                    })

            # Build Gemini batch format for SDK auto-parsing
            gemini_request = {"contents": contents}
            gemini_response = {
                "candidates": [{
                    "content": {
                        "role": "model",
                        "parts": [{
                            "text": final_response
                        }]
                    }
                }]
            }

            # Also store conversation_history separately for custom metrics
            conversation_history = contents[:-1] if len(contents) > 1 else [
            ]  # All but last user turn
            extracted_data["conversation_history"] = conversation_history

            # 8. Construct Row - JSONL format with Gemini batch structure
            row = {
                # Gemini batch format fields (SDK auto-parses these for multi-turn metrics)
                "request": gemini_request,
                "response": gemini_response,
                # Metadata fields
                "question_id": eval_id,
                "session_id": session_id,
                "base_url": "simulation",
                "source_type": "simulation",
                "app_name": app_name,
                "ADK_USER_ID": user_id,
                "status": {
                    "boolean": "success"
                },
                "run_id": str(uuid.uuid4()),
                "agents_evaluated": [app_name],
                "user_inputs": user_inputs,
                "question_metadata": question_metadata,
                "interaction_datetime": datetime.now().isoformat(),
                "USER": os.environ.get("USER", "simulator"),
                "reference_data": reference_data,
                "missing_information": {
                    "boolean": False
                },
                "final_session_state": final_session_state,
                "session_trace": synthetic_trace,
                "latency_data": latency_data,
                "trace_summary": trace_summary,
                "extracted_data": extracted_data,
                "final_response": final_response
            }

            # Preserve ADK Eval Scores as Metadata or separate columns?
            # User wants "same structure as processed_interactions".
            # Processed interactions doesn't have score columns yet (they come from evaluation).
            # But we can keep them as extra columns, they won't hurt.
            adk_evals = case.get("eval_metric_results") or case.get(
                "overall_eval_metric_results") or []
            for eval_res in adk_evals:
                m_name = eval_res.get("metric_name")
                if m_name:
                    row[f"adk_score.{m_name}"] = eval_res.get("score")

            extracted_rows.append(row)

        return extracted_rows

    def _process_per_invocation_format(self, eval_id: str,
                                       session_id: Optional[str],
                                       per_invocation: list,
                                       case: dict) -> Optional[Dict[str, Any]]:
        """Process Format 2: eval_metric_result_per_invocation (no session_details).

        This format appears when ADK eval runs without capturing full session details.
        Each invocation contains user_content, final_response, and intermediate_data.
        """
        if not per_invocation:
            return None

        user_inputs = []
        text_responses = []
        tool_calls = []
        app_name = None
        final_response = ""

        for inv_wrapper in per_invocation:
            inv = inv_wrapper.get("actual_invocation", {})

            # Extract user input
            user_content = inv.get("user_content", {})
            user_parts = user_content.get("parts", [])
            user_text = "".join(p.get("text", "") for p in user_parts)
            if user_text:
                user_inputs.append(user_text)

            # Extract final response
            resp_content = inv.get("final_response", {})
            resp_parts = resp_content.get("parts", [])
            resp_text = "".join(p.get("text", "") for p in resp_parts)
            if resp_text:
                text_responses.append(resp_text)
                final_response = resp_text  # Last one wins

            # Extract tool calls and agent name from intermediate events
            intermediate = inv.get("intermediate_data", {})
            events = intermediate.get("invocation_events", [])
            for event in events:
                author = event.get("author", "")
                if not app_name and author:
                    app_name = author  # Discover agent name from first author

                content = event.get("content", {})
                parts = content.get("parts", [])
                for part in parts:
                    fc = part.get("functionCall")
                    if fc:
                        tool_calls.append({
                            "tool_name": fc.get("name", ""),
                            "input_arguments": fc.get("args", {}),
                            "output_result": {}
                        })

        app_name = app_name or "unknown"

        # Synthesize a minimal trace with spans for each component
        synthetic_trace = []
        trace_id = str(uuid.uuid4())[:16]

        # Root invocation span
        synthetic_trace.append({
            "name": "invocation",
            "context": {
                "trace_id": trace_id,
                "span_id": "0001"
            },
            "parent_id": None,
            "start_time": datetime.now().isoformat(),
            "end_time": datetime.now().isoformat(),
            "attributes": {},
        })

        # Agent span
        synthetic_trace.append({
            "name": f"invoke_agent {app_name}",
            "context": {
                "trace_id": trace_id,
                "span_id": "0002"
            },
            "parent_id": "0001",
            "start_time": datetime.now().isoformat(),
            "end_time": datetime.now().isoformat(),
            "attributes": {},
        })

        # Tool spans
        for i, tc in enumerate(tool_calls):
            synthetic_trace.append({
                "name": f"execute_tool {tc['tool_name']}",
                "context": {
                    "trace_id": trace_id,
                    "span_id": f"{i+3:04d}"
                },
                "parent_id": "0002",
                "start_time": datetime.now().isoformat(),
                "end_time": datetime.now().isoformat(),
                "attributes": {
                    "tool_name": tc["tool_name"]
                },
            })

        # Build tool declarations from discovered tool names
        tool_names = sorted(set(tc["tool_name"] for tc in tool_calls))
        tool_declarations = [{
            "function_declarations": [{
                "name": tn,
                "description": f"Tool: {tn}"
            }]
        } for tn in tool_names]

        # Build Gemini batch format
        contents = []
        for i, user_input in enumerate(user_inputs):
            contents.append({"role": "user", "parts": [{"text": user_input}]})
            if i < len(text_responses):
                contents.append({
                    "role": "model",
                    "parts": [{
                        "text": text_responses[i]
                    }]
                })

        extracted_data = {
            "state_variables": {},
            "tool_interactions": tool_calls,
            "sub_agent_trace": [],
            "tool_declarations": tool_declarations,
            "system_instruction": f"You are the {app_name} agent.",
            "conversation_history": contents[:-1] if len(contents) > 1 else [],
            "thinking_trace": [],
            "grounding_chunks": [],
            "per_turn_tokens": [],
            "stop_reasons": [],
        }

        golden_q = self.golden_map.get(eval_id, {})
        # Same per-row resolution as the legacy format above — try id-keyed
        # golden_map first, fall back to prompt-keyed map (sim path).
        resolved_ref = self._resolve_reference_data(eval_id, user_inputs)

        row = {
            "request": {
                "contents": contents
            },
            "response": {
                "candidates": [{
                    "content": {
                        "role": "model",
                        "parts": [{
                            "text": final_response
                        }]
                    }
                }]
            },
            "question_id": eval_id,
            "session_id": session_id or str(uuid.uuid4()),
            "base_url": "simulation",
            "source_type": "simulation",
            "app_name": app_name,
            "ADK_USER_ID": "eval_user",
            "status": {
                "boolean": "success"
            },
            "run_id": str(uuid.uuid4()),
            "agents_evaluated": [app_name],
            "user_inputs": user_inputs,
            "question_metadata": golden_q.get("metadata", {}),
            "interaction_datetime": datetime.now().isoformat(),
            "USER": os.environ.get("USER", "simulator"),
            "reference_data": resolved_ref,
            "missing_information": {
                "boolean": False
            },
            "final_session_state": {},
            "session_trace": synthetic_trace,
            "latency_data": {},
            "trace_summary": [f"Tool: {tc['tool_name']}" for tc in tool_calls],
            "extracted_data": extracted_data,
            "final_response": final_response,
        }

        # ADK eval scores
        adk_evals = case.get("eval_metric_results") or case.get(
            "overall_eval_metric_results") or []
        for eval_res in adk_evals:
            m_name = eval_res.get("metric_name")
            if m_name:
                row[f"adk_score.{m_name}"] = eval_res.get("score")

        return row

    def run(self) -> List[Dict[str, Any]]:
        """Processes ADK eval history files and returns a list of interaction records.

        Returns:
            List of dictionaries, each representing one interaction.
            Use write_jsonl() to save to disk.
        """
        history_dir = os.path.join(self.agent_dir, ".adk", "eval_history")
        if not os.path.exists(history_dir):
            raise FileNotFoundError(
                f"History directory not found: {history_dir}")

        all_rows = []
        for file_path in glob.glob(os.path.join(history_dir, "*.json")):
            all_rows.extend(self.process_file(file_path))

        return all_rows


def write_jsonl(records: List[Dict[str, Any]], output_path: str) -> None:
    """Writes a list of records to a JSONL file (one JSON object per line).

    Args:
        records: List of dictionaries to write.
        output_path: Path to output .jsonl file.
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False, default=str) + '\n')


def read_jsonl(input_path: str) -> List[Dict[str, Any]]:
    """Reads a JSONL file and returns a list of records.

    Args:
        input_path: Path to .jsonl file.

    Returns:
        List of dictionaries.
    """
    records = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


class TestToGoldenConverter:
    """Converts a list of conversation turns (test data) into a Golden Dataset JSON."""

    def __init__(self):
        pass

    def _parse_kv_pairs(self, pairs: Optional[List[str]]) -> Dict[str, str]:
        """Parses a list of 'key:value' strings into a dictionary."""
        result = {}
        if not pairs:
            return result
        for p in pairs:
            if ":" not in p:
                logger.warning("Invalid format '%s'. Expected 'key:value'", p)
                continue
            key, value = p.split(":", 1)
            result[key.strip()] = value.strip()
        return result

    def convert(self,
                input_path: str,
                output_path: str,
                agent_name: str,
                metadata_pairs: Optional[List[str]] = None,
                id_prefix: str = "q"):

        with open(input_path, "r") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError(
                f"Input data in {input_path} is not a list of turns.")

        user_inputs = []
        reference_tool_interactions = []

        for turn in data:
            user_inputs.append(turn.get("query", ""))

            # Map expected_tool_use to reference_tool_interactions
            for tool in turn.get("expected_tool_use", []):
                reference_tool_interactions.append({
                    "tool_name": tool.get("tool_name"),
                    "input_arguments": tool.get("tool_input"),
                })

        # Prepare metadata
        metadata = self._parse_kv_pairs(metadata_pairs)
        metadata["source_file"] = os.path.basename(input_path)

        golden_question = {
            "id": f"{id_prefix}_{uuid.uuid4().hex[:8]}",
            "user_inputs": user_inputs,
            "agents_evaluated": [agent_name],
            "metadata": metadata,
            "reference_data": {
                "reference_tool_interactions": reference_tool_interactions,
                "reference_trajectory": [agent_name],
            },
            "updated_datetime": datetime.now().strftime("%Y-%m-%d"),
        }

        output_data = {"golden_questions": [golden_question]}

        if os.path.exists(output_path):
            try:
                with open(output_path, "r") as f:
                    existing_data = json.load(f)
                    if isinstance(existing_data,
                                  dict) and "golden_questions" in existing_data:
                        existing_data["golden_questions"].append(
                            golden_question)
                        output_data = existing_data
            except Exception:
                pass

        with open(output_path, "w") as f:
            json.dump(output_data, f, indent=4)

        return output_data
