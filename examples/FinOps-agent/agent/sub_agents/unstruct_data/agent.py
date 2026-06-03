import os
from google.adk.agents import LlmAgent
from .tools import acme_search_tool
from .prompt import UNSTRUCT_DATA_INSTRUCTION

unstruct_data_agent = LlmAgent(
    name="unstruct_data_agent",
    model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
    output_key="acme_policy_context", 
    tools=[acme_search_tool],
    instruction=UNSTRUCT_DATA_INSTRUCTION,
    description="Extracts ACME corporate AI and FinOps policies from unstructured documents."
)