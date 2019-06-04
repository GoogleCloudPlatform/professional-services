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

import avro.schema
import json
import logging
import unittest

from data_generator.AvroUtil import fix_record_for_avro

class TestAvroFixer(unittest.TestCase):
    def test_fix_record_for_avro(self):

        avro_schema = avro.schema.parse(
            json.dumps({
                 u'type': u'record',
                 u'name': u'AthleticsWorldRecords',
                 u'fields': [
                    {u'name': u'birthday', 
                    u'type': [u'null', 
                        {u'logicalType': u'date', u'type': u'int'}]},
                    {u'name': u'athlete', u'type':'string'},
                    {u'name': u'race_start_time', 
                    u'type': [u'null', 
                        {u'logicalType': u'time-micros', u'type': u'long'}]},
                    {u'name':u'race_start_datetime',
                    u'type': [u'null', 
                        {u'logicalType': u'timestamp-millis', u'type': u'long'}]},
                    {u'name':u'race_end_timestamp', 
                    u'type': [u'null', 
                        {u'logicalType': u'timestamp-micros', u'type': u'long'}]},
                    {u'name':u'race_distance_m', u'type':'int'},
                    {u'name':u'time_seconds', u'type':'float'},
                    {u'name':u'is_world_record', u'type':'boolean'},
                    {u'name':u'rival_record', u'type':
                        {u'type': u'record', u'name': u'RivalAthlete', u'fields':[
                            {u'name': u'birthday', 
                            u'type': [u'null', 
                                {u'logicalType': u'date', u'type': u'int'}]},
                            {u'name': u'athlete', u'type':'string'},
                            {u'name': u'race_start_time', 
                            u'type': [u'null', 
                                {u'logicalType': u'time-micros', u'type': u'long'}]},
                            {u'name':u'race_start_datetime',
                            u'type': [u'null', 
                                {u'logicalType': u'timestamp-millis', u'type': u'long'}]},
                            {u'name':u'race_end_timestamp', 
                            u'type': [u'null', 
                                {u'logicalType': u'timestamp-micros', u'type': u'long'}]},
                            {u'name':u'race_distance_m', u'type':'int'},
                            {u'name':u'time_seconds', u'type':'float'},
                            {u'name':u'is_world_record', u'type':'boolean'}
                        ]}
                        }
                 ] 
            })
        )
        input_record = {
            u'birthday': u'1988-12-17',
            u'athlete': u'David Rudisha',
            u'race_start_time': u'20:20:00.00',
            u'race_start_datetime': u'2012-09-08T20:20:00.00',
            u'race_end_timestamp': u'2012-09-08T20:21:40.91',
            u'race_distance_m': 800,
            u'time_seconds': 100.91,
            u'is_world_record': True,
            u'rival_record':{
                u'birthday': u'1995-06-15',
                u'athlete': u'Emmanuel Kipkurui Korir',
                u'race_start_time': u'20:20:00.00',
                u'race_start_datetime': u'2018-07-22T20:20:00.00',
                u'race_end_timestamp': u'2018-07-22T20:21:42.05',
                u'race_distance_m': 800,
                u'time_seconds': 102.05,
                u'is_world_record': False
            }
        }
        
        expected_output = [{
            u'birthday': 6925,
            u'athlete': u'David Rudisha',
            u'race_start_time': 73200000000L,
            u'race_start_datetime': 1347135600000L,
            u'race_end_timestamp': 1347135700910000L,
            u'race_distance_m': 800,
            u'time_seconds': 100.91,
            u'is_world_record': True,
            u'rival_record':{
                u'birthday': 9296,
                u'athlete': u'Emmanuel Kipkurui Korir',
                u'race_start_time': 73200000000L,
                u'race_start_datetime':1532290800000L, 
                u'race_end_timestamp':1532290902050000L ,
                u'race_distance_m': 800,
                u'time_seconds': 102.05,
                u'is_world_record': False
            }
        }]

        output_record = fix_record_for_avro(input_record, avro_schema)
        self.assertDictEqual(output_record[0], expected_output[0])     
        
        
if __name__ == '__main__':
    unittest.main()
