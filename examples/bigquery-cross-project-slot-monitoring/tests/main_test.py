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

"""Tests handlers defined within main.py."""

from datetime import datetime
import mock
import os
import re
import unittest
import urlparse
import webapp2
import webtest
from google.appengine.ext import testbed

from bigquery_slots_monitoring import config
from bigquery_slots_monitoring import main


class HandlersTest(unittest.TestCase):
  """Tests handlers are set as expected."""
  def setUp(self):
    self.app = webtest.TestApp(main.app)

  @mock.patch.object(main.CopyMetrics, 'get', return_value=webapp2.Response())
  def testHandlersCopyMetrics(self, mock_get):
    self.app.get('/CopyMetrics')
    mock_get.assert_called_once_with()

  @mock.patch.object(main.FanInMetrics, 'get', return_value=webapp2.Response())
  def testHandlersFanInMetrics(self, mock_get):
    self.app.get('/FanInMetrics')
    mock_get.assert_called_once_with()


class FanInMetricsTest(unittest.TestCase):
  """Tests FanInMetrics GET handler logic."""

  def setUp(self):
    self.app = webtest.TestApp(main.app)
    self.testbed = testbed.Testbed()
    self.testbed.activate()
    self.testbed.init_datastore_v3_stub()
    self.testbed.init_memcache_stub()
    self.testbed.init_taskqueue_stub(
      root_path=os.path.join(os.path.dirname(__file__), '../'))
    self.taskqueue_stub = self.testbed.get_stub(
      testbed.TASKQUEUE_SERVICE_NAME)


  def tearDown(self):
    self.testbed.deactivate()

  def testFanInMetrics_NotCalledByCron(self):
    self.app.get('/FanInMetrics', status=403)

  @mock.patch.object(main.metrics, 'create_custom_metrics')
  @mock.patch.object(
    main.metrics, 'get_projects', return_value=['project1', 'project2'])
  def testFanInMetrics_Valid(self, mock_create_metrics, mock_get_projects):
    self.app.get(
      '/FanInMetrics',
      headers={'X-Appengine-Cron': 'Some cron'},
      status=200)

    mock_create_metrics.assert_called_once_with(config.BILLING_ACCOUNT)

    tasks = self.taskqueue_stub.get_filtered_tasks()

    self.assertEqual(len(tasks), 2)
    self.assertEqual(tasks[0].headers['X-AppEngine-QueueName'], 'copy-metrics')
    self.assertRegexpMatches(tasks[0].name, '^project1.*')
    self.assertEqual(tasks[0].method, 'GET')
    url = urlparse.urlparse(tasks[0].url)
    query = urlparse.parse_qs(url.query)
    self.assertEqual(url.path, '/CopyMetrics')
    self.assertDictEqual(
      query,
      {
        'src_project': ['project1'],
        'dst_project': [config.PROJECT_ID],
      })

    self.assertEqual(tasks[1].headers['X-AppEngine-QueueName'], 'copy-metrics')
    self.assertRegexpMatches(tasks[1].name, '^project2.*')
    self.assertEqual(tasks[1].method, 'GET')
    url = urlparse.urlparse(tasks[1].url)
    query = urlparse.parse_qs(url.query)
    self.assertEqual(url.path, '/CopyMetrics')
    self.assertDictEqual(
      query,
      {
        'src_project': ['project2'],
        'dst_project': [config.PROJECT_ID],
      })


class CopyMetricsTest(unittest.TestCase):
  """Tests CopyMetrics GET handler logic."""

  def setUp(self):
    self.app = webtest.TestApp(main.app)
    self.testbed = testbed.Testbed()
    self.testbed.activate()
    self.testbed.init_datastore_v3_stub()
    self.testbed.init_memcache_stub()

  def tearDown(self):
    self.testbed.deactivate()

  def testCopyMetrics_NotCalledByCloudTasks(self):
    self.app.get('/CopyMetrics', status=403)

  def testCopyMetrics_MissingParameters(self):
    self.app.get(
      '/CopyMetrics',
      headers={'X-AppEngine-QueueName': 'SomeQueue'},
      status=400)

  @mock.patch.object(main.metrics, 'copy_metrics')
  def testCopyMetrics_Valid(self, mock_copy_metrics):
    mocked_utcnow_value = datetime(2018, 1, 1, 12, 30, 30, 30)
    main.datetime = mock.MagicMock()
    main.datetime.utcnow.return_value = mocked_utcnow_value

    payload = {
      'src_project': 'srcProject',
      'dst_project': 'dstProject'
    }

    self.app.get(
      '/CopyMetrics',
      payload,
      headers={'X-AppEngine-QueueName': 'SomeQueue'},
      status=200)

    mock_copy_metrics.assert_called_with(
      payload['src_project'], payload['dst_project'], mocked_utcnow_value)

