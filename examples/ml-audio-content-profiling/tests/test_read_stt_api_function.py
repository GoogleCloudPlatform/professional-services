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
"""Performs unit tests for read_stt_api_function.main file."""

import unittest.mock as mock
import unittest
from read_stt_api_function import main


class TestReadSTTAPIFunction(unittest.TestCase):
    """Tests the logic in read_stt_api_function module."""
    def setUp(self):
        """Creates a mocked subscriber client object."""
        self.mocked_subscriber_client = mock.Mock()
    def test_format_time(self):
        """Tests formatting time functionality."""
        expected_output = '43:29:30'
        actual_outupt = main.format_time('156570s')
        self.assertEqual(expected_output, actual_outupt)


    def test_get_stt_ids_from_msgs(self):
        """Tests to see if output matches for get_stt_ids_from_msgs"""
        msg_object = type('ReceivedMessage', (), {
            'ack_id': "TgQhIUytDCypYEQ"
        })
        attribute_list = {
            'operation_name': '4941309277729713121',
            'audio_file_name': 'Google.Cloud.Platform.Podcast.Episode.83.flac'
        }
        msg = type('PubsubMessage', (), {
            'data': "4941309277729713121",
            'message_id': "671242583916238",
            'publish_time': {
                'seconds': 1565708780,
                'nanos': 293000000
            }
        })
        setattr(msg, 'attributes', attribute_list)
        setattr(msg_object, 'message', msg)
        actual_output = main.get_stt_ids_from_msgs(self.mocked_subscriber_client,
                                                   'my-project',
                                                   [msg_object])
        expected_outupt = [{'file': 'Google.Cloud.Platform.Podcast.Episode.83.flac',
                            'id': '4941309277729713121'}]
        self.assertEqual(actual_output, expected_outupt)


    def test_parse_transcript_output(self):
        """Tests parsing STT response JSON to format correctly."""
        sample_resp = {'name': '3876421554766873840',
                       # pylint: disable=line-too-long
                       'metadata': {'@type': 'type.googleapis.com/google.cloud.speech.v1.LongRunningRecognizeMetadata',
                                    'progressPercent': 100,
                                    'startTime': '2019-08-13T16:30:23.784460Z',
                                    'lastUpdateTime': '2019-08-13T16:48:19.253115Z'},
                       'done': True,
                       # pylint: disable=line-too-long
                       'response': {'@type': 'type.googleapis.com/google.cloud.speech.v1.LongRunningRecognizeResponse',
                                    'results': [{
                                        'alternatives': [{
                                            'transcript': """
                                                       Hi and welcome to episode number
                                                       83 of the weekly Google Cloud
                                                       platform podcast.
                                                       """,
                                            'confidence': 0.7370642,
                                            'words': [{
                                                'startTime': '4.700s',
                                                'endTime': '5.200s',
                                                'word': 'Hi'
                                            }, {
                                                'startTime': '5.300s',
                                                'endTime': '5.500s',
                                                'word': 'and'
                                            }, {
                                                'startTime': '5.500s',
                                                'endTime': '5.800s',
                                                'word': 'welcome'
                                            }, {
                                                'startTime': '5.800s',
                                                'endTime': '5.900s',
                                                'word': 'to'
                                            }, {
                                                'startTime': '5.900s',
                                                'endTime': '6.300s',
                                                'word': 'episode'
                                            }, {
                                                'startTime': '6.300s',
                                                'endTime': '6.600s',
                                                'word': 'number'
                                            }, {
                                                'startTime': '6.600s',
                                                'endTime': '7.200s',
                                                'word': '83'
                                            }, {
                                                'startTime': '7.300s',
                                                'endTime': '7.500s',
                                                'word': 'of'
                                            }, {
                                                'startTime': '7.500s',
                                                'endTime': '7.600s',
                                                'word': 'the'
                                            }, {
                                                'startTime': '7.600s',
                                                'endTime': '8s',
                                                'word': 'weekly'
                                            }, {
                                                'startTime': '8s',
                                                'endTime': '8.300s',
                                                'word': 'Google'
                                            }, {
                                                'startTime': '8.300s',
                                                'endTime': '8.500s',
                                                'word': 'Cloud'
                                            }, {
                                                'startTime': '8.500s',
                                                'endTime': '8.800s',
                                                'word': 'platform'
                                            }, {
                                                'startTime': '8.800s',
                                                'endTime': '9.500s',
                                                'word': 'podcast.'
                                            }]}]},
                                                {'alternatives': [{}]},
                                                {'alternatives': [{}]}]}}
        actual_output = main.parse_transcript_output(sample_resp)
        expected_output = [{'transcript': """
                                          Hi and welcome to episode number
                                          83 of the weekly Google Cloud
                                          platform podcast.
                                          """,
                            'start_time': '00:00:04',
                            'end_time': '00:00:09'}]
        self.assertEqual(actual_output, expected_output)

    def tearDown(self):
        """Dispose of mocked objects."""
        self.mocked_subscriber_client.dispose()


if __name__ == '__main__':
    unittest.main()
