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


class AvroUtil(object):
    """Helps with handling avro files.

    Contains functionality that allows extraction of BigQuery tables to GCS in
    avro format.

    Attributes:
        bq_schema(List[google.cloud.bigquery.schema.SchemaField]):
            schema of BigQuery table that will be extracted to an avro
            file.
        schema_name(str): name that will be given to the avro schema.

    """

    def __init__(self, bq_schema, schema_name):
        self.bq_schema = bq_schema
        self.schema_name = schema_name

    def get_avro_translated_schema(self):
        """Translates a BigQuery schema to an avro schema.

        Returns: Translated Avro schema.
        """
        type_conversions = {
            'STRING': 'string',
            'NUMERIC': {
                'type': 'bytes',
                'logicalType': 'decimal',
                'precision': 38,
                'scale': 9,
            }
        }

        fields = []
        # TODO(annarudy@google.com): add support for nested fields
        for bq_field in self.bq_schema:
            field_type = type_conversions[bq_field.field_type]

            field = {
                'name': bq_field.name,
                'type': field_type,
            }

            fields.append(field)

        schema_dict = {
            'type': 'record',
            'name': self.schema_name,
            'fields': fields,
        }
        avro_schema = avro.schema.Parse(json.dumps(schema_dict))

        return avro_schema
