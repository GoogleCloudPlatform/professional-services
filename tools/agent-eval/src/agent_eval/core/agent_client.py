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
import contextlib
import json
import logging
import re
import subprocess
import time
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

import requests

logger = logging.getLogger("agent_eval.agent_client")


class BaseAgentClient(ABC):
    """Abstract Base Class defining the contract for Agent Clients."""

    def __init__(self, app_name: str, user_id: str = "eval_user"):
        self.app_name = app_name
        self.user_id = user_id

    @abstractmethod
    def create_session(self, **session_data) -> str:
        """Creates a new session for the agent."""

    @abstractmethod
    def run_interaction(self, session_id: str, question: str) -> dict[str, Any]:
        """Sends a prompt turn to the agent and returns the response payload."""

    @abstractmethod
    def get_session_state(self, session_id: str) -> dict[str, Any]:
        """Retrieves the final state of the session."""

    @abstractmethod
    def get_session_trace(self, session_id: str) -> dict[str, Any]:
        """Retrieves the execution trace/telemetry of the session."""

    @staticmethod
    def get_final_payload_field(session_data: dict, field_name: str) -> Any:
        """Extracts a field from the final JSON payload event."""
        events = session_data.get("events", [])
        for event in reversed(events):
            content = event.get("content")
            if not content or not isinstance(content, dict):
                continue
            parts = content.get("parts", [])
            for part in parts:
                text = part.get("text", "")
                if text and "natural_language_response" in text:
                    try:
                        payload = json.loads(text)
                        return payload.get(field_name)
                    except (json.JSONDecodeError, TypeError):
                        continue
        return None


