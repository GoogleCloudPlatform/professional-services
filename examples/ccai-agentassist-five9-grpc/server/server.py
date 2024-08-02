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

import grpc
from concurrent import futures
import logging
import sys
import os
from dotenv import load_dotenv
import sounddevice # noqa: F401

sys.path.append("..")
sys.path.append("../proto")
from services.get_suggestions import VoiceServicer #pylint: disable=wrong-import-position
from voice_pb2_grpc import add_VoiceServicer_to_server #pylint: disable=wrong-import-position

load_dotenv('../.env')
server_port = os.getenv("PORT", "8080")

def _serve(port:str):
  """Start gRPC server"""
  server = grpc.server(futures.ThreadPoolExecutor(max_workers=5))
  add_VoiceServicer_to_server(VoiceServicer(), server)
  print("Server Started!")
  bind_address = f"[::]:{port}"
  server.add_insecure_port(bind_address)
  server.start()
  logging.info("Listening on %s.", bind_address)
  server.wait_for_termination()

if __name__ == "__main__":
  _serve(server_port)
