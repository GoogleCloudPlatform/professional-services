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

import google.cloud.kms_v1.types
import pytest


@pytest.fixture
def module_under_test():
    from hive_to_bigquery import kms_component

    return kms_component


def test_decrypt_symmetric_calls_kms(module_under_test, mock_kms_client):
    mock_kms_client.decrypt.return_value = google.cloud.kms_v1.types.AsymmetricDecryptResponse(plaintext=b"some plain text")

    plaintext = module_under_test.decrypt_symmetric(
        "my-kms-project", "some-location", "a-key-ring", "this-crypto-key",
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZ")

    assert plaintext == b"some plain text"
    mock_kms_client.assert_called_once_with(client_info=mock.ANY)