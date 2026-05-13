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

"""UI for the repository loading and analysis step."""

import streamlit as st
from app.frontend.copilot import run_workflow_step


def render_step1_repo(ctx, thread_id):
    """Renders the UI for Step 1: Repository Analysis."""
    col1_h, col1_b = st.columns([4, 1])
    with col1_h:
        st.header("1. Repository Analysis")

    button_disabled = bool(ctx.get("file_tree"))

    with col1_b:
        if st.button(
            "Analyze Repository",
            type="primary",
            use_container_width=True,
            disabled=button_disabled,
        ):
            run_workflow_step(
                thread_id=thread_id,
                invoker="button",
                auto_approve=True,
                ctx=ctx,
                goal="git_loader",
            )

    if ctx.get("file_tree"):
        st.success("Repository analysis complete.")
        with st.expander("View File Structure"):
            st.code(ctx["file_tree"], language="text")
    else:
        st.info(
            "Set the repository configuration in the sidebar and click 'Analyze Repository' to begin."
        )
