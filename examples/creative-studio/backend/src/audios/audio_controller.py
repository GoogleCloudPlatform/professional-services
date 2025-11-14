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


import logging

from fastapi import APIRouter, Depends, File, UploadFile
from google.cloud import speech

from src.audios.audio_service import AudioService
from src.audios.dto.create_audio_dto import CreateAudioDto
from src.auth.auth_guard import RoleChecker, get_current_user
from src.galleries.dto.gallery_response_dto import MediaItemResponse
from src.users.user_model import UserModel, UserRoleEnum

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/audios",
    tags=["Audio Generation - Chirp 3 HD, Lyria, Google TTS"],
    responses={404: {"description": "Not found"}},
    dependencies=[
        Depends(
            RoleChecker(
                allowed_roles=[
                    UserRoleEnum.ADMIN,
                    UserRoleEnum.USER,
                ]
            )
        )
    ],
)


@router.post("/generate", response_model=MediaItemResponse)
async def generate_audio(
    create_audio_dto: CreateAudioDto,
    current_user: UserModel = Depends(get_current_user),
    audio_service: AudioService = Depends(),
):
    """
    Generates audio based on the selected model (Lyria for music, Chirp/Gemini for speech).
    """
    return await audio_service.generate_audio(create_audio_dto, current_user)


@router.post("/transcribe")
async def audio_chat(audio_file: UploadFile = File()):
    client = speech.SpeechClient()
    audio_content = await audio_file.read()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        language_code="en-US",
        sample_rate_hertz=48000,
        model="default",
        audio_channel_count=1,
        enable_word_confidence=True,
        enable_word_time_offsets=True,
    )

    operation = client.long_running_recognize(config=config, audio=audio)

    logger.info("Waiting for operation to complete...")
    response = operation.result(timeout=90)
    text = ""
    for result in response.results:
        text = result.alternatives[0].transcript
    return text, 200
