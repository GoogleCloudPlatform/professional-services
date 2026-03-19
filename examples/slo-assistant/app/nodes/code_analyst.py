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

"""Module for the Code Analyst node, responsible for identifying Critical User Journeys."""

import json
import logging
import re

from app.config import get_llm
from app.prompts.cuj_prompts import get_cuj_prompt
from app.state import AgentState

from app.utils.text_utils import convert_messages_to_dicts

logger = logging.getLogger(__name__)


def code_analyst(state: AgentState):
    """Identifies Critical User Journeys (CUJs) and maps them to relevant code files."""
    logger.info("--- Identifying CUJs & Mapping Files---")

    # Defensive state cleaning
    chat_history = convert_messages_to_dicts(state.get("chat_history", []))

    llm = get_llm()

    file_tree = state.get("file_tree", "")
    guidance = state.get("cuj_guidance")

    if not file_tree:
        logger.warning("File tree is empty.")

    prompt = get_cuj_prompt(file_tree, guidance)

    response = llm.invoke(prompt)

    try:
        content = response.content.strip()
        match = re.search(r"\[.*\]", content, re.DOTALL)

        if match:
            json_str = match.group(0)
            cujs_list = json.loads(json_str)
        else:
            cujs_list = []
            logger.warning("No JSON array found in response")

        # Add filtering logic
        file_basenames = {
            line.strip().replace("/", "") for line in file_tree.split("\n") if line.strip()
        }

        filtered_cujs = []
        for cuj in cujs_list:
            cuj_files = cuj.get("files", [])
            if not cuj_files:
                # Filter out CUJs with no associated files
                continue

            all_files_exist = True
            for f in cuj_files:
                # Check if the file's basename exists in the parsed file_tree
                basename = f.split("/")[-1].split("\\")[-1]
                if basename not in file_basenames:
                    all_files_exist = False
                    break

            if all_files_exist:
                filtered_cujs.append(cuj)

        cujs_list = filtered_cujs

        if not cujs_list:
            logger.warning("No valid CUJs identified after filtering.")
            chat_updates = {
                "identified_cujs": [],
                "workflow_goal": None,  # Stop the workflow progression
                "chat_history": chat_history
                + [
                    {
                        "role": "assistant",
                        "content": (
                            "I couldn't identify any valid Critical User Journeys in the code. "
                            "Could you provide some guidance on what to look for?"
                        ),
                    }
                ],
            }
            return chat_updates

        # GCS upload is disabled in this refactored version;
        # this would be handled by a dedicated backend service or node.
        cuj_gcs_url = None

        # Start with the cleaned chat history
        chat_updates = {"chat_history": chat_history}
        if guidance:
            guidance_lower = guidance.lower()
            is_found = any(guidance_lower in cuj["name"].lower() for cuj in cujs_list)

            if not is_found:
                warning_msg = {
                    "role": "assistant",
                    "content": (
                        f"You asked to focus on **'{guidance}'**, but I could not "
                        "find explicit code evidence for it (functions/handlers) "
                        "in this repository. I have listed the journeys I *did* find."
                    ),
                }
                # Append the warning to the cleaned history
                new_history = chat_history + [warning_msg]
                chat_updates["chat_history"] = new_history

    except Exception as e:
        logger.error("JSON Parsing Error: %s", e)
        # Instead of raising an exception that crashes the graph, gracefully pause
        return {
            "identified_cujs": [],
            "workflow_goal": None,
            "chat_history": chat_history
            + [
                {
                    "role": "assistant",
                    "content": "Encountered an error analyzing the codebase. Please try again.",
                }
            ],
        }

    return {"identified_cujs": cujs_list, "cuj_gcs_url": cuj_gcs_url, **chat_updates}
