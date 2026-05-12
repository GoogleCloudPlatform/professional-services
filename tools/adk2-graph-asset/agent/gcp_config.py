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

"""
GCP / Vertex AI initialization for the ADK2 graph POC.
Mirrors the pattern used in langgraph_math_agent_v3.
"""
import os
from pathlib import Path

import vertexai
from dotenv import load_dotenv
from google.oauth2 import service_account


def init_vertex_ai(staging_bucket: str | None = None) -> dict:
    """
    Load credentials from service-account-key.json (in project root or via env),
    initialise Vertex AI, and set environment variables required by google-adk.

    Returns a dict with 'project', 'location', and 'credentials_path'.
    """
    project_root = Path(__file__).resolve().parents[1]

    # Load .env files if present
    for env_path in [project_root / ".env", project_root / "agent" / ".env"]:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=False)

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "otl-eng-avstudio")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    # Tell google-adk to use Vertex AI (not Google AI Studio)
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "1"
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
    os.environ["GOOGLE_CLOUD_LOCATION"] = location

    # Use explicit SA key if available; otherwise fall back to ADC (used on Agent Engine).
    default_key_path = project_root / "service-account-key.json"
    key_path = Path(
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS", str(default_key_path))
    ).resolve()

    init_kwargs: dict = {"project": project_id, "location": location}

    if key_path.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(key_path)
        credentials = service_account.Credentials.from_service_account_file(
            str(key_path)
        )
        init_kwargs["credentials"] = credentials
    else:
        # Running on Agent Engine or any environment with ADC configured.
        pass
    if staging_bucket:
        init_kwargs["staging_bucket"] = staging_bucket

    vertexai.init(**init_kwargs)

    return {
        "project": project_id,
        "location": location,
        "credentials_path": str(key_path),
    }
