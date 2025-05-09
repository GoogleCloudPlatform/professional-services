from typing import Optional
from pydantic import BaseModel

class LayoutParser(BaseModel):
  """Pydantic model for Layout Parser Config.

  Attributes:
    processor_name (Optional[str]):
      The full resource name of a Document AI processor or processor
      version. The processor must have type `LAYOUT_PARSER_PROCESSOR`.
      Format:
      -  `projects/{project_id}/locations/{location}/processors/{processor_id}`
      -  `projects/{project_id}/locations/{location}/processors/{processor_id}/processorVersions/{processor_version_id}`
    max_parsing_requests_per_min (int):
      The maximum number of requests the job is allowed to make to the
      Document AI processor per minute. Consult
      https://cloud.google.com/document-ai/quotas and the Quota page for
      your project to set an appropriate value here. If unspecified, a
      default value of 120 QPM will be used.
        
  """
  processor_name: str
  max_parsing_requests_per_min: Optional[int] = None

class DataIngestionConfig(BaseModel):
  """Pydantic model for Data Ingestion Config.

  Attributes:
    data_source_path (str):
      Uri of a Google Cloud Storage directory ("gs://my-bucket/my_dir").
    chunk_size (int):
      The size of each chunk.
    chunk_overlap (int):
      The size of overlap between chunks.
    layout_parser_processor (Optional[LayoutParserConfig])
      Configuration for the Document AI Layout Parser Processor. 
  """
  data_source_path: str
  chunk_size: int
  chunk_overlap: int
  layout_parser_processor: Optional[LayoutParser] = None
    
class FirestorePendingLRODocument(BaseModel):
  lro_id: str
  import_result_sink: str
  data_ingestion_config: DataIngestionConfig