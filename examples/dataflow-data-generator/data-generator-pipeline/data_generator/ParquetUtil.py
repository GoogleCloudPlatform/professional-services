# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import pyarrow as pa
import logging
import datetime
from .TimeUtil import datetime_to_epoch_timestamp, date_to_epoch_date, \
time_to_epoch_time


def get_pyarrow_translated_schema(string_schema):
    """
    Converts string schema dict to pyarrow schema for writing to parquet.
    :param string_schema:
    :return: pyarrow schema
    """
    def _bq_to_pa_type(field):
        """
        A function to convert BigQuery types to pyarrow types.
        :param field (bigquery.schema.SchemaField)
        :return: pa.DataType
        """
        type_conversions = {
            'STRING': pa.string(),
            'NUMERIC': pa.int64(),
            'BYTE': None,
            'INTEGER': pa.int64(),
            'FLOAT': pa.float64(),
            'BOOLEAN': pa.bool_(),
            'TIMESTAMP': pa.timestamp('us'),
            'DATE': pa.date32(),
            'TIME': pa.time64('us'),
            'DATETIME': pa.timestamp('us'),
            'GEOGRAPHY': None,
        }

        try:
            if field['mode'] == 'REPEATED':
                if field['type'] == 'RECORD':
                    nested_fields = field['fields']
                    # Recursively call to convert the next nested layer.
                    return pa.list_(
                        pa.struct([(fld['name'], _bq_to_pa_type(fld))
                                   for fld in nested_fields]))
                else:
                    return pa.list_(
                        _bq_to_pa_type(type_conversions[field['type']]))
            elif field['type'] == 'RECORD':
                nested_fields = field['fields']
                # Recursively call to convert the next nested layer.
                return pa.struct([(fld['name'], _bq_to_pa_type(fld))
                                  for fld in nested_fields])
            else:
                return type_conversions.get(field.get('type'))
        except KeyError as err:
            raise KeyError(
                """Type {} is not a valid BigQuery type and not supported by this
                utility.""".format(field['type']))

    pa_schema_list = []
    for field in string_schema['fields']:
        field_type = field['type']
        field_name = field['name']
        field_mode = field['mode']
        converted_type = _bq_to_pa_type(field)
        if converted_type is None:
            error_message = 'Error: json schema included a {0:s} field. ' \
                            'BYTE, and GEOGRAPHY  types cannot ' \
                            'currently be used when outputting to ' \
                            'parquet.'.format(field_type)
            logging.error(error_message)
            raise ValueError(error_message)
        else:
            nullable = False if field_mode == 'REQUIRED' else True
            pa_field = pa.field(name=field_name,
                                type=converted_type
                                #nullable=nullable
                                )
            pa_schema_list.append(pa_field)

    return pa.schema(pa_schema_list)


def fix_record_for_parquet(record, schema):
    """
    Converts TIMESTAMP, DATETIME, DATE, and TIME types to their respective
    types for parquet compatibility.
    :param record: record of data from beam pipeline
    :param schema: string schema dict.
    :return: record with converted TIMESTAMP, DATETIME, DATE, and/or TIME
    fields.
    """
    def _fix_primitive(record, field):
        """
        Converts the a value in the field in the record for parquet
        compatibility. This is mainly to consistently repeated types.
        :param record: record from data from beam pipeline.
        :param field: (bigquery.schema.SchemaField) to convert.
        """
        field_name = field['name']
        if field['type'] in ('TIMESTAMP', 'DATETIME'):
            record[field_name] = int(
                datetime_to_epoch_timestamp(record[field_name]))
        elif field['type'] == 'DATE':
            record[field_name] = int(date_to_epoch_date(record[field_name]))
        elif field['type'] == 'TIME':
            try:
                record[field_name] = datetime.datetime.strptime(
                    record[field_name], '%H:%M:%S').time()
            except ValueError:
                record[field_name] = datetime.datetime.strptime(
                    record[field_name], '%H:%M:%S.%f').time()
        return record[field_name]

    schema = schema['fields'] if isinstance(schema, dict) else schema
    for field in schema:
        field_name = field['name']
        if field['mode'] == 'REPEATED':
            fixed_array = []
            for value in record[field_name]:
                if field['type'] == 'RECORD':
                    record[field_name] = fix_record_for_parquet(
                        value, field['fields'])
                else:
                    fixed_array.append(_fix_primitive(value, field))
                    record[field_name] = fixed_array
        else:
            if field['type'] == 'RECORD':
                record[field_name] = fix_record_for_parquet(
                    record[field_name], field['fields'])
            else:
                record[field_name] = _fix_primitive(record, field)
    return [record]
