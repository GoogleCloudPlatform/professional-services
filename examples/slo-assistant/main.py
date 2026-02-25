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

"""Main entry point for the LangGraph SRE Copilot application."""

import logging

from langgraph.graph import END, StateGraph


from app.utils.gcs_checkpointer import GCSCheckpointer
from app.utils.storage_ops import BUCKET_NAME

from app.nodes import (
    code_analyst,
    diagram_generator,
    git_loader,
    orchestrator,
    slo_specialist,
    terraform_generator,
)
from app.state import AgentState

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph_builder")


def route_from_orchestrator(state: AgentState):
    """Routes execution after the Orchestrator evaluates the user's intent."""
    goal = state.get("workflow_goal")
    logger.info("ROUTING_FROM_ORCHESTRATOR: Goal is %s", goal)

    if state.get("pending_proposal"):
        logger.info("ROUTING_FROM_ORCHESTRATOR: Pending proposal found. Stopping.")
        return END

    if not goal:
        logger.info("ROUTING_FROM_ORCHESTRATOR: No goal. Stopping.")
        return END

    goal = goal.lower()

    if not state.get("file_tree"):
        logger.info("ROUTING_FROM_ORCHESTRATOR: Missing file_tree. Routing to git_loader.")
        return "git_loader"
    if goal in ["git_loader"]:
        logger.info("ROUTING_FROM_ORCHESTRATOR: Goal 'git_loader' reached. Stopping.")
        return END

    if not state.get("identified_cujs"):
        logger.info("ROUTING_FROM_ORCHESTRATOR: Missing identified_cujs. Routing to code_analyst.")
        return "code_analyst"
    if goal in ["code_analyst", "cuj", "cujs"]:
        logger.info("ROUTING_FROM_ORCHESTRATOR: Goal 'code_analyst' reached. Stopping.")
        return END

    if not state.get("sequence_diagram_code"):
        logger.info(
            "ROUTING_FROM_ORCHESTRATOR: Missing sequence_diagram_code. Routing to diagram_generator."
        )
        return "diagram_generator"
    if goal in ["diagrams", "diagram_generator"]:
        logger.info("ROUTING_FROM_ORCHESTRATOR: Goal 'diagrams' reached. Stopping.")
        return END

    if not state.get("slo_spec_draft"):
        logger.info("ROUTING_FROM_ORCHESTRATOR: Missing slo_spec_draft. Routing to slo_specialist.")
        return "slo_specialist"
    if goal in ["slo", "slos", "slo_specialist"]:
        logger.info("ROUTING_FROM_ORCHESTRATOR: Goal 'slo' reached. Stopping.")
        return END

    if not state.get("terraform_files"):
        logger.info(
            "ROUTING_FROM_ORCHESTRATOR: Missing terraform_files. Routing to terraform_generator."
        )
        return "terraform_generator"

    logger.info("ROUTING_FROM_ORCHESTRATOR: All steps complete or unrecognized goal. Stopping.")
    return END


def route_after_step(state: AgentState, current_step: str):
    """Determines whether to pause the graph or chain to the next step."""
    goal = state.get("workflow_goal")
    auto = state.get("auto_approve")

    logger.info("ROUTE_AFTER_STEP: Current=%s, Goal=%s, Auto=%s", current_step, goal, auto)

    if not goal:
        return END

    goal = goal.lower()

    if not auto:
        logger.info("ROUTE_AFTER_STEP: Pausing for HITL confirmation.")
        return END

    target_map = {
        "git_loader": ["git_loader"],
        "code_analyst": ["code_analyst", "cuj", "cujs"],
        "diagram_generator": ["diagrams", "diagram_generator"],
        "slo_specialist": ["slo", "slos", "slo_specialist"],
        "terraform_generator": ["terraform", "iac", "terraform_generator", "all"],
    }

    if goal in target_map.get(current_step, []):
        logger.info("ROUTE_AFTER_STEP: Goal '%s' reached. Stopping.", goal)
        return END

    chain = {
        "git_loader": "code_analyst",
        "code_analyst": "diagram_generator",
        "diagram_generator": "slo_specialist",
        "slo_specialist": "terraform_generator",
        "terraform_generator": END,
    }

    next_node = chain.get(current_step, END)
    logger.info("ROUTE_AFTER_STEP: Chaining from %s -> %s", current_step, next_node)
    return next_node


try:
    # Define the Graph
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("orchestrator", orchestrator)
    workflow.add_node("git_loader", git_loader)
    workflow.add_node("code_analyst", code_analyst)
    workflow.add_node("diagram_generator", diagram_generator)
    workflow.add_node("slo_specialist", slo_specialist)
    workflow.add_node("terraform_generator", terraform_generator)

    # Define Flow
    workflow.set_entry_point("orchestrator")

    # Conditional Edges
    workflow.add_conditional_edges("orchestrator", route_from_orchestrator)
    workflow.add_conditional_edges("git_loader", lambda s: route_after_step(s, "git_loader"))
    workflow.add_conditional_edges("code_analyst", lambda s: route_after_step(s, "code_analyst"))
    workflow.add_conditional_edges(
        "diagram_generator", lambda s: route_after_step(s, "diagram_generator")
    )
    workflow.add_conditional_edges(
        "slo_specialist", lambda s: route_after_step(s, "slo_specialist")
    )
    workflow.add_conditional_edges(
        "terraform_generator", lambda s: route_after_step(s, "terraform_generator")
    )

    # Compile the graph
    app = workflow.compile(checkpointer=GCSCheckpointer(BUCKET_NAME))

except Exception as e:
    logger.critical("Failed to build and compile the graph: %s", e)
    raise e
