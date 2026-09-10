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

"""Node translator for APPROVAL_NODE mapping to Google ADK AskQuestionHook."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from agent_builder_to_adk.models import ParsedWorkflow, WorkflowNode
from agent_builder_to_adk.nodes.agent import (
    escape_docstring,
    format_raw_docstring,
    sanitize_identifier,
)


class ApprovalNodeMapper:
    """Translates Agent Builder APPROVAL_NODE definitions into ADK AskQuestionHook instances."""

    def __init__(self, node: WorkflowNode, workflow: ParsedWorkflow):
        self.node = node
        self.workflow = workflow
        self.hook_var = f"{sanitize_identifier(node.id)}_hook"

    def generate_code(self) -> str:
        """Generates executable AskQuestionHook instantiation code for this approval gate."""
        cfg = self.node.approval_node
        raw_msg = cfg.message if (cfg and cfg.message) else "Please approve or reject this action."
        prompt_message_lit = format_raw_docstring(raw_msg)

        approval_branch = cfg.approval_branch if (cfg and cfg.approval_branch) else "Approved"
        rejection_branch = cfg.rejection_branch if (cfg and cfg.rejection_branch) else "Rejected"

        display_name = (self.node.display_name or self.node.id).replace("\n", " ")

        code_lines = [
            f"# Human-in-the-loop Approval Gate: {display_name} (ID: {self.node.id})",
            f"{self.hook_var} = AskQuestionHook(",
            f"    prompt_message={prompt_message_lit},",
            f"    approval_branch={repr(approval_branch)},",
            f"    rejection_branch={repr(rejection_branch)},",
            f")",
        ]

        return "\n".join(code_lines)
