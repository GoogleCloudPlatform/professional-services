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

"""
YamlAdkAgent — an ADK2 graph agent built from a YAML definition.
 
This class follows the Agent Engine contract:
  • __init__  : lightweight; stores only the YAML path
  • set_up()  : called by Agent Engine after deployment; loads heavy deps
  • query()   : called per-request with an inputs dict; returns {output: str}
 
Query inputs
────────────
Pass a dict whose keys match the `inputs` variables declared in the YAML nodes.
For the sample YAML:
    agent.query({"topic": "Python", "place": "Amsterdam"})
 
The YAML `instructions` field template  "Tell me a joke on a {topic} and {place}"
is formatted with the inputs and sent as the user message to the Workflow.
 
Session management
──────────────────
Sessions are identified by (user_id, session_id).  The same session_id across
multiple query() calls gives the agent conversational memory (turn history).
 
Two session backends are used automatically:
 
  • Local / no AGENT_ENGINE_RESOURCE_NAME env var:
      InMemorySessionService — fast, no setup, but data is lost on restart.
      Best for local development and localtest.py runs.
 
  • Deployed on GCP Agent Engine (AGENT_ENGINE_RESOURCE_NAME env var present):
      VertexAiSessionService — persistent, managed by Vertex AI Agent Engine.
      Sessions survive restarts and scale across instances.
      The resource name is set automatically when Agent Engine calls set_up().
 
Session state updates
─────────────────────
Per ADK docs, session state must NEVER be modified directly on the object
returned by get_session() / create_session(). Changes must flow through the
ADK event system (EventActions.state_delta) to be tracked and persisted.
This class uses the output_key mechanism (handled automatically by the Runner)
for state updates.
 
Async / event-loop handling
───────────────────────────
ADK runners are async.  When called from Agent Engine (which runs a sync
HTTP handler), asyncio.run() works fine.  For environments that already have
a running event loop (e.g. Jupyter, nested async frameworks) we fall back to
running on a new thread.
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import os
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from google.adk import Workflow
    from google.adk.runners import Runner
    from google.adk.sessions import BaseSessionService


def _setup_tracing() -> None:
    """Enable Cloud Trace using ADK's built-in telemetry module.

    This uses the same OTel infrastructure that `adk deploy --trace_to_cloud`
    sets up, giving you rich ADK spans (invoke_agent, call_llm, execute_tool)
    automatically for every runner.run_async() call.  No extra packages needed
    — the telemetry modules ship with google-adk.
    """
    from google.adk import telemetry
    from google.adk.telemetry import google_cloud

    hooks = google_cloud.get_gcp_exporters(enable_cloud_tracing=True)
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider

        provider = TracerProvider()
        for sp in hooks.span_processors:
            provider.add_span_processor(sp)
        trace.set_tracer_provider(provider)
    except Exception as e:
        logger.error("Failed to configure OTel tracing: %s", e)


logger = logging.getLogger(__name__)

_DEFAULT_YAML = "sample_graph.yaml"

# Set by Agent Engine at runtime when deployed; absent when running locally.
_AGENT_ENGINE_RESOURCE_NAME_ENV = "AGENT_ENGINE_RESOURCE_NAME"


class YamlAdkAgent:
    """
    Agent Engine-compatible wrapper that builds an ADK2 graph at set_up() time
    from a YAML file, then executes queries via the ADK Runner.
    """

    def __init__(self, yaml_path: str = _DEFAULT_YAML) -> None:
        self.yaml_path = yaml_path
        # These are populated in set_up()
        self._root_agent: Workflow | None = None
        self._runner: Runner | None = None
        self._session_service: BaseSessionService | None = None
        self._node_templates: dict[str, str] = {}
        self._input_schema: dict[str, str] = {}
        self._app_name: str = ""  # set from root_agent.name in set_up()

    # ──────────────────────────────────────────────────────────────────────────
    # Agent Engine lifecycle
    # ──────────────────────────────────────────────────────────────────────────

    def set_up(self) -> None:
        """
        Initialise Vertex AI credentials, build the ADK2 graph agent, and
        prepare the ADK Runner + session service.

        Session backend selection
        ─────────────────────────
        • If AGENT_ENGINE_RESOURCE_NAME is set in the environment (i.e., the
          agent is running inside GCP Agent Engine), VertexAiSessionService is
          used so that conversation history persists across restarts / instances.
        • Otherwise, InMemorySessionService is used (local development).

        Called once by Agent Engine immediately after the agent is instantiated.
        """
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService

        from agent.gcp_config import init_vertex_ai
        from agent.graph_builder import build_agent_from_yaml

        gcp_config = init_vertex_ai()
        _setup_tracing()
        logger.info(
            "Vertex AI ready – project=%s  location=%s",
            gcp_config["project"],
            gcp_config["location"],
        )

        # Resolve YAML path relative to this file (works both locally and when
        # the package is deployed as extra_packages=["."])
        yaml_path = self._resolve_yaml_path()

        self._root_agent, self._node_templates, self._input_schema = (
            build_agent_from_yaml(yaml_path)
        )
        self._app_name = self._root_agent.name
        logger.info(
            "ADK2 graph agent '%s' built.  Input schema: %s",
            self._app_name,
            self._input_schema,
        )

        # ── Session service: persistent on Agent Engine, in-memory locally ────
        resource_name = os.environ.get(_AGENT_ENGINE_RESOURCE_NAME_ENV, "").strip()
        if resource_name:
            from google.adk.sessions import VertexAiSessionService

            self._session_service = VertexAiSessionService(
                project=gcp_config["project"],
                location=gcp_config["location"],
            )
            # For VertexAiSessionService the app_name must be the full
            # reasoning engine resource name.
            self._app_name = resource_name
            logger.info(
                "Using VertexAiSessionService (persistent).  " "Reasoning Engine: %s",
                resource_name,
            )
        else:
            self._session_service = InMemorySessionService()
            logger.info("Using InMemorySessionService (non-persistent – local mode).")

        self._runner = Runner(
            agent=self._root_agent,  # type: ignore[arg-type]
            app_name=self._app_name,
            session_service=self._session_service,
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Public query interface
    # ──────────────────────────────────────────────────────────────────────────

    def query(
        self,
        inputs: dict[Any, Any],
        user_id: str = "default_user",
        session_id: str = "default_session",
    ) -> dict[Any, Any]:
        """
        Run a single query through the ADK2 graph agent.

        Parameters
        ----------
        inputs:
            Dict of input values.  Keys should match the YAML input variables
            (e.g. ``{"topic": "Python", "place": "Amsterdam"}``).
            Also accepts ``{"input": "free-form message"}`` for plain text.
        user_id:
            Identifies the user; used for session scoping.
        session_id:
            Identifies the conversation thread.

        Returns
        -------
        dict with key ``"output"`` containing the agent's text response.
        """
        # Allow inputs to also carry user_id / session_id as dict keys
        # (convenient for Agent Engine REST callers).
        if isinstance(inputs, dict):
            user_id = inputs.pop("user_id", user_id)
            session_id = inputs.pop("session_id", session_id)

        coro = self._async_query(inputs, user_id, session_id)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # Already inside an event loop (e.g. Jupyter / nested async)
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return asyncio.run(coro)

    # ──────────────────────────────────────────────────────────────────────────
    # Internal async implementation
    # ──────────────────────────────────────────────────────────────────────────

    async def _async_query(
        self,
        inputs: dict,
        user_id: str,
        session_id: str,
    ) -> dict:
        from google.genai import types as genai_types

        # Ensure set_up() has been called by Agent Engine
        assert self._session_service is not None, "Session service not initialized"
        assert self._runner is not None, "Runner not initialized"

        # ── Build user message from YAML template + inputs ────────────────────
        # The YAML `instructions` template (e.g. "Tell me a joke on a {topic}
        # and {place}") is formatted here with the caller-supplied inputs and
        # becomes the turn's user message.  This is the correct ADK 2.0 pattern:
        # the Agent.instruction is a static system prompt; dynamic values enter
        # through the user message content.
        user_message = self._format_user_message(inputs)

        # ── Create or resume session ──────────────────────────────────────────
        # The Runner owns the session lifecycle and calls append_event() after
        # every turn, which is the only correct way to update session state per
        # the ADK docs (direct session.state mutation is explicitly discouraged).
        # We only need to ensure the session object exists before run_async().
        session = await self._session_service.get_session(
            app_name=self._app_name,
            user_id=user_id,
            session_id=session_id,
        )
        if session is None:
            # First turn for this (user_id, session_id) pair — create a fresh
            # session with empty state.  The Runner will populate history via
            # append_event() automatically.
            session = await self._session_service.create_session(
                app_name=self._app_name,
                user_id=user_id,
                session_id=session_id,
            )
            logger.info(
                "Created new session user_id=%s session_id=%s",
                user_id,
                session_id,
            )
        else:
            logger.info(
                "Resumed session user_id=%s session_id=%s  " "(turns in history: %d)",
                user_id,
                session_id,
                len(session.events),
            )

        # ── Execute the Workflow ─────────────────────────────────────────────
        content = genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=user_message)],
        )

        response_text = ""
        async for event in self._runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content,
        ):
            # Only collect from the final root-level event (non-partial, root author).
            # This skips partial streaming token events and intermediate node events.
            if getattr(event, "content", None) and getattr(event, "content").parts:
                response_text = getattr(event, "content").parts[0].text

        logger.info("Query completed.  Response length: %d chars", len(response_text))
        return {"output": response_text}

    # ──────────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _format_user_message(self, inputs: dict) -> str:
        """
        Build the user-turn message.

        Priority:
        1. If there is exactly one LLM node template, format it with `inputs`.
        2. If `inputs` has a ``"message"`` or ``"input"`` key, use that value.
        3. Fall back to  "key: value, …"  concatenation.
        """
        if self._node_templates:
            template = next(iter(self._node_templates.values()))
            try:
                return template.format(**inputs)
            except (KeyError, ValueError):
                pass  # some variables missing — fall through

        if "message" in inputs:
            return inputs["message"]
        if "input" in inputs:
            return inputs["input"]

        skip = {"user_id", "session_id"}
        return "  ".join(f"{k}: {v}" for k, v in inputs.items() if k not in skip)

    def _resolve_yaml_path(self) -> str:
        """
        Return an absolute path to the YAML file whether running locally or
        from a deployed package root.
        """
        p = Path(self.yaml_path)
        if p.is_absolute() and p.exists():
            return str(p)

        # Try relative to the project root (parent of the agent/ package)
        project_root = Path(__file__).resolve().parents[1]
        candidate = project_root / self.yaml_path
        if candidate.exists():
            return str(candidate)

        # Try current working directory (Agent Engine deployment context)
        cwd_candidate = Path.cwd() / self.yaml_path
        if cwd_candidate.exists():
            return str(cwd_candidate)

        raise FileNotFoundError(
            f"Cannot locate YAML file '{self.yaml_path}'.  "
            "Make sure it is included via extra_packages=['.'] in deploy.py."
        )
