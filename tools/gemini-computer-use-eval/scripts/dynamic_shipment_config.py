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

import random


def replace_placeholders(obj, placeholder, replacement):
    """Recursively traverses a dictionary or list and replaces string placeholders."""
    if isinstance(obj, dict):
        return {
            k: replace_placeholders(v, placeholder, replacement)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [
            replace_placeholders(item, placeholder, replacement) for item in obj
        ]
    elif isinstance(obj, str):
        return obj.replace(placeholder, replacement)
    return obj


def load_config(config: dict) -> dict:
    """
    Dynamically injects a random reference number into the already-loaded
    benchmark configuration dictionary.
    This function is called by the runner via the --script flag.
    """
    # Generate a random 5-digit string (e.g., TEST_84921)
    # We use a 5-digit random to minimize collision probability in UAT
    random_id = random.randint(10000, 99999)
    random_ref = f"TEST_{random_id}"

    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"Injecting dynamic reference number: {random_ref}")

    # Inject it into all placeholders in the configuration dictionary
    # This ensures consistency across system prompt, task goal, and output format
    updated_config = replace_placeholders(config, "{{REF_NUM}}", random_ref)

    return updated_config
