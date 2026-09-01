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

"""Top level agent for Bigquery modelling  multi-agents.

-- It gets the prompt from the user and passes to the suitable agent.
"""
import os
from datetime import date

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmRequest, LlmResponse
from google.genai import types

from .const import (
    KIND_OF_ACTIVITY_START_FRESH,
    KIND_OF_ACTIVITY_STATE_LBL,
)
from .sub_agents import (
    ddl_agent,
    dml_agent,
    modelling_orchestrator_agent,
    reporting_agent,
    search_agent,
    synthetic_data_generator_agent,
)

AGENT_INTRODUCTION_MINIFIED = """Welcome! I am your BigQuery Modeling Assistant, a powerful multi-agent system designed to help you with all aspects of data modeling.
I act as an orchestrator for a team of specialist agents. Just tell me what you need to do, and I'll route your request to the right expert.
"""
AGENT_INTRODUCTION = """Welcome! I am your BigQuery Modelling Assistant, a powerful multi-agent system designed to help you with all aspects of data modeling.

I act as an orchestrator for a team of specialist agents. Just tell me what you need to do, and I'll route your request to the right expert.

Here’s a guide to my team and how they can assist you:

**1. `search_agent` - The Information Retriever**
*   **Purpose:** This agent is your go-to for finding information about your existing data. It can retrieve schemas and metadata for both your raw source data and any data models you've already built.
*   **Use Cases & Examples:**
    *   When a user wants to see an existing schema:
        *   *"Find the schema for the source `customers` table."*
        *   *"Show me the metadata for the target `Dim_User` table we created last week."*
    *   When a user wants to retrieve a data model:
        *   *"Can you retrieve the existing data model for sales?"*

**2. `modelling_orchestrator_agent` - The Architect & Designer**
*   **Purpose:** This is the core agent for designing and generating new data models from scratch. It creates all the necessary artifacts for you to review and build upon.
*   **What it creates:** Logical models, physical DDL scripts (`CREATE TABLE ...`), and detailed metadata in JSON format.
*   **Use Cases & Examples:**
    *   When a user wants to create a new data model from scratch:
        *   *"Design a star schema for e-commerce analytics."*
        *   *"Generate the DDL for fact and dimension tables based on the retail KPIs."*
    *   When a user needs specific model artifacts:
        *   *"Create a logical model and provide physical implementation suggestions for our user data."*
        *   *"Generate the BigQuery metadata JSON for the model I just designed."*

**3. `ddl_agent` - The Builder**
*   **Purpose:** Once a data model design is ready (as a DDL script), this agent's job is to build it in BigQuery. It takes the script and executes it to create your tables.
*   **Use Cases & Examples:**
    *   When a user wants to build tables from a script:
        *   *"Execute the DDL to create the tables in the `sales_dm` dataset."*
        *   *"Run the generated DDL scripts."*
        *   *"Apply the table creation script now."*

**4. `synthetic_data_generator_agent` - The Data Populator**
*   **Purpose:** Need to test your new tables? This agent can populate them with realistic, synthetic (mock) data, which is crucial for development and validation.
*   **Use Cases & Examples:**
    *   When a user needs sample data in their new tables:
        *   *"Generate synthetic data for the `Dim_Customer` and `Fact_Sales` tables."*
        *   *"Populate the newly created tables with mock data."*

**5. `reporting_agent` - The Visualizer**
*   **Purpose:** To help you understand your data model's structure, this agent generates visual reports and diagrams, such as Entity-Relationship Diagrams (ERDs).
*   **Use Cases & Examples:**
    *   When a user wants to visualize the data model:
        *   *"Create a Mermaid ER diagram for the current data model."*
        *   *"Generate a report on the table structures."*

**6. `dml_agent` - The Analyst & Querier**
*   **Purpose:** When your tables are built and populated, this agent helps you get insights from your data. It generates and runs SQL queries to answer analytical questions and calculate metrics.
*   **Use Cases & Examples:**
    *   When a user asks an analytical question about the data:
        *   *"What was the total sales amount for last month?"*
        *   *"Show me the top 10 products by sales."*

You can start by telling me what you'd like to accomplish. For example, try asking me to "design a new data model for sales".
"""

def before_model_callback(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> LlmResponse | None:
    if "source_search_result" not in callback_context.state:
        callback_context.state["source_search_result"] = ""
    if "metadata" not in callback_context.state:
        callback_context.state["metadata"] = '{"tables": [], "relationships": []}'
    callback_context.state[KIND_OF_ACTIVITY_STATE_LBL] = KIND_OF_ACTIVITY_START_FRESH
    return None


date_today = date.today()


root_agent = Agent(
    model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
    name="data_modelling_agent",
    description=AGENT_INTRODUCTION_MINIFIED,
    instruction="""You are a master orchestrator for a BigQuery Modelling Multi-Agent System. Your primary responsibility is to analyze the user's request and delegate it to the correct specialist agent based on the user's intent.
    You must follow these rules:

    **Agent Routing Guide:**
    - **`ddl_agent`**: Use for requests to **inspect live BigQuery datasets/tables**, create schemas and tables, execute DDL scripts, or **apply table and column descriptions** (`ALTER TABLE ... SET OPTIONS(...)`) to live BigQuery tables.
    - **`modelling_orchestrator_agent`**: Use for requests to **design, architect, or generate** new enterprise dimensional data models (Fact & Dimension tables), logical models, or feature engineering enhancements for KPIs.
    - **`search_agent`**: Use for searching datastore documentation or saved model archives.
    - **`synthetic_data_generator_agent`**: Use for requests to generate synthetic or sample data.
    - **`reporting_agent`**: Use for requests to create visual reports, ER diagrams, or schema charts.
    - **`dml_agent`**: Use for requests to run analytical queries (e.g. SELECT) or calculate metrics against tables.

    **Strict Rules:**
    1.  You **MUST** delegate the task to exactly **ONE** agent.
    2.  You **MUST NOT** generate final answers yourself. Your main job is to route.
    3.  If an agent returns an error, you must retry from beginning after sending clear message to user.
""",
    global_instruction=(
        f"""
        You are a BigQuery Modelling Multi Agent System.
        Todays date: {date_today}
        """
    ),
    sub_agents = [
        search_agent,
        modelling_orchestrator_agent,
        ddl_agent,
        synthetic_data_generator_agent,
        reporting_agent,
        dml_agent,
        # task_initialization_agent,
    ],
    generate_content_config=types.GenerateContentConfig(temperature=0.01),
    before_model_callback = before_model_callback,
)


def load_agent() -> Agent:
    """Returns the initialized root data modelling agent."""
    return root_agent