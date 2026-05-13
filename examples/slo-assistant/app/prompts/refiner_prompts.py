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

"""Prompts for refining various artifacts like Mermaid diagrams and SLO specifications."""

# app/prompts/refiner_prompts.py
from app.prompts.diagram_prompts import MERMAID_INSTRUCTIONS

# --- 1. MERMAID PROMPT (Simple) ---


def get_mermaid_refiner_prompt(
    current_content: str, user_instruction: str, context: str = ""
) -> str:
    """
    Returns the prompt for refining a MermaidJS diagram based on user instructions.
    """
    return f"""
    You are an Expert Software Architect.
    Update this MermaidJS diagram based on the user request.

    CONTEXT (Code References):
    {context}
    
    EXISTING DIAGRAM:
    {current_content}
    
    INSTRUCTION: "{user_instruction}"
    
    RULES:
    {MERMAID_INSTRUCTIONS}
    
    OUTPUT: Return ONLY the raw Mermaid code.
    """


# --- 2. SLO EXECUTOR PROMPT (Strict) ---


def get_slo_executor_prompt(
    current_content: str, user_instruction: str, plan_json: str, context: str = ""
) -> str:
    """
    Returns the prompt for executing a change plan on an SLO document.
    """
    return f"""
    You are a Technical Editor. You are executing a pre-approved Change Plan on a Markdown document.

    CONTEXT (Code References):
    {context}
    
    CRITICAL RULE: BOUNDED EDITING
    You are ONLY allowed to modify the sections listed in the 'affected_sections' of the Change Plan.
    
    Everything else must be copied BYTE-FOR-BYTE.
    
    --- CHANGE PLAN ---
    {plan_json}
    -------------------
    
    FORMATTING PROTOCOLS (NON-NEGOTIABLE):
    1. **PRESERVE STRUCTURE:** Do not promote text to Headers. Keep "SLI Specification:" as a bold label.
    2. **CODE BLOCKS:** - PromQL queries MUST use triple backticks: ```promql
       - LaTeX math MUST use: $$
    3. **VERBATIM COPY:** If a section is listed in 'unchanged_sections', you must copy it exactly as it appears in the source.
    
    --- EXISTING DOCUMENT (SOURCE) ---
    {current_content}
    ----------------------------------
    
    USER INSTRUCTION: "{user_instruction}"
    
    ACTION: Apply the Change Plan to the Source Document.
    OUTPUT: The full, valid Markdown document.
    """


def get_cuj_refiner_prompt(current_json: str, user_instruction: str, context: str = "") -> str:
    """
    Returns the prompt for refining a list of Critical User Journeys (CUJs).
    """
    return f"""
    You are a Data Editor. Your job is to update a JSON list of User Journeys based on user feedback.

    CONTEXT (File Tree):
    {context}

    CURRENT JSON:
    {current_json}

    USER INSTRUCTION: "{user_instruction}"

    RULES:
    1. Modifiy the JSON list to satisfy the instruction.
    2. If the user asks to add a file (e.g. "Add `auth.py`"), Verify that it exists in the file tree, find its path.
    3. Maintain the exact JSON structure:
    `[{{ "name": "...", "description": "...", "files": [...] }}]`.
    4. Do not delete items unless explicitly asked.

    OUTPUT: Return ONLY the raw valid JSON list.
    """
