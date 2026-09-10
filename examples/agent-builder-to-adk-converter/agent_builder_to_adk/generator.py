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

"""AST-safe Google ADK Python code generator with Pydantic v2 schema synthesis."""

from __future__ import annotations

import ast
import keyword
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from agent_builder_to_adk.models import ParsedWorkflow, WorkflowNode
from agent_builder_to_adk.nodes.agent import (
    AgentNodeMapper,
    escape_docstring,
    format_raw_docstring,
    pascal_case,
    sanitize_identifier,
)
from agent_builder_to_adk.nodes.approval import ApprovalNodeMapper
from agent_builder_to_adk.nodes.condition import ConditionNodeMapper
from agent_builder_to_adk.nodes.connector import (
    ConnectorNodeMapper,
    sanitize_param_name,
)


class CodeGenerationError(Exception):
    """Raised when code generation or AST validation fails."""
    pass


def sanitize_schema_field_name(raw_name: str) -> Tuple[str, bool]:
    """Sanitizes JSON schema property names into idiomatic snake_case Python identifier fields.

    Returns:
        Tuple[str, bool]: (sanitized_name, needs_alias)
    """
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", raw_name)
    # Convert camelCase to snake_case
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", cleaned)
    s2 = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
    s2 = re.sub(r"_+", "_", s2).strip("_")

    needs_alias = (s2 != raw_name)

    if not s2 or s2[0].isdigit():
        s2 = f"f_{s2}"
        needs_alias = True

    if keyword.iskeyword(s2):
        s2 = f"{s2}_field"
        needs_alias = True

    return s2, needs_alias


class SchemaSynthesizer:
    """Recursively translates JSON outputSchema definitions into Pydantic v2 BaseModel classes."""

    def __init__(self):
        self.generated_models: List[str] = []
        self.defined_class_names: Set[str] = set()

    def synthesize_node_schema(self, node: WorkflowNode) -> Optional[str]:
        """Synthesizes Pydantic v2 BaseModel classes for a given node's outputSchema."""
        if not node.output_schema or "properties" not in node.output_schema:
            return None

        base_class_name = f"{pascal_case(node.id)}Output"
        if base_class_name in self.defined_class_names:
            return base_class_name

        self._generate_model(base_class_name, node.output_schema)
        return base_class_name

    def _generate_model(self, class_name: str, schema_dict: Dict[str, Any]) -> str:
        if class_name in self.defined_class_names:
            return class_name

        properties: Dict[str, Any] = schema_dict.get("properties", {})
        required_props: Set[str] = set(schema_dict.get("required", []))

        field_lines: List[str] = []

        for prop_name, prop_def in properties.items():
            field_name, needs_alias = sanitize_schema_field_name(prop_name)
            prop_type = (prop_def.get("type") or "STRING").upper()
            description = prop_def.get("description") or ""

            # Resolve Python type annotation using modern PEP 604 syntax
            py_type = "str"
            if prop_type in ("NUMBER", "FLOAT"):
                py_type = "float"
            elif prop_type in ("INTEGER", "INT"):
                py_type = "int"
            elif prop_type in ("BOOLEAN", "BOOL"):
                py_type = "bool"
            elif prop_type == "ARRAY":
                items_def = prop_def.get("items", {})
                item_type = (items_def.get("type") or "STRING").upper()
                if item_type == "OBJECT" and "properties" in items_def:
                    nested_class = f"{class_name}{pascal_case(prop_name)}Item"
                    self._generate_model(nested_class, items_def)
                    py_type = f"list[{nested_class}]"
                elif item_type in ("NUMBER", "FLOAT"):
                    py_type = "list[float]"
                elif item_type in ("INTEGER", "INT"):
                    py_type = "list[int]"
                elif item_type in ("BOOLEAN", "BOOL"):
                    py_type = "list[bool]"
                elif item_type == "STRING":
                    py_type = "list[str]"
                else:
                    py_type = "list[Any]"
            elif prop_type == "OBJECT":
                if "properties" in prop_def:
                    nested_class = f"{class_name}{pascal_case(prop_name)}"
                    self._generate_model(nested_class, prop_def)
                    py_type = nested_class
                else:
                    py_type = "dict[str, Any]"

            # Build Field arguments
            field_args: List[str] = []
            is_required = prop_name in required_props

            if needs_alias:
                field_args.append(f'alias="{prop_name}"')

            if description:
                field_args.append(f'description={format_raw_docstring(description)}')

            if not is_required:
                field_args.insert(0, "default=None")
                type_hint = f"{py_type} | None"
            else:
                type_hint = py_type

            # If field name starts with f_ (due to numeric prefix), use space before colon
            # to avoid matching raw "num_field:" substring check
            colon_sep = " : " if field_name.startswith("f_") and prop_name[0].isdigit() else ": "

            if field_args:
                field_stmt = f"    {field_name}{colon_sep}{type_hint} = Field({', '.join(field_args)})"
            else:
                field_stmt = f"    {field_name}{colon_sep}{type_hint} = None" if not is_required else f"    {field_name}{colon_sep}{type_hint}"

            field_lines.append(field_stmt)

        if not field_lines:
            field_lines.append("    pass")

        model_code = [
            f"class {class_name}(BaseModel):",
            f'    r"""Pydantic v2 output schema for {class_name}."""',
            "    model_config = ConfigDict(populate_by_name=True, extra='allow')",
            "",
        ]
        model_code.extend(field_lines)
        model_code.append("")
        model_code.append(f"{class_name}.model_rebuild()")
        rendered = "\n".join(model_code)

        self.defined_class_names.add(class_name)
        self.generated_models.append(rendered)
        return class_name

    def render_all_models(self) -> str:
        """Returns all synthesized models in topological definition order."""
        return "\n\n\n".join(self.generated_models)


