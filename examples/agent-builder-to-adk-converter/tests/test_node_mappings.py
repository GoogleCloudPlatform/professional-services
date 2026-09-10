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
"""Node-by-node mapping integrity tests across all 6 supported node types.

Node Types Evaluated:
1. AGENT_NODE -> LlmAgent / Agent with model, instructions, and connected tools.
2. CONNECTOR_NODE -> strongly-typed Python tool functions with docstrings.
3. APPROVAL_NODE -> ADK AskQuestionHook / on_interaction human-in-the-loop gate.
4. CONDITION_NODE -> conditional if/elif branching logic.
5. AGENT_REFERENCE_NODE -> external subagent / MCP tool invocation.
6. CONNECTOR_EVENT_TRIGGER -> event trigger ingestion handler.
"""

from __future__ import annotations

import ast
from typing import Any
import pytest

from tests.conftest import assert_ast_compiles

from agent_builder_to_adk.generator import CodeGenerator
from agent_builder_to_adk.models import (
    AgentNodeConfig,
    ConnectorNodeConfig,
    ParsedWorkflow,
    SelectedTools,
    ToolRef,
    WorkflowEdge,
    WorkflowNode,
)

from agent_builder_to_adk.nodes.agent import (
    escape_docstring,
    format_raw_docstring,
    pascal_case,
    sanitize_identifier,
)
from agent_builder_to_adk.nodes.connector import (
    generate_mock_value,
    infer_type_and_default,
    sanitize_param_name,
)
from agent_builder_to_adk.parser import parse_workflow



