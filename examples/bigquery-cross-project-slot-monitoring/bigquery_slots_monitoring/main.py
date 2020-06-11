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

"""Main application called from app.yaml."""

from datetime import datetime
from bigquery_slots_monitoring import config
from bigquery_slots_monitoring import helpers
from bigquery_slots_monitoring import metrics

import webapp2
from google.appengine.api import taskqueue


class FanInMetrics(webapp2.RequestHandler):
  """Fan in metrics from all projects into a central Stackdriver account.

  Makes sure all custom metrics are created.
  Discovering all projects associated with billing account.
  All metrics are written to a central Stackdriver account.

  Each project is processed individually within a different task. This is to
  help making this scalable across many projects. Otherwise, this call might
  take long and timeout.

  This is based on configuration set in config.py, and metrics in constants.py.
  """

  def get(self):
    """Handler for doing metrics fan-in for all projects."""

    # Can only be accessed by cron.
    if self.request.headers.get('X-Appengine-Cron') is None:
      self.error(403)
      return

    metrics.create_custom_metrics(config.PROJECT_ID)
    date_string = helpers.date_object_to_rfc3339(datetime.now())

    for src_project in metrics.get_projects(config.BILLING_ACCOUNT):
      taskqueue.add(
          queue_name='copy-metrics',
          name=filter(str.isalnum, '%s%s' % (src_project, date_string)),
          url='/CopyMetrics',
          method='GET',
          params={
              'src_project': src_project,
              'dst_project': config.PROJECT_ID,
          })


class CopyMetrics(webapp2.RequestHandler):
  """Copies metrics from a single project to a single Stackdriver account."""

  def get(self):
    src_project = self.request.get('src_project')
    dst_project = self.request.get('dst_project')

    # Can only be called from Cloud Tasks.
    if self.request.headers.get('X-AppEngine-QueueName') is None:
      self.error(403)
      return

    if not src_project or not dst_project:
      self.error(400)
      return

    metrics.copy_metrics(src_project, dst_project, datetime.utcnow())


app = webapp2.WSGIApplication([
    ('/CopyMetrics', CopyMetrics),
    ('/FanInMetrics', FanInMetrics),
])
