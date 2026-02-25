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

"""Module for refining generated artifacts based on user instructions."""

import logging

from app.config import get_llm
from app.prompts.planner_prompts import get_planner_prompt
from app.prompts.refiner_prompts import (
    get_cuj_refiner_prompt,
    get_mermaid_refiner_prompt,
    get_slo_executor_prompt,
)

logger = logging.getLogger(__name__)


def artifact_refiner(
    current_content: str, user_instruction: str, artifact_type: str, context: str = ""
):
    """
    Refines artifacts.
    - Mermaid: Single-pass update.
    - SLO: Two-phase 'Plan & Execute' to preserve formatting.
    """
    # Force deterministic output
    llm = get_llm()

    # --- BRANCH 1: MERMAID (Direct) ---
    if artifact_type == "sequence_diagram":
        logger.info("Refining Mermaid Diagram...")
        prompt = get_mermaid_refiner_prompt(current_content, user_instruction, context)
        response = llm.invoke(prompt).content.strip()

        # Cleanup markdown fences if present
        if "```mermaid" in response:
            response = response.replace("```mermaid", "").replace("```", "").strip()
        elif "```" in response:
            response = response.replace("```", "").strip()

        return response

    # --- BRANCH 2: SLO (Plan + Execute) ---
    if artifact_type == "SLO":
        try:
            # PHASE 1: PLAN
            logger.info("--- Phase 1: Planning SLO Changes ---")
            planner_prompt = get_planner_prompt(current_content, user_instruction, context)
            plan_response = llm.invoke(planner_prompt).content.strip()

            # Clean JSON
            if "```json" in plan_response:
                plan_response = plan_response.replace("```json", "").replace("```", "").strip()
            elif "```" in plan_response:
                plan_response = plan_response.replace("```", "").strip()

            # PHASE 2: EXECUTE
            logger.info(
                "--- Phase 2: Executing Bounded Rewrite (Plan: %s...) ---",
                plan_response[:50],
            )
            executor_prompt = get_slo_executor_prompt(
                current_content, user_instruction, plan_response, context
            )
            final_response = llm.invoke(executor_prompt).content.strip()

            # Final Cleanup
            if "```markdown" in final_response:
                final_response = (
                    final_response.replace("```markdown", "").replace("```", "").strip()
                )

            return final_response

        except Exception as e:
            logger.error("SLO Refinement Failed: %s", e)
            return current_content

    elif artifact_type == "cuj_list":
        logger.info("Refining CUJ List...")
        prompt = get_cuj_refiner_prompt(current_content, user_instruction, context)
        response = llm.invoke(prompt).content.strip()

        # Clean JSON markdown
        if "```json" in response:
            response = response.replace("```json", "").replace("```", "").strip()
        elif "```" in response:
            response = response.replace("```", "").strip()

        return response

    return current_content
