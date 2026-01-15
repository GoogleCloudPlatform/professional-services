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
import base64
import io
import logging
import time
import wave
from typing import Any, Dict, List, MutableSequence, Optional, cast

from fastapi import Depends

import vertexai
from google.cloud import aiplatform
from google.cloud import texttospeech_v1beta1 as texttospeech
from google.genai import types
from google.protobuf import json_format, struct_pb2
from vertexai.generative_models import GenerationConfig, GenerativeModel

from src.audios.audio_constants import LanguageEnum, VoiceEnum
from src.audios.dto.create_audio_dto import CreateAudioDto
from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.base_dto import AspectRatioEnum, GenerationModelEnum, MimeTypeEnum
from src.common.schema.genai_model_setup import GenAIModelSetup
from src.common.schema.media_item_model import JobStatusEnum, MediaItemModel
from src.common.storage_service import GcsService
from src.config.config_service import config_service
from src.galleries.dto.gallery_response_dto import MediaItemResponse
from src.images.repository.media_item_repository import MediaRepository
from src.users.user_model import UserModel

logger = logging.getLogger(__name__)


class AudioService:
    # Models that use the "Generate Content" (LLM) API
    GEMINI_MODELS = {
        GenerationModelEnum.GEMINI_2_5_FLASH_TTS,
        GenerationModelEnum.GEMINI_2_5_FLASH_LITE_PREVIEW_TTS,
        GenerationModelEnum.GEMINI_2_5_PRO_TTS,
    }

    # Models that use the "Synthesize Speech" (TTS) API
    TTS_MODELS = {
        GenerationModelEnum.CHIRP_3,
    }

    # Models that use the Vertex Prediction API (Music)
    MUSIC_MODELS = {
        GenerationModelEnum.LYRIA_002,
    }

    def __init__(
        self,
        media_repo: MediaRepository = Depends(),
        gcs_service: GcsService = Depends(),
        iam_signer_credentials: IamSignerCredentials = Depends(),
    ):
        """Initializes the service with its dependencies."""
        self.iam_signer_credentials = iam_signer_credentials
        self.media_repo = media_repo
        self.gcs_service = gcs_service
        self.cfg = config_service

        # Client for Gemini (GenAI)
        self.client = GenAIModelSetup.init()

        # Client for Standard TTS (Using v1beta1 for Chirp support)
        self.tts_client = texttospeech.TextToSpeechClient()

        # Initialize Vertex AI (Global)
        vertexai.init(project=self.cfg.PROJECT_ID, location=self.cfg.LOCATION)

    async def generate_audio(
        self, request_dto: CreateAudioDto, user: UserModel
    ) -> MediaItemResponse | None:
        """
        Main entry point: Routes to the correct generation logic based on the model type.
        """

        # 1. Route to Music Generation (Lyria)
        if request_dto.model in self.MUSIC_MODELS:
            return await self._generate_music_lyria(request_dto, user)

        # 2. Route to Gemini TTS Native Speech (Generate Content API)
        elif request_dto.model in self.GEMINI_MODELS:
            return await self._generate_gemini_speech(request_dto, user)

        # 3. Route to Standard/Chirp TTS (Synthesize Speech API)
        elif request_dto.model in self.TTS_MODELS:
            return await self._generate_standard_speech(request_dto, user)

        else:
            raise ValueError(
                f"Model '{request_dto.model}' is not supported by AudioService."
            )

    async def _generate_gemini_speech(
        self, request_dto: CreateAudioDto, user: UserModel
    ) -> MediaItemResponse | None:
        """
        Handles logic for Gemini Models (LLM Audio Generation).
        Implements Parallel Execution for multiple samples.
        """
        start_time = time.monotonic()
        model_id = request_dto.model.value

        # Define the single generation task
        async def generate_single_sample(index: int) -> Optional[str]:
            try:
                # 1. Call GenAI API
                response = self.client.models.generate_content(
                    model=model_id,
                    contents=[
                        f"Please read the following text: \n{request_dto.prompt}"
                    ],
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        audio_timestamp=False,
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=request_dto.voice_name or "Puck"
                                )
                            )
                        ),
                    ),
                )

                # 2. Validate Response
                if (
                    not response.candidates
                    or not response.candidates[0].content
                    or not response.candidates[0].content.parts
                ):
                    logger.warning(
                        f"Gemini attempt {index} returned no content."
                    )
                    return None

                part = response.candidates[0].content.parts[0]

                # 3. Extract Raw PCM
                pcm_bytes = None
                if hasattr(part, "inline_data") and part.inline_data:
                    pcm_bytes = part.inline_data.data
                    if isinstance(pcm_bytes, str):
                        pcm_bytes = base64.b64decode(pcm_bytes)
                else:
                    logger.warning(
                        f"Gemini attempt {index} had no inline data."
                    )
                    return None

                if not pcm_bytes:
                    return None

                # 4. Convert Raw PCM to WAV (Add RIFF Header)
                wav_buffer = io.BytesIO()
                with wave.open(wav_buffer, "wb") as wav_file:
                    wav_file.setnchannels(1)  # Mono
                    wav_file.setsampwidth(2)  # 16-bit
                    wav_file.setframerate(24000)  # 24kHz
                    wav_file.writeframes(pcm_bytes)

                final_wav_bytes = wav_buffer.getvalue()

                # 5. Save to GCS
                file_name = f"gemini_audio_{request_dto.model.value}_{int(time.time())}_{str(user.id)[:4]}_{index}.wav"
                gcs_uri = self.gcs_service.store_to_gcs(
                    folder="gemini_audio",
                    file_name=file_name,
                    mime_type=MimeTypeEnum.AUDIO_WAV,
                    contents=final_wav_bytes,
                    decode=False,
                )
                return gcs_uri

            except Exception as e:
                logger.error(f"Gemini generation attempt {index} failed: {e}")
                return None

        # --- PARALLEL EXECUTION ---
        tasks = [
            generate_single_sample(i) for i in range(request_dto.sample_count)
        ]
        results = await asyncio.gather(*tasks)
        permanent_gcs_uris = [uri for uri in results if uri is not None]

        if not permanent_gcs_uris:
            raise ValueError("Failed to generate any Gemini audio samples.")

        return await self._finalize_response(
            user,
            request_dto,
            permanent_gcs_uris,
            start_time,
            MimeTypeEnum.AUDIO_WAV,
        )

    async def _generate_standard_speech(
        self, request_dto: CreateAudioDto, user: UserModel
    ) -> MediaItemResponse | None:
        """
        Handles logic for Chirp and Standard Google Cloud TTS voices.
        INTEGRATION NOTE: Now uses Chirp3 HD logic from working snippet.
        """
        start_time = time.monotonic()

        # Define the single generation task
        async def generate_single_sample(index: int) -> Optional[str]:
            try:
                synthesis_input = texttospeech.SynthesisInput(
                    text=request_dto.prompt
                )

                # Construct the full voice name string if using Chirp 3
                # Example: "en-US" + "Chirp3-HD" + "Puck" -> "en-US-Chirp3-HD-Fenrir"
                voice_name = (
                    request_dto.voice_name.value
                    if request_dto.voice_name
                    else VoiceEnum.PUCK.value
                )
                language_code = (
                    request_dto.language_code.value
                    if request_dto.language_code
                    else LanguageEnum.EN_US.value
                )

                # If it is Chirp 3 and the user passed just the name (e.g., "Fenrir" or "Puck")
                # we need to format it correctly.
                if request_dto.model == GenerationModelEnum.CHIRP_3:
                    voice_name = f"{language_code}-Chirp3-HD-{voice_name}"

                voice_params = texttospeech.VoiceSelectionParams(
                    language_code=language_code,
                    name=voice_name,
                )

                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.LINEAR16,
                    speaking_rate=1.0,  # Default from snippet
                    volume_gain_db=0.0,
                )

                # Run blocking call in thread
                response = await asyncio.to_thread(
                    self.tts_client.synthesize_speech,
                    input=synthesis_input,
                    voice=voice_params,
                    audio_config=audio_config,
                )

                audio_bytes = response.audio_content

                file_name = f"tts_{request_dto.model.value}_{int(time.time())}_{str(user.id)[:4]}_{index}.wav"

                gcs_uri = self.gcs_service.store_to_gcs(
                    folder="tts_audio",
                    file_name=file_name,
                    mime_type=MimeTypeEnum.AUDIO_WAV,
                    contents=audio_bytes,
                    decode=False,
                )
                return gcs_uri

            except Exception as e:
                logger.error(f"Standard TTS attempt {index} failed: {e}")
                return None

        # --- PARALLEL EXECUTION ---
        tasks = [
            generate_single_sample(i) for i in range(request_dto.sample_count)
        ]
        results = await asyncio.gather(*tasks)
        permanent_gcs_uris = [uri for uri in results if uri is not None]

        if not permanent_gcs_uris:
            raise ValueError(
                "Failed to generate any Standard TTS audio samples."
            )

        return await self._finalize_response(
            user,
            request_dto,
            permanent_gcs_uris,
            start_time,
            MimeTypeEnum.AUDIO_WAV,
        )
    async def _generate_music_lyria(
        self, request_dto: CreateAudioDto, user: UserModel
    ) -> MediaItemResponse | None:
        """
        Handles logic for Lyria.
        Implements manual parallelism to support sample_count > 1.
        """
        start_time = time.monotonic()

        # Force us-central1 for Lyria client
        lyria_location = "us-central1"
        client_options = {
            "api_endpoint": f"{lyria_location}-aiplatform.googleapis.com"
        }
        client = aiplatform.gapic.PredictionServiceClient(
            client_options=client_options
        )

        # Define the single generation task
        async def generate_single_sample(index: int) -> Optional[str]:
            try:
                # 1. Prepare Parameters (Force count=1 for individual call)
                parameters_dict = {"sample_count": 1}
                parameters_value = struct_pb2.Value()
                json_format.ParseDict(parameters_dict, parameters_value)

                # 2. Prepare Instance
                instance_dict: Dict[str, Any] = {"prompt": request_dto.prompt}
                if request_dto.negative_prompt:
                    instance_dict["negative_prompt"] = (
                        request_dto.negative_prompt
                    )
                # Pass seed if provided, otherwise let API randomize
                if request_dto.seed:
                    instance_dict["seed"] = request_dto.seed

                instance_value = struct_pb2.Value()
                json_format.ParseDict(instance_dict, instance_value)
                instances: MutableSequence[struct_pb2.Value] = [instance_value]

                # 3. Call API
                response = await asyncio.to_thread(
                    client.predict,
                    endpoint=f"projects/{self.cfg.PROJECT_ID}/locations/global/publishers/google/models/lyria-002",
                    instances=instances,
                    parameters=parameters_value,
                )

                if not response.predictions:
                    return None

                # 4. Process Prediction
                # We take the first one because we requested sample_count=1
                prediction = response.predictions[0]
                # prediction is a MapComposite, which behaves like a dict
                audio_b64 = prediction.get("bytesBase64Encoded")

                if not audio_b64:
                    return None

                audio_bytes = base64.b64decode(audio_b64)

                # Unique filename per sample
                file_name = (
                    f"lyria_music_{int(time.time())}_{str(user.id)[:4]}_{index}.wav"
                )

                # 5. Save to GCS
                gcs_uri = self.gcs_service.store_to_gcs(
                    folder="lyria_audio",
                    file_name=file_name,
                    mime_type=MimeTypeEnum.AUDIO_WAV,
                    contents=audio_bytes,
                    decode=False,
                )
                return gcs_uri

            except Exception as e:
                logger.error(f"Lyria generation attempt {index} failed: {e}", exc_info=True)
                return None

        # --- PARALLEL EXECUTION ---
        # Create a task for each requested sample
        tasks = [
            generate_single_sample(i) for i in range(request_dto.sample_count)
        ]

        # Run all tasks concurrently
        results = await asyncio.gather(*tasks)

        # Filter out failed attempts (None results)
        permanent_gcs_uris = [uri for uri in results if uri is not None]

        if not permanent_gcs_uris:
            raise ValueError("Failed to generate any Lyria audio samples.")

        return await self._finalize_response(
            user,
            request_dto,
            permanent_gcs_uris,
            start_time,
            MimeTypeEnum.AUDIO_WAV,
        )

    async def _finalize_response(
        self,
        user: UserModel,
        request_dto: CreateAudioDto,
        gcs_uris: List[str],
        start_time: float,
        mime_type: MimeTypeEnum
    ) -> MediaItemResponse:
        """
        Helper to save DB record and generate presigned URLs.
        """
        if not gcs_uris:
            raise ValueError("No audio content generated.")

        presigned_url_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in gcs_uris
        ]
        presigned_urls = await asyncio.gather(*presigned_url_tasks)

        end_time = time.monotonic()
        generation_time = end_time - start_time

        media_post_to_save = MediaItemModel(
            user_email=user.email,
            user_id=user.id,
            mime_type=mime_type,
            model=request_dto.model,
            aspect_ratio=AspectRatioEnum.RATIO_16_9,
            workspace_id=request_dto.workspace_id,
            prompt=request_dto.prompt,
            original_prompt=request_dto.prompt,
            num_media=len(gcs_uris),
            generation_time=generation_time,
            gcs_uris=gcs_uris,
            status=JobStatusEnum.COMPLETED,
            negative_prompt=request_dto.negative_prompt,
            voice_name=request_dto.voice_name,
            language_code=request_dto.language_code,
            seed=request_dto.seed,  # Lyria uses seed
            # TODO: Deduce the duration and add it to the model
            # duration_seconds=None,
        )
        media_post_to_save = await self.media_repo.create(media_post_to_save)

        return MediaItemResponse(
            **media_post_to_save.model_dump(),
            presigned_urls=presigned_urls,
        )
