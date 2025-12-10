# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may
# obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
from enum import Enum
from typing import Any, Dict, List, Optional, Type, Union

from fastapi import Depends

from google.genai import Client, types
from pydantic import BaseModel, Field
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.brand_guidelines.dto.brand_guideline_search_dto import (
    BrandGuidelineSearchDto,
)
from src.brand_guidelines.repository.brand_guideline_repository import (
    BrandGuidelineRepository,
)
from src.brand_guidelines.schema.brand_guideline_model import (
    BrandGuidelineModel,
)
from src.common.base_dto import GenerationModelEnum
from src.config.config_service import config_service
from src.images.dto.create_imagen_dto import CreateImagenDto
from src.multimodal.dto.create_prompt_imagen_dto import CreatePromptImageDto
from src.multimodal.dto.create_prompt_video_dto import CreatePromptVideoDto
from src.multimodal.rewriters import (
    RANDOM_IMAGE_PROMPT_TEMPLATE,
    RANDOM_VIDEO_PROMPT_TEMPLATE,
    REWRITE_IMAGE_JSON_PROMPT_TEMPLATE,
    REWRITE_IMAGE_TEXT_PROMPT_TEMPLATE,
    REWRITE_VIDEO_JSON_PROMPT_TEMPLATE,
    REWRITE_VIDEO_TEXT_PROMPT_TEMPLATE,
)
from src.multimodal.schema.gemini_model_setup import GeminiModelSetup
from src.videos.dto.create_veo_dto import CreateVeoDto

logger = logging.getLogger(__name__)


