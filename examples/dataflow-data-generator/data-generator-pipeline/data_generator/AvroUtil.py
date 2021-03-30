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

import avro.schema
import fastavro
import json
from .TimeUtil import datetime_to_epoch_timestamp, date_to_epoch_date, \
time_to_epoch_time


def fix_record_for_avro(record, avro_schema):
    for field in avro_schema['fields']:
        field_name = field['name']
        datatype = field['type']
        if isinstance(datatype, dict):
            # This is a record type definition so we need to recurse a level deeper.
            record[field_name] = fix_record_for_avro(
                record[field_name], fastavro.parse_schema(datatype))[0]
        elif isinstance(datatype, list) and isinstance(datatype[1], dict):
            logical_type = datatype[1].get('logicalType', None)
            if logical_type:
                if logical_type.find('-') > -1:
                    logical_prefix, precision = logical_type.split('-')
                else:
                    logical_prefix = logical_type
                    precision = None
                if logical_prefix == 'timestamp':
                    is_micros = (precision == 'micros')
                    record[field_name] = datetime_to_epoch_timestamp(
                        record[field_name], micros=is_micros)
                elif logical_type == 'date':
                    record[field_name] = date_to_epoch_date(record[field_name])
                elif logical_prefix == 'time':
                    is_micros = (precision == 'micros')

                    record[field_name] = time_to_epoch_time(record[field_name],
                                                            micros=is_micros)
    return [record]
