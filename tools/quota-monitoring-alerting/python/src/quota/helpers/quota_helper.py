# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Helper functions to query quota limits and usage details."""

import itertools
import logging

from src.common.lib import monitoring_lib

_MQL = """
fetch consumer_quota
| filter resource.service =~ '.*'
| { usage:
      metric serviceruntime.googleapis.com/quota/allocation/usage
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      | align next_older(1d)
      | group_by [resource.service, resource.project_id, resource.location,
           metric.quota_metric]
  ; limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      | align next_older(1d)
      | group_by [resource.service, resource.project_id, resource.location,
           metric.quota_metric, metric.limit_name] }
| join
| value [usage: val(0), limit: val(1), div(val(0), val(1)).mul(100)]
"""

_MQL_ALL = """
fetch consumer_quota
| filter resource.service =~ '.*'
| { usage: metric serviceruntime.googleapis.com/quota/allocation/usage
    | filter resource.project_id = '%s'
    | align next_older(1d)
    | group_by [resource.service, resource.project_id, resource.location,
         metric.quota_metric]
  ; limit: metric serviceruntime.googleapis.com/quota/limit
    | filter resource.project_id = '%s'
    | align next_older(1d)
    | group_by [resource.service, resource.project_id, resource.location,
         metric.quota_metric, metric.limit_name] }
| join
| value [usage: val(0), limit: val(1), div(val(0), val(1)).mul(100)]
"""

_MQL_RATE = """
fetch consumer_quota
| filter resource.service =~ '.*'
| { rate_usage:
      metric serviceruntime.googleapis.com/quota/rate/net_usage
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      | align next_older(1d)
      | group_by
          [resource.service, resource.project_id, resource.location,
           metric.quota_metric]
  ; limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      | align next_older(1d)
      | group_by
          [resource.service, resource.project_id, resource.location,
           metric.quota_metric, metric.limit_name] }
| join
| value [usage: val(0), limit: val(1), div(val(0), val(1)).mul(100)]
"""

_MQL_RATE_ALL = """
fetch consumer_quota
| filter resource.service =~ '.*'
| { rate_usage:
      metric serviceruntime.googleapis.com/quota/rate/net_usage
      | filter resource.project_id = '%s'
      | align next_older(1d)
      | group_by
          [resource.service, resource.project_id, resource.location,
           metric.quota_metric]
  ; limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | align next_older(1d)
      | group_by
          [resource.service, resource.project_id, resource.location,
           metric.quota_metric, metric.limit_name] }
| join
| value [usage: val(0), limit: val(1), div(val(0), val(1)).mul(100)]
"""

_MQL_THRESHOLDS = """
| value [usage: val(0), limit: val(1), val(2), val(2).gt(%s)]
| filter val(3)
| value [usage: val(0), limit: val(1), val(2)]
"""

_USAGE_MQL_ALL = """
fetch consumer_quota
| metric 'serviceruntime.googleapis.com/quota/allocation/usage'
| group_by 1d, [value_usage_max: max(value.usage)]
| every 1d
| group_by [%s],
    [value_usage_max_max: max(value_usage_max)]
"""

_LIMIT_MQL_ALL = """
fetch consumer_quota
| metric 'serviceruntime.googleapis.com/quota/limit'
| group_by 2d, [value_limit_max: max(value.limit)]
| every 2d
| group_by [%s],
    [value_limit_max_max: max(value_limit_max)]
"""

_USAGE_MQL = """
fetch consumer_quota
| metric 'serviceruntime.googleapis.com/quota/allocation/usage'
| filter (metric.quota_metric == '%s')
| group_by 1d, [value_usage_max: max(value.usage)]
| every 1d
| group_by [%s],
    [value_usage_max_max: max(value_usage_max)]
"""

_LIMIT_MQL = """
fetch consumer_quota
| metric 'serviceruntime.googleapis.com/quota/limit'
| filter (metric.quota_metric == '%s')
| group_by 2d, [value_limit_max: max(value.limit)]
| every 2d
| group_by [%s],
    [value_limit_max_max: max(value_limit_max)]
"""

_LIMIT_DURATION_IN_SECS = 60 * 60 * 24 * 2  # 2 day.
_USAGE_DURATION_IN_SECS = 60 * 60 * 24  # 1 day.

