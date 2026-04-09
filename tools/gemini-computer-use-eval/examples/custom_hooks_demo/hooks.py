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

# Example hooks for monitoring execution safety in an automation run.
# These functions are called by the Runner at specific points in the lifecycle.

SAFE_DOMAINS = ["example.com", "google.com", "localhost"]


def validate_navigation(step: int, history: list):
    """
    Ensures that the agent stays within safe, expected domains.
    Runs as an 'after_step' hook.
    """
    if not history:
        return

    last_turn = history[-1]

    # Check if the last turn was a function response (the result of an action)
    if not hasattr(last_turn, "parts"):
        return

    current_url = None
    for part in last_turn.parts:
        if part.function_response and part.function_response.response:
            resp = part.function_response.response
            if "url" in resp:
                current_url = resp["url"]
                break

    if not current_url:
        return

    url_lower = current_url.lower()

    # Simple check: Is the domain in our allowlist?
    is_safe = any(domain in url_lower for domain in SAFE_DOMAINS)
    if not is_safe and "about:blank" not in url_lower:
        print(
            f"--- SAFETY ALERT: Agent navigated to external domain: {current_url} ---"
        )
        # In a real scenario, you could raise an exception to abort the run:
        # raise RuntimeError(f"Safety Violation: Navigation to {current_url} is not allowed.")


def log_start(config: dict):
    """
    Simple hook to log the start of a benchmark run.
    Runs as a 'before_run' hook.
    """
    task_name = config.get("name", "Unknown Task")
    print(f"\n--- [HOOK] Starting Benchmark: {task_name} ---")
    print(f"--- [HOOK] Goal: {config.get('task', {}).get('goal')} ---")
