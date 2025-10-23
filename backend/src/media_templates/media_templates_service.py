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

import asyncio
from typing import Optional

from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.media_templates.dto.media_template_response_dto import (
    MediaTemplateResponse,
)
from src.common.base_dto import MimeTypeEnum
from src.media_templates.dto.create_prompt_template_dto import (
    CreatePromptTemplateDto,
)
from src.images.repository.media_item_repository import MediaRepository
from src.media_templates.repository.media_template_repository import (
    MediaTemplateRepository,
)
from src.media_templates.schema.media_template_model import (
    MediaTemplateModel,
    GenerationParameters,
)
from src.media_templates.dto.template_search_dto import TemplateSearchDto
from src.media_templates.dto.update_template_dto import UpdateTemplateDto

# We need Gemini to auto-generate names and descriptions
from src.multimodal.gemini_service import (
    GeminiService,
    PromptTargetEnum,
    ResponseMimeTypeEnum,
)


class MediaTemplateService:
    """Handles the business logic for managing media templates."""

    def __init__(self):
        # Dependency Injection for repositories and other services
        self.template_repo = MediaTemplateRepository()
        self.media_item_repo = MediaRepository()
        self.gemini_service = GeminiService()
        self.iam_signer_credentials = IamSignerCredentials()

    async def _create_media_template_response(
        self, item: MediaTemplateModel
    ) -> MediaTemplateResponse:
        """
        Helper function to convert a MediaItem into a GalleryItemResponse
        by generating presigned URLs in parallel for its GCS URIs.
        """
        all_gcs_uris = item.gcs_uris or []

        # Create a list of tasks to run the synchronous URL generation in parallel threads
        tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in all_gcs_uris
            if uri
        ]

        # Await all URL generation tasks to complete concurrently
        presigned_urls = await asyncio.gather(*tasks)

        thumbnail_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in (item.thumbnail_uris or "")
            if uri
        ]
        presigned_thumbnail_urls = await asyncio.gather(*thumbnail_tasks)

        # Create the response DTO, copying all original data and adding the new URLs
        return MediaTemplateResponse(
            **item.model_dump(),
            presigned_urls=presigned_urls,
            presigned_thumbnail_urls=presigned_thumbnail_urls,
        )

    def get_template_by_id(
        self, template_id: str
    ) -> Optional[MediaTemplateModel]:
        """Fetches a single template by its ID."""
        return self.template_repo.get_by_id(template_id)

    async def find_all_templates(
        self, search_dto: TemplateSearchDto
    ) -> PaginationResponseDto[MediaTemplateResponse]:
        """Finds all templates with optional filtering and pagination."""
        # Run the synchronous database query in a separate thread
        media_templates_query = await asyncio.to_thread(
            self.template_repo.query, search_dto
        )
        media_templates = media_templates_query.data or []

        # Convert each MediaItem to a GalleryItemResponse in parallel
        response_tasks = [
            self._create_media_template_response(item)
            for item in media_templates
        ]
        enriched_items = await asyncio.gather(*response_tasks)

        return PaginationResponseDto[MediaTemplateResponse](
            count=media_templates_query.count,
            next_page_cursor=media_templates_query.next_page_cursor,
            data=enriched_items,
        )

    def delete_template(self, template_id: str) -> bool:
        """Deletes a template by its ID. (Admin only)"""
        return self.template_repo.delete(template_id)

    def update_template(
        self, template_id: str, update_dto: UpdateTemplateDto
    ) -> Optional[MediaTemplateModel]:
        """Updates a template's information. (Admin only)"""
        # model_dump with exclude_unset=True creates a dict with only the provided fields
        update_data = update_dto.model_dump(exclude_unset=True)
        if not update_data:
            return self.template_repo.get_by_id(
                template_id
            )  # Nothing to update

        return self.template_repo.update(template_id, update_data)

    def create_template_from_media_item(
        self, media_item_id: str
    ) -> Optional[MediaTemplateModel]:
        """
        Creates a new MediaTemplate by copying properties from an existing MediaItem
        and using Gemini to generate a creative name and description. (Admin only)
        """
        media_item = self.media_item_repo.get_by_id(media_item_id)
        if not media_item:
            return None  # MediaItem not found

        # --- Use Gemini to generate a name and description ---
        prompt_for_gemini = f"""
          Based on the following creative prompt, generate a short, catchy 'Name', a one-sentence 'Description',
          generate a relevant industry, a fictional but plausible brand name, and a list of 5-7 relevant tags
          for a new template. The original prompt is: '{media_item.prompt}'.\n
        """
        target_type = (
            PromptTargetEnum.VIDEO
            if media_item.mime_type == MimeTypeEnum.VIDEO_MP4
            else PromptTargetEnum.IMAGE
        )

        generated_text = self.gemini_service.generate_structured_prompt(
            original_prompt="",
            target_type=target_type,
            prompt_template=prompt_for_gemini,
            response_mime_type=ResponseMimeTypeEnum.JSON,
            response_schema=CreatePromptTemplateDto,
        )
        metadata = CreatePromptTemplateDto.model_validate_json(generated_text)

        # Create the new template by mapping fields
        new_template = MediaTemplateModel(
            name=metadata.name,
            description=metadata.description,
            mime_type=media_item.mime_type,
            industry=metadata.industry,
            brand=metadata.brand,
            tags=metadata.tags or [],
            gcs_uris=media_item.gcs_uris,
            thumbnail_uris=media_item.thumbnail_uris,
            generation_parameters=GenerationParameters(
                prompt=media_item.original_prompt,
                model=media_item.model,
                aspect_ratio=media_item.aspect_ratio,
                style=media_item.style,
                lighting=media_item.lighting,
                color_and_tone=media_item.color_and_tone,
                composition=media_item.composition,
                negative_prompt=media_item.negative_prompt,
            ),
        )

        self.template_repo.save(new_template)
        return new_template
