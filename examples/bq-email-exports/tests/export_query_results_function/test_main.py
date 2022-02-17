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
"""Unit tests for export query results function"""
import os
import sys
import time

import pytest

sys.path.append(os.path.realpath(os.path.dirname(__file__) + "../.."))
from export_query_results_function import main


@pytest.fixture
def mock_env(monkeypatch):
    """Setting mock environment variables"""
    monkeypatch.setenv("BUCKET_NAME", "my-bucket")
    monkeypatch.setenv("OBJECT_NAME", "dir/subdir/query.txt")
    monkeypatch.setenv("PROJECT_ID", "my-gcp-project")
    monkeypatch.setenv("OBJECT_NAME", "dir/subdir/query.txt")
    monkeypatch.setenv("COMPRESSION", "NONE")
    monkeypatch.setenv("DEST_FMT", "NEWLINE_DELIMETED_JSON")
    monkeypatch.setenv("FIELD_DELIMITER", ",")
    monkeypatch.setenv("USE_AVRO_TYPES", "False")


def test_raise_exception():
    """Tests that KeyError exception is raised when no env vars are set"""
    with pytest.raises(KeyError):
        main.get_env('BUCKET_NAME')


@pytest.mark.parametrize("test_input,expected",
                         [("BUCKET_NAME", "my-bucket"),
                          ("OBJECT_NAME", "dir/subdir/query.txt"),
                          ("PROJECT_ID", "my-gcp-project"),
                          ("OBJECT_NAME", "dir/subdir/query.txt"),
                          ("COMPRESSION", "NONE"),
                          ("DEST_FMT", "NEWLINE_DELIMETED_JSON"),
                          ("FIELD_DELIMITER", ","),
                          ("USE_AVRO_TYPES", "False")])
def test_get_env(mock_env, test_input, expected):
    """Tests reading of env vars"""
    assert main.get_env(test_input) == expected


def test_get_dest_uri(mock_env):
    """Tests construction of URI using env vars"""
    assert main.get_destination_uri(
    ) == f"gs://my-bucket/{time.strftime('%Y%m%d-%H%M%S')}/dir/subdir/query.txt"
