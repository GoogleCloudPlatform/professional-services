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

"""Prompts for identifying Critical User Journeys (CUJs) from codebases."""


def get_cuj_prompt(file_tree: str, guidance: str = None) -> str:
    """
    Returns the prompt for identifying Critical User Journeys (CUJs)
    based on the file structure.
    """
    guidance_section = ""

    if guidance:
        guidance_section = f"""
        USER GUIDANCE:
        The user has specifically requested to identify journeys related to: "{guidance}".
        Ensure these are prioritized and accurately captured if they exist in the code.
        """

    prompt = f"""
        You are a Principal Site Reliability Engineer. Your goal is to identify the Critical User Journeys (CUJs) for the provided application code.

        {guidance_section}

        For each CUJ, list the specific FILE PATHS that contain the core logic for that journey (e.g., the route handler, the service logic).
        
        FILE PATHS:
        {file_tree}

        RULES:
        1. A "CUJ" is a path a user takes that delivers core business value (e.g., "Checkout", "Login", "Search").
        2. Do NOT include technical background tasks (like "Database Migration" or "Cache Warmup").
        3. Focus on the high-level API routes and service interactions.
        4. Return a clean, consistent list.

        --------------------------------------------------------
        CRITICAL ANTI-HALLUCINATION RULES:
        1. **EVIDENCE REQUIRED:** You MUST only add journeys where you can identify a specific file and function/handler in the `FILE PATHS` provided.
        2. **NO INVENTION:** If the User Guidance requests a journey (e.g. "Login") but you cannot find a corresponding file (e.g. `loginHandler`, `auth_service`, `UserController`), **YOU MUST OMIT IT**.
        3. **STRICT VERIFICATION:** Do not assume a journey exists just because it is standard (e.g. don't assume "Login" exists if the code uses anonymous sessions).
        4. **EMPTY IS BETTER:** It is better to return a shorter list of real journeys than a long list of hallucinated ones.
        --------------------------------------------------------

        OUTPUT FORMAT:
        Return a RAW JSON List of objects:
        [
            {{
                "name": "Add to Cart",
                "description": "User adds an item to their shopping cart.",
                "files": ["src/cartservice/cartservice.cs", "src/cartservice/services/CartService.cs"]
            }}
        ]
        """
    return prompt
