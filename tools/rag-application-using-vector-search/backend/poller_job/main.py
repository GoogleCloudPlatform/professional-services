import logging
import os
from google.cloud import firestore
from google.cloud.aiplatform_v1beta1 import VertexRagServiceClient
from google.cloud.aiplatform_v1.types import ImportRagFilesResponse, ImportRagFilesOperationMetadata
from google.longrunning.operations_pb2 import GetOperationRequest  # type: ignore
from google.api_core.client_options import ClientOptions
from google.protobuf import text_format

logger = logging.getLogger(__name__)

DATABASE_NAME = os.getenv("DATABASE_NAME")
REGION = os.getenv("REGION")
PROJECT_ID = os.getenv("PROJECT_ID")

db = firestore.Client(project=PROJECT_ID, database=DATABASE_NAME)

def main():
  opts = ClientOptions(api_endpoint=f"{REGION}-aiplatform.googleapis.com")
  client = VertexRagServiceClient(client_options=opts)
  
  remove_from_pending_lro = []
  failed_lros = []
  successful_lros = []
  pending_lros = db.collection("pending_lro").stream() 
  
  # Check the status for the pending LROs.
  for doc in pending_lros:
    content = doc.to_dict()
    request = GetOperationRequest(name=content["lro_id"])
    operation = client.get_operation(request=request)
    if operation.done:
      add_to_failed_lro = False
      remove_from_pending_lro.append(doc.id)
      if operation.HasField("error"):
        add_to_failed_lro = True
        content["error"] = text_format.MessageToString(operation.error)
      if operation.HasField("response"):
        rag_response = ImportRagFilesResponse.deserialize(operation.response.value)
        content["response"] = ImportRagFilesResponse.to_dict(rag_response)
        if rag_response.failed_rag_files_count > 0:
          add_to_failed_lro = True
      if operation.HasField("metadata"):
        rag_operation_metadata = ImportRagFilesOperationMetadata.deserialize(operation.metadata.value)
        content["metadata"] = ImportRagFilesOperationMetadata.to_dict(rag_operation_metadata)
      if add_to_failed_lro:
        failed_lros.append((doc.id, content))
      else:
        successful_lros.append((doc.id, content))
        
    
  # Delete LROs which are done.
  for lro_id in remove_from_pending_lro:
    db.collection("pending_lro").document(lro_id).delete()
  
  # Adding failed LROs to 'failed_lro' collection.
  for lro_id, content in failed_lros:
    db.collection("failed_lro").document(lro_id).set(content)
  
  # Adding successful LROs to 'successfule_lro' collection.
  for lro_id, content in successful_lros:
    db.collection("successful_lro").document(lro_id).set(content)

if __name__ == "__main__":
  try:
    main()
  except Exception as err:
    logger.error(f"Polling job failed with error: {str(err)}")
    raise err