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


import os
import unittest
from unittest.mock import patch
from unittest.mock import MagicMock
from unittest.mock import PropertyMock

import main


class MainTest(unittest.TestCase):
    def setUp(self):
        os.environ['OBJECT_TO_WATCH'] = "test-folder"

    @patch('main.process_finalize')
    @patch('main.create_gcs_object')
    @patch('main.create_gke_cluster')
    def test_will_process_finalize(self, mock_gke_cluster,
                                   mock_gcs_object, mock_process_finalize):
        data = {
            "bucket": "test-bucket",
            "name": "test-folder/test-file.yaml"
        }
        context = MagicMock()
        event_type = PropertyMock(
            return_value='google.storage.object.finalize')

        type(context).event_type = event_type

        main.gcs_trigger(data, context)
        assert mock_process_finalize.called

    @patch('main.process_finalize')
    @patch('main.create_gcs_object')
    @patch('main.create_gke_cluster')
    def test_will_not_process_finalize(self, mock_gke_cluster,
                                       mock_gcs_object, mock_process_finalize):
        data = {
            "bucket": "test-bucket",
            "name": "test-file.yaml"
        }
        context = MagicMock()
        event_type = PropertyMock(
            return_value='google.storage.object.finalize')

        type(context).event_type = event_type

        main.gcs_trigger(data, context)
        assert not mock_process_finalize.called

    @patch('main.process_delete')
    @patch('main.create_gcs_object')
    @patch('main.create_gke_cluster')
    def test_will_process_delete(self, mock_gke_cluster,
                                 mock_gcs_object, mock_process_delete):
        data = {
            "bucket": "test-bucket",
            "name": "test-folder/test-file.yaml"
        }
        context = MagicMock()
        event_type = PropertyMock(
            return_value='google.storage.object.delete')

        type(context).event_type = event_type

        main.gcs_trigger(data, context)
        assert mock_process_delete.called

    @patch('main.process_delete')
    @patch('main.create_gcs_object')
    @patch('main.create_gke_cluster')
    def test_will_not_process_delete(self, mock_gke_cluster,
                                     mock_gcs_object, mock_process_delete):
        data = {
            "bucket": "test-bucket",
            "name": "test-file.yaml"
        }
        context = MagicMock()
        event_type = PropertyMock(
            return_value='google.storage.object.delete')

        type(context).event_type = event_type

        main.gcs_trigger(data, context)
        assert not mock_process_delete.called
