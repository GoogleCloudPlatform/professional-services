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

"""Node translator for CONDITION_NODE mapping to conditional branching logic."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from agent_builder_to_adk.models import (
    ConditionExpression,
    ExpressionItem,
    LogicalGroup,
    ParsedWorkflow,
    RoutingRule,
    WorkflowNode,
)
from agent_builder_to_adk.nodes.agent import escape_docstring, sanitize_identifier


def map_condition_operator(operator_str: Optional[str]) -> str:
    """Maps Agent Builder operator strings to Python comparison operators."""
    op = (operator_str or "EQUALS").upper()
    mapping = {
        "EQUALS": "==",
        "EQUAL": "==",
        "NOT_EQUALS": "!=",
        "NOT_EQUAL": "!=",
        "GREATER_THAN": ">",
        "GREATER_THAN_OR_EQUAL": ">=",
        "LESS_THAN": "<",
        "LESS_THAN_OR_EQUAL": "<=",
        "CONTAINS": "in",
        "IS_TRUE": "is_true",
        "IS_FALSE": "is_false",
    }
    return mapping.get(op, "==")


class ConditionNodeMapper:
    """Translates Agent Builder CONDITION_NODE definitions into executable routing functions."""

    def __init__(self, node: WorkflowNode, workflow: ParsedWorkflow):
        self.node = node
        self.workflow = workflow
        self.eval_func_name = f"evaluate_{sanitize_identifier(node.id)}"

    def generate_code(self) -> str:
        """Generates a complete Python function that evaluates condition rules against workflow state."""
        display_name = self.node.display_name or self.node.id
        docstring_desc = escape_docstring(
            f"Evaluates conditional routing rules for condition node '{display_name}' ({self.node.id})."
        )

        rules: List[RoutingRule] = []
        if self.node.condition_node and self.node.condition_node.rule_based_routing:
            rules = self.node.condition_node.rule_based_routing.rules

        # Outgoing branches from edges
        outgoing_edges = self.workflow.get_outgoing_edges(self.node.id)
        default_branch = "DEFAULT"
        if (
            self.node.condition_node
            and self.node.condition_node.rule_based_routing
            and getattr(self.node.condition_node.rule_based_routing, "else_branch", None)
        ):
            default_branch = self.node.condition_node.rule_based_routing.else_branch
        elif outgoing_edges:
            rule_branches = {r.branch for r in rules}
            for e in outgoing_edges:
                if e.route_string and e.route_string not in rule_branches:
                    default_branch = e.route_string
                    break
            else:
                for e in outgoing_edges:
                    if e.route_string:
                        default_branch = e.route_string
                        break
                else:
                    default_branch = outgoing_edges[0].target_node_id

        code_lines = [
            f"def {self.eval_func_name}(context: dict[str, Any]) -> str:",
            f'    r"""{docstring_desc}',
            "",
            "    Args:",
            "        context (dict[str, Any]): Workflow state context containing upstream outputs.",
            "",
            "    Returns:",
            "        str: Evaluated routing branch name.",
            '    """',
        ]

        if not rules:
            code_lines.append(f"    return {repr(default_branch)}")
            return "\n".join(code_lines)

        for idx, rule in enumerate(rules):
            branch_name = rule.branch
            cond_clauses: List[str] = []
            logical_op = "and"

            if rule.rule and rule.rule.root_expression:
                root_expr = rule.rule.root_expression
                if root_expr.logical_group:
                    lg: LogicalGroup = root_expr.logical_group
                    logical_op = "and" if (lg.logical_operator or "AND").upper() == "AND" else "or"
                    for exp_idx, expr_item in enumerate(lg.expressions):
                        if expr_item.condition:
                            clause = self._build_clause(expr_item.condition, idx, exp_idx, code_lines)
                            cond_clauses.append(clause)
                elif root_expr.condition:
                    clause = self._build_clause(root_expr.condition, idx, 0, code_lines)
                    cond_clauses.append(clause)

            if cond_clauses:
                joined_cond = f" {logical_op} ".join(cond_clauses)
                code_lines.append(f"    if {joined_cond}:")
                code_lines.append(f"        return {repr(branch_name)}")
            else:
                code_lines.append(f"    return {repr(branch_name)}")

        code_lines.append(f"    return {repr(default_branch)}")
        return "\n".join(code_lines)

    def _build_clause(
        self,
        cond: ConditionExpression,
        rule_idx: int,
        expr_idx: int,
        code_lines: List[str],
    ) -> str:
        var_path = cond.left.variable_path if cond.left else "status"
        op_raw = (cond.condition_operator or "EQUALS").upper()
        op_py = map_condition_operator(cond.condition_operator)
        val_repr = repr(cond.right.literal) if (cond.right and cond.right.literal is not None) else "None"

        val_var = f"val_r{rule_idx}_e{expr_idx}"
        code_lines.append(f"    {val_var} = _extract_context_value(context, {repr(var_path)})")

        if op_raw in ("IS_TRUE", "IS_TRUE_VALUE") or op_py == "is_true":
            return f"bool({val_var})"
        if op_raw in ("IS_FALSE", "IS_FALSE_VALUE") or op_py == "is_false":
            return f"not bool({val_var})"
        if op_py == "in":
            return f"({val_var} is not None and {val_repr} in {val_var})" if val_repr != "None" else f"bool({val_var})"
        if op_py in (">", ">=", "<", "<="):
            return f"({val_var} is not None and {val_var} {op_py} {val_repr})"
        return f"{val_var} {op_py} {val_repr}"
