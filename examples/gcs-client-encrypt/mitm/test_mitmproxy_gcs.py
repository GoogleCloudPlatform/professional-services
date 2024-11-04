# Copyright 2024 Google Inc. All Rights Reserved.

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
import unittest
from unittest.mock import MagicMock, patch
from mitmproxy import http
import tink
from tink import aead
from tink.integration import gcpkms
import os
from hashlib import md5
import base64


class MockAead:
    def encrypt(self, plaintext, associated_data):
        return b"encrypted_data"

    def decrypt(self, ciphertext, associated_data):
        return b"decrypted_data"

# Define some test data
TEST_ENCRYPTED_DATA = b"some_encrypted_data"
TEST_DECRYPTED_DATA = b"some_decrypted_data"
TEST_GCS_PATH = b"gs://test-bucket/test-object"
TEST_GCP_KMS_KEY = "gcp-kms://projects/your-project/locations/global/keyRings/your-ring/cryptoKeys/your-key"

os.environ["GCP_KMS_KEY"]=TEST_GCP_KMS_KEY
import mitmproxy_gcs

#@patch("mitmproxy_gcs.gcpkms.GcpKmsClient", MockGcpKmsClient)
#@patch("mitmproxy_gcs.aead.KmsEnvelopeAead", MockAead)
@patch("mitmproxy_gcs.env_aead", MockAead())
class TestMitmproxyGCS(unittest.TestCase):

    def test_encrypt_and_decrypt_encrypt(self):
        result = mitmproxy_gcs.encrypt_and_decrypt(
            "encrypt", "project_id", b"plaintext", TEST_GCS_PATH
        )
        self.assertEqual(result, b"encrypted_data")

    def test_encrypt_and_decrypt_decrypt(self):
        result = mitmproxy_gcs.encrypt_and_decrypt(
            "decrypt", "project_id", b"ciphertext", TEST_GCS_PATH
        )
        self.assertEqual(result, b"decrypted_data")


    def test_base64_md5hash(self):
        test_buffer = b"test_data"
        expected_hash = base64.b64encode(md5(test_buffer).digest()).decode("utf-8")
        result = mitmproxy_gcs._base64_md5hash(test_buffer)
        self.assertEqual(result, expected_hash)



    @patch("mitmproxy_gcs.encrypt_and_decrypt", return_value=b"encrypted_content")
    def test_request_gcs_upload(self, mock_encrypt):
        flow = MagicMock(spec=http.HTTPFlow)
        flow.request = MagicMock(spec=http.Request)
        flow.request.pretty_url = "https://storage.googleapis.com/upload/storage/v1/b/my-bucket/o?uploadType=media&name=my-object"
        flow.request.content = b'{"name": "my-object"}\r\ncontent-type: text/plain\r\n\r\nunencrypted_content\r\n--boundary\r\n'

        mitmproxy_gcs.request(flow)
        
        modified_content = b'{"name": "my-object"}\r\ncontent-type: text/plain\r\n\r\nencrypted_content\r\n--boundary\r\n'

        self.assertEqual(flow.request.content, modified_content)
        mock_encrypt.assert_called_once_with("encrypt", "your-default-project", b"unencrypted_content", b"gs://my-bucket/my-object")

    @patch("mitmproxy_gcs.encrypt_and_decrypt", return_value=b"decrypted_content")
    @patch("mitmproxy_gcs._base64_md5hash", return_value="test_md5_hash")    
    def test_response_gcs_download(self, mock_md5hash, mock_decrypt):
        flow = MagicMock(spec=http.HTTPFlow)
        flow.request = MagicMock(spec=http.Request)
        flow.request.pretty_url = "https://storage.googleapis.com/download/storage/v1/b/my-bucket/o/my-object?alt=media"
        flow.response = MagicMock()
        flow.response.content = TEST_ENCRYPTED_DATA

        mitmproxy_gcs.response(flow)

        mock_decrypt.assert_called_once_with("decrypt", "your-default-project", TEST_ENCRYPTED_DATA, b"gs://my-bucket/my-object")
        self.assertEqual(flow.response.content, b"decrypted_content")
        mock_md5hash.assert_called_once_with(b"decrypted_content")

if __name__ == "__main__":
    unittest.main()
