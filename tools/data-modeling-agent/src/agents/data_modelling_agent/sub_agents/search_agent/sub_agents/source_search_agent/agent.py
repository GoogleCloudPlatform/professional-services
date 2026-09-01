import os

from google.adk.agents import Agent
from google.adk.tools import VertexAiSearchTool

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "")
vertex_datastore_id = os.getenv("VERTEX_DATASTORE_ID", None)

tools_list = []
datastore_info = "No Vertex AI Datastore configured; use live BigQuery table inspection instead."
if vertex_datastore_id:
    DATASTORE_ID = f"projects/{project_id}/locations/global/collections/default_collection/dataStores/{vertex_datastore_id}"
    datastore_info = f"document store: {DATASTORE_ID}"
    tools_list.append(VertexAiSearchTool(data_store_id=DATASTORE_ID))

source_search_agent = Agent(
    name="vertex_source_search_agent",
    model="gemini-2.5-flash",
    instruction=f"""You are a helpful assistant that answers questions based on information found in {datastore_info}.
    You must follow below instructions:
    1. If VertexAiSearchTool is available, use it to find relevant information before answering.
    2. If no datastore tool is available or information is not found, advise the user to use live BigQuery inspection.
    3. You must return all available items from the datastore if found.
    """,
    description="Existing/Source schema search assistant with Vertex AI Search capabilities",
    tools=tools_list,
    output_key = "source_search_result",
)