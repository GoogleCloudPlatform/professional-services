import uuid
import logging
import os
import vertexai
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from google.cloud import firestore
from models.data_ingestion_models import DataIngestionConfig, FirestorePendingLRODocument
from vertexai import rag
from vertexai.rag.utils.resources import TransformationConfig, ChunkingConfig, LayoutParserConfig

router = APIRouter()
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("REGION")
CORPUS_NAME = os.getenv("CORPUS_NAME")
DATABASE_NAME = os.getenv("DATABASE_NAME")
GCS_IMPORT_RESULT_BUCKET = os.getenv("GCS_IMPORT_RESULT_BUCKET")
PENDING_LRO_COLLECTION_NAME = "pending_lro"

vertexai.init(project=PROJECT_ID, location=LOCATION)
db = firestore.Client(project=PROJECT_ID, database=DATABASE_NAME)

@router.post(path="/rag-engine")
async def trigger_data_ingestion_job(data: DataIngestionConfig):
  """Trigger an async data ingestion job by calling RAG Engine API
     and publish the LRO ID to FireStore.
     
  Args:
      data (DataIngestionConfig): Configuration for the data ingestion
      job.

  Returns:
      dict: A dictionary containing the status and result message.

  Raises:
      HTTPException: If an error occurs while triggering the data
      ingestion job.
  """
  try:
    logger.info("Triggering data ingestion job")

    file_name = uuid.uuid4()
    import_result_sink = f"{GCS_IMPORT_RESULT_BUCKET}/{file_name}.ndjson"
    # Returns google.api_core.operation_async.AsyncOperation object.
    # More Info: https://googleapis.dev/python/google-api-core/latest/operation.html#google.api_core.operation_async.AsyncOperation
    async_operation = await rag.import_files_async(
      corpus_name=CORPUS_NAME,
      paths=[data.data_source_path],
      transformation_config=TransformationConfig(
        chunking_config=ChunkingConfig(
          chunk_size=data.chunk_size,
          chunk_overlap=data.chunk_overlap,
        )
      ),
      parser=LayoutParserConfig(
        processor_name=data.layout_parser_processor.processor_name,
        max_parsing_requests_per_min=data.layout_parser_processor.max_parsing_requests_per_min
      ) if data.layout_parser_processor is not None else None,
      import_result_sink=import_result_sink
    )

    logger.info("Data ingestion job triggered successfully")
    logger.info("Adding LRO info to the firestore")

    lro_id = async_operation.operation.name
    document_data = FirestorePendingLRODocument(
      lro_id=lro_id,
      import_result_sink=import_result_sink,
      data_ingestion_config=data
    )
    db.collection(PENDING_LRO_COLLECTION_NAME).document(lro_id.replace('/', '_')).set(document_data.model_dump())

    logger.info("Successfully added LRO info to the firestore")    
    return JSONResponse(
      status_code=202,
      content="Initiated Data Ingestion job triggered successfully."
    )
  except Exception as e:
    logger.error(f"Error triggering data ingestion job: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))

