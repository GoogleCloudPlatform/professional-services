# Copyright 2025 Google LLC
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

import datetime
from typing import List, Optional

from pydantic import Field
from sqlalchemy import Integer, String, func, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from src.common.base_repository import BaseDocument
from src.common.schema.media_item_model import JobStatusEnum
from src.database import Base


class BrandGuideline(Base):
    """
    SQLAlchemy model for the 'brand_guidelines' table.
    """
    __tablename__ = "brand_guidelines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[JobStatusEnum] = mapped_column(String, default=JobStatusEnum.PROCESSING.value)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # workspace_id is Optional because it can be global (None)
    workspace_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workspaces.id"), nullable=True)
    
    source_pdf_gcs_uris: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    color_palette: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    
    logo_asset_id: Mapped[Optional[int]] = mapped_column(ForeignKey("source_assets.id"), nullable=True)
    guideline_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    tone_of_voice_summary: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    visual_style_summary: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        onupdate=func.now(),
        server_default=func.now()
    )


class BrandGuidelineModel(BaseDocument):
    """
    COLLECTION: brand_guidelines
    Stores structured brand kits, either linked to a workspace or as a global default.
    Data is populated by an admin OR via AI-powered extraction from an uploaded PDF.
    """
    
    id: Optional[int] = None

    name: str
    status: JobStatusEnum = JobStatusEnum.PROCESSING
    error_message: Optional[str] = None

    workspace_id: Optional[int] = Field(
        default=None,
        description="If set, this guideline is linked to a single workspace. If null, it's global.",
    )

    # --- Source File (The user's input) ---
    source_pdf_gcs_uris: List[str] = Field(
        default_factory=list,
        description="The GCS paths to the original PDF or its generated chunks.",
    )

    # --- AI-Extracted & Manually-Entered Fields ---
    color_palette: List[str] = Field(
        default_factory=list,
        description="List of hex color codes (e.g., '#FFFFFF') extracted from the PDF or entered manually.",
    )

    # TODO: We should be able to add the logo and then how it looks
    # logo_description: Optional[str]
    logo_asset_id: Optional[int] = Field(
        default=None,
        description="The ID of a document in the 'user_assets' collection to be used as the logo.",
    )

    guideline_text: Optional[str] = Field(
        default=None,
        description="This is the full raw text extracted from the PDF, for reference.",
    )

    # --- THESE ARE THE NEW, "SMART" FIELDS ---
    tone_of_voice_summary: Optional[str] = Field(
        default=None,
        description="An AI-generated summary of brand voice, used to prefix text-generation prompts.",
    )

    visual_style_summary: Optional[str] = Field(
        default=None,
        description="An AI-generated summary of visual style, used to prefix image-generation prompts.",
    )
