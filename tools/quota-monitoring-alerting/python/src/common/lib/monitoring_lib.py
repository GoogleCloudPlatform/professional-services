# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Helper functions to interact with Cloud Monitoring timeseries data."""

import logging
import time

from google.cloud import monitoring_v3
from google.api_core import exceptions

from src.common.lib import gcp

_PROJECTS = 'projects/%s'


def gauge_int_timeseries(resource_type, resource_labels, metric_type,
                         metric_labels, value):
    """Build GAUGE INT timeseries object."""
    series = monitoring_v3.TimeSeries()
    series.metric.type = metric_type
    series.metric.labels.update(metric_labels)
    series.resource.type = resource_type
    series.resource.labels.update(resource_labels)
    series.metric_kind = 'GAUGE'
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10**9)
    interval = monitoring_v3.TimeInterval(
        {'end_time': {
            'seconds': seconds,
            'nanos': nanos
        }})
    point = monitoring_v3.Point({
        'interval':
        interval,
        'value':
        monitoring_v3.TypedValue(int64_value=value)
    })
    series.points = [point]
    return series


def write_time_series(host_project_id, series):
    """Write given timeseries to Cloud Monitoring."""
    client = monitoring_v3.MetricServiceClient()
    project_id = 'projects/%s' % host_project_id
    try:
        client.create_time_series(request={
            'name': project_id,
            'time_series': [series]
        })
        return True
    except exceptions.GoogleAPIError as err:
        logging.error(err)
        return False


def _extract_mql_timeseries_data(response):
    """Extract timeseries data from MQL query response.

    Args:
        response: dict, with 'timeSeriesDescriptor' & 'timeSeriesData'.

    Returns:
        dict, with metric timeseries data(resource & metric labels flattened).
    """
    lkeys = response['timeSeriesDescriptor'].get('labelDescriptors', [])
    # (fixme): Is there a better way to fetch and extract this data?
    for result in response.get('timeSeriesData', []):
        data = {}
        lvalues = result.get('labelValues', [])
        data = {
            key['key']: val.get('stringValue', '')
            for key, val in zip(lkeys, lvalues)
        }
        point_data = result.get('pointData', [])
        if not point_data:
            continue

        # Returns all points.
        for point in point_data:
            values = point.get('values', [])
            if not values:
                continue

            data.update(point['timeInterval'])
            value_types = []
            value_type_values = []
            for value in values:
                for key, val in value.items():
                    value_types.append(key)
                    value_type_values.append(val)
            data['metric_value_types'] = value_types
            data['metric_values'] = value_type_values
            yield data


def query_timeseries_mql(project_id, mql):
    """Query timeseries for a project using mql.

    Args:
        project_id: str, project id.
        mql: str, Cloud Monitoring MQL query.

    Returns:
        obj, that can be iterated to get metric timeseries data(dict).
    """
    project_name = _PROJECTS % project_id
    client = gcp.monitoring_service()
    # pylint:disable=no-member
    request = client.projects().timeSeries().query(name=project_name,
                                                   body={'query': mql})
    # pylint:enable=no-member
    response = gcp.execute_request(request)
    if response:
        return _extract_mql_timeseries_data(response)
    return []
