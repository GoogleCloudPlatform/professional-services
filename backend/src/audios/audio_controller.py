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
from fastapi import APIRouter
from fastapi import File, UploadFile
from google.cloud import speech
from fastapi import APIRouter, Depends

from src.users.user_model import UserRoleEnum
from src.auth.auth_guard import RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/audios",
    tags=["Google Audio APIs"],
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


@router.post("/transcribe")
async def audio_chat(audio_file: UploadFile = File(...)):
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
        logger.info(f"Transcript: {result.alternatives[0].transcript}")
        text = result.alternatives[0].transcript

    return text, 200
