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


import logging
import unittest
from data_generator.AvroUtil import fix_record_for_avro

class TestAvroFixer(unittest.TestCase):
    def test_fix_record_for_avro(self):

        schema = [
            {u'NAME':u'birthday', u'TYPE':'DATE'},
            {u'NAME':u'athlete', u'TYPE':'STRING'},
            {u'NAME':u'race_start_time', u'TYPE':'TIME'},
            {u'NAME':u'race_start_datetime', u'TYPE':'DATETIME'},
            {u'NAME':u'race_end_timestamp', u'TYPE':'TIMESTAMP'},
            {u'NAME':u'race_distance_m', u'TYPE':'INTEGER'},
            {u'NAME':u'time_seconds', u'TYPE':'FLOAT'},
            {u'NAME':u'is_world_record', u'TYPE':'BOOLEAN'}
        ]

        input_record = {
            u'birthday': '1988-12-17',
            u'athlete': 'David Rudisha',
            u'race_start_time': '20:20:00.00',
            u'race_start_datetime': '2012-09-08T20:20:00.00',
            u'race_end_timestamp': '2012-09-08T20:21:40.91',
            u'race_distance_m': 800,
            u'time_seconds': 100.91,
            u'is_world_record': True
        }
        
        expected_output = {
            u'birthday': 6925,
            u'athlete': 'David Rudisha',
            u'race_start_time': 73200000000L,
            u'race_start_datetime': 1347135600000000L,
            u'race_end_timestamp': 1347135700910000L,
            u'race_distance_m': 800,
            u'time_seconds': 100.91,
            u'is_world_record': True
        }

        output_record = fix_record_for_avro(input_record, schema)
        self.assertDictEqual(output_record, expected_output)     
        
        
if __name__ == '__main__':
    unittest.main()
