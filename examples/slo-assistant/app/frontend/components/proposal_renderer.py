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
UI for rendering an AI-generated proposal and handling user acceptance/rejection.
This component is driven by the `pending_proposal` key in the application state.
"""

import json
from typing import Any, Dict

import streamlit as st

from app.services import api_client
from app.services.artifact_manager import ArtifactManager  # Keep this import


def _accept_proposal(thread_id: str, ctx: Dict[str, Any]):
    """Accepts the current proposal and updates the backend state via the API."""
    proposal = ctx.get("pending_proposal")
    if not proposal:
        return

    artifact_type = proposal["type"]
    update_payload = {}
    msg = ""

    try:
        if artifact_type == "cuj_list":
            update_payload["identified_cujs"] = json.loads(proposal["draft_content"])
            msg = "Updated Critical User Journeys list."
        else:
            target_dict_key = ArtifactManager.get_dict_key(artifact_type)
            if not target_dict_key:
                st.error(f"Unknown artifact type: {artifact_type}")
                return

            is_bulk = proposal.get("status") == "needs_bulk_refinement"
            current_dict = ctx.get(target_dict_key, {})

            if is_bulk:
                drafts = proposal.get("drafts", {})
                current_dict.update(drafts)
                update_payload[target_dict_key] = current_dict
                msg = f"Applied changes to **{len(drafts)} artifacts**."
            else:
                target_cuj = proposal.get("target")
                draft_content = proposal.get("draft_content")
                if target_cuj and draft_content is not None:
                    current_dict[target_cuj] = draft_content
                    update_payload[target_dict_key] = current_dict
                    msg = f"Changes applied to **{target_cuj}**."
                else:
                    st.error("Failed to apply proposal: Missing target or content.")
                    return

        # Prepare the final payload for the API
        final_payload = {
            **update_payload,
            "pending_proposal": None,
            "chat_history": ctx.get("chat_history", []) + [{"role": "assistant", "content": msg}],
        }

        api_client.update_state(thread_id, final_payload)
        st.rerun()

    except Exception as e:
        st.error(f"Failed to accept changes: {e}")


def _discard_proposal(thread_id: str, ctx: Dict[str, Any]):
    """Discards the current proposal by updating the backend state."""
    update_payload = {
        "pending_proposal": None,
        "chat_history": ctx.get("chat_history", [])
        + [{"role": "assistant", "content": "Discarded. What else?"}],
    }
    try:
        api_client.update_state(thread_id, update_payload)
        st.rerun()
    except Exception as e:
        st.error(f"Failed to discard proposal: {e}")


def render_proposal_ui(ctx: Dict[str, Any], thread_id: str):
    """Renders the Accept/Reject UI Card for a pending proposal."""
    proposal = ctx.get("pending_proposal")
    if not proposal:
        return

    st.info(f"**AI Proposal:** {proposal.get('instruction', 'No instruction provided.')}")

    is_bulk = proposal.get("status") == "needs_bulk_refinement"
    artifact_type = proposal.get("type")

    with st.container(border=True):
        if is_bulk:
            drafts = proposal.get("drafts", {})
            tabs = st.tabs(list(drafts.keys()))
            for i, (target, content) in enumerate(drafts.items()):
                with tabs[i]:
                    st.code(
                        content,
                        language=("mermaid" if artifact_type == "sequence_diagram" else "yaml"),
                    )
        elif proposal.get("draft_content"):
            content = proposal.get("draft_content")
            st.code(
                content,
                language=("mermaid" if artifact_type == "sequence_diagram" else "yaml"),
            )

    col_accept, col_reject = st.columns(2)
    with col_accept:
        btn_label = "Accept All" if is_bulk else "Accept Change"
        if st.button(btn_label, use_container_width=True):
            with st.spinner("Applying changes..."):
                _accept_proposal(thread_id, ctx)
    with col_reject:
        if st.button("Discard", use_container_width=True):
            _discard_proposal(thread_id, ctx)
