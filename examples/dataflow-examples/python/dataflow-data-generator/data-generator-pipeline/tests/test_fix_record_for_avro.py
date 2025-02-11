# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import fastavro
import json
import logging
import unittest

from data_generator.AvroUtil import fix_record_for_avro


class TestAvroFixer(unittest.TestCase):
    def test_fix_record_for_avro(self):

        fastavro_schema = fastavro.parse_schema({
            'type':
            'record',
            'name':
            'AthleticsWorldRecords',
            'fields': [{
                'name': 'birthday',
                'type': ['null', {
                    'logicalType': 'date',
                    'type': 'int'
                }]
            }, {
                'name': 'athlete',
                'type': 'string'
            }, {
                'name':
                'race_start_time',
                'type':
                ['null', {
                    'logicalType': 'time-micros',
                    'type': 'long'
                }]
            }, {
                'name':
                'race_start_datetime',
                'type':
                ['null', {
                    'logicalType': 'timestamp-millis',
                    'type': 'long'
                }]
            }, {
                'name':
                'race_end_timestamp',
                'type':
                ['null', {
                    'logicalType': 'timestamp-micros',
                    'type': 'long'
                }]
            }, {
                'name': 'race_distance_m',
                'type': 'int'
            }, {
                'name': 'time_seconds',
                'type': 'float'
            }, {
                'name': 'is_world_record',
                'type': 'boolean'
            }, {
                'name': 'rival_record',
                'type': {
                    'type':
                    'record',
                    'name':
                    'RivalAthlete',
                    'fields': [{
                        'name':
                        'birthday',
                        'type':
                        ['null', {
                            'logicalType': 'date',
                            'type': 'int'
                        }]
                    }, {
                        'name': 'athlete',
                        'type': 'string'
                    }, {
                        'name':
                        'race_start_time',
                        'type': [
                            'null', {
                                'logicalType': 'time-micros',
                                'type': 'long'
                            }
                        ]
                    }, {
                        'name':
                        'race_start_datetime',
                        'type': [
                            'null', {
                                'logicalType': 'timestamp-millis',
                                'type': 'long'
                            }
                        ]
                    }, {
                        'name':
                        'race_end_timestamp',
                        'type': [
                            'null', {
                                'logicalType': 'timestamp-micros',
                                'type': 'long'
                            }
                        ]
                    }, {
                        'name': 'race_distance_m',
                        'type': 'int'
                    }, {
                        'name': 'time_seconds',
                        'type': 'float'
                    }, {
                        'name': 'is_world_record',
                        'type': 'boolean'
                    }]
                }
            }]
        })
        input_record = {
            'birthday': '1988-12-17',
            'athlete': 'David Rudisha',
            'race_start_time': '20:20:00.00',
            'race_start_datetime': '2012-09-08T20:20:00.00',
            'race_end_timestamp': '2012-09-08T20:21:40.91',
            'race_distance_m': 800,
            'time_seconds': 100.91,
            'is_world_record': True,
            'rival_record': {
                'birthday': '1995-06-15',
                'athlete': 'Emmanuel Kipkurui Korir',
                'race_start_time': '20:20:00.00',
                'race_start_datetime': '2018-07-22T20:20:00.00',
                'race_end_timestamp': '2018-07-22T20:21:42.05',
                'race_distance_m': 800,
                'time_seconds': 102.05,
                'is_world_record': False
            }
        }

        expected_output = [{
            'birthday': 6925,
            'athlete': 'David Rudisha',
            'race_start_time': 73200000000,
            'race_start_datetime': 1347135600000,
            'race_end_timestamp': 1347135700910000,
            'race_distance_m': 800,
            'time_seconds': 100.91,
            'is_world_record': True,
            'rival_record': {
                'birthday': 9296,
                'athlete': 'Emmanuel Kipkurui Korir',
                'race_start_time': 73200000000,
                'race_start_datetime': 1532290800000,
                'race_end_timestamp': 1532290902050000,
                'race_distance_m': 800,
                'time_seconds': 102.05,
                'is_world_record': False
            }
        }]

        output_record = fix_record_for_avro(input_record, fastavro_schema)
        self.assertDictEqual(output_record[0], expected_output[0])


if __name__ == '__main__':
    unittest.main()
