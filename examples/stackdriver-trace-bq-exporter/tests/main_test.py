#Copyright 2019 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.

"""Tests for main."""

import json
import os
import unittest
from cloud_function import main

from google.cloud.trace_v1.proto import trace_pb2
from google.protobuf import timestamp_pb2


_EXPORT_LOG_FILE_PATH = '/tmp/export_log_file'


class TestMainMethods(unittest.TestCase):
    """Main test methods"""

    def tearDown(self):
        if os.path.exists(_EXPORT_LOG_FILE_PATH):
            os.remove(_EXPORT_LOG_FILE_PATH)

    def test_write_local_export_log(self):
        last_read_timestamp = timestamp_pb2.Timestamp()
        last_read_timestamp.GetCurrentTime()
        trace_count = 10
        expected_entry = {
            'timestamp_micros': last_read_timestamp.ToMicroseconds(),
            'trace_insert_count': trace_count
        }

        main._write_local_export_log_file(
            _EXPORT_LOG_FILE_PATH,
            last_read_timestamp,
            trace_count
        )

        with open(_EXPORT_LOG_FILE_PATH, 'r') as log_file:
            data = log_file.read()
            parsed_data = json.loads(data)
            self.assertDictEqual(expected_entry, parsed_data)


    def test_determine_last_read_ts(self):
        old_timestamp = timestamp_pb2.Timestamp()
        old_timestamp.FromMicroseconds(1565634371016226)
        new_timestamp = timestamp_pb2.Timestamp()
        new_timestamp.GetCurrentTime()

        trace_span = trace_pb2.TraceSpan()
        trace_span.end_time.CopyFrom(new_timestamp)
        self.assertEqual(
            new_timestamp,
            main._determine_last_read_timestamp(old_timestamp, trace_span)
        )

        trace_span.end_time.CopyFrom(old_timestamp)
        self.assertEqual(
            new_timestamp,
            main._determine_last_read_timestamp(new_timestamp, trace_span)
        )


    def test_parse_span(self):
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromMicroseconds(1565634371016226)

        trace_span = trace_pb2.TraceSpan()
        trace_span.name = 'test'
        trace_span.parent_span_id = 54321
        trace_span.start_time.CopyFrom(timestamp)
        trace_span.end_time.CopyFrom(timestamp)
        trace_span.span_id = 12345
        trace_span.labels['key1'] = 'value1'
        trace_span.labels['key2'] = 'value2'

        expected_dict = {
            'name': 'test',
            'parent_span_id': 54321,
            'start_time_micros': 1565634371016226,
            'end_time_micros': 1565634371016226,
            'span_id': 12345,
            'milliseconds': 0,
            'labels': [
                {'key': 'key1', 'value': 'value1'},
                {'key': 'key2', 'value': 'value2'}
            ]
        }

        self.assertDictEqual(
            expected_dict,
            main._parse_span(trace_span)
        )


if __name__ == '__main__':
    unittest.main()
