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

import pyarrow as pa
import unittest

from google.cloud import bigquery

from bq_benchmarks.generic_benchmark_tools import parquet_util


class TestParquetUtil(unittest.TestCase):
    """Tests functionality of load_benchmark_tools.parquet_util.ParquetUtil.

    Attributes:
        parquet_util(load_benchmark_tools.ParquetUtil): parquet utility class to be
            tested.
    """

    def setUp(self):
        """Sets up resources for tests.
        """
        bq_schema = [
            bigquery.SchemaField('string1', 'STRING', 'REQUIRED'),
            bigquery.SchemaField('numeric1', 'NUMERIC', 'REQUIRED')
        ]
        self.parquet_util = parquet_util.ParquetUtil(bq_schema=bq_schema)

    def test_get_parquet_translated_schema(self):
        """Tests ParquetUtil.get_pa_translated_schema().

        Tests ParquetUtil's ability to translate a BigQuery schema to PyArrow
            schema for parquet.

        Returns:
            True if test passes, else False.
        """
        parquet_translated_schema = self.parquet_util.get_pa_translated_schema()
        expected_pa_schema = pa.schema([
            pa.field('string1', pa.string()),
            pa.field('numeric1', pa.int64())
        ])
        assert parquet_translated_schema == expected_pa_schema
