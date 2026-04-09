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

"""Prompts for generating MermaidJS sequence diagrams."""

from typing import List

MERMAID_INSTRUCTIONS = """
VISUALIZATION RULES:
1. **Participants**: Define services and infrastructure explicitly.
2. **Inference**: If the code implies persistence (e.g., `Save()`, `Redis.Set()`), you MUST add a database participant.
3. **Syntax**: 
    - Start with 'sequenceDiagram' and 'autonumber'
    - Use CamelCase for names (e.g., `CartRedis`, `UserDB`). NO spaces.
    - Services: `participant Name`
    - Databases: `participant Name@{ "type": "database" }`
    - Use 'activate' and 'deactivate' blocks for every service call.\n"
    - **NEVER use arrows without a source (e.g., `->>Target`). Always use `Source->>Target`.Mermaid does NOT support anonymous arrows.**
    - NEVER use `->>` or `-->>` without specifying the sender.
4. **Scope**: Focus on the backend flow.
5. **Actors**: Always include a `actor User` or `participant Client` to initiate the request.



OUTPUT FORMAT:
Return ONLY the raw MermaidJS code string. 
Do NOT wrap in markdown (```mermaid). 
Do NOT return JSON. Just the diagram code.
"""


def get_diagram_prompt(cuj_name: str, cuj_description: str, cuj_files: List[str]) -> str:
    """
    Returns the prompt for generating a MermaidJS sequence diagram
    for a specific Critical User Journey.
    """
    prompt = f"""
    You are a Technical Architect.
    Generate a MermaidJS sequence diagram for this specific Critical User Journey.
    
    JOURNEY DETAILS:
    Name: {cuj_name}
    Description: {cuj_description}
    Files Involved: {cuj_files}
    
    {MERMAID_INSTRUCTIONS}
    """
    return prompt
