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
import grpc
import logging
import wave
import argparse
import os
from dotenv import load_dotenv

sys.path.append("../proto")
from voice_pb2 import VoiceConfig, StreamingConfig, StreamingVoiceRequest #pylint: disable=wrong-import-position
from voice_pb2_grpc import VoiceStub #pylint: disable=wrong-import-position

load_dotenv('../.env')
server_address = os.getenv("SERVER_ADDRESS", "0.0.0.0")
server_port = os.getenv("PORT", "8080")
size = int(os.getenv("CHUNK_SIZE", 1024))

def generate_chunks(config, audio, chunk_size):
  """Send initial audio configuration and audio content in chunks"""
  # Send initial configuration
  yield StreamingVoiceRequest(streaming_config=config)

  # Send audio content
  while chunk := audio.readframes(chunk_size):
    yield StreamingVoiceRequest(audio_content=chunk)

def run(role, call_id):
  """Send requests to the server"""

  audio_path = f"audio/{role}.wav"

  #Map call_leg
  #0 Agent - 1 Customer. Ignoring supervisor
  call_leg = 0 if role=="HUMAN_AGENT" else 1
  print(call_leg)

  # Get Audio config
  wf = wave.open(audio_path, "rb")
  sample_rate = wf.getframerate() #Number of frames per second
  chunk_size = size #Number of frames to be sent in each request

  # Voice Config
  voice_config = VoiceConfig(encoding=1, #1 for LINEAR16
                            sample_rate_hertz=sample_rate
                            )

  config = StreamingConfig(voice_config=voice_config,
                           vcc_call_id=call_id,
                           domain_id="customer_domain",
                           campaign_id="campaing_associated",
                           agent_id="agent_identifier",
                           call_leg=call_leg,
                           trust_token="trust_token_123",
                           subscription_id="sub_id_123",
                           skill_id="skill_identifier"
                           )


  with grpc.insecure_channel(f"{server_address}:{server_port}") as channel:
    stub = VoiceStub(channel)
    responses = stub.StreamingVoice(generate_chunks(config=config,
                                                    audio=wf,
                                                    chunk_size=chunk_size))

    # If the response has a status code
    # and it is different from SRV_REQ_START_STREAMING (1001), then stop
    for response in responses:
      print(f"Client received: {response}")

      #Verify if the initial handshake was successful
      if response.status.code and response.status.code != 1001:
        break


if __name__ == "__main__":
  logging.basicConfig(level=logging.INFO)

  #Parse arguments
  parser = argparse.ArgumentParser()
  parser.add_argument("--role",
                      type=str,
                      default=None,
                      help="Please specify the role as HUMAN_AGENT or END_USER")
  parser.add_argument("--call_id",
                      type=str,
                      default=None,
                      help="Please specify the CallId")

  args = parser.parse_args()

  run(role=args.role, call_id=args.call_id)
