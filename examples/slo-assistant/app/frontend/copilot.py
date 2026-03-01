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
This module is the central controller for the Streamlit UI.
This version uses the API client to interact with the backend server.
"""

import os
from typing import Any, Dict

import streamlit as st

from app.services import api_client
from app.utils.text_utils import convert_messages_to_dicts

# --- Constants & Avatar Helper ---
ASSETS_DIR = os.path.join("app", "assets")
GEMINI_AVATAR = os.path.join(ASSETS_DIR, "gemini_logo.svg")
USER_AVATAR = os.path.join(ASSETS_DIR, "user_icon.png")


def get_avatar(role: str) -> str:
    """Gets the appropriate avatar for a given role."""
    if role == "assistant":
        return GEMINI_AVATAR if os.path.exists(GEMINI_AVATAR) else "assistant"
    return USER_AVATAR if os.path.exists(USER_AVATAR) else "user"


# --- Central Workflow Driver ---
def run_workflow_step(
    thread_id: str,
    invoker: str,
    auto_approve: bool,
    ctx: Dict[str, Any],
    goal: str = None,
):
    """
    A centralized function to run the backend workflow via the API.
    """
    run_input = ctx.copy()
    if goal:
        run_input["workflow_goal"] = goal
    run_input["auto_approve"] = auto_approve

    status_container = st.empty()
    status_container.markdown("**Starting workflow...**")
    try:
        # Consume the stream from the backend
        for event in api_client.run_workflow(thread_id, run_input, auto_approve):
            if event.get("event") == "error":
                raise Exception(event.get("data", {}).get("error", "Unknown backend error"))

            # Update status based on node execution
            if event.get("event") == "on_chain_start":
                node_name = event.get("name", "")
                if node_name == "git_loader":
                    status_container.markdown("**Cloning repository and mapping files...**")
                elif node_name == "code_analyst":
                    status_container.markdown("**Identifying Critical User Journeys (CUJs)...**")
                elif node_name == "diagram_generator":
                    status_container.markdown(
                        "**Tracing code and generating Sequence Diagrams...**"
                    )
                elif node_name == "slo_specialist":
                    status_container.markdown("**Drafting professional SLO specifications...**")
                elif node_name == "terraform_generator":
                    status_container.markdown(
                        "**Writing Google Cloud Terraform configurations...**"
                    )

        # After the run, get the definitive state from the server
        status_container.markdown("**Finalizing state...**")
        new_state = api_client.get_state(thread_id)

        # Update context without clearing it to avoid UI flicker and state loss
        for k, v in new_state.get("values", {}).items():
            ctx[k] = v
        ctx["next"] = new_state.get("next")
        status_container.empty()

    except Exception as e:
        status_container.empty()
        st.error(f"Workflow execution failed: {e}")
        # Try to recover state anyway
        try:
            new_state = api_client.get_state(thread_id)
            for k, v in new_state.get("values", {}).items():
                ctx[k] = v
            ctx["next"] = new_state.get("next")
        except Exception as get_state_e:
            st.error(f"Failed to retrieve latest state: {get_state_e}")
        return  # Stop execution so we don't append success messages

    # UI updates
    final_auto_approve = ctx.get("auto_approve", auto_approve)

    # We evaluate the next step logically based on the current state data
    def get_next_logical_step(state: Dict[str, Any]) -> str:
        if not state.get("file_tree"):
            return "Repository Analysis"
        if not state.get("identified_cujs"):
            return "identify Critical User Journeys (CUJs)"
        if not state.get("sequence_diagram_code"):
            return "generate Sequence Diagrams"
        if not state.get("slo_spec_draft"):
            return "draft SLO Specifications"
        if not state.get("terraform_files"):
            return "generate Terraform Code"
        return "Finalization"

    if invoker == "chat":
        next_step_name = get_next_logical_step(ctx)

        if next_step_name == "Finalization":
            ctx["chat_history"].append(
                {
                    "role": "assistant",
                    "content": "All requested steps are complete! You can now review the generated artifacts.",
                }
            )
        elif not final_auto_approve:
            ctx["chat_history"].append(
                {
                    "role": "assistant",
                    "content": f"Step Complete. Ready to proceed to **{next_step_name}**?",
                }
            )
        else:
            # If it stopped while auto_approve is True, it must have reached its specific workflow goal.
            ctx["chat_history"].append(
                {
                    "role": "assistant",
                    "content": f"Reached target goal. To continue towards the final configuration, I need to **{next_step_name}**. Shall I proceed?",
                }
            )

        # We need to save this new chat message to the state
        api_client.update_state(thread_id, {"chat_history": ctx["chat_history"]})

    elif invoker == "button":
        st.toast("Analysis step complete!")

    # No manual save. The server handles persistence.
    st.rerun()


# --- Chat UI and Logic ---
def render_copilot(ctx: Dict[str, Any], thread_id: str):
    """Renders the chat interface."""
    with st.sidebar:
        st.divider()
        st.markdown("### AI Chat Assist")

        if not ctx.get("chat_history"):
            ctx["chat_history"] = [
                {
                    "role": "assistant",
                    "content": "Hi! I'm your AI-Powered SLO Consultant. How can I help you analyze your repository today?",
                }
            ]

        chat_container = st.container(height=400)
        for msg in ctx.get("chat_history", [])[-10:]:
            with chat_container.chat_message(msg["role"], avatar=get_avatar(msg["role"])):
                st.markdown(msg["content"])

        if prompt := st.chat_input("Type instructions..."):
            ctx["chat_history"].append({"role": "user", "content": prompt})
            _handle_chat_input(ctx, thread_id)


def _handle_chat_input(ctx: Dict[str, Any], thread_id: str):
    """Handles user input from the chat interface."""
    ctx["chat_history"] = convert_messages_to_dicts(ctx.get("chat_history", []))

    # The Orchestrator is now the entry point of the LangGraph in the backend.
    # We simply trigger the workflow and the graph will handle AI decisions and routing natively.
    run_workflow_step(
        thread_id=thread_id,
        invoker="chat",
        auto_approve=ctx.get("auto_approve", False),
        ctx=ctx,
    )
