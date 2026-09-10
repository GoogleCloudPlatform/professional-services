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
"""Exhaustive tests for Pydantic v2 schema generation and validation.

Tests:
- Primitive field type translations (STRING -> str, NUMBER -> float, etc.).
- Complex nested objects and array types (list[SubModel]).
- Field name sanitization, keyword collisions, and alias mapping.
- Pydantic v2 ConfigDict(populate_by_name=True) verification.
- Runtime dynamic instantiation and validation failure semantics.
- Adversarial keyword collisions (def, class, import, lambda, async, await).
- Deep object nesting (3+ levels).
"""

from __future__ import annotations

import ast
from typing import Any
import pytest
import pydantic
from pydantic import BaseModel, ValidationError

try:
    from agent_builder_to_adk.generator import CodeGenerator, generate_pydantic_schema
except ImportError:
    try:
        from agent_builder_to_adk.generator import CodeGenerator  # type: ignore
        generate_pydantic_schema = None  # type: ignore
    except ImportError:
        CodeGenerator = None  # type: ignore
        generate_pydantic_schema = None  # type: ignore

try:
    from agent_builder_to_adk.parser import parse_workflow
except ImportError:
    from agent_builder_to_adk import parse_workflow  # type: ignore


class TestPrimitiveSchemaGeneration:
    """Verifies scalar type mappings and basic model synthesis."""

    def test_primitive_field_types(self) -> None:
        schema = {
            "properties": {
                "name": {"type": "STRING", "description": "User name"},
                "age": {"type": "INTEGER", "description": "User age"},
                "balance": {"type": "NUMBER", "description": "Account balance"},
                "active": {"type": "BOOLEAN", "description": "Active flag"},
            },
            "required": ["name", "age"],
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "SchemaTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_1",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))

        assert "class " in code
        assert "pydantic.BaseModel" in code or "BaseModel" in code
        assert "name" in code
        assert "str" in code
        assert "float" in code
        assert "bool" in code
        ast.parse(code)

    def test_optional_fields_allow_none(self) -> None:
        schema = {
            "properties": {
                "required_field": {"type": "STRING"},
                "optional_field": {"type": "STRING"},
            },
            "required": ["required_field"],
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "OptionalTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_opt",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert "None" in code
        ast.parse(code)


class TestComplexNestedSchemas:
    """Verifies generation of nested models and typed arrays."""

    def test_array_of_primitives(self) -> None:
        schema = {
            "properties": {
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "List of string tags",
                }
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "ArrayPrimitiveTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_arr",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert "list[str]" in code or "List[str]" in code
        ast.parse(code)

    def test_nested_object_model_generation(self) -> None:
        schema = {
            "properties": {
                "user": {
                    "type": "OBJECT",
                    "properties": {
                        "username": {"type": "STRING"},
                        "email": {"type": "STRING"},
                    },
                    "required": ["username"],
                }
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "NestedObjTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_nested",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert code.count("BaseModel") >= 1
        ast.parse(code)

    def test_array_of_nested_objects(self, swift_mt700_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        code = gen.generate(parse_workflow(swift_mt700_data))
        assert "owners" in code
        assert "BaseModel" in code
        ast.parse(code)

    def test_triple_nested_object_hierarchy(self) -> None:
        """Verifies Level 1 -> Level 2 -> Level 3 nested models."""
        schema = {
            "properties": {
                "level1": {
                    "type": "OBJECT",
                    "properties": {
                        "level2": {
                            "type": "OBJECT",
                            "properties": {
                                "level3_field": {"type": "STRING"}
                            }
                        }
                    }
                }
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "DeepNestingTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_deep",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert code.count("BaseModel") >= 1
        ast.parse(code)


class TestFieldSanitizationAndAliasing:
    """Verifies handling of numeric prefixes, spaces, and reserved words."""

    def test_numeric_field_prefix_sanitization(self) -> None:
        schema = {
            "properties": {
                "13_lc_amount": {"type": "NUMBER"},
                "17_effective_date": {"type": "STRING"},
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "NumericFieldTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_num",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert "13_lc_amount:" not in code
        assert 'alias="13_lc_amount"' in code or 'alias=\'13_lc_amount\'' in code or "f_13_lc_amount" in code
        ast.parse(code)

    @pytest.mark.parametrize(
        "keyword",
        [
            "class",
            "def",
            "import",
            "from",
            "lambda",
            "async",
            "await",
            "global",
            "return",
            "yield",
        ],
    )
    def test_reserved_keyword_sanitization(self, keyword: str) -> None:
        schema = {
            "properties": {
                keyword: {"type": "STRING", "description": f"Field named {keyword}"}
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": f"KW_{keyword}",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_kw",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        # Must parse cleanly without SyntaxError caused by bare keyword field
        ast.parse(code)

    def test_populate_by_name_config(self) -> None:
        schema = {
            "properties": {
                "16_custom_field": {"type": "STRING"},
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "ConfigDictTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_cfg",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        assert "populate_by_name=True" in code or "ConfigDict" in code or "populate_by_name" in code

    @pytest.mark.parametrize(
        "special_field",
        [
            "field-with-dash",
            "field with spaces",
            "field.with.dot",
            "@type",
            "$ref",
        ],
    )
    def test_special_character_field_names(self, special_field: str) -> None:
        schema = {
            "properties": {
                special_field: {"type": "STRING"}
            }
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "SpecialFieldTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "agent_spec_field",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        # Must generate valid syntax
        ast.parse(code)


class TestDynamicModelExecution:
    """Executes generated model definitions at runtime to verify Pydantic v2 semantics."""

    def test_instantiate_generated_model(self) -> None:
        schema = {
            "properties": {
                "ticket_id": {"type": "STRING"},
                "cost": {"type": "NUMBER"},
                "is_urgent": {"type": "BOOLEAN"},
            },
            "required": ["ticket_id"],
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "ExecutionTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "exec_agent",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        env: dict[str, Any] = {}
        exec(code, env)

        model_classes = [
            v for v in env.values()
            if isinstance(v, type) and issubclass(v, BaseModel) and v is not BaseModel
        ]
        assert len(model_classes) >= 1
        model_cls = model_classes[0]

        instance = model_cls(ticket_id="TCK-100", cost=45.5, is_urgent=True)
        assert getattr(instance, "ticket_id", None) == "TCK-100"

    def test_validation_error_on_invalid_type(self) -> None:
        schema = {
            "properties": {
                "count": {"type": "INTEGER"},
            },
            "required": ["count"],
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "ValidationFailureTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "val_agent",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        env: dict[str, Any] = {}
        exec(code, env)

        model_classes = [
            v for v in env.values()
            if isinstance(v, type) and issubclass(v, BaseModel) and v is not BaseModel
        ]
        model_cls = model_classes[0]
        with pytest.raises(ValidationError):
            model_cls(count="not-an-integer-xyz")

    def test_missing_required_field_raises(self) -> None:
        schema = {
            "properties": {
                "required_code": {"type": "STRING"},
                "optional_desc": {"type": "STRING"},
            },
            "required": ["required_code"],
        }
        gen = CodeGenerator()
        dummy_wf = {
            "displayName": "MissingReqTest",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "req_agent",
                            "nodeType": "AGENT_NODE",
                            "outputSchema": schema,
                        }
                    ],
                    "edges": [],
                }
            },
        }
        code = gen.generate(parse_workflow(dummy_wf))
        env: dict[str, Any] = {}
        exec(code, env)

        model_classes = [
            v for v in env.values()
            if isinstance(v, type) and issubclass(v, BaseModel) and v is not BaseModel
        ]
        model_cls = model_classes[0]
        # Missing required field must raise ValidationError
        with pytest.raises(ValidationError):
            model_cls(optional_desc="Only optional provided")
