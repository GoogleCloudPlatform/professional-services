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


@pytest.fixture
def mock_env(monkeypatch):
    """Setting mock environment variables"""
    monkeypatch.setenv("SIGNED_URL", "True")
    monkeypatch.setenv("FROM_EMAIL", "sender@gmail.com")
    monkeypatch.setenv("TO_EMAILS", "recepient@gmail.com")
    monkeypatch.setenv("EMAIL_SUBJECT", "BigQuery email export")
    monkeypatch.setenv("SENDGRID_API_KEY", "SG.key")
    monkeypatch.setenv("SIGNED_URL_EXPIRATION", "24")


def test_raise_exception():
    """Tests that KeyError exception is raised when no env vars are set"""
    with pytest.raises(KeyError):
        main.get_env('SIGNED_URL')


@pytest.mark.parametrize("test_input,expected",
                         [("SIGNED_URL", "True"),
                          ("FROM_EMAIL", "sender@gmail.com"),
                          ("TO_EMAILS", "recepient@gmail.com"),
                          ("EMAIL_SUBJECT", "BigQuery email export"),
                          ("SENDGRID_API_KEY", "SG.key"),
                          ("SIGNED_URL_EXPIRATION", "24")])
def test_get_env(mock_env, test_input, expected):
    """Tests reading of env vars"""
    assert main.get_env(test_input) == expected


@pytest.mark.parametrize(
    "test_input,expected",
    [("gs://bucket/object.txt",
      "https://storage.cloud.google.com/bucket/object.txt"),
     ("gs://bucket/dir/object.txt",
      "https://storage.cloud.google.com/bucket/dir/object.txt"),
     ("gs://bucket/dir/subdir/object.json",
      "https://storage.cloud.google.com/bucket/dir/subdir/object.json")])
def test_get_auth_url(test_input, expected):
    """Tests creation of authenticated GCS URL"""
    assert main.get_auth_url(test_input) == expected
