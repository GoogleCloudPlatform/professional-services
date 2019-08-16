# Copyright 2019 Google Inc.
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
"""Class that declares exceptions to be used by main.py."""

class CustomError(Exception):
    """Class for creating CustomError to be returned."""

    def __init__(self, message, status_code=None, payload=None):
        """Instantiates instance of class."""
        self.message = message
        if status_code is not None:
          self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """Converts exception to JSON serializable dictionary."""
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['error'] = True
        return rv
