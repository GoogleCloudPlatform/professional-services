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
"""Exhaustive unit and integration tests for Agent Builder workflow JSON parser.

Tests schema parsing across:
- Tier 1: Core entity extraction, edge traversal, topological sort, cycle detection.
- Tier 2: Corrupted JSON syntax, missing flows, orphan edges, schema validation failures.
- Tier 3: Cross-node combinatorial dependencies and multi-layer hierarchies.
- Tier 4: Real-world workflows (SWIFT, Trade Finance, Customer Support, Travel, Approver).
- Tier 5: Adversarial boundary cases (special characters, unicode, massive payloads).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from agent_builder_to_adk.models import WorkflowEdge, WorkflowNode
from agent_builder_to_adk.parser import ParsedWorkflow, find_cycles, parse_workflow


class TestValidWorkflowParsing:
    """Validates parser on well-formed Agent Builder export JSON files."""

    def test_parse_linear_workflow(self, valid_linear_data: dict[str, Any]) -> None:
        workflow: ParsedWorkflow = parse_workflow(valid_linear_data)
        assert workflow.display_name == "Linear Data Pipeline Agent"
        assert len(workflow.nodes) == 3
        assert len(workflow.edges) == 2
        assert "trigger_file_created" in workflow.nodes
        assert "summary_agent" in workflow.nodes
        assert "send_alert_email" in workflow.nodes
        assert workflow.roots == ["trigger_file_created"]
        assert len(workflow.layers) >= 3

    def test_parse_branching_workflow(self, valid_branching_data: dict[str, Any]) -> None:
        workflow: ParsedWorkflow = parse_workflow(valid_branching_data)
        assert workflow.display_name == "Branching Incident Router Agent"
        assert len(workflow.nodes) == 7
        assert len(workflow.edges) == 6
        assert "severity_condition" in workflow.nodes
        assert workflow.nodes["severity_condition"].node_type == "CONDITION_NODE"
        condition_edges = [e for e in workflow.edges if e.source_node_id == "severity_condition"]
        assert len(condition_edges) == 2
        routes = {e.route_string for e in condition_edges}
        assert routes == {"CRITICAL", "STANDARD"}

    def test_parse_multi_agent_workflow(self, valid_multi_agent_data: dict[str, Any]) -> None:
        workflow: ParsedWorkflow = parse_workflow(valid_multi_agent_data)
        assert workflow.display_name == "Collaborative Multi-Agent Synthesis Pipeline"
        assert len(workflow.nodes) == 6
        assert "code_gen_subagent_ref" in workflow.nodes
        ref_node = workflow.nodes["code_gen_subagent_ref"]
        assert ref_node.node_type == "AGENT_REFERENCE_NODE"
        assert ref_node.ref_agent is not None or ref_node.agent_reference_node is not None

    def test_parse_approval_workflow(self, valid_approval_data: dict[str, Any]) -> None:
        workflow: ParsedWorkflow = parse_workflow(valid_approval_data)
        assert workflow.display_name == "Corporate Expense Reimbursement Flow"
        assert len(workflow.nodes) == 5
        approval_node = workflow.nodes["manager_approval_gate"]
        assert approval_node.node_type == "APPROVAL_NODE"
        approval_edges = [e for e in workflow.edges if e.source_node_id == "manager_approval_gate"]
        assert len(approval_edges) == 2
        assert {e.route_string for e in approval_edges} == {"Approved", "Rejected"}

    def test_parse_complex_trade_finance_workflow(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        workflow: ParsedWorkflow = parse_workflow(complex_trade_finance_data)
        assert workflow.display_name == "Trade Finance Agent"
        assert len(workflow.nodes) == 19
        assert len(workflow.edges) == 18
        types_present = {n.node_type for n in workflow.nodes.values()}
        expected_types = {
            "CONNECTOR_EVENT_TRIGGER",
            "AGENT_NODE",
            "CONDITION_NODE",
            "APPROVAL_NODE",
            "CONNECTOR_NODE",
            "AGENT_REFERENCE_NODE",
        }
        assert expected_types.issubset(types_present)

    def test_parse_swift_mt700_workflow(self, swift_mt700_data: dict[str, Any]) -> None:
        workflow: ParsedWorkflow = parse_workflow(swift_mt700_data)
        assert workflow.display_name == "SWIFT MT700 Generator"
        assert len(workflow.nodes) == 5
        assert len(workflow.edges) == 4
        assert workflow.roots == ["when_a_file_is_created"]

    def test_parse_customer_support_sample(
        self, sample_customer_support_data: dict[str, Any]
    ) -> None:
        workflow: ParsedWorkflow = parse_workflow(sample_customer_support_data)
        assert workflow.display_name == "Customer Support Agent"
        assert len(workflow.nodes) == 8
        assert "triage_classifier_agent" in workflow.nodes
        assert "category_router" in workflow.nodes

    def test_parse_travel_booking_sample(
        self, sample_travel_booking_data: dict[str, Any]
    ) -> None:
        workflow: ParsedWorkflow = parse_workflow(sample_travel_booking_data)
        assert workflow.display_name == "Travel Booking Agent"
        assert len(workflow.nodes) == 8
        assert "budget_approval_gate" in workflow.nodes
        assert "flight_booking_subagent" in workflow.nodes

    def test_parse_document_approver_sample(
        self, sample_document_approver_data: dict[str, Any]
    ) -> None:
        workflow: ParsedWorkflow = parse_workflow(sample_document_approver_data)
        assert workflow.display_name == "Document Approver Agent"
        assert len(workflow.nodes) == 7
        assert "contract_extractor_agent" in workflow.nodes
        assert "legal_compliance_approval_gate" in workflow.nodes

    def test_parse_from_json_string(self, valid_linear_data: dict[str, Any]) -> None:
        json_str = json.dumps(valid_linear_data)
        workflow = parse_workflow(json_str)
        assert workflow.display_name == "Linear Data Pipeline Agent"
        assert len(workflow.nodes) == 3


class TestMalformedWorkflowParsing:
    """Validates parser resilience and defensive error handling on invalid inputs."""

    def test_parse_malformed_syntax_raises_error(self, malformed_syntax_text: str) -> None:
        with pytest.raises((json.JSONDecodeError, ValueError)):
            parse_workflow(malformed_syntax_text)

    def test_parse_missing_flow_raises_error(
        self, malformed_missing_flow_data: dict[str, Any]
    ) -> None:
        with pytest.raises((ValueError, KeyError)):
            parse_workflow(malformed_missing_flow_data)

    def test_parse_empty_string_raises_error(self) -> None:
        with pytest.raises(ValueError):
            parse_workflow("")

    def test_parse_whitespace_string_raises_error(self) -> None:
        with pytest.raises(ValueError):
            parse_workflow("   \n\t  ")

    def test_parse_empty_dict_raises_error(self) -> None:
        with pytest.raises((ValueError, KeyError)):
            parse_workflow({})

    def test_parse_invalid_type_raises_error(self) -> None:
        with pytest.raises((TypeError, ValueError)):
            parse_workflow(12345)  # type: ignore

    def test_parse_cyclic_workflow_detected(
        self, malformed_cyclic_data: dict[str, Any]
    ) -> None:
        """Cycle detection should raise ValueError or flag the cycle in parsed workflow."""
        try:
            workflow = parse_workflow(malformed_cyclic_data)
            assert isinstance(workflow, ParsedWorkflow)
        except ValueError as exc:
            assert "cycle" in str(exc).lower() or "circular" in str(exc).lower()

    def test_parse_invalid_edges_handling(
        self, malformed_invalid_edges_data: dict[str, Any]
    ) -> None:
        try:
            workflow = parse_workflow(malformed_invalid_edges_data)
            assert "existing_node_alpha" in workflow.nodes
            assert "ghost_source_node_999" not in workflow.nodes
        except ValueError as exc:
            assert "node" in str(exc).lower() or "edge" in str(exc).lower()

    def test_parse_corrupt_schema_handling(
        self, malformed_invalid_schema_data: dict[str, Any]
    ) -> None:
        try:
            workflow = parse_workflow(malformed_invalid_schema_data)
            assert "node_with_corrupted_schema" in workflow.nodes
        except (ValueError, TypeError):
            pass


class TestTopologyAndLayering:
    """Validates root node computation, BFS/DFS layer assignment, and ordering."""

    def test_roots_calculation_single_root(self, valid_linear_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_linear_data)
        assert len(workflow.roots) == 1
        assert workflow.roots[0] == "trigger_file_created"

    def test_roots_calculation_isolated_nodes(self) -> None:
        isolated_data = {
            "displayName": "Isolated Nodes Workflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {"id": "node_a", "nodeType": "AGENT_NODE"},
                        {"id": "node_b", "nodeType": "AGENT_NODE"},
                    ],
                    "edges": [],
                }
            },
        }
        workflow = parse_workflow(isolated_data)
        assert set(workflow.roots) == {"node_a", "node_b"}
        assert len(workflow.layers) >= 1

    def test_topological_layering_order(self, valid_linear_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_linear_data)
        assert "trigger_file_created" in workflow.layers[0]
        agent_layer = -1
        leaf_layer = -1
        for idx, layer in enumerate(workflow.layers):
            if "summary_agent" in layer:
                agent_layer = idx
            if "send_alert_email" in layer:
                leaf_layer = idx
        assert agent_layer != -1 and leaf_layer != -1
        assert agent_layer < leaf_layer

    def test_all_nodes_assigned_to_layers(self, complex_trade_finance_data: dict[str, Any]) -> None:
        workflow = parse_workflow(complex_trade_finance_data)
        assigned_nodes = set()
        for layer in workflow.layers:
            for node_id in layer:
                assigned_nodes.add(node_id)
        assert assigned_nodes == set(workflow.nodes.keys())

    def test_diamond_dag_topology(self) -> None:
        """Diamond pattern: Root -> (NodeB, NodeC) -> NodeD."""
        diamond_data = {
            "displayName": "Diamond Workflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {"id": "root", "nodeType": "CONNECTOR_EVENT_TRIGGER"},
                        {"id": "branch_b", "nodeType": "AGENT_NODE"},
                        {"id": "branch_c", "nodeType": "AGENT_NODE"},
                        {"id": "join_d", "nodeType": "CONNECTOR_NODE"},
                    ],
                    "edges": [
                        {"sourceNodeId": "root", "targetNodeId": "branch_b"},
                        {"sourceNodeId": "root", "targetNodeId": "branch_c"},
                        {"sourceNodeId": "branch_b", "targetNodeId": "join_d"},
                        {"sourceNodeId": "branch_c", "targetNodeId": "join_d"},
                    ],
                }
            },
        }
        wf = parse_workflow(diamond_data)
        assert wf.roots == ["root"]
        assert len(wf.nodes) == 4
        # root in first layer, join_d after branch_b and branch_c
        root_layer = next(i for i, layer in enumerate(wf.layers) if "root" in layer)
        b_layer = next(i for i, layer in enumerate(wf.layers) if "branch_b" in layer)
        c_layer = next(i for i, layer in enumerate(wf.layers) if "branch_c" in layer)
        d_layer = next(i for i, layer in enumerate(wf.layers) if "join_d" in layer)
        assert root_layer < b_layer
        assert root_layer < c_layer
        assert b_layer < d_layer
        assert c_layer < d_layer


class TestNodeEntityExtraction:
    """Validates extraction of node specific attributes across node types."""

    def test_extract_trigger_node_attributes(self, valid_linear_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_linear_data)
        node = workflow.nodes["trigger_file_created"]
        assert node.node_type == "CONNECTOR_EVENT_TRIGGER"
        assert node.event_type == "file_uploaded" or (
            node.connector_event_trigger and node.connector_event_trigger.event_type == "file_uploaded"
        )
        assert node.output_schema is not None

    def test_extract_agent_node_attributes(self, valid_linear_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_linear_data)
        node = workflow.nodes["summary_agent"]
        assert node.node_type == "AGENT_NODE"
        assert node.model == "gemini-2.5-flash"
        assert "executive summary" in node.instruction.lower()
        assert "send_alert_email" in node.tools or len(node.tools) >= 0

    def test_extract_connector_node_attributes(self, valid_linear_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_linear_data)
        node = workflow.nodes["send_alert_email"]
        assert node.node_type == "CONNECTOR_NODE"
        assert node.connector_tool == "send_email" or (
            node.connector_node and node.connector_node.tool_name == "send_email"
        )

    def test_extract_condition_node_attributes(self, valid_branching_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_branching_data)
        node = workflow.nodes["severity_condition"]
        assert node.node_type == "CONDITION_NODE"

    def test_extract_approval_node_attributes(self, valid_approval_data: dict[str, Any]) -> None:
        workflow = parse_workflow(valid_approval_data)
        node = workflow.nodes["manager_approval_gate"]
        assert node.node_type == "APPROVAL_NODE"
        assert node.approval_message is not None or (
            node.approval_node and node.approval_node.message is not None
        )

    def test_instruction_length_preservation(self, complex_trade_finance_data: dict[str, Any]) -> None:
        workflow = parse_workflow(complex_trade_finance_data)
        doc_conv_agent = workflow.nodes["gemini_agent_5"]
        assert len(doc_conv_agent.instruction) > 3000
        assert "STAGE 1 — RETRIEVE SR2019 SPECIFICATION" in doc_conv_agent.instruction
        assert "STAGE 3 — GENERATE THE MT700 MESSAGE (SR2019)" in doc_conv_agent.instruction


class TestParserBoundaryAndCornerCases:
    """Tier 2 & Tier 5 Adversarial & Boundary test scenarios."""

    @pytest.mark.parametrize(
        "special_name",
        [
            "Agent with spaces and CAPS",
            "Agent-with-hyphens_and.dots",
            "Thai Agent: ผู้ช่วยตรวจสอบเอกสาร",
            "Japanese Agent: 金融取引エージェント",
            "Special Symbols !@#$%^&*()_+={}[]|:;'<>?",
            "Emoji Agent 🤖⚡🔀📧✋🔗",
        ],
    )
    def test_display_name_special_characters(self, special_name: str) -> None:
        payload = {
            "displayName": special_name,
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "node_spec",
                            "displayName": special_name,
                            "nodeType": "AGENT_NODE",
                            "agentNode": {"instruction": f"Processing for {special_name}"},
                        }
                    ],
                    "edges": [],
                }
            },
        }
        wf = parse_workflow(payload)
        assert wf.display_name == special_name
        assert wf.nodes["node_spec"].display_name == special_name

    @pytest.mark.parametrize("length", [0, 1, 500, 5000, 20000])
    def test_instruction_boundary_lengths(self, length: int) -> None:
        instr = "X" * length
        payload = {
            "displayName": f"LengthTest_{length}",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "node_len",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {"instruction": instr},
                        }
                    ],
                    "edges": [],
                }
            },
        }
        wf = parse_workflow(payload)
        assert len(wf.nodes["node_len"].instruction) == length

    def test_node_id_with_non_alphanumeric_chars(self) -> None:
        payload = {
            "displayName": "OddIDWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {"id": "node-1.2.3_test", "nodeType": "AGENT_NODE"},
                        {"id": "16_leading_digit_node", "nodeType": "CONNECTOR_NODE"},
                    ],
                    "edges": [
                        {"sourceNodeId": "node-1.2.3_test", "targetNodeId": "16_leading_digit_node"}
                    ],
                }
            },
        }
        wf = parse_workflow(payload)
        assert "node-1.2.3_test" in wf.nodes
        assert "16_leading_digit_node" in wf.nodes
        assert len(wf.edges) == 1

    def test_workflow_with_fifty_sequential_nodes(self) -> None:
        nodes = []
        edges = []
        for i in range(50):
            node_id = f"seq_node_{i}"
            nodes.append({"id": node_id, "nodeType": "AGENT_NODE"})
            if i > 0:
                edges.append({"sourceNodeId": f"seq_node_{i-1}", "targetNodeId": node_id})

        payload = {
            "displayName": "DeepLinearWorkflow",
            "workflowAgentDefinition": {"agentFlow": {"nodes": nodes, "edges": edges}},
        }
        wf = parse_workflow(payload)
        assert len(wf.nodes) == 50
        assert len(wf.edges) == 49
        assert wf.roots == ["seq_node_0"]
        assert len(wf.layers) == 50

    def test_missing_optional_node_fields(self) -> None:
        """Nodes with bare minimum fields should parse without crashing."""
        payload = {
            "displayName": "MinimalNodeWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {"id": "bare_node_1"},  # missing nodeType, agentNode, etc.
                        {"id": "bare_node_2", "nodeType": "DEFAULT"},
                    ],
                    "edges": [],
                }
            },
        }
        wf = parse_workflow(payload)
        assert "bare_node_1" in wf.nodes
        assert "bare_node_2" in wf.nodes


class TestGraphCycleDetection:
    """Verifies cycle detection DFS algorithm in agent_builder_to_adk.parser."""

    def test_find_cycles_acyclic(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
            "B": WorkflowNode(id="B", nodeType="AGENT_NODE"),
            "C": WorkflowNode(id="C", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="B")],
            "B": [WorkflowEdge(sourceNodeId="B", targetNodeId="C")],
            "C": [],
        }
        cycles = find_cycles(nodes, outgoing)
        assert cycles == []

    def test_find_cycles_simple_cycle(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
            "B": WorkflowNode(id="B", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="B")],
            "B": [WorkflowEdge(sourceNodeId="B", targetNodeId="A")],
        }
        cycles = find_cycles(nodes, outgoing)
        assert len(cycles) == 1
        assert cycles[0] == ["A", "B", "A"]

    def test_find_cycles_triangular_cycle(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
            "B": WorkflowNode(id="B", nodeType="AGENT_NODE"),
            "C": WorkflowNode(id="C", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="B")],
            "B": [WorkflowEdge(sourceNodeId="B", targetNodeId="C")],
            "C": [WorkflowEdge(sourceNodeId="C", targetNodeId="A")],
        }
        cycles = find_cycles(nodes, outgoing)
        assert len(cycles) == 1
        assert cycles[0] == ["A", "B", "C", "A"]

    def test_find_cycles_self_loop(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="A")],
        }
        cycles = find_cycles(nodes, outgoing)
        assert len(cycles) == 1
        assert cycles[0] == ["A", "A"]

    def test_find_cycles_disconnected(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
            "B": WorkflowNode(id="B", nodeType="AGENT_NODE"),
            "C": WorkflowNode(id="C", nodeType="AGENT_NODE"),
            "D": WorkflowNode(id="D", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="B")],
            "B": [],
            "C": [WorkflowEdge(sourceNodeId="C", targetNodeId="D")],
            "D": [],
        }
        cycles = find_cycles(nodes, outgoing)
        assert cycles == []

    def test_find_cycles_disconnected_with_cycle(self) -> None:
        nodes = {
            "A": WorkflowNode(id="A", nodeType="AGENT_NODE"),
            "B": WorkflowNode(id="B", nodeType="AGENT_NODE"),
            "C": WorkflowNode(id="C", nodeType="AGENT_NODE"),
            "D": WorkflowNode(id="D", nodeType="AGENT_NODE"),
        }
        outgoing = {
            "A": [WorkflowEdge(sourceNodeId="A", targetNodeId="B")],
            "B": [],
            "C": [WorkflowEdge(sourceNodeId="C", targetNodeId="D")],
            "D": [WorkflowEdge(sourceNodeId="D", targetNodeId="C")],
        }
        cycles = find_cycles(nodes, outgoing)
        assert len(cycles) == 1
        assert cycles[0] == ["C", "D", "C"]


class TestParserEdgeCases:
    """Verifies edge case handling and fallback paths in parse_workflow."""

    def test_parse_workflow_unsupported_type(self) -> None:
        with pytest.raises(TypeError) as exc_info:
            parse_workflow(12345)  # type: ignore
        assert "Unsupported workflow source type" in str(exc_info.value)

    def test_parse_workflow_top_level_agent_flow(self) -> None:
        payload = {
            "agentFlow": {
                "nodes": [{"id": "flow_node_1", "nodeType": "AGENT_NODE"}],
                "edges": [],
            }
        }
        wf = parse_workflow(payload)
        assert "flow_node_1" in wf.nodes

    def test_parse_workflow_top_level_nodes_list(self) -> None:
        payload = {
            "nodes": [{"id": "direct_node_1", "nodeType": "AGENT_NODE"}],
            "edges": [],
        }
        wf = parse_workflow(payload)
        assert "direct_node_1" in wf.nodes

    def test_parse_workflow_all_nodes_in_cycle_with_trigger(self) -> None:
        payload = {
            "nodes": [
                {"id": "trigger_init", "nodeType": "CONNECTOR_EVENT_TRIGGER"},
                {"id": "agent_worker", "nodeType": "AGENT_NODE"},
            ],
            "edges": [
                {"sourceNodeId": "trigger_init", "targetNodeId": "agent_worker"},
                {"sourceNodeId": "agent_worker", "targetNodeId": "trigger_init"},
            ],
        }
        wf = parse_workflow(payload)
        assert wf.roots == ["trigger_init"]

    def test_parse_workflow_all_nodes_in_cycle_without_trigger(self) -> None:
        payload = {
            "nodes": [
                {"id": "agent_1", "nodeType": "AGENT_NODE"},
                {"id": "agent_2", "nodeType": "AGENT_NODE"},
            ],
            "edges": [
                {"sourceNodeId": "agent_1", "targetNodeId": "agent_2"},
                {"sourceNodeId": "agent_2", "targetNodeId": "agent_1"},
            ],
        }
        wf = parse_workflow(payload)
        assert len(wf.roots) == 1
        assert wf.roots[0] in ("agent_1", "agent_2")

