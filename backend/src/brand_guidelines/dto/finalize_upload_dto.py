from typing import Optional

from pydantic import BaseModel, Field


class FinalizeUploadDto(BaseModel):
    """Request body to finalize an upload and start processing."""
    name: str = Field(min_length=3, max_length=100, description="The name for the new brand guideline.")
    workspace_id: Optional[int] = Field(None, description="The ID of the workspace to associate the guideline with.")
    gcs_uri: str = Field(description="The GCS URI of the successfully uploaded PDF file.")
    original_filename: str = Field(description="The original name of the uploaded file.")
