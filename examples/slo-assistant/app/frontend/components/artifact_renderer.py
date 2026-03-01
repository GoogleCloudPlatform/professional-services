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
Reusable component to render a section of artifacts, including tabs, edit mode,
and the proposal UI.
"""

import streamlit as st

from app.frontend.common import get_console_link
from app.frontend.components.proposal_renderer import render_proposal_ui
from app.services import api_client
from app.services.artifact_manager import ArtifactManager


def render_artifact_section(
    ctx: dict,
    thread_id: str,
    artifact_type: str,
    artifacts_dict: dict,
    gcs_folder: str,
    success_message: str,
    render_callback=None,
    visual_render_callback=None,
):
    """
    Renders a standardized UI section for a dictionary of artifacts.
    Handles proposals, manual edits, and display for a given artifact type.
    """
    # 1. Check for and render any pending proposals for this artifact type
    if ctx.get("pending_proposal") and ctx["pending_proposal"]["type"] == artifact_type:
        render_proposal_ui(ctx, thread_id)
        return

    if not artifacts_dict:
        return

    # 2. Render Success Message and Cloud Link
    st.success(success_message)
    folder_link = get_console_link(ctx.get("repo_url", ""), gcs_folder)
    st.info(f"[View in Cloud Console]({folder_link})")

    # 3. Render Tabs for each artifact item
    names = list(artifacts_dict.keys())
    tabs = st.tabs(names)

    for i, name in enumerate(names):
        with tabs[i]:
            content = artifacts_dict[name]
            edit_key = f"edit_mode_{artifact_type}_{i}"
            if edit_key not in st.session_state:
                st.session_state[edit_key] = False

            # --- EDIT MODE ---
            if st.session_state[edit_key]:
                _render_edit_mode(ctx, thread_id, artifact_type, name, content, i, gcs_folder)
            # --- VIEW MODE ---
            else:
                _render_view_mode(
                    name,
                    content,
                    artifact_type,
                    i,
                    render_callback,
                    visual_render_callback,
                )


def _render_edit_mode(ctx, thread_id, artifact_type, name, content, index, gcs_folder):
    """Renders the UI for manually editing an artifact."""
    st.info(f"Editing: {name}")
    new_content = st.text_area(
        f"Edit {artifact_type}",
        value=content,
        height=500,
        key=f"text_area_{artifact_type}_{index}",
    )

    col_s, col_c = st.columns([1, 6])
    with col_s:
        if st.button("Save", key=f"save_{artifact_type}_{index}"):
            # Get the state key for this artifact type (e.g., 'sequence_diagram_code')
            dict_key = ArtifactManager.get_dict_key(artifact_type)
            if dict_key:
                # Prepare the payload to update the backend state
                updated_dict = ctx.get(dict_key, {})
                updated_dict[name] = new_content
                try:
                    api_client.update_state(thread_id, {dict_key: updated_dict})

                    # Sync to GCS
                    from app.utils.storage_ops import upload_file
                    from app.utils.text_utils import sanitize_filename

                    safe_name = sanitize_filename(name)
                    ext = ".txt"
                    if artifact_type == "sequence_diagram":
                        ext = ".mermaid"
                    elif artifact_type == "SLO":
                        ext = ".md"
                    elif artifact_type == "terraform":
                        ext = ""  # Terraform names usually include .tf

                    filename = f"{safe_name}{ext}" if not safe_name.endswith(".tf") else safe_name

                    upload_file(
                        repo_url=ctx.get("repo_url", "unknown-repo"),
                        folder_category=gcs_folder,
                        filename=filename,
                        content=new_content,
                    )

                    st.session_state[f"edit_mode_{artifact_type}_{index}"] = False
                    st.toast("Saved!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to save changes: {e}")

    with col_c:
        if st.button("Cancel", key=f"cancel_{artifact_type}_{index}"):
            st.session_state[f"edit_mode_{artifact_type}_{index}"] = False
            st.rerun()


def _render_view_mode(name, content, artifact_type, index, render_callback, visual_render_callback):
    """Renders the display-only view of an artifact."""
    col_h, col_e = st.columns([6, 1])
    with col_h:
        st.caption(f"Previewing: **{name}**")
    with col_e:
        if st.button("Edit", key=f"edit_btn_{artifact_type}_{index}"):
            st.session_state[f"edit_mode_{artifact_type}_{index}"] = True
            st.rerun()

    # Use custom renderers if provided
    if visual_render_callback:
        show_visual = st.toggle("Diagram View", value=True, key=f"toggle_{artifact_type}_{index}")
        if show_visual:
            visual_render_callback(content)
        elif render_callback:
            render_callback(content)
        else:
            st.code(content, language="text")
    elif render_callback:
        render_callback(content)
    else:
        st.code(content, language="text")
