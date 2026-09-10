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

"""Agent Builder to Google ADK Python Converter.

An enterprise-grade tool for translating Google Cloud Agent Builder workflow JSON exports
into production-ready Google Antigravity SDK (ADK) Python multi-agent pipelines.
"""

from agent_builder_to_adk.cli import (
    convert_directory,
    convert_single_file,
    convert_workflow_json,
    main,
)
from agent_builder_to_adk.generator import CodeGenerator, CodeGenerationError
from agent_builder_to_adk.models import (
    ParsedWorkflow,
    WorkflowEdge,
    WorkflowNode,
)
from agent_builder_to_adk.parser import parse_workflow, WorkflowParseError

__version__ = "1.0.0"

__all__ = [
    "__version__",
    "convert_workflow_json",
    "convert_single_file",
    "convert_directory",
    "parse_workflow",
    "CodeGenerator",
    "ParsedWorkflow",
    "WorkflowNode",
    "WorkflowEdge",
    "WorkflowParseError",
    "CodeGenerationError",
    "main",
]
