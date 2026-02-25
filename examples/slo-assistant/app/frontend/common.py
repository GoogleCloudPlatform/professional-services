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

"""Common utilities and helper functions for the frontend."""

import logging
import urllib
import re
import os

from app.utils.storage_ops import BUCKET_NAME, GCP_PROJECT_ID, get_project_folder


def get_app_version() -> str:
    """Extracts the application version from pyproject.toml."""
    try:
        # Assuming the app is run from the root of the project
        pyproject_path = os.path.join(os.getcwd(), "pyproject.toml")
        with open(pyproject_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("version = "):
                    match = re.search(r'version = "(.*?)"', line)
                    if match:
                        return match.group(1)
    except Exception as e:
        logging.warning("Could not read version from pyproject.toml: %s", e)
    return "0.0.0"


def configure_logging():
    """Silences verbose third-party loggers."""
    silenced_loggers = [
        "httpx",
        "httpcore",
        "urllib3",
        "google.auth",
        "google.api_core",
        "google.cloud",
        "google.cloud.aiplatform",
        "vertexai",
    ]
    for logger_name in silenced_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    # Ensure app logger is visible
    logging.getLogger("app").setLevel(logging.INFO)


def get_console_link(repo_url, subfolder=""):
    """Generates a direct link to the Google Cloud Storage Console."""
    try:
        project_folder = get_project_folder(repo_url)
        # URL Encode the path parts
        safe_prefix = urllib.parse.quote(f"{project_folder}/{subfolder}", safe="")

        return (
            f"https://console.cloud.google.com/storage/browser/{BUCKET_NAME}/"
            f"{safe_prefix}?project={GCP_PROJECT_ID}"
        )
    except Exception:
        return "#"