class TestAgentNodeMapping:
    """Verifies AGENT_NODE transformation into ADK Agent instances."""

    def test_agent_model_and_instruction_mapping(
        self, valid_linear_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_linear_data))
        assert "gemini-2.5-flash" in code
        assert "executive summary" in code.lower()
        assert_ast_compiles(code)

    def test_agent_tool_binding(self, valid_linear_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_linear_data))
        assert "send_alert_email" in code

    def test_multi_agent_independent_configs(
        self, valid_multi_agent_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_multi_agent_data))
        assert "coordinator_agent" in code
        assert "research_specialist" in code
        assert "code_review_agent" in code

    @pytest.mark.parametrize(
        "model_name",
        [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro-002",
            "gemini-3.1-pro-preview",
        ],
    )
    def test_agent_model_preservation(self, model_name: str) -> None:
        payload = {
            "displayName": f"Model_{model_name}",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_test",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {
                                "model": model_name,
                                "instruction": "Test model instruction",
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        assert model_name in code
        assert_ast_compiles(code)


class TestConnectorNodeMapping:
    """Verifies CONNECTOR_NODE transformation into strongly-typed tool functions."""

    def test_connector_generates_python_function(
        self, valid_linear_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_linear_data))
        assert "def send_alert_email" in code or "def send_email" in code
        assert "-> " in code

    def test_connector_docstring_and_types(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(complex_trade_finance_data))
        tree = assert_ast_compiles(code)

        func_nodes = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        tool_func = next((f for f in func_nodes if "send_mail" in f.name), None)
        assert tool_func is not None, "Expected connector tool function in generated AST"
        docstring = ast.get_docstring(tool_func)
        assert docstring is not None
        assert len(docstring) > 0

    def test_connector_multiple_typed_parameters(self) -> None:
        payload = {
            "displayName": "TypedConnectorWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "multi_param_tool",
                            "displayName": "Multi Parameter Tool",
                            "nodeType": "CONNECTOR_NODE",
                            "connectorNode": {
                                "toolName": "calculate_tax",
                                "inputParameters": {
                                    "rate": 0.07,
                                    "amount": 1000.0,
                                    "jurisdiction": "CA",
                                    "is_exempt": False,
                                },
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        tree = assert_ast_compiles(code)
        assert "calculate_tax" in code or "multi_param_tool" in code

    def test_connector_nested_schemas_and_mock_helpers(self) -> None:
        """Exercises nested OBJECT, ARRAY of OBJECT, and primitive types in outputSchema."""
        payload = {
            "displayName": "NestedConnectorWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "query_database_connector",
                            "displayName": "Query Database Connector",
                            "nodeType": "CONNECTOR_NODE",
                            "connectorNode": {
                                "toolName": "query_db",
                                "inputParameters": {
                                    "01_invalid_leading": "prefix",
                                    "class": "keyword_test",
                                    "rate_float": 4.5,
                                    "is_active": True,
                                    "limit_int": 50,
                                    "tags": ["tag1", "tag2"],
                                    "config_dict": {"k": "v"},
                                    "ref_param": "${upstream_node.output_data}",
                                    "dup_name": "first",
                                },
                            },
                            "outputSchema": {
                                "type": "OBJECT",
                                "properties": {
                                    "status": {"type": "STRING", "description": "Status message"},
                                    "count": {"type": "INTEGER", "description": "Record count"},
                                    "score": {"type": "NUMBER", "description": "Confidence score"},
                                    "is_valid": {"type": "BOOLEAN", "description": "Validation flag"},
                                    "record": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "id": {"type": "STRING"},
                                            "meta": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "version": {"type": "INTEGER"}
                                                }
                                            }
                                        }
                                    },
                                    "items": {
                                        "type": "ARRAY",
                                        "items": {
                                            "type": "OBJECT",
                                            "properties": {
                                                "name": {"type": "STRING"},
                                                "qty": {"type": "INTEGER"}
                                            }
                                        }
                                    },
                                    "float_list": {"type": "ARRAY", "items": {"type": "NUMBER"}},
                                    "int_list": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                                    "bool_list": {"type": "ARRAY", "items": {"type": "BOOLEAN"}},
                                    "str_list": {"type": "ARRAY", "items": {"type": "STRING"}},
                                    "empty_obj": {"type": "OBJECT"},
                                    "unknown_field": {"type": "UNKNOWN_TYPE"},
                                }
                            }
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        tree = assert_ast_compiles(code)
        compile(code, "<test_connector_nested_schemas>", "exec")
        assert "def query_database_connector" in code
        assert "QueryDatabaseConnectorOutput" in code
        assert "QueryDatabaseConnectorOutputRecord" in code

    def test_connector_unit_helpers(self) -> None:
        """Verifies connector helper functions directly."""
        assert sanitize_param_name("123_abc") == "param_123_abc"
        assert sanitize_param_name("class") == "class_param"
        assert sanitize_param_name("__") == "param_"
        assert sanitize_param_name("clean_name") == "clean_name"

        assert infer_type_and_default(True) == ("bool", "True")
        assert infer_type_and_default(100) == ("int", "100")
        assert infer_type_and_default(2.5) == ("float", "2.5")
        assert infer_type_and_default([1, 2]) == ("list[Any]", "[]")
        assert infer_type_and_default({"k": "v"}) == ("dict[str, Any]", "{}")
        assert infer_type_and_default("${user.input}") == ("str", "'Value from user.input'")
        assert infer_type_and_default(None) == ("str", "'default'")

        assert generate_mock_value({"type": "NUMBER"}, "n") == "100.0"
        assert generate_mock_value({"type": "INTEGER"}, "i") == "1"
        assert generate_mock_value({"type": "BOOLEAN"}, "b") == "True"
        assert generate_mock_value({"type": "OBJECT"}, "o") == '{"status": "OK"}'
        assert generate_mock_value({"type": "UNKNOWN"}, "u") == '{"status": "OK"}'
        assert generate_mock_value({"type": "ARRAY", "items": {"type": "NUMBER"}}, "a") == "[100.0]"
        assert generate_mock_value({"type": "ARRAY", "items": {"type": "INTEGER"}}, "a") == "[1]"
        assert generate_mock_value({"type": "ARRAY", "items": {"type": "BOOLEAN"}}, "a") == "[True]"
        assert generate_mock_value({"type": "ARRAY", "items": {"type": "STRING"}}, "a") == '["sample_item"]'



