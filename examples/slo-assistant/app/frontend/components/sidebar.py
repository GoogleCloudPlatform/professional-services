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
Sidebar component for the Streamlit UI.
"""

import streamlit as st

from app.frontend.common import get_app_version


def render_sidebar(ctx):
    """
    Renders the sidebar with session info and configuration inputs.

    Returns:
        A tuple containing the latest values from the UI inputs:
        (repo_url, branch, subfolder, pat_token)
    """
    with st.sidebar:
        # --- SECTION 1: SESSION MANAGEMENT ---
        with st.expander("Session Management", expanded=True):
            # The key 'thread_id_input' is used to capture user input for a new session ID
            thread_id_input = st.text_input(
                "Session / Thread ID",
                value=st.session_state.get("thread_id", ""),
                key="thread_id_input",
                help="Enter an existing ID to resume a session, or share this ID to collaborate.",
            )

            col_load, col_new = st.columns(2)
            with col_load:
                if st.button("Load / Resume", use_container_width=True):
                    # When loading, set the main session_state.thread_id to the input value
                    st.session_state.thread_id = thread_id_input
                    st.session_state.pop("ctx", None)  # Force reload from API
                    st.query_params["thread_id"] = thread_id_input  # Update URL
                    st.toast(f"Loading session: {st.session_state.thread_id}")
                    st.rerun()

            with col_new:
                if st.button("Start New Session", use_container_width=True):
                    st.session_state.clear()
                    st.query_params.clear()
                    st.rerun()

        # --- SECTION 2: REPO CONFIGURATION ---
        with st.expander("Configuration", expanded=True):
            # Set default values for the UI input fields from the context
            repo_url = st.text_input(
                "Git Repository URL",
                value=ctx.get("repo_url", "https://github.com/lightstep/hipster-shop.git"),
            )
            branch = st.text_input("Branch Name", value=ctx.get("repo_branch", "master"))
            subfolder = st.text_input(
                "Subfolder Path (Optional)",
                value=ctx.get("repo_subfolder", ""),
                placeholder="e.g. src/cartservice",
            )
            pat_token = st.text_input(
                "GitHub PAT (Optional)", value=ctx.get("pat_token", ""), type="password"
            )

        # Retrieve and display the application version at the bottom of the screen
        version = get_app_version()
        st.markdown(
            f"""
            <div style='
                position: fixed;
                bottom: 15px;
                right: 15px;
                color: #888888;
                font-size: 0.8rem;
                font-family: monospace;
                z-index: 1000;
            '>
                v{version}
            </div>
            """,
            unsafe_allow_html=True,
        )

        return repo_url, branch, subfolder, pat_token
