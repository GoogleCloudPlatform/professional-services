# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Database Agent: get data from database (BigQuery) using NL2SQL."""

import os
from typing import Any

from google.adk.agents import Agent
from google.adk.tools.base_tool import BaseTool  # Required for type hinting in callback
from google.adk.tools.tool_context import ToolContext
from google.genai import types

from . import tools
from .chase_sql import chase_db_tools
from .prompts import return_instructions_bigquery

NL2SQL_METHOD = os.getenv("NL2SQL_METHOD", "BASELINE")


def setup_before_tool_call(
    tool: BaseTool, args: dict[str, Any], tool_context: ToolContext
) -> dict[str, Any] | None:
    tool_name = tool.name
    print(f"\n[BEFORE TOOL] Calling '{tool_name}' with original args: {args}")
    project_id = tool_context.state.get("project_id")
    dataset_id = tool_context.state.get("dataset_id")
    ddl = tool_context.state.get("ddl")
    """Setup the agent."""
    if "database_settings" not in tool_context.state:
        tool_context.state["database_settings"] = \
            tools.get_database_settings(ddl, project_id, dataset_id)

dml_agent = Agent(
    model="gemini-2.5-flash",
    name="dml_agent",
    description="Responsible for DML operations in BigQuery.",
    instruction=return_instructions_bigquery(),
    tools=[
        (
            chase_db_tools.initial_bq_nl2sql
            if NL2SQL_METHOD == "CHASE"
            else tools.initial_bq_nl2sql
        ),
        tools.run_bigquery_validation,
    ],
    before_tool_callback=setup_before_tool_call,
    generate_content_config=types.GenerateContentConfig(temperature=0.01),
)