# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
State definitions for the SLO Generator Agent.

This module defines the TypedDict structures used to pass state
between the various nodes in the LangGraph workflow.
"""

from typing import Any, Dict, List, Optional, TypedDict


class CUJMetadata(TypedDict):
    """
    Metadata representing a Critical User Journey (CUJ) identified in the codebase.
    """

    name: str
    description: str
    relevant_files: List[str]


class AgentState(TypedDict):
    """
    The central state object passed through the LangGraph workflow.

    Attributes:
        repo_url: The URL of the repository being analyzed.
        pat_token: Optional Personal Access Token for authentication.
        local_repo_path: Path where the repo is cloned locally.
        source_code: Raw source code content or summary.
        file_tree: String representation of the repository file structure.
        identified_cujs: List of CUJs found by the Analyst agent.
        sequence_diagram_code: Mermaid/PlantUML code for the sequence diagram.
        slo_spec_draft: The text-based SLO specification.
        terraform_files: Dictionary mapping filenames to their Terraform code content.
        validation_errors: Accumulator for any errors found during validation steps.
    """

    # Input: Git Url and private access token
    repo_url: str
    pat_token: Optional[str]
    local_repo_path: str

    # Input: The raw code provided by the user
    source_code: str
    file_tree: str

    # Output from "Code Analyst" [cite: 7]
    identified_cujs: List[Dict[str, Any]]

    # Output from "Diagram & Flow Generator" [cite: 8]
    # We store the text representation (Mermaid/PlantUML)
    sequence_diagram_code: Dict[str, str]

    # Output from "SLO Definition" [cite: 10]
    # A structured dictionary or text describing SLIs/SLOs
    slo_spec_draft: str
    slo_reports_dict: Dict[str, str]

    # Output from "Terraform Generator" [cite: 11]
    terraform_files: Dict[str, str]

    # Feedback loop for Validation
    validation_errors: Optional[str]

    chat_history: List[Dict[str, str]]

    # The "Staging Area".
    pending_proposal: Optional[Dict[str, Any]]

    # Tracks the active goal across interrupts (e.g., 'terraform', 'slo')
    workflow_goal: Optional[str]
    auto_approve: bool

    # Stores user hints to focus on specific CUJs
    cuj_guidance: Optional[str]
