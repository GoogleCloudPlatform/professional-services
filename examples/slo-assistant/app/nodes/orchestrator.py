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

"""Module for the Orchestrator node, which directs the SRE Copilot workflow."""

import json
import logging

from app.config import get_llm
from app.prompts.orchestrator_prompts import get_orchestrator_prompt
from app.state import AgentState

from app.utils.text_utils import convert_messages_to_dicts

logger = logging.getLogger(__name__)


def orchestrator(state: AgentState):
    """
    The Central Brain. Analyzes user intent from chat_history.
    Decides:
    1. Direct Answer (if question is general)
    2. Clarification (if request is vague)
    3. Proposal (if request is a specific edit for Diagram OR SLO)
    """
    logger.info("--- Orchestrator: Analyzing User Intent ---")

    llm = get_llm()
    # Ensure chat_history is a list of dictionaries
    chat_history = convert_messages_to_dicts(state.get("chat_history", []))

    # Fallback if chat is empty
    if not chat_history:
        return {
            "chat_history": [
                {
                    "role": "assistant",
                    "content": "I am ready. How can I help refine your SLOs?",
                }
            ]
        }

    recent_history = chat_history[-6:]
    chat_history_str = "\n".join(
        [f"{msg['role'].upper()}: {msg['content']}" for msg in recent_history]
    )

    # Context gathering
    cujs = state.get("identified_cujs", [])
    cuj_list_str = ", ".join([c.get("name", "Unknown") for c in cujs])
    file_tree = state.get("file_tree", "")
    workflow_goal = state.get("workflow_goal")

    # Fast-path for manual button clicks (no new user chat message to process)
    if chat_history[-1].get("role") != "user":
        logger.info("No new user input. Orchestrator passing through.")
        return {}

    auto_approve = state.get("auto_approve", False)

    # 1. Get Prompt (Clean!)
    prompt = get_orchestrator_prompt(
        cuj_list_str, chat_history_str, workflow_goal, file_tree, auto_approve
    )

    # Handle simple commands without calling the LLM
    last_message = chat_history[-1]["content"].lower().strip()
    if last_message in ["start", "start analysis", "analyze", "begin"]:
        return {
            "workflow_goal": "all",
            "auto_approve": False,
            "chat_history": chat_history
            + [{"role": "assistant", "content": "Starting analysis..."}],
        }

    try:
        response = llm.invoke(prompt)
        content = response.content.replace("```json", "").replace("```", "").strip()
        decision = json.loads(content)

        logger.info("Orchestrator Decision: %s", json.dumps(decision))

        # Scenario: Just Chat (No state change)
        if decision["action"] == "chat":
            chat_history.append({"role": "assistant", "content": decision["response"]})
            return {"chat_history": chat_history}

        if decision["action"] == "propose_edit":
            if decision["artifact_type"] == "cuj_list" and not cujs:
                return {
                    "cuj_guidance": decision.get("instruction", ""),
                    "workflow_goal": "cuj",
                    "chat_history": chat_history
                    + [
                        {
                            "role": "assistant",
                            "content": (
                                f"Noted. I will focus on **'{decision.get('instruction')}'** "
                                "and start the analysis now."
                            ),
                        }
                    ],
                }
            return {
                "pending_proposal": {
                    "status": "needs_refinement",
                    "target": decision["target_cuj"],
                    # This will be 'mermaid' or 'slo'
                    "type": decision["artifact_type"],
                    "instruction": decision["instruction"],
                }
            }

        # Scenario: Bulk Proposal
        if decision["action"] == "propose_bulk_edit":
            return {
                "pending_proposal": {
                    "status": "needs_bulk_refinement",
                    "type": decision["artifact_type"],
                    "instruction": decision["instruction"],
                }
            }

        # Scenario: Take user guidance on CUJs
        if decision["action"] == "provide_guidance":
            output = {"cuj_guidance": decision["guidance"]}
            if not cujs:
                output["workflow_goal"] = "cuj"
                chat_history.append(
                    {
                        "role": "assistant",
                        "content": (
                            f"Guidance received. I will focus on **{decision['guidance']}** "
                            "and start analysis."
                        ),
                    }
                )
            else:
                chat_history.append(
                    {
                        "role": "assistant",
                        "content": (
                            f"Guidance received. I will focus on **{decision['guidance']}** "
                            "for the next run."
                        ),
                    }
                )
            output["chat_history"] = chat_history
            return output

        if decision["action"] == "start_workflow":
            return {
                "workflow_goal": decision["target_step"],
                "chat_history": chat_history,
                "auto_approve": decision.get("auto_approve", False),
            }

        if decision["action"] == "resume_workflow":
            # Resume the workflow towards the existing goal
            return {
                "chat_history": chat_history,
                "auto_approve": decision.get("auto_approve", False),
            }

        # Default return if no other action is taken
        return {"chat_history": chat_history}

    except Exception as e:
        logger.error("Orchestrator failed: %s", e)
        return {
            "chat_history": chat_history
            + [
                {
                    "role": "assistant",
                    "content": "I encountered an error while analyzing your request. Please try again.",
                }
            ]
        }
