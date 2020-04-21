# Copyright 2019 Google LLC.
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

"""Tests for the bigquery module."""

from __future__ import absolute_import
from __future__ import print_function

from ml_dataprep import bqclient
from unittest import TestCase

class TestBqClient(TestCase):

    _bq_client = bqclient.BqClient()

    def test_build_table_uri(self):
        table_uri = self._bq_client.build_table_uri(
            'my_project_id', 'my_dataset', 'mytable')
        assert table_uri == 'my_project_id.my_dataset.mytable'
