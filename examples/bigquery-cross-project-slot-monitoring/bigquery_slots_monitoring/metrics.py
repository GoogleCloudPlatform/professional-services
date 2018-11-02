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

"""Cross-project metrics fan-in logic."""

from datetime import datetime
from datetime import timedelta
import logging
import pytz
import re

from bigquery_slots_monitoring import constants
from bigquery_slots_monitoring import helpers
from bigquery_slots_monitoring import schema
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def get_projects(billing_account):
  """Gets list of projects using a billing account ID.

  Args:
    billing_account: Billing account ID (e.g: 123456-123456-123456).

  Returns:
    List of project IDs using specifed billing account ID.
  """

  service = build('cloudbilling', 'v1')
  request = service.billingAccounts().projects().list(
      name='billingAccounts/%s' % billing_account)
  try:
    response = request.execute()
    return [
        i['projectId'].encode('utf-8') for i in response['projectBillingInfo']
    ]
  except HttpError as error:
    helpers.log_http_error('get_projects', error)
    return []


def create_custom_metrics(project):
  """Creates custom metrics in case missing.

  Args:
    project: Project ID to create custom metrics within.
  """

  def missing_custom_metrics():
    """Gets list of custom metrics that are not created.

    Returns:
      List of custom metrics that are not created.
      E.g: ['custom.googleapis.com/someMetric'].
    """

    # All custom metrics start with a known prefix.
    request = service.projects().metricDescriptors().list(
        name='projects/%s' % project,
        filter='metric.type = starts_with("%s")' %
        constants.CUSTOM_METRICS_PREFIX,
    )

    try:
      response = request.execute()

      # We only want to take the metric kind.
      custom_metrics = [
          re.sub(
              r'^projects/[^/]+/metricDescriptors/',
              '', m['name'].encode('utf-8'))
          for m in response['metricDescriptors']
      ] if 'metricDescriptors' in response else []

      # Keep only custom metrics we want, that do not currently exist.
      return set(constants.CUSTOM_METRICS_MAP.keys()).difference(custom_metrics)

    except HttpError as error:
      helpers.log_http_error('missing_custom_metrics', error)
      return []

  def create_custom_metric(custom_metric):
    """Creates a custom metric under specified project.

    Metric specifications taken from constants.CUSTOM_METRICS_MAP.

    Args:
      custom_metric: Metric to create. e.g: custom.googleapis.com/someMetric.
    """

    request = service.projects().metricDescriptors().create(
        name='projects/%s' % project,
        body={
            'type':
                custom_metric,
            'metricKind':
                constants.CUSTOM_METRICS_MAP[custom_metric]['metricKind'],
            'valueType':
                constants.CUSTOM_METRICS_MAP[custom_metric]['valueType']
        })

    try:
      request.execute()
    except HttpError as error:
      helpers.log_http_error('create_custom_metric', error)

  service = build('monitoring', 'v3')
  for custom_metric in missing_custom_metrics():
    create_custom_metric(custom_metric)
    logging.info('Created custom metric=%s', custom_metric)


def copy_metrics(src_project, dst_project, utc_now):
  """Copies metrics from source to destination project.

  Uses Monitoring API to get data points from src_project and write them
  into dst_project.

  Loops through all metrics defined under constants.py. For each metric,
  gets all data points and writes to the corresponding custom metric in the
  destination project.

  When getting data points, checks for latest data point taken as a start time
  for the query. Otherwise, gets data points for the last 24h. This is because
  inserting data points older than 24h is not possible.

  Args:
    src_project: Source project ID.
    dst_project: Destination project ID.
    utc_now: Date time object in UTC timezone. Optional, used for testing.
  """

  def record_last_point(time_series):
    """Records latest data point from time series into Datastore."""

    date = time_series['points'][-1]['interval']['endTime']
    metric_type = time_series['metric']['type']

    entity = schema.LastPoints.query(
        schema.LastPoints.project_id == src_project,
        schema.LastPoints.metric == metric_type
    ).fetch()

    if entity:
      entity[0].date = date
      entity[0].put()
    else:
      schema.LastPoints(
          project_id=src_project, metric=metric_type, date=date).put()

  def read_last_point(metric):
    """Reads last data point from Datastore. Returns None if not found."""
    entity = schema.LastPoints.query(
        schema.LastPoints.project_id == src_project,
        schema.LastPoints.metric == metric
    ).fetch()

    return entity[0].date if entity else None

  def get_time_series(metric):
    """Gets time series (data points) for metric and project."""

    # Start time is 24h at latest, or endTime of latest data point retrieved.
    start_time = read_last_point(metric) or helpers.date_object_to_rfc3339(
        utc_now - timedelta(days=1))
    end_time = helpers.date_object_to_rfc3339(utc_now)

    logging.info('Getting time series: metric=%s, startTime=%s, endTime=%s',
                 metric, start_time, end_time)

    request = service.projects().timeSeries().list(
        name='projects/%s' % src_project,
        interval_startTime=start_time,
        interval_endTime=end_time,
        filter='metric.type = "%s"' % metric)

    try:
      response = request.execute()
      return response['timeSeries'][0] if 'timeSeries' in response else None
    except HttpError as error:
      helpers.log_http_error('get_time_series', error)
      return None

  def write_time_series(custom_metric, time_series):
    """Writes time series to custom metric."""

    deadline = pytz.utc.localize(utc_now) - timedelta(hours=24)
    body = {
        'timeSeries': [{
            'resource': {
                'type': 'global',
                'labels': {},
            },
            'metric': {
                'type': custom_metric,
                'labels': {
                    'project_id': src_project,
                },
            },
            'metricKind':
                constants.CUSTOM_METRICS_MAP[custom_metric]['metricKind'],
            'valueType':
                constants.CUSTOM_METRICS_MAP[custom_metric]['valueType'],
        }],
    }

    for point in time_series['points']:
      logging.info(
          'Processing datapoint: project=%s, metric=%s, value=%s, '
          'startTime=%s, endTime=%s',
          src_project, custom_metric, point['value']['int64Value'],
          point['interval']['startTime'], point['interval']['endTime'])

      # Even though we never ask for data points older than 24h, having this
      # here for another layer of safety.
      if helpers.date_string_to_object_utc(point['interval']['endTime']) < deadline:
        logging.info('Skipping too late data point.')
        continue

      try:
        body['timeSeries'][0]['points'] = [point]
        request = service.projects().timeSeries().create(
            name='projects/%s' % dst_project, body=body)

        request.execute()
      except HttpError as error:
        helpers.log_http_error('write_time_series', error)

  logging.info('Copying metrics from project=%s', src_project)
  service = build('monitoring', 'v3')

  for metric in constants.SOURCE_TO_CUSTOM_MAP.keys():
    logging.info('Working on metric=%s', metric)

    time_series = get_time_series(metric)
    if time_series:
      time_series['points'].reverse()
      write_time_series(constants.SOURCE_TO_CUSTOM_MAP[metric], time_series)
      record_last_point(time_series)
