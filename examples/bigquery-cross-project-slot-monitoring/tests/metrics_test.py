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

"""Tests metrics logic defined within metrics.py."""

from datetime import datetime, timedelta
import mock
import unittest

from google.appengine.ext import ndb
from google.appengine.ext import testbed

from bigquery_slots_monitoring import constants
from bigquery_slots_monitoring import helpers
from bigquery_slots_monitoring import metrics
from bigquery_slots_monitoring import schema


class GetProjectsTest(unittest.TestCase):
  """Tests getting projects associated with a billing account."""

  @mock.patch.object(metrics, 'build')
  def testGetProjects_Valid(self, mock_build):
    mocked_result = {
      'projectBillingInfo': [
        {
          'projectId': u'project1',
        },
        {
          'projectId': u'project2',
        },
      ]
    }
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = mocked_result.__getitem__
    (mock_build.return_value
      .billingAccounts.return_value
      .projects.return_value
      .list.return_value
      .execute.return_value) = mock_dict

    self.assertEqual(
      metrics.get_projects('anything'), ['project1', 'project2'])


class CreateCustomMetricsTest(unittest.TestCase):
  """Tests creation of custom metrics if not existing."""

  @mock.patch.object(metrics, 'build')
  def testCreateCustomMetrics_AllMetricsMissing(self, mock_build):
    # Mocking no existing metrics are found, means all will be created.
    mocked_existing_metrics_result = {}
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = (
      mocked_existing_metrics_result.__getitem__)
    (mock_build.return_value
      .projects.return_value
      .metricDescriptors.return_value
      .list.return_value
      .execute.return_value) = mock_dict

    metrics.create_custom_metrics('someProject')

    # To test this, we assert a call was made to create each of
    # the custom metrics defined within constants.py.
    for metric in constants.CUSTOM_METRICS_MAP.keys():
      mock_build().projects().metricDescriptors().create.assert_called_once_with(
        name='projects/someProject',
        body={
          'type': metric,
          'metricKind': constants.CUSTOM_METRICS_MAP[metric]['metricKind'],
          'valueType': constants.CUSTOM_METRICS_MAP[metric]['valueType'],
        })

  @mock.patch.object(metrics, 'build')
  def testCreateCustomMetrics_NoMetricsMissing(self, mock_build):
    # Mocking that all metrics were found in API response.
    mocked_existing_metrics_result = {
      'metricDescriptors': [
        {
          'name': 'projects/some_project_id/metricDescriptors/%s' % m
        }
        for m in constants.CUSTOM_METRICS_MAP.keys()
      ]
    }
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = (
      mocked_existing_metrics_result.__getitem__)
    (mock_build.return_value
      .projects.return_value
      .metricDescriptors.return_value
      .list.return_value
      .execute.return_value) = mock_dict

    metrics.create_custom_metrics('someProject')

    # Accordingly, no call is expected to create any custom metric.
    mock_build().projects().metricDescriptors().create().assert_not_called()