class AgentClient(BaseAgentClient):
    """
    A client for interacting with the Agent service.
    Encapsulates session creation, message sending, state retrieval, and trace analysis.
    """

    def __init__(
        self,
        base_url: str,
        app_name: str,
        user_id: str = "eval_user",
        token: str | None = None,
    ):
        """
        Initialize the AgentClient.

        Args:
            base_url: The base URL of the agent service.
            app_name: The name of the application/agent.
            user_id: The user ID to associate with sessions.
            token: Optional gcloud identity token. If not provided, it will be fetched using gcloud.
        """
        super().__init__(app_name, user_id)
        self.base_url = base_url.rstrip("/")
        self._token = token

    @property
    def token(self) -> str | None:
        """Returns the current token, fetching it if necessary. Returns None for localhost."""
        if self._is_localhost():
            return None
        if not self._token:
            self._token = self._fetch_gcloud_token()
        return self._token

    def _is_localhost(self) -> bool:
        """Check if the base_url is localhost (no auth needed)."""
        return "localhost" in self.base_url or "127.0.0.1" in self.base_url

    def _fetch_gcloud_token(self) -> str:
        """Fetches the gcloud identity token from the environment."""
        try:
            token = subprocess.check_output(
                ["gcloud", "auth", "print-identity-token"], text=True
            ).strip()
            return token
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            raise RuntimeError(
                f"Error getting gcloud token: {e}. "
                "Ensure you are logged in with 'gcloud auth login'."
            ) from e

    def _get_headers(self) -> dict[str, str]:
        """Returns the headers for API requests. Skips auth for localhost."""
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        # Only add Authorization header for non-localhost URLs
        if not self._is_localhost() and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def create_session(self, **session_data) -> str:
        """
        Creates a new session. session_data is optional.
        """
        session_id = f"session_{uuid.uuid4()}"
        url = f"{self.base_url}/apps/{self.app_name}/users/{self.user_id}/sessions/{session_id}"

        # If session_data has content, pass it as JSON.
        # If session_data is empty ({}), we pass None to json,
        # which usually results in a request with no body.
        payload = session_data if session_data else None

        logger.debug("Creating session: %s...", session_id)
        self._make_request("POST", url, json=payload)

        logger.debug("Session created successfully.")
        return session_id

    def run_interaction(
        self, session_id: str, question: str, streaming: bool = False
    ) -> dict[str, Any]:
        """
        Sends a question to the agent.

        Args:
            session_id: The current session ID.
            question: The user's question.

        Returns:
            The agent's response payload.
        """
        url = f"{self.base_url}/run"
        payload = {
            "app_name": self.app_name,
            "user_id": self.user_id,
            "session_id": session_id,
            "new_message": {"role": "user", "parts": [{"text": question}]},
            "streaming": streaming,
        }

        logger.debug("Sending question to agent...")
        return self._make_request("POST", url, json=payload)

    def get_session_state(self, session_id: str) -> dict[str, Any]:
        """
        Retrieves the final state of a session.

        Args:
            session_id: The session ID.

        Returns:
            The session state dictionary.
        """
        url = f"{self.base_url}/apps/{self.app_name}/users/{self.user_id}/sessions/{session_id}"
        logger.debug("Retrieving final session state...")
        return self._make_request("GET", url)

    def get_session_trace(self, session_id: str) -> dict[str, Any]:
        """
        Get the session trace. Tries multiple endpoints.

        Args:
            session_id: Session ID to retrieve trace for.

        Returns:
            The trace dictionary.

        Raises:
            RuntimeError: If trace cannot be retrieved.
        """
        urls = [
            f"{self.base_url}/debug/trace/session/{session_id}",
            f"{self.base_url}/apps/{self.app_name}/sessions/{session_id}/trace",
        ]

        for url in urls:
            try:
                # We use a custom retry loop here because of the 404/empty check logic
                # which is specific to traces being ready.
                trace = self._make_request_with_custom_retry(url)
                if trace:
                    logger.debug("Retrieved trace for session %s", session_id)
                    return trace
            except Exception as e:
                logger.warning("Failed to get trace from %s: %s", url, e)
                continue

        raise RuntimeError(
            f"Failed to retrieve trace for session {session_id} after trying all URLs."
        )

    def _make_request(self, method: str, url: str, **kwargs) -> Any:
        """Helper to make HTTP requests with retries."""
        headers = self._get_headers()
        # Merge headers if provided in kwargs, but don't overwrite Authorization if not needed
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))

        retries = 3
        delay = 1
        for i in range(retries):
            try:
                response = requests.request(method, url, headers=headers, **kwargs)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                if i < retries - 1:
                    logger.debug(
                        "Request failed with %s. Retrying in %d seconds...", e, delay
                    )
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise

    def _make_request_with_custom_retry(self, url: str) -> Any:
        """Specific retry logic for traces which might return 404 or empty initially."""
        headers = self._get_headers()
        retries = 5
        delay = 1
        for i in range(retries):
            try:
                response = requests.get(url, headers=headers)
                if response.status_code == 404:
                    if i < retries - 1:
                        time.sleep(delay)
                        delay *= 2
                        continue
                    else:
                        raise requests.exceptions.HTTPError(f"404 Not Found: {url}")

                response.raise_for_status()
                data = response.json()
                if data:
                    return data
                logger.debug("Trace empty, retrying in %d seconds...", delay)
            except requests.exceptions.RequestException:
                if i < retries - 1:
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise
            time.sleep(delay)
            delay *= 2
        raise RuntimeError("Retries exhausted")

    # --- Static Utility Methods for Analysis ---

    @staticmethod
    def analyze_trace_and_extract_spans(trace_data: list[dict]) -> list[dict]:
        """Analyzes raw trace data to build a tree and extract classified information."""

        class _SpanNode:
            def __init__(self, span_data):
                self.data = span_data
                self.id = span_data.get("span_id")
                self.parent_id = span_data.get("parent_span_id")
                self.children = []

            def add_child(self, child_node):
                self.children.append(child_node)

        def build_trace_tree(trace_data):
            span_nodes = {}
            for span in trace_data:
                span_nodes[span["span_id"]] = _SpanNode(span)
            root_nodes = []
            for _span_id, node in span_nodes.items():
                if node.parent_id and node.parent_id in span_nodes:
                    span_nodes[node.parent_id].add_child(node)
                else:
                    root_nodes.append(node)
            return root_nodes

        def extract_span_information(span_node):
            span_data = span_node.data
            name = span_data.get("name", "")
            attributes = span_data.get("attributes", {})
            start_time = span_data.get("start_time", 0)
            end_time = span_data.get("end_time", 0)
            duration_ms = (
                (end_time - start_time) / 1_000_000 if start_time and end_time else 0
            )

            extracted_info = {
                "name": name,
                "span_id": span_data.get("span_id"),
                "parent_span_id": span_data.get("parent_span_id"),
                "duration_ms": round(duration_ms, 2),
                "type": "OTHER",
                "details": {},
            }

            if "agent_run" in name or "invoke_agent" in name:
                extracted_info["type"] = "AGENT_RUN"
                try:
                    # Support "agent_run [name]", "agent_run[name]", "invoke_agent name"
                    if "[" in name and "]" in name:
                        extracted_info["details"]["agent_name"] = re.search(
                            r"\[(.*)\]", name
                        ).group(1)
                    else:
                        # Assume "invoke_agent name" or similar
                        parts = name.split(maxsplit=1)
                        if len(parts) > 1:
                            extracted_info["details"]["agent_name"] = parts[1].strip()
                        else:
                            extracted_info["details"]["agent_name"] = "unknown"
                except (IndexError, AttributeError):
                    extracted_info["details"]["agent_name"] = "unknown"
            elif "tool_call" in name or "execute_tool" in name:
                extracted_info["type"] = "TOOL_CALL"
                tool_name = attributes.get("gen_ai.tool.name")
                if not tool_name:
                    try:
                        tool_name = re.search(r"\[(.*)\]", name).group(1)
                    except (IndexError, AttributeError):
                        # Fallback for "execute_tool name"
                        tool_name = name.split(" ")[-1] if " " in name else "unknown"

                extracted_info["details"]["tool_name"] = tool_name

                if "gcp.vertex.agent.tool_call_args" in attributes:
                    try:
                        extracted_info["details"]["arguments"] = json.loads(
                            attributes["gcp.vertex.agent.tool_call_args"]
                        )
                    except (json.JSONDecodeError, TypeError):
                        extracted_info["details"]["arguments"] = attributes[
                            "gcp.vertex.agent.tool_call_args"
                        ]

            # Check if it's a tool response (sometimes unified in execute_tool span)
            if "tool_response" in name or (
                "execute_tool" in name
                and "gcp.vertex.agent.tool_response" in attributes
            ):
                if (
                    extracted_info["type"] == "OTHER"
                ):  # Don't overwrite if already classified as call
                    extracted_info["type"] = "TOOL_RESPONSE"

                if "gcp.vertex.agent.tool_response" in attributes:
                    try:
                        tool_response = json.loads(
                            attributes["gcp.vertex.agent.tool_response"]
                        )
                        extracted_info["details"]["response"] = tool_response
                    except (json.JSONDecodeError, TypeError):
                        extracted_info["details"]["raw_response"] = attributes[
                            "gcp.vertex.agent.tool_response"
                        ]

            elif name == "call_llm":
                extracted_info["type"] = "LLM_CALL"
                if "gen_ai.request.model" in attributes:
                    extracted_info["details"]["model"] = attributes[
                        "gen_ai.request.model"
                    ]
                if "gcp.vertex.agent.llm_request" in attributes:
                    with contextlib.suppress(json.JSONDecodeError, TypeError):
                        extracted_info["details"]["request"] = json.loads(
                            attributes["gcp.vertex.agent.llm_request"]
                        )
                if "gcp.vertex.agent.llm_response" in attributes:
                    with contextlib.suppress(json.JSONDecodeError, TypeError):
                        extracted_info["details"]["response"] = json.loads(
                            attributes["gcp.vertex.agent.llm_response"]
                        )

            if "http.method" in attributes:
                extracted_info["type"] = "HTTP_REQUEST"
                extracted_info["details"]["method"] = attributes.get("http.method")
                extracted_info["details"]["url"] = attributes.get("http.url")
                extracted_info["details"]["status_code"] = attributes.get(
                    "http.status_code"
                )

            return extracted_info

        def traverse_and_extract(span_node):
            extracted_info = extract_span_information(span_node)
            extracted_info["children"] = [
                traverse_and_extract(child) for child in span_node.children
            ]
            return extracted_info

        root_nodes = build_trace_tree(trace_data)
        return [traverse_and_extract(root) for root in root_nodes]

    @staticmethod
    def get_latency_from_spans(analyzed_trace: list[dict]) -> list[dict]:
        """Extracts latency information from the analyzed trace."""

        def process_span(span):
            span_type = span.get("type")
            name = span.get("name")

            if span_type == "HTTP_REQUEST":
                details = span.get("details", {})
                method = details.get("method", "")
                url = details.get("url", "")
                name = f"{method} [{url}]"

            latency_info = {
                "name": name,
                "type": span_type,
                "duration_seconds": round(span.get("duration_ms", 0) / 1000.0, 4),
            }
            children = span.get("children")
            if children:
                latency_info["children"] = [process_span(child) for child in children]
            return latency_info

        return [process_span(root) for root in analyzed_trace]

    @staticmethod
    def get_agent_trajectory(analyzed_trace: list[dict]) -> list[str]:
        """
        Extracts the sequence of agents and tools invoked.

        Captures:
        - AGENT_RUN spans (direct agent invocations)
        - TOOL_CALL spans (tools and sub-agents called as tools)
        - Legacy span naming patterns

        Returns a deduplicated list showing the execution flow.
        """
        trajectory = []
        seen = set()  # Track seen items to avoid duplicates from parallel spans

        def traverse(span):
            span_type = span.get("type", "")
            details = span.get("details", {})
            name = span.get("name", "")

            item = None

            # 1. AGENT_RUN spans - direct agent invocations
            if span_type == "AGENT_RUN":
                agent_name = details.get("agent_name")
                if agent_name:
                    item = f"agent:{agent_name}"

            # 2. TOOL_CALL spans - tools and sub-agents called as tools
            elif span_type == "TOOL_CALL":
                tool_name = details.get("tool_name")
                if tool_name:
                    # Check if it looks like a sub-agent (typically PascalCase with "Agent" suffix)
                    if tool_name.endswith("Agent") or tool_name == "transfer_to_agent":
                        item = f"sub-agent:{tool_name}"
                    else:
                        item = f"tool:{tool_name}"

            # 3. Fallback for old traces or unclassified spans (legacy check)
            elif "agent_run" in name.lower():
                match = re.search(r"\[(.*)\]", name)
                if match:
                    item = f"agent:{match.group(1)}"

            # Add to trajectory if not a duplicate
            if item and item not in seen:
                seen.add(item)
                trajectory.append(item)

            for child in span.get("children", []):
                traverse(child)

        for root in analyzed_trace:
            traverse(root)
        return trajectory

    @staticmethod
    def get_state_variable(session_data: dict, variable: str) -> Any:
        """Extracts a state variable from the session data."""
        state = session_data.get("state", {})
        return state.get(variable, None)

    @staticmethod
    def get_tool_interactions(session_data: dict) -> list[dict[str, Any]]:
        """
        Extracts a chronological list of tool interactions (call and response pairs) from the session events.

        Returns:
            A list of dictionaries, where each dictionary represents a tool execution:
            {
                "tool_name": str,
                "input_arguments": dict,
                "output_result": Any,
                "call_id": str
            }
        """
        events = session_data.get("events", [])
        interactions = []
        pending_calls = {}  # Map call_id to partial interaction dict

        for event in events:
            content = event.get("content")
            if not content or not isinstance(content, dict):
                continue
            parts = content.get("parts", [])
            for part in parts:
                # Handle Function Call (supports both camelCase and snake_case)
                call = part.get("functionCall") or part.get("function_call")
                if call and isinstance(call, dict):
                    call_id = call.get("id")
                    tool_name = call.get("name")
                    args = call.get("args")

                    if call_id:
                        pending_calls[call_id] = {
                            "tool_name": tool_name,
                            "input_arguments": args,
                            "call_id": call_id,
                            "output_result": None,  # Placeholder
                        }

                # Handle Function Response (supports both camelCase and snake_case)
                response = part.get("functionResponse") or part.get("function_response")
                if response and isinstance(response, dict):
                    call_id = response.get("id")
                    resp_content = response.get("response")
                    result = None
                    if resp_content and isinstance(resp_content, dict):
                        result = resp_content.get("result")
                    if not result and resp_content:
                        result = resp_content

                    if call_id and call_id in pending_calls:
                        interaction = pending_calls.pop(call_id)
                        interaction["output_result"] = result
                        interactions.append(interaction)

        # Add any calls that didn't get a response (e.g. failed or interrupted)
        for _, interaction in pending_calls.items():
            interaction["status"] = "no_response"
            interactions.append(interaction)

        return interactions

    @staticmethod
    def get_sub_agent_trace(session_data: dict) -> list[dict[str, Any]]:
        """
        Extracts the sequence of agent turns and their text responses.

        Returns:
            A list of dictionaries, where each dictionary represents an agent's turn:
            {
                "agent_name": str,
                "text_response": str,
                "timestamp": float
            }
        """
        events = session_data.get("events", [])
        trace = []

        for event in events:
            author = event.get("author")
            # Skip user events
            if author == "user":
                continue

            content = event.get("content")
            if not content or not isinstance(content, dict):
                continue
            parts = content.get("parts", [])
            text_content = []

            for part in parts:
                if part.get("text"):
                    text_content.append(part["text"])

            if text_content:
                trace.append(
                    {
                        "agent_name": author,
                        "text_response": "\n".join(text_content),
                        "timestamp": event.get("timestamp"),
                    }
                )

        return trace


