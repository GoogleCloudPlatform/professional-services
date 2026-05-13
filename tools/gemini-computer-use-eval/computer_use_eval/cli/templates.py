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

BASIC_YAML = """name: "{name}"
description: "Generated basic benchmark for {name}"

agent:
  model: "gemini-2.5-computer-use-preview-10-2025"
  system_prompt: |
    {{{{DEFAULT}}}}
    You are a helpful assistant. Complete the task accurately.

task:
  start_url: "https://www.google.com"
  goal: "Search for 'Gemini API' and verify the results."

criteria:
  assertions:
    - type: "url"
      condition: "contains"
      value: "google.com/search"
"""

STANDARD_YAML = """name: "{name}"
description: "Enterprise-grade benchmark for {name} with optimized performance."

agent:
  model: "gemini-2.5-computer-use-preview-10-2025"
  system_prompt_file: "prompts/system.md"
  context:
    preset: "EFFICIENT"
  max_steps: 50

task:
  start_url: "https://www.google.com"
  goal: "Example goal: Perform a search and verify the first result."

criteria:
  assertions:
    - type: "script"
      code_file: "assertions/success.js"
"""

STANDARD_PROMPT = """# System Instructions for {name}

{{{{DEFAULT}}}}

=== MISSION ===
Complete the task efficiently. 

=== BATCHING RULES ===
- Group related actions (like typing into multiple fields) into a single turn.
- Minimize turns to reduce latency and cost.
"""

STANDARD_ASSERTION = """/**
 * Assertion Logic for {name}
 * Return true if the task was successful.
 */
(() => {{
  // Example: Check if specific text exists on page
  const text = document.body.innerText;
  return text.includes("Google");
}})()
"""
