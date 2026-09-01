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

from data_modelling_agent.sub_agents.search_agent.sub_agents import (
    source_search_agent,
    target_search_agent,
)
from google.adk.tools import ToolContext
from google.adk.tools.agent_tool import AgentTool


async def call_source_search_agent(
    question: str,
    tool_context: ToolContext,
):
    """Tool to call source search agent."""

    agent_tool = AgentTool(agent=source_search_agent)

    source_search_agent_output = await agent_tool.run_async(
        args={"request": question}, tool_context=tool_context
    )
    # tool_context.state["source_search_agent_output"] = source_search_agent_output

    return source_search_agent_output


async def call_target_search_agent(
    question: str,
    tool_context: ToolContext,
):
    """Tool to call target search agent."""

    agent_tool = AgentTool(agent=target_search_agent)

    target_search_agent_output = await agent_tool.run_async(
        args={"request": question}, tool_context=tool_context
    )
    # tool_context.state["target_search_agent_output"] = target_search_agent_output

    return target_search_agent_output