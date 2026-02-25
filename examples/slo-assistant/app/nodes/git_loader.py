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

"""Module for loading and analyzing Git repositories."""

import logging

from app.state import AgentState
from app.utils import (
    clone_repository,
    get_repo_file_structure,
    convert_messages_to_dicts,
)

logger = logging.getLogger(__name__)


def git_loader(state: AgentState):
    """Clones the specified Git repository and extracts its file structure."""
    logger.info("--- Cloning Repository ---")

    # Defensive state cleaning
    chat_history = convert_messages_to_dicts(state.get("chat_history", []))

    logger.info(
        "Target Repo: %s, Target Branch: %s, Target Subfolder: %s",
        state.get("repo_url"),
        state.get("repo_branch"),
        state.get("repo_subfolder"),
    )
    repo_path = clone_repository(
        state["repo_url"],
        state.get("pat_token"),
        state.get("repo_subfolder"),
        state.get("repo_branch"),
    )

    # Generate the file tree for the Analyst to look at
    file_tree = get_repo_file_structure(repo_path)
    logger.info("File tree generated. Total files found: %d", len(file_tree.splitlines()))
    # Return the cleaned history along with the node's output
    return {
        "local_repo_path": repo_path,
        "file_tree": file_tree,
        "chat_history": chat_history,
    }
