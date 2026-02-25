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

"""Module for generating Terraform configurations from SLO specifications."""

import json
import logging

from app.config import get_llm
from app.prompts.terraform_prompts import get_terraform_prompt
from app.state import AgentState

logger = logging.getLogger(__name__)


def normalize_llm_json(raw: str) -> str:
    """Normalizes LLM JSON output by stripping markdown fences and fixing quotes."""
    raw = raw.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    raw = raw.replace("“", '"').replace("”", '"')
    if "{" in raw and "}" in raw:
        raw = raw[raw.find("{") : raw.rfind("}") + 1]
    return raw


def terraform_generator(state: AgentState):
    """Generates Terraform configurations from SLO specifications."""
    logger.info("--- Generating Terraform ---")

    llm = get_llm()

    slo_report = state.get("slo_spec_draft", "")

    if not slo_report:
        logger.warning("No SLO Report found in state. Terraform generation may be empty.")
        return {"terraform_files": {}, "tf_gcs_urls": []}

    prompt = get_terraform_prompt(slo_report)

    response = llm.invoke(prompt)
    raw_content = response.content

    # --- CLEANUP & PARSING ---
    try:
        # 1. Strip Markdown fencing (```json ... ```)
        clean_json = normalize_llm_json(raw_content)

        # 2. Parse into Dictionary
        files_dict = json.loads(clean_json)
        logger.info("Generated %d Terraform files.", len(files_dict))

    except json.JSONDecodeError:
        logger.error(
            "Terraform Generation Failed. JSON Decode Error. Raw Content Snippet: %s...",
            raw_content[:200],
        )
        # Fallback: Return a single text file with the raw output for debugging
        files_dict = {"error_log.txt": raw_content}

    return {"terraform_files": files_dict}
