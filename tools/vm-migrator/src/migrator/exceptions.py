#!/usr/bin/env python
# Copyright 2021 Google Inc.
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
# limitations under the License..
"""
This module contains all the custom exceptions used in the GCP migrator.
"""


class InvalidFormatException(Exception):
    """
    This exception is used to signify the format which you have supplied
    does not adhere to GCP format specified in README.md.
    """
    pass


class NotFoundException(Exception):
    """
    This exception signifies tha the GCP resources which you want to
    operate does not exist.
    """
    pass


class GCPOperationException(Exception):
    """
    This exception is used to signify when a GCP operation
    like create, update, delete returns an error.
    """
    pass
