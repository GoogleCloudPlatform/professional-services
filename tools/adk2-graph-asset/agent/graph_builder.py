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
Parse a YAML graph definition and build an ADK2 agent graph.
 
Requires ADK 2.0 (Alpha):  pip install google-adk --pre
 
YAML schema supported
─────────────────────
  version / kind / metadata
  spec:
    llms:        list of LLM config blocks (id, provider, model, temperature, …)
    tools:       list of tool references  (unused in this builder – extend as needed)
    memory:      memory config            (unused in this builder – extend as needed)
  workflow:
    nodes:
      - id: start   type: start
      - id: <name>  type: llm    config: {llm_id, instructions, system_prompt, …}
                                  inputs: [{name, type}]
      - id: end     type: end
    edges:
      - source: <id>  target: <id>
  observability:
    tracing: {enabled: bool}
 
Instruction template
────────────────────
  The YAML `instructions` field may contain variable placeholders:
    {"input": "variable_name"}
  These are converted to Python str.format()-style {variable_name} markers and
  returned as `node_templates`.  The caller formats the template with real input
  values and sends the result as the user message to the Workflow at query time.
 
  ADK 2.0 Agent.instruction is a static string only (no callables).
  Therefore the YAML `system_prompt` (if any) becomes the Agent instruction.
  If system_prompt is empty a neutral default is used.
  The YAML `instructions` template drives the user message, not the agent instruction.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml
from google.adk import Agent, Workflow

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

# Matches  {"input": "topic"}  or  {"input":"place"}
_INPUT_PATTERN = re.compile(r'\{"input"\s*:\s*"([^"]+)"\}')


# ──────────────────────────────────────────────────────────────────────────────
# YAML helpers
# ──────────────────────────────────────────────────────────────────────────────


def load_yaml(path: str | Path) -> dict:
    """Load and parse a YAML file, returning a plain dict."""
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _extract_input_vars(text: str) -> list[str]:
    """Return variable names found inside {"input": "…"} markers."""
    return _INPUT_PATTERN.findall(text)


def _clean_template(text: str) -> str:
    """Replace {"input": "X"} markers with {X} for str.format()."""
    return _INPUT_PATTERN.sub(lambda m: "{" + m.group(1) + "}", text)


def _safe_name(name: str) -> str:
    """Convert a display name to a safe ADK agent identifier."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)


# ──────────────────────────────────────────────────────────────────────────────
# Main builder
# ──────────────────────────────────────────────────────────────────────────────


def build_agent_from_yaml(
    yaml_path: str | Path,
) -> tuple[Workflow, dict[str, str], dict[str, str]]:
    """
    Build an ADK2 graph agent (Workflow) from a YAML graph definition.

    Parameters
    ----------
    yaml_path:
        Path to the YAML file.

    Returns
    -------
    root_agent:
        An ADK2 Workflow wrapping one or more Agent nodes.
    node_templates:
        Mapping of  node_id → cleaned instruction template string
        (variable placeholders in {var} form).  The caller formats this
        template with real input values to build the user message at query time.
    input_schema:
        Mapping of  variable_name → type  collected from all LLM node
        input declarations in the YAML.
    """
    graph_dict = load_yaml(yaml_path)

    metadata = graph_dict.get("metadata", {})
    spec = graph_dict.get("spec", {})
    workflow = graph_dict.get("workflow", {})

    agent_name = _safe_name(metadata.get("name", "adk2_graph_agent"))
    agent_description = metadata.get("description", "")

    # ── LLM configs ───────────────────────────────────────────────────────────
    llm_configs: dict[str, dict] = {llm["id"]: llm for llm in spec.get("llms", [])}

    # ── Workflow nodes & edges ─────────────────────────────────────────────────
    nodes: list[dict] = workflow.get("nodes", [])
    edges: list[dict] = workflow.get("edges", [])

    adj: dict[str, list[str]] = {}
    for edge in edges:
        adj.setdefault(edge["source"], []).append(edge["target"])

    # ── Build per-node artefacts ───────────────────────────────────────────────
    node_agents: dict[str, Agent] = {}
    node_templates: dict[str, str] = {}
    input_schema: dict[str, str] = {}

    for node in nodes:
        if node.get("type") != "llm":
            continue

        node_id = node["id"]
        config = node.get("config", {})
        llm_id = config.get("llm_id", "")
        llm_cfg = llm_configs.get(llm_id, {})

        raw_instruction = config.get("instructions", "")
        system_prompt = (config.get("system_prompt") or "").strip()

        # Collect input schema
        for inp in node.get("inputs") or []:
            input_schema[inp["name"]] = inp.get("type", "text")

        # Store the instruction template (with {var} placeholders) so the
        # caller (adk_agent.py) can format it with real values as the user message.
        cleaned = _clean_template(raw_instruction)
        node_templates[node_id] = cleaned

        # ADK 2.0 Agent.instruction must be a static string.
        # Use the YAML system_prompt as the agent's behavioral instruction.
        # If empty, fall back to a neutral default.
        model_id = llm_cfg.get("model", "gemini-2.0-flash")
        effective_instruction = (
            system_prompt
            or "You are a helpful assistant. Fulfill the request in the user message."
        )

        # ADK 2.0 API: google.adk.Agent
        node_agents[node_id] = Agent(
            name=node_id,
            model=model_id,
            instruction=effective_instruction,
        )

    llm_node_ids = [n["id"] for n in nodes if n.get("type") == "llm"]

    if not llm_node_ids:
        raise ValueError("No LLM nodes found in the YAML graph definition.")

    # ── Assemble root Workflow ────────────────────────────────────────────────
    # ADK 2.0 graph API: Workflow(name=..., edges=[("START", agent1, agent2, ...)])
    # For a single LLM node the edge tuple is   ("START", sole_agent)
    # For multi-node sequential the tuple is     ("START", agent1, agent2, ...)
    ordered = _topological_order(nodes, adj, node_agents)

    root_agent = Workflow(
        name=agent_name,
        edges=[tuple(["START"] + list(ordered))],  # type: ignore[arg-type]
    )

    return root_agent, node_templates, input_schema


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────


def _topological_order(
    nodes: list[dict],
    adj: dict[str, list[str]],
    node_agents: dict[str, Agent],
) -> list[Agent]:
    """Return ADK2 Agent objects in BFS (topological) order starting from 'start' node."""
    end_ids = {n["id"] for n in nodes if n.get("type") == "end"}
    start_ids = [n["id"] for n in nodes if n.get("type") == "start"]
    start = start_ids[0] if start_ids else None

    if not start:
        return list(node_agents.values())

    ordered: list[Agent] = []
    queue = [start]
    seen: set[str] = set()

    while queue:
        curr = queue.pop(0)
        if curr in seen:
            continue
        seen.add(curr)
        if curr in node_agents:
            ordered.append(node_agents[curr])
        for nxt in adj.get(curr, []):
            if nxt not in seen and nxt not in end_ids:
                queue.append(nxt)

    return ordered or list(node_agents.values())
