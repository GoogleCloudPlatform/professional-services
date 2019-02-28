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
                "mode": "REQUIRED"
            },
            {
                "type": "INTEGER",
                "name": "integer1",
                "mode": "REQUIRED"
            },
            {
                "type": "FLOAT",
                "name": "float1",
                "mode": "REQUIRED"
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
                pa.field('string1', pa.string()),
                pa.field('numeric1', pa.int64()),
                pa.field('integer1', pa.int64()),
                pa.field('float1', pa.float64()),
                pa.field('boolean1', pa.bool_()),
                pa.field('timestamp1', pa.timestamp('ms')),
                pa.field('date1', pa.date32()),
                pa.field('time1', pa.time64('us')),
                pa.field('datetime1', pa.date64()),
            ]
        )

        pyarrow_schema = get_pyarrow_translated_schema(string_input_schema)
        self.assertEqual(pyarrow_schema, expected_pa_schema)


if __name__ == '__main__':
    unittest.main()
