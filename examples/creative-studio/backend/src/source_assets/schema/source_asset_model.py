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
from enum import Enum
from typing import Optional

from pydantic import Field
from sqlalchemy import Integer, String, func, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.common.base_dto import AspectRatioEnum, MimeTypeEnum
from src.common.base_repository import BaseDocument
from src.database import Base


class AssetScopeEnum(str, Enum):
    """Defines who can access an asset."""

    PRIVATE = "private"  # Belongs to a single user
    SYSTEM = "system"  # Available to all users (e.g., VTO models)


class AssetTypeEnum(str, Enum):
    """Defines the purpose of an asset for easier filtering."""

    GENERIC_IMAGE = "generic_image"
    GENERIC_VIDEO = "generic_video"
    VTO_PRODUCT = "vto_product"
    VTO_PERSON_FEMALE = "vto_person_female"
    VTO_PERSON_MALE = "vto_person_male"
    VTO_TOP = "vto_top"
    VTO_BOTTOM = "vto_bottom"
    VTO_DRESS = "vto_dress"
    VTO_SHOE = "vto_shoe"


class SourceAsset(Base):
    """
    SQLAlchemy model for the 'source_assets' table.
    """
    __tablename__ = "source_assets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # workspace_id should ideally be a ForeignKey, but for now we keep it as int/str
    # We'll use int since Workspace uses int ID.
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    gcs_uri: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[MimeTypeEnum] = mapped_column(String, nullable=False)
    aspect_ratio: Mapped[AspectRatioEnum] = mapped_column(String, default=AspectRatioEnum.RATIO_1_1.value)
    file_hash: Mapped[str] = mapped_column(String, nullable=False)
    scope: Mapped[AssetScopeEnum] = mapped_column(String, default=AssetScopeEnum.PRIVATE.value)
    asset_type: Mapped[AssetTypeEnum] = mapped_column(String, default=AssetTypeEnum.GENERIC_IMAGE.value)
    thumbnail_gcs_uri: Mapped[Optional[str]] = mapped_column(String, nullable=True)

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


class SourceAssetModel(BaseDocument):
    """
    Represents any uploaded asset, from a user's photo to a system-wide VTO model.
    It MUST belong to a workspace.
    Its visibility is controlled by its 'scope'.
    """
    
    id: Optional[int] = None

    workspace_id: int = Field(
        description="Foreign key (ID) to the 'workspaces' collection."
    )
    user_id: int = Field(
        description="User ID of the person who uploaded this specific file."
    )
    gcs_uri: str
    original_filename: str
    mime_type: MimeTypeEnum
    aspect_ratio: AspectRatioEnum = AspectRatioEnum.RATIO_1_1
    file_hash: str  # SHA-256 hash of the original file for de-duplication
    scope: AssetScopeEnum = AssetScopeEnum.PRIVATE
    asset_type: AssetTypeEnum = AssetTypeEnum.GENERIC_IMAGE
    thumbnail_gcs_uri: Optional[str] = None  # In case of uploading a video
