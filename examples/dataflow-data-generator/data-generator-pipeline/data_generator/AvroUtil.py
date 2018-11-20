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

import datetime

def datetime_to_avro_timestamp(dt, micros=True):
    """
    This is a convienence function for converting datetime objects to 
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        dt: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _UNIX_EPOCH = datetime.datetime(1970, 1, 1)
    _MILLISECONDS_PER_SECOND = 10 ** 3
    _MICROSECONDS_PER_SECOND = 10 ** 6

    if isinstance(dt, unicode):
        try:
            dt = datetime.datetime.strptime(dt, '%Y-%m-%dT%H:%M:%S')
        except:
            dt = datetime.datetime.strptime(dt, '%Y-%m-%dT%H:%M:%S.%f')
            
    seconds_since_epoch = (dt - _UNIX_EPOCH).total_seconds()

    multiplier = _MICROSECONDS_PER_SECOND if micros else _MILLISECONDS_PER_SECOND

    return long(seconds_since_epoch * multiplier)

def date_to_avro_date(dt):
    """
    This is a convienence function for converting datetime objects to 
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        dt: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _UNIX_EPOCH = datetime.datetime(1970, 1, 1)

    if isinstance(dt, unicode):
       dt = datetime.datetime.strptime(dt, '%Y-%m-%d')
            
    days_since_epoch = (dt - _UNIX_EPOCH).days

    return int(days_since_epoch)

def time_to_avro_time(t, micros=True):
    """
    This is a convienence function for converting datetime objects to 
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        dt: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _MIDNIGHT = datetime.time(0, 0, 0) 
    _MILLISECONDS_PER_SECOND = 10 ** 3
    _MICROSECONDS_PER_SECOND = 10 ** 6
    if isinstance(t, unicode):
        try:
            t = datetime.datetime.strptime(t, '%H:%M:%S').time()
        except:
            t = datetime.datetime.strptime(t, '%H:%M:%S.%f').time()

    _TODAY = datetime.date.today()        

    seconds_since_midnight = (datetime.datetime.combine(_TODAY,t) 
                              - datetime.datetime.combine(_TODAY, 
                                    _MIDNIGHT)).total_seconds()

    multiplier = _MICROSECONDS_PER_SECOND if micros else _MILLISECONDS_PER_SECOND

    return long(seconds_since_midnight * multiplier)

def fix_record_for_avro(record, avro_schema):
    for field in avro_schema.fields:
        field_name = field.name
        datatype_union = field.type.to_json()
        if isinstance(datatype_union[1], dict):
            logical_type = datatype_union[1].get(u'logical_type', None)
            if logical_type:
                if logical_type.find('-') > -1:
                    logical_prefix, precision = logical_type.split('-')
                else:
                    logical_prefix = logical_type
                    precision = None
                if logical_prefix == u'timestamp': 
                    is_micros = (precision == u'micros') 
                    record[field_name] = datetime_to_avro_timestamp(record[field_name],
                                            micros=is_micros)
                elif logical_type == u'date':
                    record[field_name] = date_to_avro_date(record[field_name])
                elif logical_prefix == u'time':
                    record[field_name] = time_to_avro_time(record[field_name])
    return [record]
