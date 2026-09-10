#!/usr/bin/env python3
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

"""Executable CLI utility for converting Agent Builder workflows to Google ADK Python code."""

import sys
from pathlib import Path

# Ensure local package is importable when executed directly as a script
REPO_ROOT = Path(__file__).resolve().parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from agent_builder_to_adk.cli import (
    convert_directory,
    convert_single_file,
    convert_workflow_json,
    main,
)
from agent_builder_to_adk.generator import CodeGenerator, CodeGenerationError
from agent_builder_to_adk.models import ParsedWorkflow
from agent_builder_to_adk.parser import parse_workflow, WorkflowParseError

__all__ = [
    "convert_workflow_json",
    "convert_single_file",
    "convert_directory",
    "parse_workflow",
    "CodeGenerator",
    "ParsedWorkflow",
    "WorkflowParseError",
    "CodeGenerationError",
    "main",
]

if __name__ == "__main__":
    sys.exit(main())
