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

"""Module for the SLO Specialist node, responsible for drafting SLO specifications."""

import concurrent.futures
import json
import logging

from app.config import get_llm
from app.prompts.slo_prompts import get_slo_design_prompt
from app.state import AgentState
from app.utils import read_specific_files

from app.utils.text_utils import convert_messages_to_dicts

logger = logging.getLogger(__name__)


def _draft_single_slo(cuj: dict, repo_path: str, diagrams_dict: dict, file_tree: str) -> dict:
    """
    Helper function to draft a single SLO specification for a given CUJ.
    This function is executed in a parallel thread.
    """
    cuj_name = cuj.get("name", "Unknown Journey")
    files_to_read = cuj.get("files", [])

    try:
        code_context = read_specific_files(repo_path, files_to_read)
        if not code_context:
            code_context = (
                "(No specific implementation files found. Relying on architecture diagrams.)"
            )
    except Exception as e:
        code_context = f"(Error reading files: {e})"

    prompt = get_slo_design_prompt(
        cuj_name=cuj_name,
        diagram_json=json.dumps(diagrams_dict.get(cuj_name, "Diagram not found")),
        code_context=code_context,
        file_tree=file_tree,
    )

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        return {"status": "success", "name": cuj_name, "report": response.content}
    except Exception as e:
        logger.error("LLM call failed for SLO drafting of '%s': %s", cuj_name, e)
        return {
            "status": "error",
            "name": cuj_name,
            "error": f"Failed to draft SLO: {e}",
        }


def slo_specialist(state: AgentState) -> dict:
    """
    Drafts SLO specifications for all identified CUJs in parallel.
    Returns a dictionary with the generated SLO reports.
    """
    logger.info("--- Drafting SLOs ---")

    # Clean the chat history as a defensive measure
    chat_history = convert_messages_to_dicts(state.get("chat_history", []))

    cujs = state.get("identified_cujs", [])
    if not cujs:
        return {
            "slo_spec_draft": "",
            "slo_reports_dict": {},
            "chat_history": chat_history,
        }

    diagrams = state.get("sequence_diagram_code", {})
    repo_path = state.get("local_repo_path")
    file_tree = state.get("file_tree", "")

    slo_reports_dict = {}
    results = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_cuj = {
            executor.submit(_draft_single_slo, cuj, repo_path, diagrams, file_tree): cuj
            for cuj in cujs
        }
        for future in concurrent.futures.as_completed(future_to_cuj):
            results.append(future.result())

    for result in results:
        name = result["name"]
        if result["status"] == "success":
            slo_reports_dict[name] = result["report"]
        else:
            slo_reports_dict[name] = result["error"]

    # Generate a master report by concatenating all individual reports
    full_report = "\n\n---\n\n".join(slo_reports_dict.values())

    return {
        "slo_spec_draft": full_report,
        "slo_reports_dict": slo_reports_dict,
        "chat_history": chat_history,
    }
