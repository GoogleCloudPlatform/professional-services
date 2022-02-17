# Copyright 2020 Google Inc.
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

import json
import logging
from typing import Dict, TypeVar

import apache_beam as beam

K = TypeVar("K")
V = TypeVar("V")


class UTF8JsonCoder(beam.coders.Coder):
    """UTF8-JSON Encoder/Decoder"""

    def encode(self, input: Dict[K, V]):
        """Encodes JSON object to UTF8 bytes

    Args:
        Input - Input element that needs to be encoded to utf8 bytes
    """
        try:
            return json.dumps(input).encode("utf8")
        except Exception as e:
            logging.error(f"Error {e} in parsing value {input}")

    def decode(self, input: bytes):
        """Decodes UTF8 bytes to JSON object

    Args:
        Input - Input element in utf8 bytes to decode
    """
        try:
            return json.loads(input.decode("utf8"))
        except Exception as e:
            logging.error(f"Error {e} in parsing value {input}")

    def is_deterministic(self):
        return True
