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

"""
Client for interacting with the SRE Copilot backend API.
"""

import json
import logging
import os
from typing import Any, Dict, Iterator

import requests

logger = logging.getLogger(__name__)

# Read the API port from an environment variable, with a fallback to 8080
API_PORT = os.environ.get("API_PORT", "8080")
API_BASE_URL = f"http://localhost:{API_PORT}/api/v1"


def create_thread() -> str:
    """Creates a new thread and returns the thread_id."""
    try:
        response = requests.post(f"{API_BASE_URL}/threads", timeout=10)
        response.raise_for_status()
        return response.json()["thread_id"]
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to create thread: {e}")
        raise


def get_state(thread_id: str) -> Dict[str, Any]:
    """Fetches the current state for a given thread."""
    try:
        response = requests.get(f"{API_BASE_URL}/threads/{thread_id}/state", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to get state for thread {thread_id}: {e}")
        raise


def update_state(thread_id: str, values: Dict[str, Any]) -> Dict[str, Any]:
    """Updates the state for a given thread."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/threads/{thread_id}/state",
            json={"values": values},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to update state for thread {thread_id}: {e}")
        raise


def run_workflow(
    thread_id: str, run_input: Dict[str, Any], auto_approve: bool = False
) -> Iterator[Dict[str, Any]]:
    """
    Runs the workflow and streams back events.
    Yields parsed SSE events as dictionaries.
    """
    try:
        with requests.post(
            f"{API_BASE_URL}/threads/{thread_id}/run",
            json={
                "thread_id": thread_id,
                "input": run_input,
                "auto_approve": auto_approve,
            },
            stream=True,
            timeout=1800,  # Extremely long timeout for potentially long runs
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8")
                    if decoded_line.startswith("event:"):
                        # In a more robust client, you might parse the event type
                        pass
                    elif decoded_line.startswith("data:"):
                        data_str = decoded_line[len("data:") :]
                        try:
                            yield json.loads(data_str)
                        except json.JSONDecodeError:
                            logger.warning(f"Could not decode SSE data: {data_str}")

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to run workflow for thread {thread_id}: {e}")
        # Yield a final error event
        yield {"event": "error", "data": {"error": str(e)}}
