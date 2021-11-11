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
"""Defines custom exceptions"""


class CustomBaseError(Exception):
    """Base class for all the custom exceptions"""
    def __init__(self):
        pass


class ArgumentInitializationError(CustomBaseError):
    """Raised when there is an error in initializing the variables like
    BigQuery table name, Hive port number, MySQL port number etc."""
    pass


class ConnectionError(CustomBaseError):
    """Raised when there is a connection failure to any of the Hive, BigQuery,
    GCS, and MySQL components."""
    pass


class MySQLExecutionError(CustomBaseError):
    """Raised when there is a failure in executing query on MySQL database."""
    pass


class HiveExecutionError(CustomBaseError):
    """Raised when there is a failure in executing query on Hive database."""
    pass


class IncrementalColumnError(CustomBaseError):
    """Raised when the provided incremental column is not valid."""
    pass


class HDFSCommandError(CustomBaseError):
    """Raised when HDFS command execution fails."""
    pass
