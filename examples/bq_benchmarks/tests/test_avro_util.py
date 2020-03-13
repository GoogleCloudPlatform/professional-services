# Copyright 2018 Google Inc.
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

import json

import avro.schema
import unittest

from google.cloud import bigquery

from bq_benchmarks.generic_benchmark_tools import avro_util


class TestAvroUtil(unittest.TestCase):
    """Tests functionality of load_benchmark_tools.avro_util.AvroUtil.

    Attributes:
        avro_util(load_benchmark_tools.AvroUtil): avro utility class to be
            tested.
        schema_name(str): name that will be given to the test avro schema.

    """

    def setUp(self):
        """Sets up resources for tests.
        """
        bq_schema = [
            bigquery.SchemaField('string1', 'STRING', 'REQUIRED'),
            bigquery.SchemaField('numeric1', 'NUMERIC', 'REQUIRED')
        ]
        self.schema_name = 'test_schema'
        self.avro_util = avro_util.AvroUtil(bq_schema=bq_schema,
                                            schema_name=self.schema_name)

    def test_get_avro_translated_schema(self):
        """Tests AvroUtil.get_avro_translated_schema().

        Tests AvroUtil's ability to translate a BigQuery schema to an Avro
        schema.

        Returns:
            True if test passes, else False.
        """
        avro_translated_schema = self.avro_util.get_avro_translated_schema()
        expected_schema_dict = {
            'fields': [{
                'type': 'string',
                'name': 'string1'
            }, {
                'type': {
                    'logicalType': 'decimal',
                    'scale': 9,
                    'type': 'bytes',
                    'precision': 38
                },
                'name': 'numeric1'
            }],
            'type':
            'record',
            'name':
            'test_schema'
        }
        expected_avro_schema = avro.schema.Parse(
            json.dumps(expected_schema_dict))
        assert avro_translated_schema == expected_avro_schema
