import os
from google.adk.tools import VertexAiSearchTool

DATASTORE_ID = os.getenv("ACME_DATASTORE_ID") 

acme_search_tool = VertexAiSearchTool(data_store_id=DATASTORE_ID)