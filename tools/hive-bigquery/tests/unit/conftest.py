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

from unittest import mock

import google.cloud.bigquery
import google.cloud.storage
import google.cloud.kms_v1
import pytest


@pytest.fixture(autouse=True)
def mock_bigquery_client(monkeypatch):
    mock_client = mock.create_autospec(google.cloud.bigquery.Client)
    monkeypatch.setattr(google.cloud.bigquery, "Client", mock_client)

    # Constructor returns the mock itself, so this mock can be treated as the
    # constructor or the instance.
    mock_client.return_value = mock_client

    return mock_client


@pytest.fixture(autouse=True)
def mock_kms_client(monkeypatch):
    mock_client = mock.create_autospec(google.cloud.kms_v1.KeyManagementServiceClient)
    monkeypatch.setattr(google.cloud.kms_v1, "KeyManagementServiceClient", mock_client)

    # Constructor returns the mock itself, so this mock can be treated as the
    # constructor or the instance.
    mock_client.return_value = mock_client

    return mock_client



@pytest.fixture(autouse=True)
def mock_storage_client(monkeypatch):
    mock_client = mock.create_autospec(google.cloud.storage.Client)
    monkeypatch.setattr(google.cloud.storage, "Client", mock_client)

    # Constructor returns the mock itself, so this mock can be treated as the
    # constructor or the instance.
    mock_client.return_value = mock_client

    return mock_client

