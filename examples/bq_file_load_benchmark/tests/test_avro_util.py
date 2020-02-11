from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import json

import avro.schema
import unittest

from google.cloud import bigquery

from bq_file_load_benchmark.generic_benchmark_tools import avro_util


class TestAvroUtil(unittest.TestCase):
    """Tests functionality of load_benchmark_tools.avro_util.AvroUtil.

    Attributes:
        avro_util(load_benchmark_tools.AvroUtil): avro utility class to be tested.
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
        self.avro_util = avro_util.AvroUtil(
            bq_schema=bq_schema,
            schema_name=self.schema_name
        )

    def test_get_avro_translated_schema(self):
        """Tests AvroUtil.get_avro_translated_schema().

        Tests AvroUtil's ability to translate a BigQuery schema to an Avro
        schema.

        Returns:
            True if test passes, else False.
        """
        avro_translated_schema = self.avro_util.get_avro_translated_schema()
        expected_schema_dict = {
            'fields': [
                {
                    'type': 'string',
                    'name': 'string1'
                },
                {
                    'type': {
                        'logicalType': 'decimal',
                        'scale': 9,
                        'type': 'bytes',
                        'precision': 38
                    },
                    'name': 'numeric1'
                }
            ],
            'type': 'record',
            'name': 'test_schema'
        }
        expected_avro_schema = avro.schema.parse(
            json.dumps(expected_schema_dict)
        )
        assert avro_translated_schema == expected_avro_schema
