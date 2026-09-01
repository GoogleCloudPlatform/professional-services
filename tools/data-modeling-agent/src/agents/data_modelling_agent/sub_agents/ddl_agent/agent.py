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

from typing import Any

from google.adk.agents import Agent
from google.adk.tools.base_tool import BaseTool  # Required for type hinting in callback
from google.adk.tools.tool_context import ToolContext

from .tools import ddl_execution, execute_raw_ddl, inspect_live_bigquery_tables

#########callbacks##########

def before_tool_callback_user_input(
    tool: BaseTool, args: dict[str, Any], tool_context: ToolContext
) -> dict[str, Any] | None:
    tool_name = tool.name
    print(f"\n[BEFORE TOOL] Calling '{tool_name}' with original args: {args}")

    dataset_to_be_deleted = args.get("dataset_to_be_deleted", False)
    tool_context.state["dataset_to_be_deleted"] = dataset_to_be_deleted

    dataset_id = args.get("dataset_id", None)
    if dataset_id:
        tool_context.state["dataset_id"] = dataset_id
    return None

ddl_agent = Agent(
    name="ddl_agent",
    model="gemini-2.5-flash",
    instruction=r"""You are a BigQuery DDL execution and Database Administration assistant.
Your capabilities include:
1. Inspecting live BigQuery datasets and tables via `inspect_live_bigquery_tables` to explain their schemas and business meanings.
2. Executing custom BigQuery SQL DDL and ALTER statements via `execute_raw_ddl`, including:
   - Creating new schemas and tables, and inserting records (`CREATE SCHEMA`, `CREATE TABLE`, `INSERT INTO`).
   - Adding or updating table descriptions (`ALTER TABLE \`project.dataset.table\` SET OPTIONS (description="...");`).
   - Adding or updating column descriptions (`ALTER TABLE \`project.dataset.table\` ALTER COLUMN column_name SET OPTIONS (description="...");`).
3. Running pre-existing DDL statements via `ddl_execution`.

**Guidelines:**
- When requested to inspect live datasets or tables in BigQuery, dynamically extract the dataset names or project ID from the user request and call `inspect_live_bigquery_tables(dataset_ids=[...])` to inspect them and explain every table and column in clear, business-friendly terms.
- When creating source tables or raw schemas, write standard `CREATE TABLE` and `INSERT INTO` statements.
- When requested to add table or column descriptions to existing tables, construct the exact `ALTER TABLE ... SET OPTIONS(...)` and `ALTER TABLE ... ALTER COLUMN ... SET OPTIONS(...)` queries and execute them using `execute_raw_ddl`.
""",
    description="You are an assistant who will inspect tables, create tables, manage schemas, and apply table/column descriptions in BigQuery.",
    output_key = "ddl_agent_output",
    tools = [
        inspect_live_bigquery_tables,
        ddl_execution,
        execute_raw_ddl,
    ],
    before_tool_callback=before_tool_callback_user_input,
)