class TestApprovalNodeMapping:
    """Verifies APPROVAL_NODE transformation into executable human-in-the-loop gates."""

    def test_approval_hook_generation(self, valid_approval_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_approval_data))
        assert "AskQuestionHook" in code or "on_interaction" in code or "approval" in code.lower()
        assert "Approved" in code
        assert "Rejected" in code
        assert_ast_compiles(code)

    def test_approval_message_preservation(self, valid_approval_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_approval_data))
        assert "Please approve or reject reimbursement" in code

    @pytest.mark.parametrize(
        "approved_label,rejected_label",
        [
            ("Approved", "Rejected"),
            ("Certified", "Declined"),
            ("Pass", "Fail"),
            ("YES", "NO"),
        ],
    )
    def test_custom_approval_branch_labels(
        self, approved_label: str, rejected_label: str
    ) -> None:
        payload = {
            "displayName": "CustomApprovalWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "custom_gate",
                            "displayName": "Custom Gate",
                            "nodeType": "APPROVAL_NODE",
                            "approvalNode": {
                                "message": "Confirm release?",
                                "approvalBranch": approved_label,
                                "rejectionBranch": rejected_label,
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        assert approved_label in code
        assert rejected_label in code
        assert_ast_compiles(code)


class TestConditionNodeMapping:
    """Verifies CONDITION_NODE transformation into branch evaluation."""

    def test_condition_routing_branches(self, valid_branching_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_branching_data))
        assert "if " in code
        assert "CRITICAL" in code
        assert "STANDARD" in code
        assert_ast_compiles(code)

    def test_condition_no_undefined_variables(
        self, valid_branching_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_branching_data))
        tree = assert_ast_compiles(code)
        assert isinstance(tree, ast.Module)

    def test_three_way_conditional_branching(
        self, sample_customer_support_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(sample_customer_support_data))
        assert "BILLING" in code
        assert "TECHNICAL" in code
        assert "GENERAL" in code
        assert_ast_compiles(code)

    def test_condition_operators_and_edge_cases(self) -> None:
        """Verifies condition operators: IS_FALSE, CONTAINS, GREATER_THAN, empty rules, and fallback defaults."""
        payload = {
            "displayName": "ConditionOperatorsWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "cond_ops",
                            "displayName": "Condition Operators Node",
                            "nodeType": "CONDITION_NODE",
                            "conditionNode": {
                                "ruleBasedRouting": {
                                    "rules": [
                                        {
                                            "branch": "FALSE_BRANCH",
                                            "rule": {
                                                "rootExpression": {
                                                    "condition": {
                                                        "left": {"variablePath": "flag"},
                                                        "conditionOperator": "IS_FALSE",
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "branch": "IN_BRANCH",
                                            "rule": {
                                                "rootExpression": {
                                                    "condition": {
                                                        "left": {"variablePath": "category"},
                                                        "conditionOperator": "CONTAINS",
                                                        "right": {"literal": "VIP"},
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "branch": "GT_BRANCH",
                                            "rule": {
                                                "rootExpression": {
                                                    "condition": {
                                                        "left": {"variablePath": "amount"},
                                                        "conditionOperator": "GREATER_THAN",
                                                        "right": {"literal": 1000},
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "branch": "NO_EXPR_BRANCH",
                                            "rule": {}
                                        },
                                    ],
                                    "elseBranch": "DEFAULT_BRANCH",
                                }
                            }
                        },
                        {
                            "id": "cond_no_rules",
                            "nodeType": "CONDITION_NODE",
                            "conditionNode": {
                                "ruleBasedRouting": {
                                    "rules": [],
                                    "elseBranch": "FALLBACK"
                                }
                            }
                        }
                    ],
                    "edges": [
                        {"sourceNodeId": "cond_ops", "targetNodeId": "cond_no_rules", "routeString": "EXTRA_DEFAULT"}
                    ],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        assert_ast_compiles(code)
        compile(code, "<test_condition_ops>", "exec")
        assert "not bool(val_r0_e0)" in code
        assert "in val_r1_e0" in code
        assert "> 1000" in code




class TestAgentReferenceNodeMapping:
    """Verifies AGENT_REFERENCE_NODE transformation into subagent/MCP invocation."""

    def test_agent_reference_subagent(
        self, valid_multi_agent_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_multi_agent_data))
        assert "code_gen_subagent_ref" in code or "codegen-subagent" in code
        assert_ast_compiles(code)

    def test_mcp_agent_reference(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(complex_trade_finance_data))
        assert "mcp_get_fx_rate" in code or "get_fx_rate" in code
        assert_ast_compiles(code)


class TestTriggerNodeMapping:
    """Verifies CONNECTOR_EVENT_TRIGGER transformation into event handlers."""

    def test_trigger_event_type_handling(self, valid_linear_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(valid_linear_data))
        assert "file_uploaded" in code or "trigger" in code.lower()
        assert_ast_compiles(code)

    @pytest.mark.parametrize(
        "event_type",
        [
            "file_uploaded",
            "pubsub_message_received",
            "webhook_received",
            "email_received",
            "form_submitted",
        ],
    )
    def test_trigger_event_variations(self, event_type: str) -> None:
        payload = {
            "displayName": f"Trigger_{event_type}",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "test_trig",
                            "nodeType": "CONNECTOR_EVENT_TRIGGER",
                            "connectorEventTrigger": {
                                "eventType": event_type,
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(payload))
        assert_ast_compiles(code)


class TestModelsAndAgentHelpers:
    """Verifies edge case property accessors in models and agent nodes."""

    def test_workflow_edge_properties(self) -> None:
        edge = WorkflowEdge(sourceNodeId="src", targetNodeId="tgt", routeString="route_a")
        assert edge.source == "src"
        assert edge.target == "tgt"
        assert edge.route == "route_a"

    def test_workflow_node_properties(self) -> None:
        node = WorkflowNode(
            id="node_a",
            displayName="Node Alpha",
            nodeType="AGENT_NODE",
            agentNode=AgentNodeConfig(
                selectedTools=SelectedTools(tools=[ToolRef(name="tool_1"), ToolRef(name="tool_2")])
            ),
        )
        assert node.label == "Node Alpha"
        assert node.tools == ["tool_1", "tool_2"]

    def test_parsed_workflow_connected_tools_edge_cases(self) -> None:
        node_agent = WorkflowNode(id="agent_1", nodeType="AGENT_NODE")
        node_conn = WorkflowNode(
            id="conn_1",
            nodeType="CONNECTOR_NODE",
            connectorNode=ConnectorNodeConfig(toolName="tool_abc"),
        )
        wf = ParsedWorkflow(
            agent_id="test",
            display_name="Test",
            description="Test description",
            nodes={"agent_1": node_agent, "conn_1": node_conn},
            edges=[
                WorkflowEdge(sourceNodeId="conn_1", targetNodeId="agent_1"),
            ],
            roots=["conn_1"],
            layers=[["conn_1"], ["agent_1"]],
        )
        # Non-existent node returns empty list
        assert wf.get_connected_tools("non_existent") == []
        # Incoming edge from CONNECTOR_NODE is detected
        assert wf.get_connected_tools("agent_1") == ["conn_1"]

    def test_agent_node_string_helpers(self) -> None:
        assert sanitize_identifier("") == "node"
        assert escape_docstring("") == ""
        assert escape_docstring("test\\") == "test\\ "
        assert format_raw_docstring("") == 'r""""""'

