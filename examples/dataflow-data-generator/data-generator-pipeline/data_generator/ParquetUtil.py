import pyarrow as pa


def get_pyarrow_translated_schema(json_schema):
    type_conversions = {
        'STRING': pa.string(),
        'NUMERIC': pa.int64(),
        'BYTE': None,
        'INTEGER': pa.int64(),
        'FLOAT': pa.float64(),
        'NUMERIC': pa.int64(),
        'BOOLEAN': pa.bool_(),
        'TIMESTAMP': pa.timestamp(),
        'DATE': pa.date32(),
        'TIME': pa.time64(),
        'DATETIME': pa.date64(),
        'GEOGRAPHY': None,
        'RECORD': None
    }
    pa_schema_list = []
    for json_field in json_schema:
        pa_field = pa.field(
            json_field.name,
            type_conversions[json_field.field_type]
        )
        pa_schema_list.append(pa_field)

    return pa.schema(pa_schema_list)
