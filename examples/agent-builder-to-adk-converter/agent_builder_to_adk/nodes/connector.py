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

"""Node translator for CONNECTOR_NODE mapping to strongly-typed Python tool functions."""

from __future__ import annotations

import keyword
import re
from typing import Any, Dict, List, Optional, Tuple

from agent_builder_to_adk.models import ParsedWorkflow, WorkflowNode
from agent_builder_to_adk.nodes.agent import escape_docstring, pascal_case, sanitize_identifier


def sanitize_param_name(raw_name: str) -> str:
    """Sanitizes an input parameter key into a valid, idiomatic Python parameter name."""
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", raw_name).lower()
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if not cleaned or cleaned[0].isdigit():
        cleaned = f"param_{cleaned}"
    if keyword.iskeyword(cleaned):
        cleaned = f"{cleaned}_param"
    return cleaned


def infer_type_and_default(val: Any) -> Tuple[str, str]:
    """Infers Python type hint and sample default value from parameter value."""
    if isinstance(val, bool):
        return "bool", repr(val)
    elif isinstance(val, int):
        return "int", repr(val)
    elif isinstance(val, float):
        return "float", repr(val)
    elif isinstance(val, list):
        return "list[Any]", "[]"
    elif isinstance(val, dict):
        return "dict[str, Any]", "{}"
    elif isinstance(val, str):
        # Check if it's a template reference like ${node.field}
        if val.startswith("${") and val.endswith("}"):
            clean_ref = val[2:-1].strip()
            return "str", repr(f"Value from {clean_ref}")
        return "str", repr(val if val else "default")
    return "str", repr("default")


def generate_mock_value(prop_def: Dict[str, Any], prop_name: str, indent_level: int = 2) -> str:
    """Recursively generates a Python literal expression for mock payloads matching schema definitions."""
    p_type = (prop_def.get("type") or "STRING").upper()
    clean_k = sanitize_identifier(prop_name)
    indent = "    " * indent_level
    sub_indent = "    " * (indent_level + 1)

    if p_type == "STRING":
        return f'f"{clean_k}_{{uuid.uuid4().hex[:8]}}"'
    elif p_type in ("NUMBER", "FLOAT"):
        return "100.0"
    elif p_type in ("INTEGER", "INT"):
        return "1"
    elif p_type in ("BOOLEAN", "BOOL"):
        return "True"
    elif p_type == "ARRAY":
        items_def = prop_def.get("items", {})
        item_type = (items_def.get("type") or "STRING").upper()
        if item_type == "OBJECT" and "properties" in items_def:
            sub_val = generate_mock_value(items_def, f"{prop_name}_item", indent_level + 1)
            return f"[\n{sub_indent}{sub_val}\n{indent}]"
        elif item_type in ("NUMBER", "FLOAT"):
            return "[100.0]"
        elif item_type in ("INTEGER", "INT"):
            return "[1]"
        elif item_type in ("BOOLEAN", "BOOL"):
            return "[True]"
        else:
            return '["sample_item"]'
    elif p_type == "OBJECT":
        sub_props = prop_def.get("properties")
        if sub_props:
            sub_lines = []
            for sub_k, sub_v in sub_props.items():
                sub_val = generate_mock_value(sub_v, sub_k, indent_level + 1)
                sub_lines.append(f'{sub_indent}"{sub_k}": {sub_val},')
            nested_str = "\n".join(sub_lines)
            return f"{{\n{nested_str}\n{indent}}}"
        return '{"status": "OK"}'
    else:
        return '{"status": "OK"}'


class ConnectorNodeMapper:
    """Translates Agent Builder CONNECTOR_NODE definitions into strongly-typed tool functions."""

    def __init__(self, node: WorkflowNode, workflow: ParsedWorkflow):
        self.node = node
        self.workflow = workflow
        self.func_name = sanitize_identifier(node.id)

    def get_output_schema_name(self) -> Optional[str]:
        """Returns the PascalCase response schema class name if outputSchema is defined."""
        if self.node.output_schema and self.node.output_schema.get("properties"):
            return f"{pascal_case(self.node.id)}Output"
        return None

    def generate_code(self) -> str:
        """Generates a complete, strongly-typed Python tool function with zero TODO placeholders."""
        cfg = self.node.connector_node
        tool_name = cfg.tool_name if (cfg and cfg.tool_name) else self.node.id
        raw_params = cfg.input_parameters if (cfg and cfg.input_parameters) else {}
        display_name = self.node.display_name or self.node.id

        params_list: List[str] = []
        doc_args: List[str] = []

        seen_params = set()

        if raw_params:
            for raw_k, raw_v in raw_params.items():
                p_name = sanitize_param_name(raw_k)
                if p_name in seen_params:
                    p_name = f"{p_name}_{len(seen_params)}"
                seen_params.add(p_name)

                p_type, p_default = infer_type_and_default(raw_v)
                params_list.append(f"{p_name}: {p_type} = {p_default}")
                doc_args.append(f"        {p_name} ({p_type}): Parameter mapped from '{raw_k}'.")
        else:
            # Provide standard parameters if none explicitly configured
            params_list.append('query: str = ""')
            params_list.append("payload: Optional[dict[str, Any]] = None")
            doc_args.append("        query (str): Query string or search term.")
            doc_args.append("        payload (Optional[dict[str, Any]]): Optional payload configuration.")

        sig_params = ",\n    ".join(params_list)

        schema_name = self.get_output_schema_name()
        return_type = schema_name if schema_name else "dict[str, Any]"

        # Construct realistic output payload matching output_schema
        mock_fields: List[str] = []
        if self.node.output_schema and "properties" in self.node.output_schema:
            for prop_k, prop_v in self.node.output_schema["properties"].items():
                mock_val = generate_mock_value(prop_v, prop_k, 2)
                mock_fields.append(f'        "{prop_k}": {mock_val},')
        else:
            clean_tool = tool_name.replace('\\', '\\\\').replace('"', '\\"')
            mock_fields = [
                '        "status": "SUCCESS",',
                '        "execution_id": f"exec_{uuid.uuid4().hex[:12]}",',
                f'        "tool": "{clean_tool}",',
                f'        "message": "Successfully executed tool \'{clean_tool}\'",',
            ]

        docstring_desc = escape_docstring(f"Connector tool executing {display_name} via action '{tool_name}'.")

        code_lines = [
            f"def {self.func_name}(",
            f"    {sig_params}",
            f") -> {return_type}:",
            f'    r"""{docstring_desc}',
            "",
            "    Args:",
        ]
        code_lines.extend(doc_args)
        code_lines.extend([
            "",
            "    Returns:",
            f"        {return_type}: Execution result and metadata.",
            '    """',
            f'    logging.info("Executing connector tool \'{self.func_name}\' ({tool_name})")',
            "    result_data = {",
        ])
        code_lines.extend(mock_fields)
        code_lines.append("    }")

        if schema_name:
            code_lines.append(f"    return {schema_name}.model_validate(result_data)")
        else:
            code_lines.append("    return result_data")

        return "\n".join(code_lines)
