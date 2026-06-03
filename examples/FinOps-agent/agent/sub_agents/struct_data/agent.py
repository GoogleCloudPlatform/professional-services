import os
import logging
from google.adk.agents import LlmAgent as Agent
from google.genai import types

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