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

import os

from data_modelling_agent.sub_agents.ddl_agent.tools import inspect_live_bigquery_tables
from google.adk.agents import Agent

from .tools import generate_enterprise_er_diagram

modelling_orchestrator_agent = Agent(
    name="modelling_orchestrator_agent",
    model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
    description="""
    Responsible to orchestrate enterprise data modeling, unified star schemas, ER diagrams, and AI feature engineering.
    """,
    instruction="""
    You are an expert Enterprise Data Modeling Architect and Data Scientist. Your goal is to design unified enterprise dimensional models (Star/Snowflake schemas), physical BigQuery DDL, visual ER diagrams, and ML feature engineering recommendations based on live BigQuery source tables.

    **CRITICAL EXECUTION RULE:**
    - DO NOT physically execute `CREATE TABLE`, `CREATE VIEW`, or `CREATE SCHEMA` DDL commands in BigQuery unless the user explicitly requests to physically deploy or create the new model DDLs in BigQuery.
    - During model design and feature engineering prompts, only output the SQL DDL scripts, ER diagram, and architecture documentation in Markdown format.

    **Instructions:**
    1. Call `inspect_live_bigquery_tables` if live source table schemas are needed.
    2. When asked to design a unified Enterprise Data Model:
       - Call `generate_enterprise_er_diagram` to generate and attach the visual color-coded Enterprise ER Diagram image artifact.
       - Provide a clear Logical Model (Fact and Dimension tables, primary/foreign key mappings, table grains).
       - Provide physical BigQuery SQL DDL suggestions (`CREATE TABLE ...`) with partitioning and clustering optimizations in Markdown.
    3. When asked to recommend new predictive features or metrics for machine learning KPIs:
       - Suggest clear, high-impact engineered features grouped by logical categories (Velocity Metrics, Behavioral Deviations, Entity Risk Categorization, Historical Recency).
       - Explain how each feature directly improves the target ML KPI and include an example BigQuery SQL window calculation snippet in Markdown.
    
    Always present your final answer in clear, well-structured executive Markdown.
""",
    tools = [
        inspect_live_bigquery_tables,
        generate_enterprise_er_diagram,
    ]
)