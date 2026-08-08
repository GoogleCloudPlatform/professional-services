# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Custom deterministic metric checkers for E2E evaluation verification."""

import json
from typing import Any, Dict


def check_tool_usage(row: Dict[str, Any]) -> Dict[str, Any]:
    """Verify tool interactions are extracted and non-empty."""
    interactions = row.get("extracted_data.tool_interactions")
    if interactions is None:
        extracted = row.get("extracted_data", {})
        if isinstance(extracted, str):
            try:
                extracted = json.loads(extracted)
            except Exception:
                extracted = {}
        interactions = extracted.get("tool_interactions", []) if isinstance(extracted, dict) else []

    if isinstance(interactions, str):
        try:
            interactions = json.loads(interactions)
        except Exception:
            interactions = []

    count = len(interactions) if isinstance(interactions, list) else 0
    score = 1.0 if count > 0 else 0.0
    return {
        "score": score,
        "explanation": f"Successfully extracted {count} tool interactions from OpenInference trace.",
    }


def check_prompt_response(row: Dict[str, Any]) -> Dict[str, Any]:
    """Verify prompt and response are non-empty and accurately resolved."""
    prompt = str(row.get("prompt", "") or "").strip()
    response = str(row.get("response", "") or "").strip()
    valid = bool(prompt and response)
    score = 1.0 if valid else 0.0
    return {
        "score": score,
        "explanation": f"Prompt length: {len(prompt)}, Response length: {len(response)}",
    }
