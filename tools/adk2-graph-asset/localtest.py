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
Local test runner for the ADK2 graph agent (no GCP deployment needed).
 
Usage
─────
    python localtest.py [<graph_yaml>] [<message>]
 
    graph_yaml  path to YAML graph definition  (default: sample_graph.yaml)
    message     optional free-form message override
 
Examples
────────
    # Use input variables defined in the YAML
    python localtest.py
 
    # Custom message
    python localtest.py sample_graph.yaml "Tell me a joke about AI in Tokyo"
"""
import asyncio
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.WARNING)  # suppress ADK debug noise locally

_DEFAULT_YAML = "sample_graph.yaml"
_DEFAULT_INPUTS = {"topic": "programming", "place": "San Francisco"}


async def _run(yaml_path: str, inputs: dict) -> None:
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types as genai_types

    from agent.gcp_config import init_vertex_ai
    from agent.graph_builder import build_agent_from_yaml, load_yaml

    # ── Initialise Vertex AI ─────────────────────────────────────────────────
    gcp_config = init_vertex_ai()
    print(
        f"Vertex AI ready – project={gcp_config['project']}  "
        f"location={gcp_config['location']}\n"
    )

    # ── Build ADK agent from YAML ────────────────────────────────────────────
    root_agent, node_templates, input_schema = build_agent_from_yaml(yaml_path)
    print(f"Agent     : {root_agent.name}")
    print(f"Inputs    : {input_schema}")
    print(f"Templates : {node_templates}\n")

    # ── Set up ADK runner ────────────────────────────────────────────────────
    session_service = InMemorySessionService()
    runner = Runner(
        agent=root_agent,  # type: ignore[arg-type]
        app_name=root_agent.name,
        session_service=session_service,
    )

    # ── Create session with input state ─────────────────────────────────────
    await session_service.create_session(
        app_name=root_agent.name,
        user_id="local_test_user",
        session_id="local_test_session",
        state=dict(inputs),
    )

    # ── Build user message from template ────────────────────────────────────
    user_message: str
    if node_templates:
        template = next(iter(node_templates.values()))
        try:
            user_message = template.format(**inputs)
        except (KeyError, ValueError):
            user_message = str(inputs)
    else:
        user_message = "  ".join(f"{k}: {v}" for k, v in inputs.items())

    print(f"User message: {user_message!r}\n")
    print("─" * 60)

    # ── Execute ──────────────────────────────────────────────────────────────
    content = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=user_message)],
    )

    response_text = ""
    async for event in runner.run_async(
        user_id="local_test_user",
        session_id="local_test_session",
        new_message=content,
    ):
        # ADK 2.0 Workflow streams intermediate partial events (event.partial=True)
        # and wraps the same output through multiple node levels.
        # Only collect from the final root-level event to get one clean response.
        if getattr(event, "content", None) and getattr(event, "content").parts:
            response_text = getattr(event, "content").parts[0].text

    print(response_text if response_text else "(no output received)")


def main() -> None:
    yaml_path = sys.argv[1] if len(sys.argv) > 1 else _DEFAULT_YAML

    # If a second argument is given, treat it as a raw message
    if len(sys.argv) > 2:
        inputs = {"input": sys.argv[2]}
    else:
        inputs = _DEFAULT_INPUTS

    # Resolve YAML relative to the script directory
    p = Path(yaml_path)
    if not p.is_absolute():
        p = Path(__file__).parent / p
    if not p.exists():
        print(f"ERROR: YAML file not found: {p}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(_run(str(p), inputs))


if __name__ == "__main__":
    main()
