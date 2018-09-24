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

"""Helper functions."""

from datetime import datetime
import json
import logging
import pytz


def log_http_error(function, error):
  """Logs HTTP handled exception.

  Args:
    function: Function where this failed, for logging reference
      (e.g: get_projects).
    error: HttpError object.
  """

  content = json.loads(error.content)['error']
  logging.error('HTTP error at %s: code=%d, status=%s, message=%s', function,
                error.resp.status, content['status'], content['message'])


def date_string_to_object_utc(date_string):
  """Converts a RFC3339 date string to a datetime object as UTC.

  Args:
    date_string: RFC 3339 date string (e.g: 2017-12-27T00:00:00Z).

  Returns:
    Corresponding datetime object with timezone set to UTC.
  """
  return pytz.utc.localize(datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%SZ'))


def date_object_to_rfc3339(date):
  """Converts a datetime object to a RFC3339 date string.

  Args:
    date: Date object (e.g datetime.datetime(2017, 12, 27 , 0, 0, 0, 0)).

  Returns:
    Corresponding RFC3339 date string (e.g: 2017-12-27T00:00:00Z).
  """
  return date.strftime('%Y-%m-%dT%H:%M:%SZ')
