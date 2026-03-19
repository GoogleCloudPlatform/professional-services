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

"""Module for generating sequence diagrams based on identified CUJs."""

import concurrent.futures
import logging

from app.config import get_llm
from app.prompts.diagram_prompts import get_diagram_prompt
from app.state import AgentState

from app.utils.text_utils import convert_messages_to_dicts

logger = logging.getLogger(__name__)


def _generate_single_diagram(cuj: dict) -> dict:
    """
    Helper function to generate a single diagram for a given CUJ.
    This function is executed in a parallel thread.
    """
    logger = logging.getLogger(__name__)  # Define logger inside the thread
    cuj_name = cuj.get("name", "Unnamed Journey")
    description = cuj.get("description", "")
    files = cuj.get("files", [])

    prompt = get_diagram_prompt(cuj_name=cuj_name, cuj_description=description, cuj_files=files)

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        mermaid_code = response.content.replace("```mermaid", "").replace("```", "").strip()
        return {"status": "success", "name": cuj_name, "code": mermaid_code}
    except Exception as e:
        logger.error("LLM call failed for diagram generation of '%s': %s", cuj_name, e)
        return {
            "status": "error",
            "name": cuj_name,
            "error": f"Failed to generate diagram: {e}",
        }


def diagram_generator(state: AgentState) -> dict:
    """
    Generates Mermaid sequence diagrams for all identified CUJs in parallel.
    Returns a dictionary with the generated diagram code.
    """
    logger.info("--- Generating Sequence Diagrams ---")

    # Clean the chat history as a defensive measure
    chat_history = convert_messages_to_dicts(state.get("chat_history", []))

    cujs = state.get("identified_cujs", [])
    if not cujs:
        return {"sequence_diagram_code": {}, "chat_history": chat_history}

    diagrams_dict = {}
    results = []

    # Use a ThreadPoolExecutor to run LLM calls in parallel for efficiency
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_cuj = {executor.submit(_generate_single_diagram, cuj): cuj for cuj in cujs}
        for future in concurrent.futures.as_completed(future_to_cuj):
            results.append(future.result())

    # Process the results after all threads have completed
    for result in results:
        name = result["name"]
        if result["status"] == "success":
            diagrams_dict[name] = result["code"]
        else:
            # Record the error in the place of the diagram content
            diagrams_dict[name] = result["error"]

    return {"sequence_diagram_code": diagrams_dict, "chat_history": chat_history}
