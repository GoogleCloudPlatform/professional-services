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


def datetime_to_epoch_timestamp(timestamp, micros=True):
    """
    This is a convienence function for converting datetime objects to
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        timestamp: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _UNIX_EPOCH = datetime.datetime(1970, 1, 1)
    _MILLISECONDS_PER_SECOND = 10**3
    _MICROSECONDS_PER_SECOND = 10**6

    if isinstance(timestamp, str):
        try:
            timestamp = datetime.datetime.strptime(timestamp,
                                                   '%Y-%m-%dT%H:%M:%S')
        except ValueError:
            timestamp = datetime.datetime.strptime(timestamp,
                                                   '%Y-%m-%dT%H:%M:%S.%f')

    seconds_since_epoch = (timestamp - _UNIX_EPOCH).total_seconds()

    multiplier = _MICROSECONDS_PER_SECOND if micros \
        else _MILLISECONDS_PER_SECOND

    return int(seconds_since_epoch * multiplier)


def date_to_epoch_date(date):
    """
    This is a convienence function for converting datetime objects to
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        date: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _UNIX_EPOCH = datetime.datetime(1970, 1, 1)

    if isinstance(date, str):
        date = datetime.datetime.strptime(date, '%Y-%m-%d')

    days_since_epoch = (date - _UNIX_EPOCH).days

    return int(days_since_epoch)


def time_to_epoch_time(time, micros=True):
    """
    This is a convienence function for converting datetime objects to
    timestamps in either milliseconds or microseconds since the Unix
    Epoch.
    Args:
        time: (datetime.datetime) to be converted.
        micros: (bool) should we use microsecond precision. Default behavior
            is millisecond precision. This should be dictated by the avsc file.
    """
    _MIDNIGHT = datetime.time(0, 0, 0)
    _MILLISECONDS_PER_SECOND = 10**3
    _MICROSECONDS_PER_SECOND = 10**6
    if isinstance(time, str):
        try:
            time = datetime.datetime.strptime(time, '%H:%M:%S').time()
        except ValueError:
            time = datetime.datetime.strptime(time, '%H:%M:%S.%f').time()

    _TODAY = datetime.date.today()

    seconds_since_midnight = (
        datetime.datetime.combine(_TODAY, time) -
        datetime.datetime.combine(_TODAY, _MIDNIGHT)).total_seconds()

    multiplier = _MICROSECONDS_PER_SECOND if micros \
        else _MILLISECONDS_PER_SECOND

    return int(seconds_since_midnight * multiplier)
