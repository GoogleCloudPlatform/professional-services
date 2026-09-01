import os

from google.adk.agents import Agent

project_id=os.getenv("GOOGLE_CLOUD_PROJECT", None)
vertex_datastore_id = os.getenv("VERTEX_DATASTORE_ID", None)
# Configuration
DATASTORE_ID = f"projects/{project_id}/locations/global/collections/default_collection/dataStores/{vertex_datastore_id}"
print(DATASTORE_ID)

def get_dummy_response():
    return {"tables":"No tables created yet"}

target_search_agent = Agent(
    name="vertex_target_search_agent",
    model="gemini-2.5-flash",
    instruction=f"""You are a helpful assistant that answers questions based on information found in the document store: {DATASTORE_ID}.
    Use the search tool to find relevant information before answering.
    If the answer isn't in the documents, say that you couldn't find the information.
    """,
    description="Destination/Target schema search assistant with Vertex AI Search capabilities",
    # tools=[VertexAiSearchTool(data_store_id=DATASTORE_ID)]
    tools = [get_dummy_response]
)