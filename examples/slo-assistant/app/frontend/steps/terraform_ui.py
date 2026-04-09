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

"""UI for the Terraform generation step."""

import json
import streamlit as st

from app.frontend.components.artifact_renderer import render_artifact_section
from app.frontend.copilot import run_workflow_step


def render_step5_terraform(ctx, thread_id):
    """Renders the UI for Step 5: Terraform Generation."""
    col_h, col_b = st.columns([4, 1])
    with col_h:
        st.header("5. Infrastructure as Code (Terraform)")

    if not ctx.get("slo_reports_dict"):
        st.info("Complete Step 4 to generate Terraform.")
        return

    terraform_files = ctx.get("terraform_files")
    button_disabled = bool(terraform_files)

    with col_b:
        if st.button(
            "Generate Terraform",
            type="primary",
            use_container_width=True,
            disabled=button_disabled,
        ):
            run_workflow_step(
                thread_id=thread_id,
                invoker="button",
                auto_approve=True,
                ctx=ctx,
                goal="terraform_generator",
            )

    if terraform_files:
        if isinstance(terraform_files, str):
            try:
                terraform_files = json.loads(terraform_files)
            except json.JSONDecodeError:
                st.error("Could not parse the Terraform file data.")
                return

        def boxed_terraform(content):
            with st.container(border=True, height=600):
                st.code(content, language="terraform")

        render_artifact_section(
            ctx=ctx,
            thread_id=thread_id,
            artifact_type="terraform",
            artifacts_dict=terraform_files,
            gcs_folder="04_terraform",
            success_message=f"**Generated {len(terraform_files)} Terraform files!**",
            render_callback=boxed_terraform,
        )
    else:
        st.info("Click 'Generate Terraform' to create the monitoring configurations.")