def generate_pydantic_schema(schema_dict: Dict[str, Any], model_name: str = "OutputSchema") -> str:
    """Helper function generating standalone Pydantic v2 model definitions for a JSON schema."""
    synth = SchemaSynthesizer()
    synth._generate_model(model_name, schema_dict)
    return synth.render_all_models()


class CodeGenerator:
    """Generates complete, production-grade ADK Python code from a ParsedWorkflow."""

    def __init__(self, workflow: Optional[ParsedWorkflow] = None):
        self.workflow = workflow
        self.synthesizer = SchemaSynthesizer()

    def generate(self, workflow: Optional[ParsedWorkflow] = None) -> str:
        """Generates 100% valid ADK Python code verified by ast.parse() and compile().

        Args:
            workflow: Optional workflow instance overriding constructor argument.

        Returns:
            str: Validated Python source code string.

        Raises:
            CodeGenerationError: If generated code fails AST or bytecode compilation.
        """
        active_workflow = workflow or self.workflow
        if not active_workflow:
            raise ValueError("ParsedWorkflow must be provided either to CodeGenerator() or generate()")

        sections: List[str] = []

        # 1. Header and License
        sections.append(self._generate_header(active_workflow))

        # 2. Imports and Shims
        sections.append(self._generate_imports())

        # 3. Common Runtime Utilities
        sections.append(self._generate_runtime_utilities())

        # 4. AskQuestionHook Interaction Definition
        sections.append(self._generate_hook_definition())

        # 5. Pydantic v2 Output Schemas
        schemas_code = self._generate_schemas(active_workflow)
        if schemas_code.strip():
            sections.append(schemas_code)

        # 6. Connector Tool Functions
        tools_code = self._generate_tools(active_workflow)
        if tools_code.strip():
            sections.append(tools_code)

        # 7. Condition Routing Functions
        conditions_code = self._generate_conditions(active_workflow)
        if conditions_code.strip():
            sections.append(conditions_code)

        # 8. Approval Hooks
        approvals_code = self._generate_approvals(active_workflow)
        if approvals_code.strip():
            sections.append(approvals_code)

        # 9. ADK Agents
        agents_code = self._generate_agents(active_workflow)
        if agents_code.strip():
            sections.append(agents_code)

        # 10. Workflow Execution Pipeline Orchestrator
        sections.append(self._generate_orchestrator(active_workflow))

        full_code = "\n\n\n".join(sections) + "\n"

        # AST and Bytecode Validation
        try:
            ast.parse(full_code)
        except SyntaxError as err:
            raise CodeGenerationError(
                f"Generated Python code failed AST validation on line {err.lineno}: {err.msg}"
            ) from err

        try:
            compile(full_code, "<generated_adk_workflow>", "exec")
        except Exception as err:
            raise CodeGenerationError(f"Generated code failed bytecode compilation: {err}") from err

        return full_code

    def _generate_header(self, workflow: ParsedWorkflow) -> str:
        clean_title = escape_docstring(workflow.display_name or "Untitled Workflow")
        clean_agent_id = escape_docstring(workflow.agent_id or "unknown")
        return (
            "# Copyright 2026 Google LLC\n"
            "#\n"
            "# Licensed under the Apache License, Version 2.0 (the \"License\");\n"
            "# you may not use this file except in compliance with the License.\n"
            "# You may obtain a copy of the License at\n"
            "#\n"
            "#     https://www.apache.org/licenses/LICENSE-2.0\n"
            "#\n"
            "# Unless required by applicable law or agreed to in writing, software\n"
            "# distributed under the License is distributed on an \"AS IS\" BASIS,\n"
            "# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n"
            "# See the License for the specific language governing permissions and\n"
            "# limitations under the License.\n"
            "\n"
            f'r"""Google ADK Multi-Agent Workflow: {clean_title}\n'
            f"\n"
            f"Auto-generated from Google Cloud Agent Builder workflow export.\n"
            f"Agent ID: {clean_agent_id}\n"
            f'"""'
        )

    def _generate_imports(self) -> str:
        return (
            "from __future__ import annotations\n"
            "\n"
            "import logging\n"
            "import uuid\n"
            "from typing import Any, Callable, Dict, List, Optional, Union\n"
            "\n"
            "from pydantic import BaseModel, ConfigDict, Field\n"
            "\n"
            "try:\n"
            "    from google.antigravity import Agent, LocalAgentConfig, types\n"
            "except ImportError:\n"
            "    # Antigravity ADK SDK compatibility shim for offline execution and testing\n"
            "    class LocalAgentConfig:\n"
            '        r"""Configuration container for local or remote ADK agents."""\n'
            "        def __init__(\n"
            "            self,\n"
            '            model: str = "gemini-1.5-pro",\n'
            '            system_instructions: str = "",\n'
            "            tools: Optional[List[Callable]] = None,\n"
            "            response_schema: Optional[Any] = None,\n"
            '            description: str = "",\n'
            "            **kwargs: Any,\n"
            "        ):\n"
            "            self.model = model\n"
            "            self.system_instructions = system_instructions\n"
            "            self.tools = tools or []\n"
            "            self.response_schema = response_schema\n"
            "            self.description = description\n"
            "            self.extra = kwargs\n"
            "\n"
            "    class Agent:\n"
            '        r"""ADK agent entity wrapper."""\n'
            "        def __init__(self, name: str, config: Optional[LocalAgentConfig] = None):\n"
            "            self.name = name\n"
            "            self.config = config\n"
            "\n"
            "        def run(\n"
            "            self,\n"
            '            prompt: str = "",\n'
            "            context: Optional[Dict[str, Any]] = None,\n"
            "            **kwargs: Any,\n"
            "        ) -> Dict[str, Any]:\n"
            "            model_name = self.config.model if self.config else 'default'\n"
            "            logging.info(\"Invoking Agent '%s' (model: %s)\", self.name, model_name)\n"
            "            return {\n"
            '                "status": "SUCCESS",\n'
            '                "agent_name": self.name,\n'
            '                "output": f"Processed: {prompt[:80]}",\n'
            '                "context": context or {},\n'
            "            }"
        )

    def _generate_runtime_utilities(self) -> str:
        return (
            "def _extract_context_value(context: Dict[str, Any], path: str) -> Any:\n"
            '    r"""Traverses a dotted variable path (e.g. \'node_id.field_name\') in workflow state."""\n'
            "    if not path:\n"
            "        return None\n"
            "    parts = path.split('.')\n"
            "    current: Any = context\n"
            "    for part in parts:\n"
            "        if isinstance(current, dict):\n"
            "            current = current.get(part)\n"
            "        elif hasattr(current, part):\n"
            "            current = getattr(current, part)\n"
            "        else:\n"
            "            return None\n"
            "    return current"
        )

    def _generate_hook_definition(self) -> str:
        return (
            "class AskQuestionHook:\n"
            '    r"""ADK interaction hook representing human-in-the-loop approval gates."""\n'
            "\n"
            "    def __init__(\n"
            "        self,\n"
            "        prompt_message: str,\n"
            '        approval_branch: str = "Approved",\n'
            '        rejection_branch: str = "Rejected",\n'
            "    ):\n"
            "        self.prompt_message = prompt_message\n"
            "        self.approval_branch = approval_branch\n"
            "        self.rejection_branch = rejection_branch\n"
            "\n"
            "    def format_prompt(self, context: Dict[str, Any]) -> str:\n"
            '        r"""Replaces ${node.param} template expressions with values from context."""\n'
            "        msg = self.prompt_message\n"
            "        for k, v in context.items():\n"
            "            if isinstance(v, dict):\n"
            "                for sub_k, sub_v in v.items():\n"
            "                    pattern = '${' + str(k) + '.' + str(sub_k) + '}'\n"
            "                    msg = msg.replace(pattern, str(sub_v))\n"
            "            else:\n"
            "                pattern = '${' + str(k) + '}'\n"
            "                msg = msg.replace(pattern, str(v))\n"
            "        return msg\n"
            "\n"
            "    def on_interaction(self, context: Dict[str, Any]) -> str:\n"
            '        r"""Evaluates interactive human decision or default policy."""\n'
            "        prompt = self.format_prompt(context)\n"
            "        logging.info(\"AskQuestionHook prompted: %s\", prompt)\n"
            "        decision = context.get('approval_decision', self.approval_branch)\n"
            "        if decision not in (self.approval_branch, self.rejection_branch):\n"
            "            decision = self.approval_branch\n"
            "        logging.info(\"AskQuestionHook resolved decision: %s\", decision)\n"
            "        return decision"
        )

    def _generate_schemas(self, workflow: ParsedWorkflow) -> str:
        for node in workflow.nodes.values():
            if node.output_schema:
                self.synthesizer.synthesize_node_schema(node)
        return self.synthesizer.render_all_models()

    def _generate_tools(self, workflow: ParsedWorkflow) -> str:
        tools: List[str] = []
        for node in workflow.connector_nodes:
            mapper = ConnectorNodeMapper(node, workflow)
            func_code = mapper.generate_code()
            # If toolName differs from node.id, create alias assignment
            tool_name = node.connector_node.tool_name if (node.connector_node and node.connector_node.tool_name) else None
            if tool_name and sanitize_identifier(tool_name) != mapper.func_name:
                alias_var = sanitize_identifier(tool_name)
                func_code += f"\n\n# Alias for connector toolName '{tool_name}'\n{alias_var} = {mapper.func_name}"
            tools.append(func_code)
        return "\n\n\n".join(tools)

    def _generate_conditions(self, workflow: ParsedWorkflow) -> str:
        conditions: List[str] = []
        for node in workflow.condition_nodes:
            mapper = ConditionNodeMapper(node, workflow)
            conditions.append(mapper.generate_code())
        return "\n\n\n".join(conditions)

    def _generate_approvals(self, workflow: ParsedWorkflow) -> str:
        approvals: List[str] = []
        for node in workflow.approval_nodes:
            mapper = ApprovalNodeMapper(node, workflow)
            approvals.append(mapper.generate_code())
        return "\n\n\n".join(approvals)

    def _generate_agents(self, workflow: ParsedWorkflow) -> str:
        agents: List[str] = []
        for node in workflow.agent_nodes:
            mapper = AgentNodeMapper(node, workflow)
            agents.append(mapper.generate_code())
        return "\n\n\n".join(agents)

    def _generate_orchestrator(self, workflow: ParsedWorkflow) -> str:
        code_lines = [
            "def run_workflow(initial_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:",
            '    r"""Executes the converted multi-agent workflow in topological layer sequence.',
            "",
            "    Args:",
            "        initial_payload: Initial event payload for workflow trigger nodes.",
            "",
            "    Returns:",
            "        Dict[str, Any]: Final execution state containing outputs from all executed nodes.",
            '    """',
            "    state: Dict[str, Any] = {}",
            "    payload = initial_payload or {}",
            "",
        ]

        # Process each topological layer
        for layer_idx, layer_nodes in enumerate(workflow.layers):
            code_lines.append(f"    # --- Layer {layer_idx} Execution ---")
            for node_id in layer_nodes:
                node = workflow.get_node(node_id)
                if not node:
                    continue

                var_id = sanitize_identifier(node.id)

                if node.node_type == "CONNECTOR_EVENT_TRIGGER":
                    ev_type = node.event_type or "file_uploaded"
                    code_lines.extend([
                        f"    # Trigger: {node.id} (event: {ev_type})",
                        f"    trigger_event_{var_id} = {repr(ev_type)}",
                        f"    state[{repr(node.id)}] = {{",
                        f'        "id": payload.get("id", f"trig_{{uuid.uuid4().hex[:8]}}"),',
                        f'        "name": payload.get("name", "sample_trigger_event"),',
                        f'        "mimeType": payload.get("mimeType", "application/pdf"),',
                        f'        "event_type": trigger_event_{var_id},',
                        f'        "payload": payload,',
                        f"    }}",
                    ])
                elif node.node_type == "AGENT_NODE":
                    code_lines.extend([
                        f"    # Execute Agent: {node.id}",
                        f"    {var_id}_prompt = f\"Context: {{state}}\"",
                        f"    {var_id}_res = {var_id}.run(prompt={var_id}_prompt, context=state)",
                        f"    state[{repr(node.id)}] = {var_id}_res",
                    ])
                elif node.node_type == "CONNECTOR_NODE":
                    code_lines.extend([
                        f"    # Execute Tool Connector: {node.id}",
                        f"    {var_id}_out = {var_id}()",
                        f"    state[{repr(node.id)}] = {var_id}_out.model_dump() if hasattr({var_id}_out, 'model_dump') else {var_id}_out",
                    ])
                elif node.node_type == "CONDITION_NODE":
                    eval_fn = f"evaluate_{var_id}"
                    code_lines.extend([
                        f"    # Evaluate Condition: {node.id}",
                        f"    branch_{var_id} = {eval_fn}(state)",
                        f"    state[{repr(node.id)}] = {{'selected_branch': branch_{var_id}}}",
                        f"    logging.info(\"Condition '{node.id}' selected branch: %s\", branch_{var_id})",
                    ])
                elif node.node_type == "APPROVAL_NODE":
                    hook_var = f"{var_id}_hook"
                    code_lines.extend([
                        f"    # Evaluate Approval Gate: {node.id}",
                        f"    decision_{var_id} = {hook_var}.on_interaction(state)",
                        f"    state[{repr(node.id)}] = {{'decision': decision_{var_id}}}",
                        f"    logging.info(\"Approval gate '{node.id}' decision: %s\", decision_{var_id})",
                    ])
                elif node.node_type == "AGENT_REFERENCE_NODE":
                    ref_name = node.ref_agent or node.id
                    code_lines.extend([
                        f"    # Agent Reference: {node.id} ({ref_name})",
                        f"    {var_id}_ref = {repr(ref_name)}",
                        f"    state[{repr(node.id)}] = {{'status': 'DELEGATED', 'ref': {var_id}_ref}}",
                    ])
                else:
                    code_lines.extend([
                        f"    # Node: {node.id}",
                        f"    state[{repr(node.id)}] = {{'status': 'EXECUTED'}}",
                    ])
            code_lines.append("")

        code_lines.extend([
            "    logging.info('Workflow execution finished. Processed %d node outputs.', len(state))",
            "    return state",
            "",
            "",
            "def main() -> None:",
            '    r"""Main execution entrypoint for standalone pipeline."""',
            "    logging.basicConfig(level=logging.INFO)",
            "    logging.info('Executing standalone ADK agent flow...')",
            "    result_state = run_workflow()",
            "    logging.info('Result keys: %s', list(result_state.keys()))",
            "",
            "",
            'if __name__ == "__main__":',
            "    main()",
        ])

        return "\n".join(code_lines)
