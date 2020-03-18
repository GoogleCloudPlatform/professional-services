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
import unittest
import datetime
from data_generator.ParquetUtil import get_pyarrow_translated_schema, \
fix_record_for_parquet


class TestParquetUtil(unittest.TestCase):
    def test_get_pyarrow_translated_schema(self):

        string_input_schema = {
            "fields": [{
                "type": "STRING",
                "name": "string1",
                "mode": "REQUIRED"
            }, {
                "type": "NUMERIC",
                "name": "numeric1",
                "mode": "NULLABLE"
            }, {
                "type": "INTEGER",
                "name": "integer1",
                "mode": "REQUIRED"
            }, {
                "type": "FLOAT",
                "name": "float1",
                "mode": "NULLABLE"
            }, {
                "type": "BOOLEAN",
                "name": "boolean1",
                "mode": "REQUIRED"
            }, {
                "type": "TIMESTAMP",
                "name": "timestamp1",
                "mode": "REQUIRED"
            }, {
                "type": "DATE",
                "name": "date1",
                "mode": "REQUIRED"
            }, {
                "type": "TIME",
                "name": "time1",
                "mode": "REQUIRED"
            }, {
                "type": "DATETIME",
                "name": "datetime1",
                "mode": "REQUIRED"
            }, {
                "type":
                "RECORD",
                "name":
                "record1",
                "mode":
                "REPEATED",
                "fields": [{
                    "type": "BOOLEAN",
                    "name": "boolean1",
                    "mode": "REQUIRED"
                }, {
                    "type": "TIMESTAMP",
                    "name": "timestamp1",
                    "mode": "REQUIRED"
                }]
            }]
        }
        expected_pa_schema = pa.schema([
            pa.field(name='string1', type=pa.string()
                     #nullable=False
                     ),
            pa.field(name='numeric1', type=pa.int64()
                     #nullable=True
                     ),
            pa.field(
                name='integer1',
                type=pa.int64(),
                #nullable=False
            ),
            pa.field(name='float1', type=pa.float64()
                     #nullable=True
                     ),
            pa.field(name='boolean1', type=pa.bool_()
                     #nullable=False
                     ),
            pa.field(name='timestamp1',
                     type=pa.timestamp('us')
                     #nullable=False
                     ),
            pa.field(
                name='date1',
                type=pa.date32(),
                #nullable=False
            ),
            pa.field(name='time1', type=pa.time64('us')
                     #nullable=False
                     ),
            pa.field(name='datetime1',
                     type=pa.timestamp('us')
                     #nullable=False
                     ),
            pa.field(
                name='record1',
                type=pa.list_(
                    pa.struct([
                        pa.field(name='boolean1',
                                 type=pa.bool_()
                                 #nullable=False
                                 ),
                        pa.field(name='timestamp1',
                                 type=pa.timestamp('us')
                                 #nullable=False
                                 )
                    ])))
        ])

        pyarrow_schema = get_pyarrow_translated_schema(string_input_schema)
        self.assertEqual(pyarrow_schema, expected_pa_schema)

    def test_fix_record_for_parquet(self):
        input_schema = [{
            "type": "TIMESTAMP",
            "name": "timestamp1",
            "mode": "REQUIRED"
        }, {
            "type": "DATETIME",
            "name": "datetime1",
            "mode": "REQUIRED"
        }, {
            "type": "DATE",
            "name": "date1",
            "mode": "REQUIRED"
        }, {
            "type": "TIME",
            "name": "time1",
            "mode": "REQUIRED"
        }, {
            "type":
            "RECORD",
            "name":
            "record1",
            "mode":
            "REPEATED",
            "fields": [{
                "type": "TIMESTAMP",
                "name": "timestamp1",
                "mode": "REQUIRED"
            }]
        }]

        record = {
            'timestamp1': '2019-03-15T20:22:28',
            'datetime1': '2019-03-15T20:24:58',
            'date1': '2019-03-15',
            'time1': '20:20:00.00',
            'record1': [{
                'timestamp1': '2019-03-15T20:22:28',
            }]
        }

        expected_output = [{
            'timestamp1': 1552681348000000,
            'datetime1': 1552681498000000,
            'date1': 17970,
            'time1': datetime.time(20, 20),
            'record1': [{
                'timestamp1': 1552681348000000
            }]
        }]

        output_record = fix_record_for_parquet(record, input_schema)
        self.assertEqual(output_record, expected_output)


if __name__ == '__main__':
    unittest.main()
