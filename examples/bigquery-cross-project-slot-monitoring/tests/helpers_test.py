# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests handlers defined within helpers.py."""

from datetime import datetime
import pytz
import unittest

from bigquery_slots_monitoring import helpers


class DateStringToObjectUTCTest(unittest.TestCase):
  """Tests conversion of date string to date object in UTC timezone."""

  def testDateStringToObjectUTC(self):
    date_string = '2017-12-27T00:00:00Z'
    self.assertEqual(
      helpers.date_string_to_object_utc(date_string),
      pytz.utc.localize(datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%SZ')))


class DateObjectToRFC3339Test(unittest.TestCase):
  """Tests extraction of RFC3339 compliant date string from date object."""

  def testDateObjectToRFC3339(self):
    date = datetime(2017, 12, 27, 12, 0, 30)
    self.assertEqual(helpers.date_object_to_rfc3339(date), '2017-12-27T12:00:30Z')
