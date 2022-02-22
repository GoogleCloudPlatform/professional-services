# Copyright 2019 Google LLC.
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

"""Exceptions raised while generating training and validation data.

This module provides exceptions to be raised in specific cases of errors
occuring during the generation of the training and validation datasets:
    * MLDataPrepException - to be raised in case of failure of creation
    of the temporary table containg shuffled data.
"""


from __future__ import absolute_import
from __future__ import print_function


class MLDataPrepException(Exception):
    """Raised when the application encounters an error.
    Args:
        message (str): The error message.
        code (int): The error code
        cause (Exception): The root google.cloud.exceptions.GoogleCloudError exception.
    """

    def __init__(self, message, code, cause):
        """Set the message, code and cause exception."""
        super(MLDataPrepException, self).__init__(message)
        self.message = message
        self._code = code
        self._cause = cause

    @property
    def code(self):
        """The root cause exception."""
        return self._code

    @property
    def cause(self):
        """The root cause exception."""
        return self._cause

    def __str__(self):
        return "{}: {}, code {}, cause : {}".format(self.__class__.__name__, self.message,
                                                    self.code, self.cause)
