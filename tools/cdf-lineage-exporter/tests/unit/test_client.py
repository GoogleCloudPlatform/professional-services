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
import requests


@pytest.fixture
def module_under_test():
    import cdap.client

    return cdap.client


@pytest.fixture
def object_under_test(module_under_test):
    client = module_under_test.CDAPClient(credentials=None,
                                          api_endpoint="http://localhost:11015")
    client._transport = mock.create_autospec(requests)
    return client


def test_list_datasets_with_404(object_under_test):
    mock_response = mock.create_autospec(requests.Response)
    mock_response.status_code = 404
    object_under_test._transport.request.return_value = mock_response
    assert object_under_test.list_datasets() == []


def test_list_streams_with_404(object_under_test):
    mock_response = mock.create_autospec(requests.Response)
    mock_response.status_code = 404
    object_under_test._transport.request.return_value = mock_response
    assert object_under_test.list_streams() == []
