# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_response import LlmResponse

from .tools import call_source_search_agent, call_target_search_agent


def update_response(callback_context: CallbackContext,
                    llm_response: LlmResponse):
    
    callback_context.state["readable_search_result"] = llm_response.content


search_agent = Agent(
    name="search_agent",
    model="gemini-2.5-flash",
    instruction="""
    You are a search agent who retrieves relevant schema/metadata information from datastore using tools call_source_search_agent or call_target_search_agent.
    You must follow below instructions:
    1. Identify if the search is for source or target. If source or respective synonyms is present execute call_source_search_agent tool.
    2. If target or respective synonyms is present execute call_target_search_agent tool. If nothing is present return error to user.
    3. You must not generate any schema/metadata information by yourself.
    4.You must read the response from the tool in any format and return output in a human readale format
    """,
    description="An agent to search for schema or metadata information. Identifies whether the search is for a 'source' or 'target' schema. Accodingly it will use one of the two tools: call_source_search_agent, call_target_search_agent",
    tools=[
        call_source_search_agent,
        call_target_search_agent,
    ],
    after_model_callback=update_response,
)