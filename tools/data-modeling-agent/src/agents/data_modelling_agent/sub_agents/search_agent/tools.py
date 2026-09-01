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