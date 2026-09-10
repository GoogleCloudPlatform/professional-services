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

"""Node translator for AGENT_NODE mapping to Google ADK Agent and LocalAgentConfig."""

from __future__ import annotations

import keyword
import re
from typing import Any, Dict, List, Optional

from agent_builder_to_adk.models import ParsedWorkflow, WorkflowNode


def sanitize_identifier(name: str) -> str:
    """Sanitizes an arbitrary string into a valid Python identifier."""
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", name)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if not cleaned:
        return "node"
    if cleaned[0].isdigit():
        cleaned = f"node_{cleaned}"
    if keyword.iskeyword(cleaned):
        cleaned = f"node_{cleaned}"
    return cleaned


def pascal_case(name: str) -> str:
    """Converts a snake_case or hyphenated string into PascalCase for class names."""
    tokens = re.split(r"[^a-zA-Z0-9]", name)
    return "".join(t.capitalize() for t in tokens if t)


def format_raw_docstring(content: str) -> str:
    """Safely formats content into a raw triple-quoted Python string literal without syntax errors."""
    if not content:
        return 'r""""""'
    escaped = content.replace('"""', r'\"\"\"')
    if escaped.endswith('"') or escaped.endswith('\\'):
        escaped = escaped + "\n"
    return f'r"""{escaped}"""'


def escape_docstring(content: str) -> str:
    """Escapes triple quotes and ensures string can be safely placed in docstrings."""
    if not content:
        return ""
    escaped = content.replace('"""', r'\"\"\"')
    if escaped.endswith('"') or escaped.endswith('\\'):
        escaped = escaped + " "
    return escaped


class AgentNodeMapper:
    """Translates Agent Builder AGENT_NODE definitions into ADK Agent code blocks."""

    def __init__(self, node: WorkflowNode, workflow: ParsedWorkflow):
        self.node = node
        self.workflow = workflow
        self.agent_var = sanitize_identifier(node.id)
        self.config_var = f"{self.agent_var}_config"

    def get_connected_tools(self) -> List[str]:
        """Returns sanitized function names of tools connected strictly to this agent."""
        tool_node_ids = self.workflow.get_connected_tools(self.node.id)
        return [sanitize_identifier(tid) for tid in tool_node_ids]

    def get_response_schema_name(self) -> Optional[str]:
        """Returns the PascalCase response schema class name if outputSchema is defined."""
        if self.node.output_schema and self.node.output_schema.get("properties"):
            return f"{pascal_case(self.node.id)}Output"
        return None

    def generate_code(self) -> str:
        """Generates complete, un-truncated ADK Python code for configuring and instantiating this agent."""
        cfg = self.node.agent_node
        model_name = cfg.model if (cfg and cfg.model) else "gemini-1.5-pro"
        raw_instructions = cfg.instruction if (cfg and cfg.instruction) else ""
        system_instructions_lit = format_raw_docstring(raw_instructions)

        tool_funcs = self.get_connected_tools()
        tools_repr = f"[{', '.join(tool_funcs)}]" if tool_funcs else "[]"

        response_schema = self.get_response_schema_name()
        schema_param = f"response_schema={response_schema}" if response_schema else "response_schema=None"

        display_name = self.node.display_name or self.node.id
        description_lit = format_raw_docstring(display_name)

        code_lines = [
            f"# Agent: {display_name} (ID: {self.node.id})",
            f"{self.config_var} = LocalAgentConfig(",
            f"    model={repr(model_name)},",
            f"    system_instructions={system_instructions_lit},",
            f"    tools={tools_repr},",
            f"    {schema_param},",
            f"    description={description_lit},",
            f")",
            f"{self.agent_var} = Agent(",
            f"    name={repr(self.node.id)},",
            f"    config={self.config_var},",
            f")",
        ]

        return "\n".join(code_lines)
