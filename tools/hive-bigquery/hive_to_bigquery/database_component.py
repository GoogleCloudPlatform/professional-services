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
"""Defines Abstract class for connecting to a database."""

from abc import ABCMeta, abstractmethod


class DatabaseComponent:
    """Initializes the database connection parameters.

    Implement get_connection abstract method to establish a connection and
    get_cursor method to create a cursor object.
    """

    __metaclass__ = ABCMeta

    def __init__(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        self.user = kwargs['user']
        self.password = kwargs['password']
        self.database = kwargs['database']

        self.connection = self.get_connection()

    @abstractmethod
    def get_connection(self):
        """Establish connection to the database."""
        pass

    @abstractmethod
    def get_cursor(self):
        """Create a cursor object."""
        pass
