from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
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
        avro_schema = avro.schema.parse(json.dumps(schema_dict))

        return avro_schema
