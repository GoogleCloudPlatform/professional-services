#! /usr/bin/env python3
# Copyright 2022 Google LLC
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
"""Sync GCE quota usage to Stackdriver for multiple projects.

This tool fetches global and/or regional quotas from the GCE API for
multiple projects, and sends them to Stackdriver as custom metrics, where they
can be used to set alert policies or create charts.
"""

import base64
import datetime
import json
import logging
import os
import time
import warnings

import click

from google.api_core.exceptions import GoogleAPIError
from google.api import label_pb2 as ga_label
from google.api import metric_pb2 as ga_metric
from google.cloud import monitoring_v3

import googleapiclient.discovery
import googleapiclient.errors

_BATCH_SIZE = 5
_METRIC_KIND = ga_metric.MetricDescriptor.MetricKind.GAUGE
_METRIC_TYPE_STEM = 'custom.googleapis.com/quota/'

_USAGE = "usage"
_LIMIT = "limit"
_UTILIZATION = "utilization"


def _add_series(project_id, series, client=None):
  """Write metrics series to Stackdriver.

  Args:
    project_id: series will be written to this project id's account
    series: the time series to be written, as a list of
        monitoring_v3.types.TimeSeries instances
    client: optional monitoring_v3.MetricServiceClient will be used
        instead of obtaining a new one
  """
  client = client or monitoring_v3.MetricServiceClient()
  project_name = client.common_project_path(project_id)
  if isinstance(series, monitoring_v3.types.TimeSeries):
    series = [series]
  try:
    client.create_time_series(name=project_name, time_series=series)
  except GoogleAPIError as e:
    raise RuntimeError('Error from monitoring API: %s' % e)


def _configure_logging(verbose=True):
  """Basic logging configuration.

  Args:
    verbose: enable verbose logging
  """
  level = logging.DEBUG if verbose else logging.INFO
  logging.basicConfig(level=level)
  warnings.filterwarnings('ignore', r'.*end user credentials.*', UserWarning)


def _fetch_quotas(project, region='global', compute=None):
  """Fetch GCE per - project or per - region quotas from the API.

  Args:
    project: fetch global or regional quotas for this project id
    region: which quotas to fetch, 'global' or region name
    compute: optional instance of googleapiclient.discovery.build will be used
        instead of obtaining a new one
  """
  compute = compute or googleapiclient.discovery.build('compute', 'v1')
  try:
    if region != 'global':
      req = compute.regions().get(project=project, region=region)
    else:
      req = compute.projects().get(project=project)
    resp = req.execute()
    return resp['quotas']
  except (GoogleAPIError, googleapiclient.errors.HttpError) as e:
    logging.debug('API Error: %s', e, exc_info=True)
    raise RuntimeError('Error fetching quota (project: %s, region: %s)' %
                       (project, region))


def _get_series(metric_labels, value, metric_type, timestamp, dt=None):
  """Create a Stackdriver monitoring time series from value and labels.

  Args:
    metric_labels: dict with labels that will be used in the time series
    value: time series value
    metric_type: which metric is this series for
    dt: datetime.datetime instance used for the series end time
  """
  series = monitoring_v3.types.TimeSeries()
  series.metric.type = metric_type
  series.resource.type = 'global'
  for label in metric_labels:
    series.metric.labels[label] = metric_labels[label]
  point = monitoring_v3.types.Point()
  point.value.double_value = value

  seconds = int(timestamp)
  nanos = int((timestamp - seconds) * 10**9)
  interval = monitoring_v3.TimeInterval(
      {"end_time": {
          "seconds": seconds,
          "nanos": nanos
      }})
  point.interval = interval

  series.points.append(point)
  return series


def _quota_to_series_triplet(project, region, quota):
  """Convert API quota objects to three Stackdriver monitoring time series: usage, limit and utilization 

  Args:
    project: set in converted time series labels
    region: set in converted time series labels
    quota: quota object received from the GCE API
  """
  labels = dict()
  labels['project'] = project
  labels['region'] = region

  try:
    utilization = quota['usage'] / float(quota['limit'])
  except ZeroDivisionError:
    utilization = 0
  now = time.time()
  metric_type_prefix = _METRIC_TYPE_STEM + quota['metric'].lower() + '_'
  return [
      _get_series(labels, quota['usage'], metric_type_prefix + _USAGE, now),
      _get_series(labels, quota['limit'], metric_type_prefix + _LIMIT, now),
      _get_series(labels, utilization, metric_type_prefix + _UTILIZATION, now),
  ]


@click.command()
@click.option('--monitoring-project', required=True,
              help='monitoring project id')
@click.option('--gce-project', multiple=True,
              help='project ids (multiple), defaults to monitoring project')
@click.option('--gce-region', multiple=True,
              help='regions (multiple), defaults to "global"')
@click.option('--verbose', is_flag=True, help='Verbose output')
@click.argument('keywords', nargs=-1)
def main_cli(monitoring_project=None, gce_project=None, gce_region=None,
             verbose=False, keywords=None):
  """Fetch GCE quotas and writes them as custom metrics to Stackdriver.

  If KEYWORDS are specified as arguments, only quotas matching one of the
  keywords will be stored in Stackdriver.
  """
  try:
    _main(monitoring_project, gce_project, gce_region, verbose, keywords)
  except RuntimeError:
    logging.exception('exception raised')


def main(event, context):
  """Cloud Function entry point."""
  try:
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))
    _main(os.environ.get('GCP_PROJECT'), **data)
  # uncomment once https://issuetracker.google.com/issues/155215191 is fixed
  # except RuntimeError:
  #  raise
  except Exception:
    logging.exception('exception in cloud function entry point')


def _main(monitoring_project, gce_project=None, gce_region=None, verbose=False,
          keywords=None):
  """Module entry point used by cli and cloud function wrappers."""
  _configure_logging(verbose=verbose)
  gce_projects = gce_project or [monitoring_project]
  gce_regions = gce_region or ['global']
  keywords = set(keywords or [])
  logging.debug('monitoring project %s', monitoring_project)
  logging.debug('projects %s regions %s', gce_projects, gce_regions)
  logging.debug('keywords %s', keywords)
  quotas = []
  compute = googleapiclient.discovery.build('compute', 'v1',
                                            cache_discovery=False)
  for project in gce_projects:
    logging.debug('project %s', project)
    for region in gce_regions:
      logging.debug('region %s', region)
      for quota in _fetch_quotas(project, region, compute=compute):
        if keywords and not any(k in quota['metric'] for k in keywords):
          # logging.debug('skipping %s', quota)
          continue
        logging.debug('quota %s', quota)
        quotas.append((project, region, quota))
  client, i = monitoring_v3.MetricServiceClient(), 0

  x = len(quotas)
  while i < len(quotas):
    series = sum(
        [_quota_to_series_triplet(*q) for q in quotas[i:i + _BATCH_SIZE]], [])
    _add_series(monitoring_project, series, client)
    i += _BATCH_SIZE


if __name__ == '__main__':
  main_cli()
