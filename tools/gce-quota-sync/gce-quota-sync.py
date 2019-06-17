#!/usr/bin/env python
#
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

"""Simple tool to sync quota usage from the GCE API to Stackdriver.

This tool fetches global and optionally regional quotas from the GCE API
and sends them to Stackdriver as custom metrics, where they can be used
to set alert policies or create charts.
"""

import datetime
import logging
import warnings

import click

from google.api_core.exceptions import GoogleAPIError
from google.cloud import monitoring_v3

import googleapiclient.discovery
import googleapiclient.errors


_BATCH_SIZE = 5
_LOGGER = logging.getLogger('quota-metrics')
_METRIC_KIND = monitoring_v3.enums.MetricDescriptor.MetricKind.GAUGE
_METRIC_TYPE = 'custom.googleapis.com/quota/gce'


class Error(Exception):
  pass


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
  project_name = client.project_path(project_id)
  if isinstance(series, monitoring_v3.types.TimeSeries):
    series = [series]
  try:
    client.create_time_series(project_name, series)
  except GoogleAPIError as e:
    raise Error('Error from monitoring API: %s' % e)


def _configure_logging(verbose=True, stackdriver_logging=False):
  """Basic logging configuration.

  Args:
    verbose: enable verbose logging
    stackdriver_logging: enable Stackdriver logging
  """
  logging.basicConfig(level=logging.ERROR)
  level = logging.DEBUG if verbose else logging.INFO
  logging.getLogger(_LOGGER.name).setLevel(level)
  warnings.filterwarnings('ignore', r'.*end user credentials.*', UserWarning)
  if stackdriver_logging:
    import google.cloud.logging
    client = google.cloud.logging.Client()
    client.setup_logging(log_level=level)


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
    _LOGGER.debug('API Error: %s', e, exc_info=True)
    raise Error('Error fetching quota (project: %s, region: %s)' %
                (project, region))


def _get_series(metric_labels, value, metric_type=_METRIC_TYPE, dt=None):
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
  point = series.points.add()
  point.value.double_value = value
  point.interval.end_time.FromDatetime(dt or datetime.datetime.utcnow())
  return series


def _quota_to_series(project, region, quota):
  """Convert API quota objects to Stackdriver monitoring time series.

  Args:
    project: set in converted time series labels
    region: set in converted time series labels
    quota: quota object received from the GCE API
  """
  labels = dict((k, str(v)) for k, v in quota.items() if k != 'usage')
  labels['project'] = project
  labels['region'] = region
  try:
    value = quota['usage'] / quota['limit']
  except ZeroDivisionError:
    value = 0
  return _get_series(labels, float(value))


@click.command()
@click.option('--project', required=True, help='GCP project id')
@click.option('--gce-regions', help='GCE regions, comma separated')
@click.option('--stackdriver-logging', is_flag=True, default=False,
              help='Send logs to Stackdriver')
@click.option('--verbose', is_flag=True, help='Verbose output')
def main(project=None, gce_regions=None, verbose=False, **kw):
  "Fetch, convert, and write quotas for project and optional regions."
  _configure_logging(verbose=verbose)
  regions = ['global']
  if gce_regions:
    regions += gce_regions.split(',')
  quotas = []
  try:
    compute = googleapiclient.discovery.build(
        'compute', 'v1', cache_discovery=False)
    # Fetch quotas for global + defined regions.
    for region in regions:
      _LOGGER.debug('fetching project quota for %s %s', project, region)
      for quota in _fetch_quotas(project, region, compute=compute):
        quotas.append((region, quota))
    # Convert quotas to series, write to Stackdriver using naive batching.
    client, i = monitoring_v3.MetricServiceClient(), 0
    while i < len(quotas):
      series = [_quota_to_series(project, *q)
                for q in quotas[i:i + _BATCH_SIZE]]
      _add_series(project, series, client)
      i += _BATCH_SIZE
  except Error as e:
    _LOGGER.critical(e.message)


if __name__ == '__main__':
  main(auto_envvar_prefix='OPT')
