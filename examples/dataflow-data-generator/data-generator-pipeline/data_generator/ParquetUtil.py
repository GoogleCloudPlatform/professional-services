import pyarrow as pa
import logging
import json


def get_pyarrow_translated_schema(string_schema):
    type_conversions = {
        'STRING': pa.string(),
        'NUMERIC': pa.int64(),
        'BYTE': None,
        'INTEGER': pa.int64(),
        'FLOAT': pa.float64(),
        'NUMERIC': pa.int64(),
        'BOOLEAN': pa.bool_(),
        'TIMESTAMP': pa.timestamp('ms'),
        'DATE': pa.date32(),
        'TIME': pa.time64('us'),
        'DATETIME': pa.date64(),
        'GEOGRAPHY': None,
        'RECORD': None
    }
    pa_schema_list = []
    for field in string_schema:
        field_type = field['type']
        field_name = field['name']
        converted_field_type = type_conversions[field_type]
        if converted_field_type is None:
            logging.error('Error: json schema included a {0:s} field. BYTE,  '
                          'GEOGRAPHY, and RECORD types cannot be used when '
                          'outputting to parquet.'.format(field_type))
            raise ValueError('Error: json schema included a {0:s} field. BYTE, '
                             'GEOGRAPHY, and RECORD types cannot be used when '
                             'outputting to parquet.'.format(field_type))
        else:
            pa_field = pa.field(
                field_name,
                converted_field_type
            )
            pa_schema_list.append(pa_field)

    return pa.schema(pa_schema_list)

