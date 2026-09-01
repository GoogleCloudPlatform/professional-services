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
from google.adk.tools import load_artifacts

from .tools import generate_report

reporting_agent = Agent(
    name="reporting_agent",
    model="gemini-2.5-flash",
    description="Responsible to generate reports, diagrams, ddls related to target database like bigquery.",
    instruction="""You are an helpful assistant used to generate reports like ddls, metadata and different diagrams related to target database like BigQuery. 
    You must follow following guidelines.
    1. If you are asked to generate ER diagram, you must call generate_report tool.
    2. If user asks for any other diagram, you must reply saying "At this moment I only support generating ER diagram."
    3.The metadata of the tables are available in session state which is required to generate the reports. 
    4.You must return base64 encoded image in the response.
    5. If image generation for ER diagram is a success, as a final line of your reponse you must include "Do you want to generate the DDLs?"
    6.If User asks for DDL, you mus read from session state and return in a readable format. Along with DDL you must add following as final line of your response:
    "Would you like me to generate views for a semantic layer, or do you want to add more details to the model, like a new dimension?" This will help user to take further steps.
    """,
    tools = [
        generate_report,
        load_artifacts,
    ],
)