_LIMIT_GROUP_BY_FIELDS = [
    'metric.limit_name', 'metric.quota_metric', 'resource.project_id',
    'resource.location'
]
_USAGE_GROUP_BY_FIELDS = [
    'metric.quota_metric', 'resource.project_id', 'resource.location'
]

_RESOURCE_TYPE = 'consumer_quota'

_LIMIT_METRIC_TYPE = 'serviceruntime.googleapis.com/quota/limit'
_USAGE_METRIC_TYPE = 'serviceruntime.googleapis.com/quota/allocation/usage'

PROJECT_ATTRS = ('name', 'id', 'number', 'parent_type', 'parent_id',
                 'parent_name', 'ancestry', 'timestamp')

RESOURCE_ATTRS = ('resource.project_id', 'resource.service',
                  'resource.location', 'metric.limit_name',
                  'metric.quota_metric', 'endTime', 'metric_value_types',
                  'metric_values', 'usage', 'limit', 'consumption_percentage')

ALERTS_PROJECT_ATTRS = ('timestamp', )

ALERTS_RESOURCE_ATTRS = ('resource.project_id', 'resource.service',
                         'resource.location', 'metric.limit_name',
                         'metric.quota_metric', 'usage', 'limit',
                         'consumption_percentage', 'threshold')


class _Quota:
    """Quota object to capture individual quota details for a metric."""
    def __init__(self):
        self._resource_type = ''
        self._metric_type = ''
        self._project_data = {}
        self._api_result = {}

    def to_dict(self):
        """Return the data as dict."""
        data = {
            'resource.type': self._resource_type,
            'metric.type': self._metric_type
        }
        data.update({k: self._project_data.get(k, '') for k in PROJECT_ATTRS})
        data.update({k: self._api_result.get(k, '') for k in RESOURCE_ATTRS})
        # (fixme): Should return as a repeated value for bigquery.
        data['metric_value_types'] = ','.join(data['metric_value_types'])
        data['metric_values'] = ','.join(
            [str(v) for v in data['metric_values']])
        return {k.replace('.', '_'): v for k, v in data.items()}

    def to_alerts_dict(self):
        """Return data as dict, to be consumed for alert purposes."""
        data = {
            'resource.type': self._resource_type,
            'metric.type': self._metric_type
        }
        data.update(
            {k: self._project_data.get(k, '')
             for k in ALERTS_PROJECT_ATTRS})
        data.update(
            {k: self._api_result.get(k, '')
             for k in ALERTS_RESOURCE_ATTRS})
        return {k.replace('.', '_'): v for k, v in data.items()}

    @classmethod
    def from_api_response(cls, project, metric_type, result):
        """Build details from api response."""
        # pylint:disable = protected-access
        quota_obj = cls()
        quota_obj._resource_type = _RESOURCE_TYPE
        quota_obj._metric_type = metric_type
        quota_obj._project_data = project.to_dict()
        quota_obj._api_result = result

        # (fixme): Looks hacky, need to figure out proper way to build these
        # values.
        # NOTE: When using _MQL_ALL, there will be mutiple values.
        if not len(result['metric_values']) > 1:
            return quota_obj

        try:
            quota, limit, consumption = result.get('metric_values', [])
            quota_obj._api_result['usage'] = quota
            quota_obj._api_result['limit'] = limit
            quota_obj._api_result['consumption_percentage'] = consumption
        except ValueError:
            logging.debug(
                'Quota: usage, limit, consumption_percentage not available')
        # pylint:enable = protected-access
        return quota_obj


def _results_as_json(project,
                     metric_type,
                     results,
                     data_op='to_dict',
                     additional_values=None):
    """Return the quota details as a json consumable object."""
    additional_values = additional_values or {}
    for result in results:
        quota = _Quota.from_api_response(project, metric_type, result)
        func = getattr(quota, data_op)
        data = func()
        data.update(additional_values)
        yield data


def _filter_value(resource_type, metric_type, metric_label,
                  metric_label_value):
    values = ('resource.type="%s"' % resource_type,
              'metric.type="%s"' % metric_type,
              'metric.label.%s="%s"' % (metric_label, metric_label_value))
    return ' '.join(values)