class PromptTargetEnum(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class ResponseMimeTypeEnum(str, Enum):
    JSON = "application/json"
    TEXT = "text/plain"


class GeminiService:
    """
    A dedicated service for interactions with Google's Gemini models.
    Handles client initialization, prompt rewriting, and error handling.
    """

    def __init__(self, brand_guideline_repo: BrandGuidelineRepository = Depends()):
        """Initializes the Gemini client and configuration."""
        self.client: Client = GeminiModelSetup.init()
        self.cfg = config_service
        self.rewriter_model = self.cfg.GEMINI_MODEL_ID
        self.brand_guideline_repo = brand_guideline_repo

    def _get_response_schema(self, target: PromptTargetEnum) -> Type[BaseModel]:
        """Dynamically gets the Pydantic schema based on the target type."""
        if target is PromptTargetEnum.IMAGE:
            return CreatePromptImageDto
        if target is PromptTargetEnum.VIDEO:
            return CreatePromptVideoDto
        raise ValueError(f"No response schema defined for target: {target}")

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_structured_prompt(
        self,
        original_prompt: str,
        target_type: PromptTargetEnum,
        prompt_template: str,
        response_mime_type: ResponseMimeTypeEnum = ResponseMimeTypeEnum.JSON,
        response_schema: Type[BaseModel] | None = None,
    ) -> str:
        """
        Rewrites a user prompt using Gemini into a structured JSON format.

        Args:
            original_prompt: The initial, unstructured prompt from the user.
            target_type: The target output type (IMAGE or VIDEO).
            prompt_template: The instruction template for the Gemini model.

        Returns:
            A dictionary parsed from Gemini's JSON response.
        """
        full_prompt = f"{prompt_template} {original_prompt}"
        response_schema = response_schema or self._get_response_schema(
            target_type
        )

        try:
            response = None
            if response_mime_type.value == ResponseMimeTypeEnum.JSON.value:
                response = self.client.models.generate_content(
                    model=self.rewriter_model,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type=response_mime_type.value,
                        response_schema=response_schema,
                    ),
                )
            elif response_mime_type.value == ResponseMimeTypeEnum.TEXT.value:
                response = self.client.models.generate_content(
                    model=self.rewriter_model,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type=response_mime_type.value
                    ),
                )
            else:
                return ""

            return response.text or ""
        except Exception as e:
            logger.error(
                f"Failed to generate structured prompt for '{original_prompt}': {e}"
            )
            raise

    def generate_random_or_rewrite_prompt(
        self, target_type: PromptTargetEnum, original_prompt: str = ""
    ) -> str:
        """Generates a completely new, random, and creative text prompt."""
        try:
            prompt_template = RANDOM_IMAGE_PROMPT_TEMPLATE

            if not original_prompt:
                prompt_template = (
                    RANDOM_IMAGE_PROMPT_TEMPLATE
                    if target_type.value == PromptTargetEnum.IMAGE
                    else RANDOM_VIDEO_PROMPT_TEMPLATE
                )
            else:
                prompt_template = (
                    REWRITE_IMAGE_TEXT_PROMPT_TEMPLATE
                    if target_type.value == PromptTargetEnum.IMAGE
                    else REWRITE_VIDEO_TEXT_PROMPT_TEMPLATE
                )
            response = self.generate_structured_prompt(
                original_prompt=original_prompt,
                target_type=target_type,
                prompt_template=prompt_template,
                response_mime_type=ResponseMimeTypeEnum.TEXT,
            )
            return response
        except Exception as e:
            logger.error(f"Failed to generate random prompt: {e}")
            raise

    def _convert_dto_to_string(self, dto: BaseModel) -> str:
        """
        Private helper to convert a DTO into a formatted string for prompting.
        This consolidates the repetitive logic from the original file.
        """
        # Use model_dump_json and then reload it to ensure all values, especially
        # enums, are converted to their primitive string/number/etc. values
        # instead of their Python object representation.
        json_string = dto.model_dump_json(exclude_unset=True)
        fields = json.loads(json_string)

        # Ensure style parameters are included as empty strings if not provided
        for param in ["style", "color_and_tone", "lighting", "composition"]:
            if param not in fields:
                fields[param] = ""

        # The main 'prompt' field is the base, others are attributes
        prompt_base = fields.pop("prompt", "")

        attributes = [prompt_base]
        for key, value in fields.items():
            if value:  # Ensure value is not None or empty
                formatted_key = key.replace("_", " ").title()
                attributes.append(f"- {formatted_key}: {value}")
        return "\n".join(filter(None, attributes))

    async def enhance_prompt_from_dto(
        self,
        dto: Union[CreateImagenDto, CreateVeoDto],
        target_type: PromptTargetEnum,
        response_mime_type: ResponseMimeTypeEnum = ResponseMimeTypeEnum.JSON,
    ) -> str:
        """
        Enhances a partially filled DTO by converting it to a string,
        then asking Gemini to generate a complete, structured prompt.

        This single method replaces the four repetitive `rewrite_for_*` methods.

        Args:
            dto: The input DTO, which can be for an image or video.
            target_type: The target output type (IMAGE or VIDEO).

        Returns:
            A dictionary containing the complete, structured prompt data from Gemini.
        """
        if target_type not in [PromptTargetEnum.IMAGE, PromptTargetEnum.VIDEO]:
            raise ValueError("Invalid target_type. Must be IMAGE or VIDEO.")

        # --- Prompt Enhancement for Gemini Image-to-Image ---
        # This logic is placed here to ensure that any call to enhance a prompt
        # for Gemini Flash i2i will automatically include these critical
        # instructions, making the behavior consistent across the application.
        is_gemini_i2i = (
            isinstance(dto, CreateImagenDto)
            and dto.generation_model
            in [
                GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
                GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW,
            ]
            and (dto.source_asset_ids or dto.source_media_items)
        )

        if is_gemini_i2i:
            dto.prompt = (
                "**Objective:** Perform a targeted edit on the source image based on the user's request.\n"
                "**Guiding Principle:** Your primary goal is to follow the user's instructions precisely. Preserve all aspects of the original image (subject identity, background, lighting, composition) unless the user's request explicitly requires a change.\n\n"
                "**Execution Flow:** Analyze the user's request and match it to one of the following scenarios. If no scenario fits perfectly, use the 'General Instruction' as a fallback.\n\n"
                "--- Scenarios ---\n\n"
                "**1. Garment/Accessory Edit** (e.g., 'change the shirt to blue', 'add sunglasses')\n"
                "   - **Action:** Isolate and modify only the specified clothing or accessory item.\n"
                "   - **Constraint:** You **MUST NOT** change the subject's identity, face, pose, or the background.\n\n"
                "**2. Background Replacement** (e.g., 'change the background to a beach', 'put them in Paris')\n"
                "   - **Action:** Replace the entire background with the new scene described.\n"
                "   - **Constraint:** You **MUST** preserve the foreground subject's identity, pose, and clothing. Adjust lighting on the subject only as needed to blend them realistically into the new background.\n\n"
                "**3. Pose Adjustment** (e.g., 'make them wave', 'change the pose to sitting')\n"
                "   - **Action:** Adjust the subject's body to the new pose.\n"
                "   - **Constraint:** You **MUST** preserve the subject's identity, clothing, and the background environment.\n\n"
                "**4. Outpainting / Zoom Out** (e.g., 'zoom out', 'show more of the scene', 'make it a wide-angle shot')\n"
                "   - **Action:** Extend the image outwards by generating new content that seamlessly matches the existing style (outpainting).\n"
                "   - **Default:** If the user just says 'zoom out', interpret it as 'zoom out by at least 2x'. If they specify a different amount, follow their instruction.\n\n"
                "**5. General Instruction (Fallback):**\n"
                "   - **Action:** If the request does not fit the scenarios above, follow the user's instructions as literally as possible.\n"
                "   - **Constraint:** Make the minimum necessary changes to fulfill the request, preserving as much of the original image as you can.\n\n"
                "--- End of Scenarios ---\n\n"
                f"**User's Request:** {dto.prompt}"
            )

            # For Gemini image-to-image, we do NOT want to rewrite the prompt into a
            # complex JSON structure. The detailed instructions above are designed to
            # be sent directly to the model to ensure it makes minimal, targeted
            # changes. Bypassing the structured prompt generation prevents the model
            # from deforming or completely changing the original image.
            # We also set the response mime type to TEXT to reflect this.
            return dto.prompt

        # --- Prepend Brand Guidelines if available ---
        if dto.use_brand_guidelines and dto.workspace_id and not is_gemini_i2i:
            search_dto = BrandGuidelineSearchDto(
                workspace_id=dto.workspace_id, limit=1
            )
            guideline_response = await self.brand_guideline_repo.query(
                search_dto, workspace_id=dto.workspace_id
            )

            if guideline_response and guideline_response.data:
                guideline = guideline_response.data[0]
                # Construct a prefix to guide the prompt rewriter.
                prefix_parts = [
                    "Based on the following brand guidelines, enhance the user's prompt."
                ]
                if guideline.visual_style_summary:
                    prefix_parts.append(
                        f"**Visual Style:** {guideline.visual_style_summary}"
                    )
                if guideline.tone_of_voice_summary:
                    prefix_parts.append(
                        f"**Tone of Voice:** {guideline.tone_of_voice_summary}"
                    )
                prefix_parts.append("\n---")
                brand_guideline_prefix = "\n".join(prefix_parts) + "\n\n"
                dto.prompt = brand_guideline_prefix + dto.prompt
            else:
                logger.info(
                    f"No brand guidelines found for workspace '{dto.workspace_id}'."
                )

        prompt_template = (
            REWRITE_IMAGE_JSON_PROMPT_TEMPLATE
            if target_type == PromptTargetEnum.IMAGE
            else REWRITE_VIDEO_JSON_PROMPT_TEMPLATE
        )
        prompt_string = self._convert_dto_to_string(dto)

        return self.generate_structured_prompt(
            original_prompt=prompt_string,
            target_type=target_type,
            prompt_template=prompt_template,
            response_mime_type=response_mime_type,
        )

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def generate_text(self, prompt: str, model_id: Optional[str] = None) -> str:
        """
        Generates plain text from a given prompt using a Gemini model.

        This is a general-purpose method for simple text-in, text-out interactions.

        Args:
            prompt: The text prompt to send to the model.
            model_id: Optional. The specific Gemini model ID to use, overriding the service default.

        Returns:
            A string containing the generated text from the model.

        Raises:
            Exception: Propagates exceptions from the API call after retries.
        """
        # Use the provided model_id or fall back to the service's default rewriter model
        target_model = model_id or self.rewriter_model

        logger.info(f"Sending text generation request to model: {target_model}")
        try:
            response = self.client.models.generate_content(
                model=target_model,
                contents=prompt,
                # Configure for a simple text response without a schema
                config=types.GenerateContentConfig(
                    response_mime_type="text/plain"
                ),
            )
            logger.info("Successfully received text response from Gemini.")
            # Strip any leading/trailing whitespace from the response
            return response.text.strip() if response.text else ""
        except Exception as e:
            # Log the error with part of the prompt for context
            logger.error(
                f"Gemini text generation failed for prompt '{prompt[:100]}...': {e}"
            )
            raise

    def extract_brand_info_from_pdf(self, pdf_gcs_uri: str) -> Dict[str, Any]:
        """
        Uses a multimodal model to analyze a PDF from GCS and extract structured
        brand guideline information.

        Args:
            pdf_gcs_uri: The full GCS URI (gs://bucket/path/to/file.pdf) of the PDF.

        Returns:
            A dictionary containing the extracted brand information.
        """
        logger.info(f"Starting brand info extraction for PDF: {pdf_gcs_uri}")

        pdf_file = types.Part.from_uri(
            file_uri=pdf_gcs_uri, mime_type="application/pdf"
        )

        # This structured prompt instructs the model to return a JSON object,
        # making the output easy to parse and use.
        prompt = """
        Analyze the provided brand guidelines PDF and extract the following information into a structured JSON object:
        1.  "colorPalette": A list of the primary brand colors as hex codes (e.g., ["#RRGGBB", ...]).
        2.  "toneOfVoiceSummary": A detailed and comprehensive summary of the brand's tone of voice, approximately 200-250 words, formatted in Markdown. This summary should be suitable for use as a prefix in a text generation prompt, capturing nuances like personality, vocabulary, and attitude.
        3.  "visualStyleSummary": A detailed and comprehensive summary of the brand's visual style, aesthetics, and imagery, approximately 5000-6000 words, formatted in Markdown. This summary should be suitable for use as a prefix in an image generation prompt, covering aspects like photography style, graphic elements, and overall mood.

        Your response MUST be a single, valid JSON object and nothing else.
        """

        try:
            response = self.client.models.generate_content(
                model=self.cfg.GEMINI_MODEL_ID,
                contents=[pdf_file, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BrandGuidelineModel,
                ),
            )

            # The model is configured to return JSON, so we can parse it directly.
            extracted_data = json.loads(response.text or "{}")
            return extracted_data
        except Exception as e:
            logger.error(
                f"Failed to extract brand info from PDF {pdf_gcs_uri}: {e}"
            )
            return {}

    def aggregate_brand_info(
        self, partial_results: List[Dict[str, Any]]
    ) -> Optional[BrandGuidelineModel]:
        """
        Aggregates multiple partial brand info extractions into a single,
        consolidated result using Gemini.

        Args:
            partial_results: A list of dictionaries, where each is a partial extraction
                             from a PDF chunk, filtered to remove None values.

        Returns:
            A BrandGuidelineModel object with the combined information, or None on failure.
        """
        if not partial_results:
            return None
        if len(partial_results) == 1:
            return BrandGuidelineModel(**partial_results[0])

        logger.info(
            f"Aggregating {len(partial_results)} partial brand info results."
        )

        # --- Step 1: Deterministic Aggregation in Python ---
        # Combine color palettes and get unique hex codes, case-insensitively.
        all_colors = set()
        for result in partial_results:
            if "colorPalette" in result and result["colorPalette"]:
                # Filter out potential non-string or empty values
                valid_colors = [
                    c
                    for c in result["colorPalette"]
                    if isinstance(c, str) and c
                ]
                all_colors.update(c.upper() for c in valid_colors)

        # Collect all non-empty text summaries.
        tone_summaries = [
            r.get("toneOfVoiceSummary")
            for r in partial_results
            if r.get("toneOfVoiceSummary")
        ]
        visual_summaries = [
            r.get("visualStyleSummary")
            for r in partial_results
            if r.get("visualStyleSummary")
        ]

        # --- Step 2: AI-powered Aggregation for Summaries ---
        # Ask Gemini to synthesize the text fields into final summaries.
        prompt = f"""
        You are an expert in brand identity. You have been given partial data extracted from a large brand guidelines document. Your task is to synthesize this data into a single, final, and coherent JSON object.

        1.  **Color Palette**: Here is a list of all hex color codes found across the document chunks. Your task is to select the most representative and primary brand colors to create the final palette. **Crucially, you MUST NOT invent new colors.** Choose only from this list:
            {json.dumps(sorted(list(all_colors)), indent=2)}

        2.  **Tone of Voice Summaries**: Here are the partial summaries describing the brand's voice:
            {json.dumps(tone_summaries, indent=2)}

        3.  **Visual Style Summaries**: Here are the partial summaries describing the brand's visual style:
            {json.dumps(visual_summaries, indent=2)}

        Please generate a final, consolidated JSON object with three keys:
        -   "color_palette": A list of hex strings representing the final, curated brand colors, chosen from the list provided.
        -   "tone_of_voice_summary": A single, comprehensive, and well-written summary of approximately 200-250 words that synthesizes all aspects of the brand's voice from the partial summaries, formatted in Markdown.
        -   "visual_style_summary": A single, comprehensive, and well-written summary of approximately 5000-6000 words that synthesizes all aspects of the brand's visual identity from the partial summaries, formatted in Markdown.

        Your response MUST be a single, valid JSON object and nothing else.
        """

        try:
            # We expect a subset of the BrandGuidelineModel, so we can use it as the schema.
            response = self.client.models.generate_content(
                model=self.rewriter_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BrandGuidelineModel,
                ),
            )

            # --- Step 3: Combine Python and AI results ---
            aggregated_data = json.loads(response.text or "{}")
            return BrandGuidelineModel(**aggregated_data)
        except Exception as e:
            logger.error(
                f"Failed to aggregate brand info summaries with Gemini: {e}"
            )
            return None
