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

from typing import List, Optional

from google.cloud import firestore
from google.cloud.firestore_v1.base_aggregation import AggregationResult
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1.query_results import QueryResultsList

from src.common.base_repository import BaseRepository
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.common.schema.media_item_model import MediaItemModel
from src.galleries.dto.gallery_search_dto import GallerySearchDto


class MediaRepository(BaseRepository[MediaItemModel]):
    """Handles database operations for MediaItem objects in Firestore."""

    def __init__(self):
        # Call the parent __init__ with the collection name and Pydantic model
        super().__init__(collection_name="media_library", model=MediaItemModel)

    def query(
        self,
        search_dto: GallerySearchDto,
        extra_filters: Optional[List[FieldFilter]] = None,
    ) -> PaginationResponseDto[MediaItemModel]:
        """
        Performs a generic, paginated query on the media_library collection.
        """
        base_query = self.collection_ref
        extra_filters = extra_filters or []

        if search_dto.user_email:
            base_query = base_query.where(
                "user_email", "==", search_dto.user_email
            )
        if search_dto.mime_type:
            base_query = base_query.where(
                "mime_type", "==", search_dto.mime_type
            )
        if search_dto.model:
            base_query = base_query.where("model", "==", search_dto.model)
        if search_dto.status:
            base_query = base_query.where("status", "==", search_dto.status)

        # Apply any additional filters passed in
        for f in extra_filters:
            base_query = base_query.where(filter=f)

        count_query = base_query.count(alias="total")
        aggregation_result = count_query.get()

        total_count = 0
        if (
            isinstance(aggregation_result, QueryResultsList)
            and aggregation_result
            and isinstance(aggregation_result[0][0], AggregationResult)  # type: ignore
        ):
            total_count = int(aggregation_result[0][0].value)  # type: ignore

        data_query = base_query.order_by(
            "created_at", direction=firestore.Query.DESCENDING
        )

        if search_dto.start_after:
            last_doc_snapshot = self.collection_ref.document(
                search_dto.start_after
            ).get()
            if last_doc_snapshot.exists:
                data_query = data_query.start_after(last_doc_snapshot)

        data_query = data_query.limit(search_dto.limit)

        # Stream results and validate with the Pydantic model
        documents = list(data_query.stream())
        media_item_data = [
            self.model.model_validate(doc.to_dict()) for doc in documents
        ]

        next_page_cursor = None
        if len(documents) == search_dto.limit:
            # The cursor is the ID of the last document fetched.
            next_page_cursor = documents[-1].id

        return PaginationResponseDto[MediaItemModel](
            count=total_count,
            next_page_cursor=next_page_cursor,
            data=media_item_data,
        )
