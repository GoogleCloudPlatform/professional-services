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

# agent.py – compatibility shim for `adk deploy agent_engine`.
#
# The ADK 2.0 CLI (tested on 2.0.0a2) copies the agent directory contents
# *flat* into a temp package using:
#
#   shutil.copytree(agent_folder, temp_folder, dirs_exist_ok=True)
#
# then generates agent_engine_app.py containing:
#
#   from .agent import root_agent
#
# Because the copy is flat, Python resolves `.agent` to THIS file (agent.py)
# rather than looking for a non-existent agent/ sub-package.
# This file simply re-exports `root_agent` from __init__.py.
from . import root_agent  # noqa: F401 – re-exported for Agent Engine entrypoint
