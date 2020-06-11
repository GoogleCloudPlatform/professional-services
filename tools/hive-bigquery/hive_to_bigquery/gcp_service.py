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
"""Defines Abstract class for connecting to a GCP service."""

from abc import ABCMeta, abstractmethod


class GCPService:
    """Create a client to connect to the service.

    Attributes:
        project_id (str): GCP Project ID.
        description (str): Description of the client.
    """
    __metaclass__ = ABCMeta

    def __init__(self, project_id, description):
        self.project_id = project_id
        self._description = description
        self.client = self.get_client()

    @property
    def description(self):
        return self._description

    @abstractmethod
    def get_client(self):
        """Create client object."""
        pass
