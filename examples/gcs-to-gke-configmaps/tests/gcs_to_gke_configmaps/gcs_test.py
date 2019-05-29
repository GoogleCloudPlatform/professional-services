# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import unittest
from unittest.mock import patch

from googleapiclient.discovery import build
from googleapiclient.http import HttpMock

from gcs_to_gke_configmaps.gcs import GCSObject
from gcs_to_gke_configmaps import setup_logging
from gcs_to_gke_configmaps import cloud_logger


class GCSObjectTest(unittest.TestCase):
    content_string_apple = ""

    def setUp(self):
        setup_logging()
        apple_file = open('examples/gcs/data-example-apple.yaml', 'r')
        self.content_string_apple = apple_file.read().replace('\\n', '\n')
        apple_file.close()

    def test_content(self):
        gcsObject = GCSObject("bucket", "filename")
        http = HttpMock('tests/data/storage-discovery.json',
                        {'status': '200'})
        api_key = '12345'
        gcsObject._service = build('storage', 'v1',
                                   http=http,
                                   developerKey=api_key,
                                   cache_discovery=False)

        http = HttpMock('examples/gcs/data-example-apple.yaml',
                        {'status': '200'})
        content = gcsObject.content(http).decode("utf-8")

        cloud_logger.info("Content {}".format(content))
        # First check that we get content
        self.assertEqual(content, self.content_string_apple)

        patcher = patch('googleapiclient.discovery.Resource')
        mock_resource = patcher.start()
        content = gcsObject.content(http).decode("utf-8")
        assert not mock_resource.objects.called
