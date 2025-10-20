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

from src.brand_guidelines.dto.brand_guideline_search_dto import (
    BrandGuidelineSearchDto,
)
from src.brand_guidelines.schema.brand_guideline_model import (
    BrandGuidelineModel,
)
from src.common.base_repository import BaseRepository
from src.common.dto.pagination_response_dto import PaginationResponseDto


class BrandGuidelineRepository(BaseRepository[BrandGuidelineModel]):
    """
    Repository for all database operations related to the 'brand_guidelines' collection.
    """

    def __init__(self):
        """Initializes the repository with the 'brand_guidelines' collection."""
        super().__init__(
            collection_name="brand_guidelines", model=BrandGuidelineModel
        )

    def query(
        self,
        search_dto: BrandGuidelineSearchDto,
        extra_filters: Optional[List[FieldFilter]] = None,
    ) -> PaginationResponseDto[BrandGuidelineModel]:
        """
        Performs a generic, paginated query on the brand_guidelines collection.
        """
        base_query = self.collection_ref
        extra_filters = extra_filters or []

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

        documents = list(data_query.stream())
        guideline_data = [
            self.model.model_validate(doc.to_dict()) for doc in documents
        ]

        next_page_cursor = None
        if len(documents) == search_dto.limit:
            next_page_cursor = documents[-1].id

        return PaginationResponseDto[BrandGuidelineModel](
            count=total_count,
            next_page_cursor=next_page_cursor,
            data=guideline_data,
        )
