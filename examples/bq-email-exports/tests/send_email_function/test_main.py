# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Unit tests for send email function"""
import os
import sys

import pytest

sys.path.append(os.path.realpath(os.path.dirname(__file__) + "../.."))
from send_email_function import main


@pytest.mark.parametrize(
    "test_input,expected",
    [("gs://bucket/file.txt", "bucket"),
     ("gs://bucket/directory/file.txt", "bucket"),
     ("gs://bucket/directory/subdir/subdir/file.txt", "bucket")])
def test_get_bucket(test_input, expected):
    """Tests if function returns bucket name from GCS URI."""
    assert main.get_bucket(test_input) == expected


@pytest.mark.parametrize(
    "test_input,expected",
    [("gs://bucket/file.txt", "file.txt"),
     ("gs://bucket/directory/object.txt", "directory/object.txt"),
     ("gs://bucket/directory/subdir/subdir/subdir/file.txt",
      "directory/subdir/subdir/subdir/file.txt")])
def test_get_object(test_input, expected):
    """Tests if function returns bucket name from GCS URI."""
    assert main.get_object(test_input) == expected
