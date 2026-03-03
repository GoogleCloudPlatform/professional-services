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

"""UI for the Critical User Journeys (CUJ) step (API-driven)."""

import json

import streamlit as st

from app.frontend.common import get_console_link
from app.frontend.components.artifact_renderer import render_proposal_ui
from app.frontend.copilot import run_workflow_step
from app.services import api_client


def render_step2_cujs(ctx, thread_id):
    """Renders the UI for Step 2: Critical User Journeys."""
    col_h, col_b = st.columns([4, 1])
    with col_h:
        st.header("2. Critical User Journeys")

    # If there is a pending proposal for the CUJ list, render the proposal UI
    if ctx.get("pending_proposal") and ctx["pending_proposal"]["type"] == "cuj_list":
        render_proposal_ui(ctx, thread_id)
        return

    # Check if the prerequisite step (repo analysis) is complete
    if "file_tree" not in ctx or not ctx.get("file_tree"):
        st.info("Complete Step 1 to identify user journeys.")
        return

    button_disabled = bool(ctx.get("identified_cujs"))

    with col_b:
        if st.button(
            "Identify CUJs",
            type="primary",
            use_container_width=True,
            disabled=button_disabled,
        ):
            run_workflow_step(
                thread_id=thread_id,
                invoker="button",
                auto_approve=True,
                ctx=ctx,
                goal="code_analyst",
            )

    # Check if CUJs have been identified
    if not ctx.get("identified_cujs"):
        st.info(
            "No user journeys identified yet. Click 'Identify CUJs' or ask the chat assistant to begin."
        )
        return

    cujs = ctx["identified_cujs"]
    st.success(f"**Analysis Complete!** {len(cujs)} Journeys Identified.")

    folder_link = get_console_link(ctx.get("repo_url", ""), "01_user_journeys")
    st.info(f"**[Open Cloud Console Folder]({folder_link})**")

    st.markdown("---")

    # --- TABBED INTERFACE FOR EACH CUJ ---
    tab_names = [cuj.get("name", f"Journey {i+1}") for i, cuj in enumerate(cujs)]
    tabs = st.tabs(tab_names)

    for i, tab in enumerate(tabs):
        with tab:
            cuj = cujs[i]
            edit_key = f"cuj_edit_{i}"
            if edit_key not in st.session_state:
                st.session_state[edit_key] = False

            # --- EDIT MODE ---
            if st.session_state[edit_key]:
                _render_cuj_edit_mode(ctx, thread_id, i)
            # --- VIEW MODE ---
            else:
                _render_cuj_view_mode(cuj, i)


def _render_cuj_view_mode(cuj: dict, index: int):
    """Renders the display view for a single CUJ."""
    col_header, col_edit = st.columns([6, 1])
    with st.container(border=True):
        with col_header:
            st.markdown(f"#### {cuj.get('name', 'Unnamed Journey')}")
        with col_edit:
            if st.button("Edit", key=f"edit_btn_{index}"):
                st.session_state[f"cuj_edit_{index}"] = True
                st.rerun()

        st.caption("DESCRIPTION")
        st.markdown(cuj.get("description", "No description provided."))
        st.write("")
        st.caption(f"**Involved Files ({len(cuj.get('files', []))}):**")
        file_list_str = "\n".join(cuj.get("files", []))
        if file_list_str:
            st.code(file_list_str, language="text")
        else:
            st.caption("No files have been mapped to this journey.")


def _render_cuj_edit_mode(ctx: dict, thread_id: str, index: int):
    """Renders the editing interface for a single CUJ."""
    cuj = ctx["identified_cujs"][index]

    st.info(f"Editing: {cuj.get('name', 'Unnamed')}")

    # --- Form Inputs ---
    new_name = st.text_input("Journey Name", value=cuj.get("name", ""), key=f"name_{index}")
    new_desc = st.text_area(
        "Description", value=cuj.get("description", ""), height=100, key=f"desc_{index}"
    )
    current_files = "\n".join(cuj.get("files", []))
    new_files_str = st.text_area("Files", value=current_files, height=200, key=f"files_{index}")

    col_save, col_cancel = st.columns([1, 6])

    with col_save:
        if st.button("Save", key=f"save_cuj_{index}"):
            # Create a copy of the list to modify
            updated_cujs = list(ctx["identified_cujs"])
            updated_cujs[index] = {
                "name": new_name,
                "description": new_desc,
                "files": [f.strip() for f in new_files_str.split("\n") if f.strip()],
            }

            try:
                # Call API to update the state on the backend
                api_client.update_state(thread_id, {"identified_cujs": updated_cujs})

                # Update frontend context manually since we used a copy
                ctx["identified_cujs"] = updated_cujs

                # Sync WHOLE LIST to Cloud
                from app.utils.storage_ops import upload_file

                full_json_str = json.dumps(updated_cujs, indent=2)
                upload_file(
                    repo_url=ctx.get("repo_url", "unknown-repo"),
                    folder_category="01_user_journeys",
                    filename="identified_journeys.txt",
                    content=full_json_str,
                )

                st.session_state[f"cuj_edit_{index}"] = False
                st.toast("Changes saved!")
                st.rerun()
            except Exception as e:
                st.error(f"Failed to save changes: {e}")

    with col_cancel:
        if st.button("Cancel", key=f"cancel_cuj_{index}"):
            st.session_state[f"cuj_edit_{index}"] = False
            st.rerun()
