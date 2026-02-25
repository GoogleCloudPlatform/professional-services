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
Main Streamlit UI for the SRE Copilot application.
This version uses the backend API for all state and session management.
"""

import streamlit as st

from app.frontend.common import configure_logging
from app.frontend.components.sidebar import render_sidebar
from app.frontend.copilot import render_copilot
from app.frontend.steps import (
    render_step1_repo,
    render_step2_cujs,
    render_step3_diagrams,
    render_step4_slos,
    render_step5_terraform,
)
from app.services import api_client

# --- Initial Page Setup ---
configure_logging()
st.set_page_config(page_title="SLO Agent", layout="wide")
st.markdown(
    "<h1 style='text-align: center;'>AI-Powered SLO Consultant</h1>",
    unsafe_allow_html=True,
)


# --- Session State Management with API ---
# Try to get thread_id from URL query params
query_params = st.query_params
thread_id_from_url = query_params.get("thread_id")

# Priority 1: If we have a URL thread_id that differs from our current one, we switch to it.
if thread_id_from_url and st.session_state.get("thread_id") != thread_id_from_url:
    st.session_state.thread_id = thread_id_from_url
    st.session_state.pop("ctx", None)  # Force reload of context

# Priority 2: If we have a thread_id but NO context (either from URL or sidebar Load button), fetch it.
if st.session_state.get("thread_id") and not st.session_state.get("ctx"):
    tid = st.session_state.thread_id
    try:
        with st.spinner(f"Resuming session {tid}..."):
            # Load state from the API
            loaded_state = api_client.get_state(tid)
            # The API returns the context under the 'values' key
            st.session_state.ctx = loaded_state.get("values", {})
            st.session_state.ctx["next"] = loaded_state.get("next")
            # Sync the sidebar input field
            st.session_state.thread_id_input = tid
            st.toast(f"Resumed session: {tid}")
    except Exception as e:
        st.error(f"Could not resume session: {e}")
        st.session_state.ctx = {}
        st.toast(f"Started new session: {tid}")

# Priority 3: Initialize a brand new session if none exists at all
elif "thread_id" not in st.session_state:
    try:
        # Create a new thread via the API
        thread_id = api_client.create_thread()
        st.session_state.thread_id = thread_id
        st.session_state.ctx = {}
        st.session_state.thread_id_input = thread_id
        st.query_params["thread_id"] = thread_id  # Update URL
        st.toast(f"Started new session: {thread_id}")
    except Exception as e:
        st.error(f"Could not start a new session: {e}")
        # Halt execution if we can't even create a thread
        st.stop()


# Main context and thread_id variables
thread_id = st.session_state.thread_id
# Use st.session_state.ctx directly to ensure changes propagate across reruns
if "ctx" not in st.session_state:
    st.session_state.ctx = {}
ctx = st.session_state.ctx


# --- Render UI Components ---

# Sidebar now just gets the latest UI selections
ui_repo_url, ui_branch, ui_subfolder, ui_pat_token = render_sidebar(ctx)


# Update context with the latest repo info from the UI.
# This only updates the local context. The change will be sent to the backend
# when a workflow step is actually triggered (e.g., by a button click).
ctx["repo_url"] = ui_repo_url
ctx["repo_branch"] = ui_branch
ctx["repo_subfolder"] = ui_subfolder
ctx["pat_token"] = ui_pat_token

# --- Render Steps & Copilot ---
render_copilot(ctx, thread_id)
render_step1_repo(ctx, thread_id)
st.markdown("---")
render_step2_cujs(ctx, thread_id)
st.markdown("---")
render_step3_diagrams(ctx, thread_id)
st.markdown("---")
render_step4_slos(ctx, thread_id)
st.markdown("---")
render_step5_terraform(ctx, thread_id)

# NOTE: We no longer save the session state on every render.
# State is now managed by the backend API and updated through explicit actions.
