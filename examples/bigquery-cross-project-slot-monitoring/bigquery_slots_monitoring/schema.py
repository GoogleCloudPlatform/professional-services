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

"""Datastore schema definition."""

from google.appengine.ext import ndb


class LastPoints(ndb.Model):
  """Last data points retrieved per metric per project.

  Used to specify time range for getting latest data points.
  Time range is latest data point till current time (UTC).

  In this schema, it is expected to have one entry per project_id
  and metric. That is, instead of appending new entries, the date
  property will be updated.

  project_id: Project ID from which data point was received
    (e.g: my-project).
  metric: Metric corresponding to data point
    (e.g: bigquery.googleapis.com/slots/total_available).
  date: Date string (RFC3339) of data point's end time
    (e.g: 2018-01-01T00:00:00.00Z).
  """

  project_id = ndb.StringProperty()
  metric = ndb.StringProperty()
  date = ndb.StringProperty()
