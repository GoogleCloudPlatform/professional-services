import json
import logging
import pyarrow as pa
import unittest
from data_generator.ParquetUtil import get_pyarrow_translated_schema


class TestPyarrowSchemaTranslator(unittest.TestCase):
    def test_get_pyarrow_translated_schema(self):

        string_input_schema = [
            {
                "type": "STRING",
                "name": "string1",
                "mode": "REQUIRED"
            },
            {
                "type": "NUMERIC",
                "name": "numeric1",
                "mode": "NULLABLE"
            },
            {
                "type": "INTEGER",
                "name": "integer1",
                "mode": "REQUIRED"
            },
            {
                "type": "FLOAT",
                "name": "float1",
                "mode": "NULLABLE"
            },
            {
                "type": "BOOLEAN",
                "name": "boolean1",
                "mode": "REQUIRED"
            },
            {
                "type": "TIMESTAMP",
                "name": "timestamp1",
                "mode": "REQUIRED"
            },
            {
                "type": "DATE",
                "name": "date1",
                "mode": "REQUIRED"
            },
            {
                "type": "TIME",
                "name": "time1",
                "mode": "REQUIRED"
            },
            {
                "type": "DATETIME",
                "name": "datetime1",
                "mode": "REQUIRED"
            }
        ]
        expected_pa_schema = pa.schema(
            [
                pa.field(
                    name='string1',
                    type=pa.string(),
                    nullable=False
                ),
                pa.field(
                    name='numeric1',
                    type=pa.int64(),
                    nullable=True
                ),
                pa.field(
                    name='integer1',
                    type=pa.int64(),
                    nullable=False
                ),
                pa.field(
                    name='float1',
                    type=pa.float64(),
                    nullable=True
                ),
                pa.field(
                    name='boolean1',
                    type=pa.bool_(),
                    nullable=False
                ),
                pa.field(
                    name='timestamp1',
                    type=pa.timestamp('ms'),
                    nullable=False
                ),
                pa.field(
                    name='date1',
                    type=pa.date32(),
                    nullable=False
                ),
                pa.field(
                    name='time1',
                    type=pa.time64('us'),
                    nullable=False
                ),
                pa.field(
                    name='datetime1',
                    type=pa.date64(),
                    nullable=False
                )
            ]
        )

        pyarrow_schema = get_pyarrow_translated_schema(string_input_schema)
        self.assertEqual(pyarrow_schema, expected_pa_schema)

    def test_date_time_converter(self):
        timestamp = '2014-09-27 12:30:00.45-8:00'


if __name__ == '__main__':
    unittest.main()
