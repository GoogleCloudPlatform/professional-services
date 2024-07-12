"""
Copyright 2024 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import sys
from voice_pb2 import StreamingStatus, StreamingVoiceResponse
from voice_pb2_grpc import VoiceServicer
import utils.conversation_management as conversation_management
import utils.participant_management as participant_management
from configparser import ConfigParser
import logging
from six.moves import queue
import pyaudio
from google.api_core.exceptions import DeadlineExceeded
import os
from dotenv import load_dotenv

load_dotenv('../.env')

# Get Agent Assist Config
project_id = os.getenv("PROJECT_ID")
conversation_profile_id = os.getenv("CONVERSATION_PROFILE_ID")
chunk_size = int(os.getenv("CHUNK_SIZE"))
restart_timeout = int(os.getenv("RESTART_TIMEOUT"))  # seconds
max_lookback = int(os.getenv("MAX_LOOKBACK"))  # seconds

YELLOW = "\033[0;33m"

class CallStream:
  """Opens a recording stream as a generator yielding the audio chunks."""

  def __init__(self, rate, size, input_generator):
    self._rate = rate
    self._chunk_size = size
    self.input_generator = input_generator
    self._num_channels = 1
    self._buff = queue.Queue()
    self.is_final = False
    self.closed = True
    self.terminate = True
    # Count the number of times the stream analyze content restarts.
    self.restart_counter = 0
    self.last_start_time = 0
    # Time end of the last is_final in millisec since last_start_time.
    self.is_final_offset = 0
    # Save the audio chunks generated from the start of the audio stream for
    # replay after restart.
    self.audio_input_chunks = []
    self.new_stream = True
    self._audio_interface = pyaudio.PyAudio()
    self._audio_stream = self._audio_interface.open(
        format=pyaudio.paInt16,
        channels=self._num_channels,
        rate=self._rate,
        output=True,
        stream_callback=self._callback,
        frames_per_buffer=self._chunk_size
    )

  def __enter__(self):
    self.closed = False
    self.terminate = False
    return self

  def __exit__(self, type, value, traceback): #pylint: disable=redefined-builtin
    self._audio_stream.stop_stream()
    self._audio_stream.close()
    self.closed = True
    self.terminate = True #Added
    # Signal the generator to terminate so that the client's
    # streaming_recognize method will not block the process termination.
    self._buff.put(None)
    self._audio_interface.terminate()

  def _callback(self, in_data, frame_count, time_info, status): #pylint: disable=unused-argument
    # If len(data) is less than requested frame_count, PyAudio automatically
    # assumes the stream is finished, and the stream stops.

    data = next(self.input_generator)

    if data.audio_content:
      self._buff.put(data.audio_content)
      return (data.audio_content, pyaudio.paContinue)

  def generator(self):
    """Stream Audio from Call to API and to local buffer"""
    try:
      # Handle restart.
      # print("restart generator")
      # Flip the bit of is_final so it can continue stream.
      self.is_final = False
      total_processed_time = self.last_start_time + self.is_final_offset
      processed_bytes_length = (
          int(total_processed_time * self._rate * 16 / 8) / 1000
      )
      self.last_start_time = total_processed_time
      # Send out bytes stored in self.audio_input_chunks that is after the
      # processed_bytes_length.
      if processed_bytes_length != 0:
        audio_bytes = b"".join(self.audio_input_chunks)
        # Lookback for unprocessed audio data.
        need_to_process_length = min(
            int(len(audio_bytes) - processed_bytes_length),
            int(max_lookback * self._rate * 16 / 8),
        )
        # Note that you need to explicitly use `int` type for substring.
        need_to_process_bytes = audio_bytes[(-1) * need_to_process_length :]
        yield need_to_process_bytes

      while not self.closed and not self.is_final:
        data = []
        # Use a blocking get() to ensure there's at least one chunk of
        # data, and stop iteration if the chunk is None, indicating the
        # end of the audio stream.
        try:
          chunk = self._buff.get(timeout=3)
        except: # pylint: disable=bare-except
          print("[Closing Stream] Conversation has ended.")
          self.closed = True
          self.terminate = True
          break

        data.append(chunk)

          # Now try to the rest of chunks if there are any left in the _buff.
        while True:
          try:
            chunk = self._buff.get(block=False)
            if chunk is None:
              return
            data.append(chunk)

          except queue.Empty:
            break

        self.audio_input_chunks.extend(data)

        if data:
          yield b"".join(data)

    finally:
      # print("Stop generator")
      pass

class VoiceServicer(VoiceServicer): #pylint: disable=function-redefined
  """
  This class creates a conversation, sends audio chunks for
  transcription and get live recommendations from Agent Assist
  """
  def StreamingVoice(self, request_iterator, context): #pylint: disable=unused-argument

    # Initial handshake
    logging.info("Reading config!")
    try:
      streaming_config = next(request_iterator).streaming_config

      # Be aware that if these field are not in the config object,
      # it will fail silently, therefore an additional check might be necessary
      conversation_id = streaming_config.vcc_call_id
      sample_rate = streaming_config.voice_config.sample_rate_hertz

      if streaming_config.call_leg == 1:
        participant_role = "END_USER"
      else:
        participant_role = "HUMAN_AGENT"

      #Send status to the client.
      streaming_status = StreamingStatus(code=1001,
                                         message="Start sending audio!")
      logging.info("Responding to the client: %s", streaming_status.message)

      yield StreamingVoiceResponse(status=streaming_status)

    except: # pylint: disable=bare-except
      #Send status to the client.
      streaming_status = StreamingStatus(code=1102,
                                         message="Config error!")
      logging.info("Responding to the client: %s", streaming_status.message) # pylint: disable=bare-except

      #Send status to the client.
      yield StreamingVoiceResponse(status=streaming_status)

      return #Interrupt the rest of the code

      # Try to create a conversation if it does not exist

    logging.info("""Creating Conversation with conversation_id: %s""",
                 conversation_id)

    try:
      # Create conversation.
      conversation_management.create_conversation(
        project_id=project_id,
        conversation_profile_id=conversation_profile_id,
        conversation_id=conversation_id
      )
    except: # pylint: disable=bare-except
      #Conversation already exists
      logging.info("""conversation_id: %s already exist. Connecting.""",
                   conversation_id)

      # Get conversation
      conversation_management.get_conversation(
        project_id=project_id, conversation_id=conversation_id
      )

    # Create participant.
    logging.info("Creating Participant with ROLE: %s", participant_role)
    participant = participant_management.create_participant(
      project_id=project_id,
      conversation_id=conversation_id,
      role=participant_role
    )
    participant_id = participant.name.split("participants/")[1].rstrip()
    logging.info("""Created participant with ROLE: %s
                 and PARTICIPANT_ID: %s
                  """,
                  participant_role,
                  participant_id)

    # Open stream
    mic_manager = CallStream(sample_rate, chunk_size, request_iterator)
    sys.stdout.write(YELLOW)
    sys.stdout.write("End (ms)       Transcript Results/Status\n")
    sys.stdout.write("====================================================\n")

    with mic_manager as stream:
      while not stream.closed:
        stream.terminate = False
        while not stream.terminate:
          try:
            # print(f"New Streaming Analyze Request: {stream.restart_counter}")
            stream.restart_counter += 1
            # Send request to streaming and get response.
            responses = participant_management.analyze_content_audio_stream(
            conversation_id=conversation_id,
            participant_id=participant_id,
            sample_rate_herz=sample_rate,
            stream=stream,
            timeout=restart_timeout,
            language_code="en-US",
            single_utterance=False,
            )

            # Now, print the final transcription responses to user.
            for response in responses:
              # print(response)
              if response.human_agent_suggestion_results:
                # print(response.human_agent_suggestion_results)
                for sugg in response.human_agent_suggestion_results:
                  if sugg.suggest_faq_answers_response.faq_answers:
                    faq_answer = sugg.suggest_faq_answers_response.faq_answers[0]
                    print("=========== Suggestion ============")
                    print("Question:", faq_answer.question)
                    print("Suggested Answer:", faq_answer.answer)
                    print("Source Document:", faq_answer.source)

              if response.recognition_result.is_final:
                # offset return from recognition_result is relative
                # to the beginning of audio stream.
                offset = response.recognition_result.speech_end_offset
                stream.is_final_offset = int(
                offset.seconds * 1000 + offset.microseconds / 1000
                )
                # Half-close the stream with gRPC
                # (in Python just stop yielding requests)
                stream.is_final = True
                # print('terminated', stream.terminate)

          except DeadlineExceeded:
            print("Deadline Exceeded, restarting.")

          if stream.terminate:
            conversation_management.complete_conversation(
              project_id=project_id, conversation_id=conversation_id
            )
            break
            