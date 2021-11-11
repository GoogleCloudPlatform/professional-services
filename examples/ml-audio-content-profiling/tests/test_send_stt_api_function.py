#!/usr/bin/env python3

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
"""Unit test file for send_stt_api_function.main.py."""

import unittest.mock as mock
import unittest
from send_stt_api_function import main
from google.cloud.speech_v1 import enums


class TestSendSTTAPIFunction(unittest.TestCase):
    """Tests the logic in the send_stt_api_function module."""

    def setUp(self):
        """Mocks client objects object."""
        self.mocked_request = mock.Mock()
        self.mocked_credentials = mock.Mock()
        self.mocked_publisher_client = mock.Mock()

    def test_create_config_object_flac(self):
        """Tests create_config_object for flac encoding."""
        actual_output = main.create_config_object('audio/flac')
        self.assertEqual(actual_output['encoding'],
                         enums.RecognitionConfig.AudioEncoding.FLAC)

    def test_create_config_object_wav(self):
        """Tests create_config_object for wav encoding."""
        actual_output = main.create_config_object('audio/wav')
        self.assertEqual(actual_output['encoding'],
                         enums.RecognitionConfig.AudioEncoding.LINEAR16)

    def test_create_config_object_unspecified(self):
        """Tests create_config_object for unspecified (mp3) encoding."""
        actual_output = main.create_config_object('audio/mp3')
        self.assertEqual(actual_output['encoding'],
                         enums.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED)

    @mock.patch('send_stt_api_function.main.requests')
    def test_call_stt_api(self, mocked_request):
        """Tests that calling STT API works as expected."""
        gcs_uri = 'gs://foo/bar'
        main.call_stt_api(gcs_uri, {}, self.mocked_credentials)
        mocked_request.post.assert_called_once()

    @mock.patch('send_stt_api_function.main.os')
    @mock.patch.dict('send_stt_api_function.main.os.environ',
                     {'topic_name': 'test_topic'})
    def test_publish_operation_to_pubsub(self, mocked_os):
        """Tests that publishing an operation to PubSub works and uses env var."""
        mocked_project = mock.Mock()
        self.mocked_publisher_client.topic_path.return_value = '/path'
        mocked_operation_name = mock.Mock()
        mocked_operation_name.return_value = 'foo'
        mocked_file_name = mock.Mock()
        mocked_file_name.return_value = 'file'
        main.publish_operation_to_pubsub(self.mocked_publisher_client,
                                         mocked_project,
                                         mocked_operation_name(),
                                         mocked_file_name())
        mocked_os.environ.get.assert_called_with('topic_name')
        self.mocked_publisher_client.publish.assert_called_with(
            '/path',
            mocked_operation_name().encode('utf-8'),
            operation_name=mocked_operation_name(),
            audio_file_name=mocked_file_name())
        self.mocked_publisher_client.publish.assert_called_once()

    def tearDown(self):
        """Disposes of mocked objects."""
        self.mocked_publisher_client.dispose()
        self.mocked_credentials.dispose()
        self.mocked_request.dispose()

if __name__ == '__main__':
    unittest.main()
