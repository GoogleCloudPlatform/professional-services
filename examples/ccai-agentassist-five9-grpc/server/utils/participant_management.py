#!/usr/bin/env python

# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Dialogflow API Python sample showing how to manage Participants.
"""

from google.cloud import dialogflow_v2beta1 as dialogflow
import google.auth

ROLES = ["HUMAN_AGENT", "AUTOMATED_AGENT", "END_USER"]

# [START dialogflow_create_participant]
def create_participant(project_id: str, conversation_id: str, role: str):
  """Creates a participant in a given conversation.

  Args:
      project_id: The GCP project linked with the conversation profile.
      conversation_id: Id of the conversation.
      participant: participant to be created."""

  client = dialogflow.ParticipantsClient()
  conversation_path = dialogflow.ConversationsClient.conversation_path(
    project_id, conversation_id
  )

  if role in ROLES:
    response = client.create_participant(
        parent=conversation_path, participant={"role": role}, timeout=600
    )
    print("Participant Created.")
    print("Role:", response.role)
    print("Name:", response.name)

    return response

# [END dialogflow_create_participant]

# [START dialogflow_analyze_content_audio_stream]
def analyze_content_audio_stream(
  conversation_id: str,
  participant_id: str,
  sample_rate_herz: int,
  stream,
  timeout: int,
  language_code: str,
  single_utterance=False,
):
  """Stream audio streams to Dialogflow and receive transcripts and
  suggestions.

  Args:
      conversation_id: Id of the conversation.
      participant_id: Id of the participant.
      sample_rate_herz: herz rate of the sample.
      stream: the stream to process. It should have generator() method to
        yield input_audio.
      timeout: the timeout of one stream.
      language_code: the language code of the audio. Example: en-US
      single_utterance: whether to use single_utterance.
  """
  credentials, project_id = google.auth.default()
  client = dialogflow.ParticipantsClient(credentials=credentials)

  participant_name = client.participant_path(
      project_id, conversation_id, participant_id
  )

  audio_config = dialogflow.types.audio_config.InputAudioConfig(
      audio_encoding=dialogflow.types.audio_config.AudioEncoding.AUDIO_ENCODING_LINEAR_16,
      sample_rate_hertz=sample_rate_herz,
      language_code=language_code,
      single_utterance=single_utterance
  )

  def gen_requests(participant_name, audio_config, stream):
    """Generates requests for streaming."""
    # print('Generating req')
    audio_generator = stream.generator()
    yield dialogflow.types.participant.StreamingAnalyzeContentRequest(
        participant=participant_name, audio_config=audio_config,
    )

    for content in audio_generator:
      yield dialogflow.types.participant.StreamingAnalyzeContentRequest(
              input_audio=content,
            )

  return client.streaming_analyze_content(
      gen_requests(participant_name, audio_config, stream), timeout=timeout
  )

# [END dialogflow_analyze_content_audio_stream]
  