class CopyMetricsTest(unittest.TestCase):
  """Tests copy of metrics from one project to another."""

  def setUp(self):
    self.testbed = testbed.Testbed()
    self.testbed.activate()
    self.testbed.init_datastore_v3_stub()
    self.testbed.init_memcache_stub()

  def tearDown(self):
    ndb.delete_multi(schema.LastPoints.query().fetch(keys_only=True))
    self.testbed.deactivate()

  @mock.patch.object(metrics, 'build')
  def testCopyMetrics_NoLastPointRecorded(self, mock_build):
    # Mock response to API call requesting new data points.
    source_metric = constants.SOURCE_TO_CUSTOM_MAP.keys()[0]
    custom_metric = constants.SOURCE_TO_CUSTOM_MAP[source_metric]
    utc_now = datetime.utcnow()
    datapoint_time = helpers.date_object_to_rfc3339(utc_now)
    point = {
      'interval': {
        'startTime': datapoint_time,
        'endTime': datapoint_time,
      },
      'value': {
        'int64Value': '1.0',
      },
    }
    mocked_list_result = {
      'timeSeries': [{
        'metric': {
          'type': source_metric,
        },
        'points': [point],
      }],
    }
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = (mocked_list_result.__getitem__)
    (mock_build.return_value
      .projects.return_value
      .timeSeries.return_value
      .list.return_value
      .execute.return_value) = mocked_list_result

    metrics.copy_metrics('srcProject', 'dstProject', utc_now)

    # Asset the call to get new data points for each metric.
    # When there is no entry in LastPoint, start time should be 24 hours ago.
    start_time = helpers.date_object_to_rfc3339(utc_now - timedelta(days=1))
    end_time = helpers.date_object_to_rfc3339(utc_now)
    for metric in constants.SOURCE_TO_CUSTOM_MAP.keys():
      mock_build().projects().timeSeries().list.assert_called_once_with(
        name='projects/srcProject',
        interval_startTime=start_time,
        interval_endTime=end_time,
        filter='metric.type = "%s"' % metric)
    # Assert the call to write the data points.
    mock_build().projects().timeSeries().create.assert_called_once_with(
      name='projects/dstProject',
      body={
        'timeSeries': [{
          'resource': {
            'type': 'global',
            'labels': {},
          },
          'metric': {
            'type': custom_metric,
            'labels': {
              'project_id': 'srcProject',
            },
          },
          'metricKind':
            constants.CUSTOM_METRICS_MAP[custom_metric]['metricKind'],
          'valueType':
            constants.CUSTOM_METRICS_MAP[custom_metric]['valueType'],
          'points': [point],
        }],
      })
    # Assert last point was recorded in datastore.
    self.assertTrue(
      schema.LastPoints.query(
        schema.LastPoints.project_id == 'srcProject',
        schema.LastPoints.metric == source_metric,
        schema.LastPoints.date == datapoint_time).fetch())

  @mock.patch.object(metrics, 'build')
  def testCopyMetrics_LastPointExists(self, mock_build):
    source_metric = constants.SOURCE_TO_CUSTOM_MAP.keys()[0]
    custom_metric = constants.SOURCE_TO_CUSTOM_MAP[source_metric]
    utc_now = datetime.utcnow()
    last_datapoint_time = helpers.date_object_to_rfc3339(
      utc_now - timedelta(minutes=5))
    new_datapoint_time = helpers.date_object_to_rfc3339(utc_now)
    # Create a last point record.
    schema.LastPoints(
      project_id='srcProject',
      metric=source_metric,
      date=last_datapoint_time,
    ).put()
    # Mock response to API call requesting new data points.

    point = {
      'interval': {
        'startTime': new_datapoint_time,
        'endTime': new_datapoint_time,
      },
      'value': {
        'int64Value': '1.0',
      },
    }
    mocked_list_result = {
      'timeSeries': [{
        'metric': {
          'type': source_metric,
        },
        'points': [point],
      }],
    }
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = (mocked_list_result.__getitem__)
    (mock_build.return_value
      .projects.return_value
      .timeSeries.return_value
      .list.return_value
      .execute.return_value) = mocked_list_result

    metrics.copy_metrics('srcProject', 'dstProject', utc_now)

    # Asset the call to get new data points for each metric.
    # When there is no entry in LastPoint, start time should be 24 hours ago.
    start_time = helpers.date_object_to_rfc3339(utc_now - timedelta(days=1))
    end_time = helpers.date_object_to_rfc3339(utc_now)
    for metric in constants.SOURCE_TO_CUSTOM_MAP.keys():
      mock_build().projects().timeSeries().list.assert_called_once_with(
        name='projects/srcProject',
        interval_startTime=last_datapoint_time,
        interval_endTime=end_time,
        filter='metric.type = "%s"' % metric)
    # Assert the call to write the data points.
    mock_build().projects().timeSeries().create.assert_called_once_with(
      name='projects/dstProject',
      body={
        'timeSeries': [{
          'resource': {
            'type': 'global',
            'labels': {},
          },
          'metric': {
            'type': custom_metric,
            'labels': {
              'project_id': 'srcProject',
            },
          },
          'metricKind':
            constants.CUSTOM_METRICS_MAP[custom_metric]['metricKind'],
          'valueType':
            constants.CUSTOM_METRICS_MAP[custom_metric]['valueType'],
          'points': [point],
        }],
      })
    # Assert last point was recorded in datastore.
    self.assertTrue(
      schema.LastPoints.query(
        schema.LastPoints.project_id == 'srcProject',
        schema.LastPoints.metric == source_metric,
        schema.LastPoints.date == new_datapoint_time).fetch())

  @mock.patch.object(metrics, 'build')
  def testCopyMetrics_NoNewDatapoints(self, mock_build):
    # Mock response to API call requesting new data points.
    mocked_list_result = {}
    mock_dict = mock.MagicMock()
    mock_dict.__getitem__.side_effect = (mocked_list_result.__getitem__)
    (mock_build.return_value
      .projects.return_value
      .timeSeries.return_value
      .list.return_value
      .execute.return_value) = mocked_list_result

    utc_now = datetime.utcnow()
    metrics.copy_metrics('srcProject', 'dstProject', utc_now)

    # Asset the call to get new data points for each metric.
    # When there is no entry in LastPoint, start time should be 24 hours ago.
    start_time = helpers.date_object_to_rfc3339(utc_now - timedelta(days=1))
    end_time = helpers.date_object_to_rfc3339(utc_now)
    for metric in constants.SOURCE_TO_CUSTOM_MAP.keys():
      mock_build().projects().timeSeries().list.assert_called_once_with(
        name='projects/srcProject',
        interval_startTime=start_time,
        interval_endTime=end_time,
        filter='metric.type = "%s"' % metric)
    # Assert no call was made to write data points.
    mock_build().projects().timeSeries().create.assert_not_called()
    # Assert no last point was recorded in datastore.
    self.assertFalse(schema.LastPoints.query().fetch())
