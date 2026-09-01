import datetime
import os
from pathlib import Path

from data_modelling_agent.sub_agents.reporting_agent.tools import generate_report
from data_modelling_agent.sub_agents.reporting_agent.utils.commons import (
    cleanup_metadata,
)
from google.adk.tools import ToolContext
from google.adk.tools.agent_tool import AgentTool

from .sub_agents import modeller_agent
from .sub_agents.modeller_agent.const import (
    BQ_LOGICAL_MODEL_TASK,
    BQ_METADATA_TASK,
    DDL_TASK,
    config,
)
from .utils import del_dir, save_artifacts


async def generate_enterprise_er_diagram(tool_context: ToolContext):
    """Tool to generate and attach visual Enterprise ER Diagram image artifact."""
    return await generate_report(tool_context)

async def call_modeller_agent(
    question: str,
    tool_context: ToolContext,
):
    """Tool to call modeller_agent."""

    #This will change to active persona in future. For now we are just performing all tasks
    tasks = config["output_personas"]["all"]
    folder_name = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    Path(folder_name).mkdir()
    tool_output = {}
    for task in tasks:
        tool_context.state["current_task"] = task
        agent_tool = AgentTool(agent=modeller_agent)
        modeller_agent_output = await agent_tool.run_async(
            args={"request": question}, tool_context=tool_context
        )
        print(task,"\n", modeller_agent_output)
        save_artifacts(task, modeller_agent_output, folder_name)
        if task == DDL_TASK:
            tool_context.state["ddl"] = modeller_agent_output
        if task == BQ_METADATA_TASK:
            tool_context.state["metadata"] = cleanup_metadata(modeller_agent_output)
        if task == BQ_LOGICAL_MODEL_TASK:
            tool_output["summary"] = modeller_agent_output
    tool_context.state["gcs_folder"] = folder_name
    tool_output["gcs_folder"] = folder_name
    tool_output["project_id"] = os.getenv("GOOGLE_CLOUD_PROJECT", default="")
    tool_context.state["project_id"] = os.getenv("GOOGLE_CLOUD_PROJECT", default="")
    del_dir(folder_name)
    return tool_output