def mql_thresholds_all(project, threshold):
    """Returns all quota limit, usage, consumption percentage values.

    Args:
        project: obj, representing project details.
        threshold: int, the threshold to use for fetching the values.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _MQL_ALL + _MQL_THRESHOLDS
    mql %= (project.id, project.id, threshold)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)

    rate_mql = _MQL_RATE_ALL + _MQL_THRESHOLDS
    rate_mql %= (project.id, project.id, threshold)
    rate_results = monitoring_lib.query_timeseries_mql(project.id, rate_mql)
    # Since this returns both quota and limit, metric_type is empty.
    return _results_as_json(project,
                            '',
                            itertools.chain.from_iterable(
                                (results, rate_results)),
                            data_op='to_alerts_dict',
                            additional_values={'threshold': threshold})


def mql_thresholds_single(project, quota_metric, threshold):
    """Returns all quota limit, usage, consumption percentage values.

    Args:
        project: obj, representing project details.
        quota_metric: str, metric that is of interest.
        threshold: int, the threshold to use for fetching the values.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _MQL + _MQL_THRESHOLDS
    mql %= (project.id, quota_metric, project.id, quota_metric, threshold)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)

    rate_mql = _MQL_RATE + _MQL_THRESHOLDS
    rate_mql %= (project.id, quota_metric, project.id, quota_metric, threshold)
    rate_results = monitoring_lib.query_timeseries_mql(project.id, rate_mql)
    # Since this returns both quota and limit, metric_type is empty.
    return _results_as_json(project,
                            '',
                            itertools.chain.from_iterable(
                                (results, rate_results)),
                            data_op='to_alerts_dict',
                            additional_values={'threshold': threshold})


def mql_all(project):
    """Returns all quota limit, usage, consumption percentage values.

    Args:
        project: obj, representing project details.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _MQL_ALL % (project.id, project.id)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)

    rate_mql = _MQL_RATE_ALL % (project.id, project.id)
    rate_results = monitoring_lib.query_timeseries_mql(project.id, rate_mql)
    # Since this returns both quota and limit, metric_type is empty.
    return _results_as_json(
        project, '', itertools.chain.from_iterable((results, rate_results)))


def mql_single(project, quota_metric):
    """Returns all quota limit, usage, consumption percentage values.

    Args:
        project: obj, representing project details.
        quota_metric: str, metric that is of interest.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _MQL % (quota_metric, project.id, quota_metric, project.id)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)

    rate_mql = _MQL_RATE % (project.id, quota_metric, project.id, quota_metric)
    rate_results = monitoring_lib.query_timeseries_mql(project.id, rate_mql)
    # Since this returns both quota and limit, metric_type is empty.
    return _results_as_json(
        project, '', itertools.chain.from_iterable((results, rate_results)))


def limit_mql_all(project):
    """Query and return quota metric limit details using MQL.

    Args:
        project: obj, representing project details.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _LIMIT_MQL_ALL % ', '.join(_LIMIT_GROUP_BY_FIELDS)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)
    return _results_as_json(project, _LIMIT_METRIC_TYPE, results)


def usage_mql_all(project):
    """Query and return quota metric usage details using MQL.

    Args:
        project: obj, representing project details.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _USAGE_MQL_ALL % ', '.join(_USAGE_GROUP_BY_FIELDS)
    results = monitoring_lib.query_timeseries_mql(project.id, mql)
    return _results_as_json(project, _USAGE_METRIC_TYPE, results)


def limit_mql(project, quota_metric):
    """Query and return quota metric limit details using MQL.

    Args:
        project: obj, representing project details.
        quota_metric: str, metric that is of interest.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _LIMIT_MQL % (quota_metric, ', '.join(_LIMIT_GROUP_BY_FIELDS))
    results = monitoring_lib.query_timeseries_mql(project.id, mql)
    return _results_as_json(project, _LIMIT_METRIC_TYPE, results)


def usage_mql(project, quota_metric):
    """Query and return quota metric usage details using MQL.

    Args:
        project: obj, representing project details.
        quota_metric: str, metric that is of interest.

    Returns:
        generator object, which will yield the results as a dict.
    """
    mql = _USAGE_MQL % (quota_metric, ', '.join(_USAGE_GROUP_BY_FIELDS))
    results = monitoring_lib.query_timeseries_mql(project.id, mql)
    return _results_as_json(project, _USAGE_METRIC_TYPE, results)
