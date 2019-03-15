import json
import logging
import pyarrow as pa
import unittest
from data_generator.ParquetUtil import get_pyarrow_translated_schema, \
fix_record_for_parquet


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
                    type=pa.date64(),
                    nullable=False
                ),
                pa.field(
                    name='time1',
                    type=pa.time64('us'),
                    nullable=False
                ),
                pa.field(
                    name='datetime1',
                    type=pa.timestamp('ms'),
                    nullable=False
                )
            ]
        )

        pyarrow_schema = get_pyarrow_translated_schema(string_input_schema)
        self.assertEqual(pyarrow_schema, expected_pa_schema)

    def test_fix_record_for_parquet(self):
        input_schema = [
            {
                "type": "TIMESTAMP",
                "name": "timestamp1",
                "mode": "REQUIRED"
            },
            {
                "type": "DATETIME",
                "name": "datetime1",
                "mode": "REQUIRED"
            },
            {
                "type": "DATE",
                "name": "date1",
                "mode": "REQUIRED"
            }
        ]

        record = {
            'timestamp1': '2019-03-15T20:22:28',
            'datetime1': '2019-03-15T20:24:58',
            'date1': '2019-03-15',
            #  'time1': u'2012-09-08T20:20:00.00'
        }

        expected_output = {
            'timestamp1': 1552699348,
            'datetime1': 1552699498,
            'date1': 1552626000,
            #  'time1': u'2012-09-08T20:20:00.00'
        }

        output_record = fix_record_for_parquet(record, input_schema)
        self.assertEqual(expected_output, output_record)


if __name__ == '__main__':
    unittest.main()
