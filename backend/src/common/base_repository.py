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
import uuid
from typing import Any, Dict, Generic, List, Optional, TypeVar

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from src.auth import firebase_client_service


class BaseDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )

    # Pydantic v2 configuration for this sub-model
    model_config = ConfigDict(
        use_enum_values=True,  # Allows passing enum members like StyleEnum.MODERN
        extra="ignore",  # Prevents accidental extra fields
        populate_by_name=True,
        from_attributes=True,
        alias_generator=to_camel,
    )


# Use this new base document as the bound for your generic type.
T = TypeVar("T", bound=BaseDocument)


class BaseRepository(Generic[T]):
    """
    A generic repository for common Firestore operations.
    """

    def __init__(self, collection_name: str, model: type[T]):
        self.db: firestore.Client = firebase_client_service.firestore_db
        self.collection_ref = self.db.collection(collection_name)
        self.model = model

    def get_by_id(self, item_id: str) -> Optional[T]:
        """Retrieves a single document by its ID."""
        doc_ref = self.collection_ref.document(item_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        return self.model.model_validate({**data, "id": doc.id})  # type: ignore

    def save(self, item: T) -> str:
        """
        Saves a Pydantic model document to Firestore, automatically
        updating the 'updatedAt' timestamp.
        """
        # Before saving, update the timestamp.
        # This ensures it's always current on every write operation.
        item.updated_at = datetime.datetime.now(datetime.timezone.utc)

        doc_ref = self.collection_ref.document(item.id)
        # Use .model_dump() for Pydantic v2
        doc_ref.set(item.model_dump(exclude_none=True))
        return item.id

    def update(self, item_id: str, update_data: Dict[str, Any]) -> Optional[T]:
        """
        Performs a partial update on a document, automatically updating the timestamp.

        Args:
            item_id: The ID of the document to update.
            update_data: A dictionary of fields to change.

        Returns:
            The updated model instance, or None if not found.
        """
        # 1. Automatically add/update the 'updated_at' timestamp to the update payload.
        update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc)

        doc_ref = self.collection_ref.document(item_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        # 2. Perform the partial update.
        doc_ref.update(update_data)

        # 3. Return the full, updated document.
        return self.get_by_id(item_id)

    def delete(self, item_id: str) -> bool:
        """
        Deletes a document by its ID.
        Returns True if deletion was successful, False otherwise.
        """
        doc_ref = self.collection_ref.document(item_id)
        if not doc_ref.get().exists:
            return False

        doc_ref.delete()
        return True

    def find_by_filter(self, filter_condition: FieldFilter) -> List[T]:
        """
        Finds documents based on a single FieldFilter condition.

        Args:
            filter_condition: A Firestore FieldFilter object.

        Returns:
            A list of model instances matching the filter.
        """
        query = self.collection_ref.where(filter=filter_condition)
        docs = query.stream()
        return [
            self.model.model_validate({**doc.to_dict(), "id": doc.id})
            for doc in docs
        ]
