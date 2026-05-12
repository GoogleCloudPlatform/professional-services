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

# agent package
#
# When deployed via `adk deploy agent_engine`, this package becomes the
# top-level module. The ADK CLI looks for `root_agent` here and wraps it in
# AdkApp (which sets framework="ADK" and enables Cloud Trace / OTel).
#
# Environment variables (GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT,
# GOOGLE_CLOUD_LOCATION) are read from the .env file in this directory.
# `adk deploy agent_engine` picks up that file via --env_file and injects
# the vars into the Agent Engine deployment automatically.
# On Agent Engine at runtime the vars are already present; load_dotenv with
# override=False is a safe no-op in that case.
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)

from .graph_builder import build_agent_from_yaml  # noqa: E402

_yaml_path = Path(__file__).parent / "sample_graph.yaml"
root_agent, _, _ = build_agent_from_yaml(_yaml_path)
