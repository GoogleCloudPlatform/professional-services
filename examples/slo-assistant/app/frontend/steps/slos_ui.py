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

"""UI for the SLO Specifications step."""

import streamlit as st

from app.frontend.components.artifact_renderer import render_artifact_section
from app.frontend.copilot import run_workflow_step


def render_step4_slos(ctx, thread_id):
    """Renders the UI for Step 4: SLO Specifications."""
    col_h, col_b = st.columns([4, 1])
    with col_h:
        st.header("4. SLO Specifications")

    if not ctx.get("sequence_diagram_code"):
        st.info("Complete Step 3 to generate SLOs.")
        return

    slos = ctx.get("slo_reports_dict")
    button_disabled = bool(slos)

    with col_b:
        if st.button(
            "Generate SLOs",
            type="primary",
            use_container_width=True,
            disabled=button_disabled,
        ):
            run_workflow_step(
                thread_id=thread_id,
                invoker="button",
                auto_approve=True,
                ctx=ctx,
                goal="slo_specialist",
            )

    if slos:

        def boxed_markdown(content):
            with st.container(border=True, height=600):
                st.markdown(content)

        render_artifact_section(
            ctx=ctx,
            thread_id=thread_id,
            artifact_type="SLO",
            artifacts_dict=slos,
            gcs_folder="03_slo_design",
            success_message=f"**Generated {len(slos)} SLO Specification Documents!**",
            render_callback=boxed_markdown,
        )
    else:
        st.info("Click 'Generate SLOs' to draft specifications.")
