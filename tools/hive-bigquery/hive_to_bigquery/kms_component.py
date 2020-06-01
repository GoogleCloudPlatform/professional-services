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
"""Decrypts the ciphertext stored in GCS to get MySQL password"""

from google.cloud import kms_v1

from hive_to_bigquery import client_info


def decrypt_symmetric(project_id, location_id, key_ring_id, crypto_key_id,
                      ciphertext):
    """Decrypts input ciphertext using the provided symmetric CryptoKey."""

    # Creates an API client for the KMS API.
    info = client_info.get_gapic_client_info()
    kms_client = kms_v1.KeyManagementServiceClient(client_info=info)

    # The resource name of the CryptoKey.
    name = kms_client.crypto_key_path_path(project_id, location_id,
                                           key_ring_id, crypto_key_id)
    # Use the KMS API to decrypt the data.
    response = kms_client.decrypt(name, ciphertext)
    return response.plaintext
