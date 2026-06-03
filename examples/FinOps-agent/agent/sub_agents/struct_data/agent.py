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

import os
import logging
from google.adk.agents import LlmAgent as Agent


from .tools import bigquery_toolset
from .prompt import prompt

logger = logging.getLogger(__name__)

struct_data_agent = Agent(
   model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
   name="struct_data_agent",
   include_contents='none',
   description="Technical agent that executes SQL queries on GCP BigQuery billing tables to find cost evidence.",
   instruction=prompt, # Keep your existing prompt
   tools=[bigquery_toolset],
   output_key="struct_data_result",
)