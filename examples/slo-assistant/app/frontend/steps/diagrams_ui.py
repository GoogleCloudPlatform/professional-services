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

"""UI for the Sequence Diagram generation step."""

import streamlit as st

from app.frontend.components.artifact_renderer import render_artifact_section
from app.frontend.components.mermaid_renderer import st_mermaid_v11
from app.frontend.copilot import run_workflow_step


def render_step3_diagrams(ctx, thread_id):
    """Renders the UI for Step 3: Sequence Diagrams."""
    col_h, col_b = st.columns([4, 1])
    with col_h:
        st.header("3. Sequence Diagrams")

    if not ctx.get("identified_cujs"):
        st.info("Complete Step 2 to generate diagrams.")
        return

    diagrams = ctx.get("sequence_diagram_code")
    button_disabled = bool(diagrams)

    with col_b:
        if st.button(
            "Generate Diagrams",
            type="primary",
            use_container_width=True,
            disabled=button_disabled,
        ):
            run_workflow_step(
                thread_id=thread_id,
                invoker="button",
                auto_approve=True,
                ctx=ctx,
                goal="diagram_generator",
            )

    if diagrams:

        def boxed_diagram(content):
            with st.container(border=True, height=600):
                st.code(content, language="mermaid")

        def visual_view_wrapper(content):
            st_mermaid_v11(content, height=600)

        render_artifact_section(
            ctx=ctx,
            thread_id=thread_id,
            artifact_type="sequence_diagram",
            artifacts_dict=diagrams,
            gcs_folder="02_diagrams",
            success_message=f"**Generated {len(diagrams)} Sequence Diagrams!**",
            render_callback=boxed_diagram,
            visual_render_callback=visual_view_wrapper,
        )
    else:
        st.info("Click 'Generate Diagrams' to create diagrams for the identified CUJs.")
