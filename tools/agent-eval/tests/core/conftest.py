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
"""Shared test fixtures — mock Google Cloud / Vertex AI libraries.

These mocks must be installed before any agent_eval module is imported,
because vertexai triggers google.genai imports at module load time.
"""

import sys
from unittest.mock import MagicMock

# Mock the full chain that causes ImportError:
#   vertexai → vertexai._genai → google.genai._api_client
_vertexai_mock = MagicMock()
_google_cloud_mock = MagicMock()

for mod in [
    "google.genai",
    "google.genai.types",
    "google.genai._api_client",
    "google.cloud.aiplatform",
    "vertexai",
    "vertexai.types",
    "vertexai.preview",
    "vertexai.preview.evaluation",
]:
    sys.modules.setdefault(mod, MagicMock())
