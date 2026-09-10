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

"""Empirical stress testing suite for AST compilation and code generation.

Stress Dimensions:
1. Deep linear DAGs (50+ and 100+ nodes).
2. Wide diamond DAGs (50+ and 100+ fan-out/fan-in).
3. Extremely long system instructions (15,000+, 50,000+, 100,000+ chars with adversarial escapes).
4. Deeply nested Pydantic v2 schemas (4+ hierarchy levels, special chars, reserved words).
5. Adversarial input boundary challenges reproducing AST & runtime defects.
"""

from __future__ import annotations

import ast
import time
from typing import Any, Dict, List
import pytest

from agent_builder_to_adk.generator import CodeGenerator, CodeGenerationError
from agent_builder_to_adk.parser import parse_workflow
from tests.conftest import assert_ast_compiles


class TestDeepLinearDAGStress:
    """Stress-tests deep sequential workflows with 50+ and 100+ nodes."""

    def test_deep_linear_dag_50_nodes(self) -> None:
        """50 sequential nodes pipeline compiles cleanly to valid AST."""
        nodes: List[Dict[str, Any]] = [
            {
                "id": "trigger_node_0",
                "displayName": "Initial Trigger",
                "nodeType": "CONNECTOR_EVENT_TRIGGER",
                "eventTrigger": {"eventType": "linear_start"},
            }
        ]
        edges: List[Dict[str, Any]] = []

        for i in range(1, 50):
            prev_id = nodes[-1]["id"]
            curr_id = f"agent_step_{i:03d}"
            nodes.append({
                "id": curr_id,
                "displayName": f"Linear Step {i}",
                "nodeType": "AGENT_NODE",
                "agentNode": {
                    "model": "gemini-1.5-pro",
                    "instruction": f"Process linear pipeline stage {i}.",
                },
            })
            edges.append({
                "sourceNodeId": prev_id,
                "targetNodeId": curr_id,
            })

        payload = {
            "displayName": "DeepLinearPipeline50",
            "workflowAgentDefinition": {
                "agentFlow": {"nodes": nodes, "edges": edges}
            },
        }

        t0 = time.perf_counter()
        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)
        duration = time.perf_counter() - t0

        assert len(wf.layers) == 50
        tree = assert_ast_compiles(code, filename="linear_50.py")
        assert isinstance(tree, ast.Module)
        assert "agent_step_049" in code
        assert duration < 5.0, f"Compilation took too long: {duration:.2f}s"

    def test_deep_linear_dag_100_nodes(self) -> None:
        """100 sequential nodes pipeline compiles cleanly without recursion or memory errors."""
        nodes: List[Dict[str, Any]] = [
            {
                "id": "root_event",
                "displayName": "Root Event",
                "nodeType": "CONNECTOR_EVENT_TRIGGER",
                "eventTrigger": {"eventType": "event_100"},
            }
        ]
        edges: List[Dict[str, Any]] = []

        for i in range(1, 100):
            prev_id = nodes[-1]["id"]
            curr_id = f"node_agent_{i:03d}"
            nodes.append({
                "id": curr_id,
                "displayName": f"Pipeline Agent {i}",
                "nodeType": "AGENT_NODE",
                "agentNode": {
                    "model": "gemini-2.0-flash",
                    "instruction": f"Sequential step {i} execution.",
                },
            })
            edges.append({
                "sourceNodeId": prev_id,
                "targetNodeId": curr_id,
            })

        payload = {
            "displayName": "DeepLinearPipeline100",
            "workflowAgentDefinition": {
                "agentFlow": {"nodes": nodes, "edges": edges}
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        assert len(wf.layers) == 100
        tree = assert_ast_compiles(code, filename="linear_100.py")
        assert isinstance(tree, ast.Module)
        assert "node_agent_099" in code

    def test_deep_linear_dag_heterogeneous_nodes(self) -> None:
        """60 sequential nodes alternating among all supported node types."""
        nodes: List[Dict[str, Any]] = [
            {
                "id": "trigger_start",
                "displayName": "Trigger Start",
                "nodeType": "CONNECTOR_EVENT_TRIGGER",
                "eventTrigger": {"eventType": "batch_job"},
            }
        ]
        edges: List[Dict[str, Any]] = []

        for i in range(1, 60):
            prev_id = nodes[-1]["id"]
            mod = i % 4
            if mod == 1:
                curr_id = f"agent_node_{i}"
                nodes.append({
                    "id": curr_id,
                    "displayName": f"Agent {i}",
                    "nodeType": "AGENT_NODE",
                    "agentNode": {"model": "gemini-1.5-pro", "instruction": f"Agent {i}"},
                })
            elif mod == 2:
                curr_id = f"tool_connector_{i}"
                nodes.append({
                    "id": curr_id,
                    "displayName": f"Tool {i}",
                    "nodeType": "CONNECTOR_NODE",
                    "connectorNode": {
                        "toolName": f"fetch_metric_{i}",
                        "inputParameters": {"metric_id": f"m_{i}", "threshold": i * 1.5},
                    },
                })
            elif mod == 3:
                curr_id = f"condition_gate_{i}"
                nodes.append({
                    "id": curr_id,
                    "displayName": f"Condition {i}",
                    "nodeType": "CONDITION_NODE",
                    "conditionNode": {
                        "ruleBasedRouting": {
                            "rules": [
                                {
                                    "branch": f"branch_{i}_pass",
                                    "rule": {
                                        "rootExpression": {
                                            "condition": {
                                                "left": {"variablePath": f"status_{i}"},
                                                "conditionOperator": "EQUALS",
                                                "right": {"literal": "OK"},
                                            }
                                        }
                                    },
                                }
                            ]
                        }
                    },
                })
            else:
                curr_id = f"approval_gate_{i}"
                nodes.append({
                    "id": curr_id,
                    "displayName": f"Approval {i}",
                    "nodeType": "APPROVAL_NODE",
                    "approvalNode": {
                        "message": f"Please verify pipeline stage {i}",
                        "approvalBranch": "Approved",
                        "rejectionBranch": "Rejected",
                    },
                })

            edges.append({"sourceNodeId": prev_id, "targetNodeId": curr_id})

        payload = {
            "displayName": "HeterogeneousLinearPipeline60",
            "workflowAgentDefinition": {
                "agentFlow": {"nodes": nodes, "edges": edges}
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        assert len(wf.layers) == 60
        tree = assert_ast_compiles(code, filename="hetero_linear_60.py")
        assert isinstance(tree, ast.Module)


class TestWideDiamondDAGStress:
    """Stress-tests wide topologies with high-degree fan-out and fan-in."""

    def test_wide_diamond_dag_50_fanout(self) -> None:
        """Diamond topology with 1 trigger -> 50 parallel workers -> 1 aggregator."""
        nodes: List[Dict[str, Any]] = [
            {
                "id": "trigger_fanout",
                "displayName": "Root Trigger",
                "nodeType": "CONNECTOR_EVENT_TRIGGER",
                "eventTrigger": {"eventType": "fanout_event"},
            }
        ]
        edges: List[Dict[str, Any]] = []

        for i in range(50):
            worker_id = f"parallel_agent_{i:02d}"
            nodes.append({
                "id": worker_id,
                "displayName": f"Parallel Agent {i}",
                "nodeType": "AGENT_NODE",
                "agentNode": {
                    "model": "gemini-2.0-flash",
                    "instruction": f"Perform shard task {i}.",
                },
            })
            edges.append({"sourceNodeId": "trigger_fanout", "targetNodeId": worker_id})
            edges.append({"sourceNodeId": worker_id, "targetNodeId": "aggregator_sink"})

        nodes.append({
            "id": "aggregator_sink",
            "displayName": "Aggregator Sink",
            "nodeType": "AGENT_NODE",
            "agentNode": {
                "model": "gemini-1.5-pro",
                "instruction": "Consolidate all 50 parallel agent outputs into unified response.",
            },
        })

        payload = {
            "displayName": "WideDiamondDAG50",
            "workflowAgentDefinition": {
                "agentFlow": {"nodes": nodes, "edges": edges}
            },
        }

        wf = parse_workflow(payload)
        assert len(wf.layers) == 3
        assert len(wf.layers[1]) == 50

        gen = CodeGenerator()
        code = gen.generate(wf)

        tree = assert_ast_compiles(code, filename="diamond_50.py")
        assert isinstance(tree, ast.Module)
        assert "aggregator_sink" in code
        assert "parallel_agent_49" in code

    def test_wide_diamond_dag_100_fanout(self) -> None:
        """Diamond topology with 1 trigger -> 100 parallel workers -> 1 aggregator."""
        nodes: List[Dict[str, Any]] = [
            {
                "id": "root_dispatcher",
                "displayName": "Root Dispatcher",
                "nodeType": "CONNECTOR_EVENT_TRIGGER",
                "eventTrigger": {"eventType": "high_concurrency"},
            }
        ]
        edges: List[Dict[str, Any]] = []

        for i in range(100):
            worker_id = f"worker_{i:03d}"
            nodes.append({
                "id": worker_id,
                "displayName": f"Worker {i}",
                "nodeType": "AGENT_NODE",
                "agentNode": {
                    "model": "gemini-1.5-flash",
                    "instruction": f"Worker task index {i}",
                },
            })
            edges.append({"sourceNodeId": "root_dispatcher", "targetNodeId": worker_id})
            edges.append({"sourceNodeId": worker_id, "targetNodeId": "master_reducer"})

        nodes.append({
            "id": "master_reducer",
            "displayName": "Master Reducer",
            "nodeType": "AGENT_NODE",
            "agentNode": {
                "model": "gemini-1.5-pro",
                "instruction": "Reduce all 100 worker states.",
            },
        })

        payload = {
            "displayName": "WideDiamondDAG100",
            "workflowAgentDefinition": {
                "agentFlow": {"nodes": nodes, "edges": edges}
            },
        }

        wf = parse_workflow(payload)
        assert len(wf.layers) == 3
        assert len(wf.layers[1]) == 100

        gen = CodeGenerator()
        code = gen.generate(wf)

        tree = assert_ast_compiles(code, filename="diamond_100.py")
        assert isinstance(tree, ast.Module)
        assert "master_reducer" in code
        assert "worker_099" in code


class TestExtremeInstructionsStress:
    """Stress-tests massive and adversarial instruction string handling."""

    def test_instruction_15k_chars_with_adversarial_escapes(self) -> None:
        """System instruction with 15,000+ characters of tricky escape sequences."""
        triple_double = '"""'
        triple_single = "'''"
        block = (
            "## SECTION: PROTOCOL DEPLOYMENT\n"
            "Markdown code fences with docstrings:\n"
            "```python\n"
            f"{triple_double}Triple quotes inside markdown code fence{triple_double}\n"
            f"{triple_single}Triple single quotes inside fence{triple_single}\n"
            "def handler():\n"
            "    regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'\n"
            "    return '\\n\\t\\r\\x00\\\\'\n"
            "```\n\n"
            "Markdown quotes and escapes:\n"
            '> > He said: "Nested quotes" and \'single quotes\'\n'
            "> Trailing backslash on line: \\\n"
            "> LaTeX expression: $\\frac{\\partial^2\\psi}{\\partial t^2} = c^2\\nabla^2\\psi$\n"
            "> Regex syntax: \\d+\\s+[a-z]+(\\w*)\\b\n\n"
        )
        massive_instruction = (block * 25) + "\nFinal line with trailing backslash: \\"
        assert len(massive_instruction) > 12000

        payload = {
            "displayName": "AdversarialEscapeInstructionWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "adversarial_instruction_agent",
                            "displayName": "Adversarial Agent",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {
                                "model": "gemini-1.5-pro",
                                "instruction": massive_instruction,
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        tree = assert_ast_compiles(code, filename="adversarial_instruction.py")
        assert isinstance(tree, ast.Module)
        assert "adversarial_instruction_agent" in code

    def test_instruction_50k_and_100k_characters(self) -> None:
        """Massive instructions (50k and 100k chars) compile cleanly without MemoryError."""
        for size in [50000, 100000]:
            chunk = "Paragraph rule: Always adhere to the rigorous guidelines.\n"
            repetitions = size // len(chunk) + 1
            instruction_text = (chunk * repetitions)[:size]

            payload = {
                "displayName": f"MassiveInstruction_{size}",
                "workflowAgentDefinition": {
                    "agentFlow": {
                        "nodes": [
                            {
                                "id": f"agent_size_{size}",
                                "displayName": f"Agent {size}",
                                "nodeType": "AGENT_NODE",
                                "agentNode": {
                                    "model": "gemini-1.5-pro",
                                    "instruction": instruction_text,
                                },
                            }
                        ],
                        "edges": [],
                    }
                },
            }

            wf = parse_workflow(payload)
            gen = CodeGenerator()
            code = gen.generate(wf)

            tree = assert_ast_compiles(code, filename=f"massive_{size}.py")
            assert isinstance(tree, ast.Module)


class TestComplexNestedPydanticSchemaStress:
    """Stress-tests deep schema nesting and special character sanitization."""

    def test_four_level_nested_schema(self) -> None:
        """4-level nested schema hierarchy generates valid Pydantic v2 models."""
        schema = {
            "type": "OBJECT",
            "required": ["root_id", "level1"],
            "properties": {
                "root_id": {"type": "STRING", "description": "Root identifier"},
                "level1": {
                    "type": "OBJECT",
                    "required": ["l1_name", "items"],
                    "properties": {
                        "l1_name": {"type": "STRING"},
                        "items": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "required": ["l2_id", "sub_meta"],
                                "properties": {
                                    "l2_id": {"type": "INTEGER"},
                                    "sub_meta": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "l3_flag": {"type": "BOOLEAN"},
                                            "leaf_records": {
                                                "type": "ARRAY",
                                                "items": {
                                                    "type": "OBJECT",
                                                    "properties": {
                                                        "leaf_key": {"type": "STRING"},
                                                        "leaf_score": {"type": "NUMBER"},
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

        payload = {
            "displayName": "DeepNestedSchemaWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "schema_producer_agent",
                            "displayName": "Schema Producer",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {
                                "model": "gemini-1.5-pro",
                                "instruction": "Generate structured response.",
                            },
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        tree = assert_ast_compiles(code, filename="deep_nested_schema.py")
        assert isinstance(tree, ast.Module)
        assert "class SchemaProducerAgentOutput(" in code

    def test_special_characters_and_reserved_keywords(self) -> None:
        """Schema property names with symbols and keywords sanitize and compile properly."""
        schema = {
            "type": "OBJECT",
            "properties": {
                "@type": {"type": "STRING"},
                "$ref": {"type": "STRING"},
                "dashed-property": {"type": "STRING"},
                "property with spaces": {"type": "INTEGER"},
                "property.with.dots": {"type": "BOOLEAN"},
                "123_starts_with_digit": {"type": "NUMBER"},
                "class": {"type": "STRING"},
                "def": {"type": "STRING"},
                "import": {"type": "STRING"},
                "from": {"type": "STRING"},
                "return": {"type": "STRING"},
                "lambda": {"type": "STRING"},
                "global": {"type": "STRING"},
                "async": {"type": "STRING"},
                "await": {"type": "STRING"},
                "None": {"type": "STRING"},
            },
        }

        payload = {
            "displayName": "SpecialCharsSchemaWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "tool_with_special_schema",
                            "displayName": "Tool With Special Schema",
                            "nodeType": "CONNECTOR_NODE",
                            "connectorNode": {
                                "toolName": "fetch_special_data",
                                "inputParameters": {"param1": "val1"},
                            },
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        tree = assert_ast_compiles(code, filename="special_chars_schema.py")
        assert isinstance(tree, ast.Module)
        assert "class ToolWithSpecialSchemaOutput(" in code
        assert 'alias="@type"' in code
        assert 'alias="$ref"' in code
        assert 'alias="class"' in code


class TestAdversarialCompilationBoundaryBugs:
    """Empirical challenge tests reproducing AST generation and runtime failure modes."""

    def test_workflow_display_name_with_triple_quotes_compiles_cleanly(self) -> None:
        """Validates that workflow.display_name containing triple quotes is safely escaped."""
        payload = {
            "displayName": 'Adversarial """ Header Injection Workflow',
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_1",
                            "displayName": "Agent 1",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {"model": "gemini-1.5-pro", "instruction": "Task"},
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)
        tree = assert_ast_compiles(code, filename="escaped_header.py")
        assert isinstance(tree, ast.Module)

    def test_approval_branch_quotes_compiles_cleanly(self) -> None:
        """Validates that approvalBranch containing quotes compiles cleanly via repr()."""
        payload = {
            "displayName": "ApprovalQuotesWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "approval_gate_quotes",
                            "displayName": "Approval Gate",
                            "nodeType": "APPROVAL_NODE",
                            "approvalNode": {
                                "message": "Confirm?",
                                "approvalBranch": 'Branch "Approved"',
                                "rejectionBranch": 'Branch "Rejected"',
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)
        tree = assert_ast_compiles(code, filename="escaped_approval.py")
        assert isinstance(tree, ast.Module)

    def test_condition_branch_quotes_compiles_cleanly(self) -> None:
        """Validates that condition branch containing quotes compiles cleanly via repr()."""
        payload = {
            "displayName": "ConditionQuotesWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "condition_quotes",
                            "displayName": "Condition Node",
                            "nodeType": "CONDITION_NODE",
                            "conditionNode": {
                                "ruleBasedRouting": {
                                    "rules": [
                                        {
                                            "branch": 'Branch "True"',
                                            "rule": {
                                                "rootExpression": {
                                                    "condition": {
                                                        "left": {"variablePath": "status"},
                                                        "conditionOperator": "EQUALS",
                                                        "right": {"literal": "OK"},
                                                    }
                                                }
                                            },
                                        }
                                    ]
                                }
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)
        tree = assert_ast_compiles(code, filename="escaped_condition.py")
        assert isinstance(tree, ast.Module)

    def test_connector_tool_name_runtime_execution(self) -> None:
        """Validates that connector tool executes cleanly without runtime NameError."""
        payload = {
            "displayName": "ConnectorNameErrorWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "custom_search_tool",
                            "displayName": "Search Tool",
                            "nodeType": "CONNECTOR_NODE",
                            "connectorNode": {
                                "toolName": "google_search",
                                "inputParameters": {"query": "test query"},
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }

        wf = parse_workflow(payload)
        gen = CodeGenerator()
        code = gen.generate(wf)

        namespace: Dict[str, Any] = {}
        exec(compile(code, "test_connector.py", "exec"), namespace)
        tool_fn = namespace["custom_search_tool"]
        res = tool_fn()
        assert res["status"] == "SUCCESS"
        assert res["tool"] == "google_search"
        assert res["message"] == "Successfully executed tool 'google_search'"
