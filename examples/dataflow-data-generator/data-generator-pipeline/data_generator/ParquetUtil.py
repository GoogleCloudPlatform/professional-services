import pyarrow as pa
import logging
import time


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
        'DATE': pa.date64(),
        'TIME': pa.time64('us'),
        'DATETIME': pa.timestamp('ms'),
        'GEOGRAPHY': None,
        'RECORD': None
    }
    pa_schema_list = []
    for field in string_schema:
        field_type = field['type']
        field_name = field['name']
        field_mode = field['mode']
        converted_field_type = type_conversions[field_type]
        if converted_field_type is None:
            error_message = 'Error: json schema included a {0:s} field. ' \
                            'BYTE, GEOGRAPHY, and RECORD types cannot ' \
                            'currently be used when outputting to ' \
                            'parquet.'.format(field_type)
            logging.error(error_message)
            raise ValueError(error_message)
        else:
            nullable = False if field_mode == 'REQUIRED' else True
            pa_field = pa.field(
                name=field_name,
                type=converted_field_type
            #    nullable=nullable
            )
            pa_schema_list.append(pa_field)

    return pa.schema(pa_schema_list)


def timestamp_to_parquet_timestamp(timestamp):
    pattern = '%Y-%m-%dT%H:%M:%S'
    epoch = int(time.mktime(time.strptime(timestamp, pattern)))
    return epoch


def date_to_parquet_date(date):
    pattern = '%Y-%m-%d'
    epoch = int(time.mktime(time.strptime(date, pattern)))
    return epoch


def time_to_parquet_time(time):
    pattern = '%H:%M:%S'
    epoch = int(time.mktime(time.strptime(time, pattern)))
    return epoch


def fix_record_for_parquet(record, schema):
    for field in schema:
        field_name = field["name"]
        if field["type"] in ("TIMESTAMP", "DATETIME"):
            record[field_name] = timestamp_to_parquet_timestamp(
                record[field_name]
            )
        elif field["type"] == "DATE":
            record[field_name] = date_to_parquet_date(
                record[field_name]
            )
        elif field["type"] == "TIME":
            record[field_name] = time_to_parquet_time(
                record[field_name]
            )

    return [record]
