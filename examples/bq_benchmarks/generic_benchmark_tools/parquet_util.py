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


class ParquetUtil(object):
    """Helps with handling parquet files.

    Contains functionality that allows extraction of BigQuery tables to GCS in
    parquet format.

    Attributes:
        bq_schema(List[google.cloud.bigquery.schema.SchemaField]): schema of
            BigQuery table that will be extracted to an parquet file.

    """

    def __init__(self, bq_schema):
        self.bq_schema = bq_schema

    def get_pa_translated_schema(self):
        """Translates a BigQuery schema to an parquet schema.

        Returns: Translated parquet schema in pyarrow.Schema format.
        """

        type_conversions = {
            'STRING': pa.string(),
            'NUMERIC': pa.int64(),
        }

        # TODO(annarudy@google.com): add support for nested fields
        pa_schema_list = [
            pa.field(
                bq_field.name,
                type_conversions[bq_field.field_type],
            ) for bq_field in self.bq_schema
        ]

        return pa.schema(pa_schema_list)
