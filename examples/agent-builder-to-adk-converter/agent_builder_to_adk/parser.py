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

"""Parser, cycle detector, and topological layering engine for Agent Builder workflows."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from pydantic import ValidationError

from agent_builder_to_adk.models import (
    AgentBuilderExport,
    AgentFlow,
    ParsedWorkflow,
    WorkflowEdge,
    WorkflowNode,
)


class WorkflowParseError(ValueError):
    """Raised when an Agent Builder workflow export JSON cannot be parsed or validated."""
    pass


def find_cycles(
    nodes: Dict[str, WorkflowNode],
    outgoing: Dict[str, List[WorkflowEdge]],
) -> List[List[str]]:
    """Detect cycles in the workflow DAG using depth-first search traversal.

    Args:
        nodes: Mapping of node ID to WorkflowNode.
        outgoing: Mapping of node ID to list of outgoing edges.

    Returns:
        List of detected cyclic paths (each represented as a list of node IDs).
    """
    visited: Set[str] = set()
    recursion_stack: Set[str] = set()
    current_path: List[str] = []
    cycles: List[List[str]] = []

    def dfs(node_id: str):
        visited.add(node_id)
        recursion_stack.add(node_id)
        current_path.append(node_id)

        for edge in outgoing.get(node_id, []):
            target = edge.target_node_id
            if target not in visited:
                dfs(target)
            elif target in recursion_stack:
                cycle_start_index = current_path.index(target)
                cycle_path = current_path[cycle_start_index:] + [target]
                cycles.append(cycle_path)

        current_path.pop()
        recursion_stack.remove(node_id)

    for node_id in nodes:
        if node_id not in visited:
            dfs(node_id)

    return cycles


def compute_layers(
    nodes: Dict[str, WorkflowNode],
    outgoing: Dict[str, List[WorkflowEdge]],
    incoming: Dict[str, List[WorkflowEdge]],
    roots: List[str],
) -> List[List[str]]:
    """Assigns workflow nodes into topological execution layers.

    Layer 0 comprises root nodes (triggers or source nodes without incoming dependencies).
    Subsequent layers contain nodes whose predecessor dependencies are resolved in prior layers.
    Includes cycle guards to ensure convergence on cyclic or self-referential workflows.

    Args:
        nodes: Mapping of node ID to WorkflowNode.
        outgoing: Adjacency list for outgoing edges.
        incoming: Adjacency list for incoming edges.
        roots: Detected or designated root node IDs.

    Returns:
        Ordered list of layers, where each layer is a list of node IDs.
    """
    if not nodes:
        return []

    layer_assignment: Dict[str, int] = {}
    for r in roots:
        layer_assignment[r] = 0

    max_iterations = len(nodes) + 2
    for _ in range(max_iterations):
        updated = False
        for node_id in nodes:
            current_layer = layer_assignment.get(node_id, 0)
            for edge in outgoing.get(node_id, []):
                target = edge.target_node_id
                target_layer = layer_assignment.get(target, 0)
                if current_layer + 1 > target_layer:
                    layer_assignment[target] = current_layer + 1
                    updated = True
        if not updated:
            break

    for node_id in nodes:
        if node_id not in layer_assignment:
            pred_layers = [
                layer_assignment[e.source_node_id]
                for e in incoming.get(node_id, [])
                if e.source_node_id in layer_assignment
            ]
            layer_assignment[node_id] = max(pred_layers) + 1 if pred_layers else 0

    max_layer = max(layer_assignment.values()) if layer_assignment else 0
    layers: List[List[str]] = [[] for _ in range(max_layer + 1)]

    node_id_order = {nid: idx for idx, nid in enumerate(nodes.keys())}
    for node_id, l_idx in layer_assignment.items():
        layers[l_idx].append(node_id)

    for layer in layers:
        layer.sort(key=lambda nid: node_id_order.get(nid, 0))

    return [l for l in layers if l]


def parse_workflow(source: Union[str, Path, Dict[str, Any]]) -> ParsedWorkflow:
    """Parse and validate an Agent Builder workflow JSON export.

    Args:
        source: File path, JSON string, or raw dictionary containing the workflow definition.

    Returns:
        ParsedWorkflow: Normalized workflow model ready for analysis or code generation.

    Raises:
        WorkflowParseError: If JSON syntax is invalid or schema contracts are violated.
        TypeError: If input source type is unsupported.
    """
    raw_data: Dict[str, Any]

    if not isinstance(source, (str, Path, dict)):
        raise TypeError(f"Unsupported workflow source type: {type(source).__name__}")

    if isinstance(source, Path) or (isinstance(source, str) and not source.strip().startswith("{") and not source.strip().startswith("[")):
        if isinstance(source, str) and not source.strip():
            raise WorkflowParseError("Empty workflow source string.")
        file_path = Path(source)
        if not file_path.exists():
            raise WorkflowParseError(f"Workflow file does not exist: {file_path}")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
        except json.JSONDecodeError as err:
            raise WorkflowParseError(f"Invalid JSON in file {file_path}: {err}") from err
        except Exception as err:
            raise WorkflowParseError(f"Error reading {file_path}: {err}") from err
    elif isinstance(source, str):
        if not source.strip():
            raise WorkflowParseError("Empty workflow source string.")
        try:
            raw_data = json.loads(source)
        except json.JSONDecodeError as err:
            raise WorkflowParseError(f"Invalid JSON string payload: {err}") from err
    elif isinstance(source, dict):
        raw_data = source
    else:
        raise TypeError(f"Unsupported workflow source type: {type(source)}")

    if not isinstance(raw_data, dict) or not raw_data:
        raise WorkflowParseError("Expected top-level JSON structure to be a non-empty object.")

    # Locate agentFlow and metadata
    display_name = raw_data.get("displayName") or raw_data.get("name") or "AgentWorkflow"
    description = raw_data.get("description") or ""
    agent_id = Path(raw_data.get("name", "agent")).name or "agent"

    flow_data: Optional[Dict[str, Any]] = None

    if "workflowAgentDefinition" in raw_data and isinstance(raw_data["workflowAgentDefinition"], dict):
        wad = raw_data["workflowAgentDefinition"]
        if "agentFlow" in wad and isinstance(wad["agentFlow"], dict):
            flow_data = wad["agentFlow"]
    elif "agentFlow" in raw_data and isinstance(raw_data["agentFlow"], dict):
        flow_data = raw_data["agentFlow"]
    elif "nodes" in raw_data and isinstance(raw_data["nodes"], list):
        flow_data = raw_data

    if not flow_data:
        raise WorkflowParseError(
            "Missing 'workflowAgentDefinition.agentFlow' or 'nodes'/'edges' in Agent Builder export JSON."
        )

    try:
        flow = AgentFlow.model_validate(flow_data)
    except ValidationError as err:
        raise WorkflowParseError(f"Schema validation failed for agent flow: {err}") from err

    # Index nodes and edges
    nodes_map: Dict[str, WorkflowNode] = {node.id: node for node in flow.nodes}

    # Validate that all edges connect existing nodes
    for edge in flow.edges:
        if edge.source_node_id not in nodes_map or edge.target_node_id not in nodes_map:
            raise WorkflowParseError(
                f"Invalid edge references non-existent node: '{edge.source_node_id}' -> '{edge.target_node_id}'"
            )

    valid_edges: List[WorkflowEdge] = flow.edges

    # Construct adjacency maps
    outgoing: Dict[str, List[WorkflowEdge]] = {nid: [] for nid in nodes_map}
    incoming: Dict[str, List[WorkflowEdge]] = {nid: [] for nid in nodes_map}

    for edge in valid_edges:
        outgoing[edge.source_node_id].append(edge)
        incoming[edge.target_node_id].append(edge)

    # Compute root nodes: nodes without incoming edges
    roots: List[str] = [nid for nid, inc in incoming.items() if len(inc) == 0]

    # If all nodes have incoming edges (cyclic or loop), prioritize trigger nodes
    if not roots and nodes_map:
        trigger_ids = [
            nid for nid, node in nodes_map.items()
            if node.node_type == "CONNECTOR_EVENT_TRIGGER"
        ]
        roots = trigger_ids if trigger_ids else [next(iter(nodes_map.keys()))]

    # Compute topological layers
    layers = compute_layers(nodes_map, outgoing, incoming, roots)

    return ParsedWorkflow(
        agent_id=str(agent_id),
        display_name=str(display_name),
        description=str(description),
        nodes=nodes_map,
        edges=valid_edges,
        roots=roots,
        layers=layers,
    )