class LocalAgentClient(BaseAgentClient):
    """An in-process, local client for interacting with an ADK agent/workflow instance.

    Shares the same interface as AgentClient but executes calls in-process.
    """

    def __init__(self, agent_instance: Any, app_name: str, user_id: str = "eval_user"):
        super().__init__(app_name, user_id)
        self.agent_instance = agent_instance
        self.base_url = "local://in-process"
        self.sessions = {}

    def create_session(self, **session_data) -> str:
        session_id = f"local_session_{uuid.uuid4()}"
        self.sessions[session_id] = {
            "state": session_data.get("state") or {},
            "events": [],
        }
        return session_id

    async def _run_interaction_async(
        self, session_id: str, question: str
    ) -> dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        from google.adk.agents.invocation_context import InvocationContext
        from google.adk.sessions.session import Session as AdkSession

        # 1. Rebuild ADK session and context
        adk_session = AdkSession(
            id=session_id,
            user_id=self.user_id,
            app_name=self.app_name,
            state=session["state"],
        )

        from google.adk.sessions.in_memory_session_service import InMemorySessionService

        session_service = InMemorySessionService()
        inv_context = InvocationContext(
            session_service=session_service,
            invocation_id=f"inv_{uuid.uuid4()}",
            session=adk_session,
        )

        # 2. Run the agent in-process!
        response_text = ""

        if hasattr(self.agent_instance, "run_async"):
            async for event in self.agent_instance.run_async(inv_context):
                if hasattr(event, "is_final_response") and event.is_final_response():
                    response_text = event.output or ""
                    if not response_text and event.content:
                        response_text = "".join(
                            part.text
                            for part in event.content.parts
                            if hasattr(part, "text")
                        )
        else:
            res = self.agent_instance(inv_context)
            response_text = res.output or "" if hasattr(res, "output") else str(res)

        # 3. Update session state and mock events
        user_event = {
            "author": "user",
            "content": {"parts": [{"text": question}]},
            "timestamp": datetime.now().isoformat(),
        }
        model_event = {
            "author": self.app_name,
            "content": {"parts": [{"text": response_text}]},
            "timestamp": datetime.now().isoformat(),
        }

        session["events"].extend([user_event, model_event])
        session["state"] = adk_session.state

        return {
            "response": response_text,
            "session_id": session_id,
            "state": adk_session.state,
        }

    def run_interaction(self, session_id: str, question: str) -> dict[str, Any]:
        """Synchronous wrapper around async interaction execution."""
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                self._run_interaction_async(session_id, question), loop
            )
            return future.result()
        else:
            return asyncio.run(self._run_interaction_async(session_id, question))

    def get_session_state(self, session_id: str) -> dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")
        return {"events": session["events"], "state": session["state"]}

    def get_session_trace(self, session_id: str) -> dict[str, Any]:
        return {"spans": []}
