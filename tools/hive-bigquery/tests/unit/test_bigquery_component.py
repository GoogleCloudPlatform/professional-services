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

import pytest


PROJECT_ID = "this-is-a-test-project"


@pytest.fixture
def module_under_test():
    from hive_to_bigquery import bigquery_component

    return bigquery_component


@pytest.fixture
def object_under_test(module_under_test):
    return module_under_test.BigQueryComponent(PROJECT_ID)


def test_get_client(object_under_test, mock_bigquery_client):
    # Constructor already calls get_client.
    mock_bigquery_client.reset_mock()

    client = object_under_test.get_client()

    assert client is mock_bigquery_client
    mock_bigquery_client.assert_called_once_with(
        project=PROJECT_ID, client_info=mock.ANY
    )
