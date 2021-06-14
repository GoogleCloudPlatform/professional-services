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
"""Functions to help in debugging the quota metrics export to BQ."""

import logging
import pkg_resources

import copy
import tabulate

from src.common.lib import bigquery_lib
from src.common.lib import projects_lib
from src.common.utils import common_utils

from src.quota.helpers import config_helper
from src.quota.helpers import quota_helper

_ALL = 'ALL'
_CONFIG_FILEPATH = pkg_resources.resource_filename('src.quota', 'config.yaml')


def _projects(quota_config):
    if quota_config.include_all_projects:
        return projects_lib.get_all()
    return projects_lib.get_selective(quota_config.projects)


def _quota_metrics(quota_config):
    if quota_config.include_all_metrics:
        return [_ALL]
    return quota_config.metrics


def _project_metric_map(quota_config):
    """Project and metric mapping."""
    projects = _projects(quota_config)
    quota_metrics = _quota_metrics(quota_config)
    for project in projects:
        for quota_metric in quota_metrics:
            yield project, quota_metric


def _print_counts(project, label, results):
    print(project.id, label, len(list(results)))


def _print_results(project, quota_metric, results):
    print('...................................', project.id, quota_metric)
    headers = []
    headers.extend(quota_helper.PROJECT_ATTRS)
    headers.extend(quota_helper.RESOURCE_ATTRS)

    rows = []
    project_data = [
        getattr(project, attr) for attr in quota_helper.PROJECT_ATTRS
    ]
    for result in results:
        row = []
        row.extend(copy.deepcopy(project_data))
        row.extend([result.get(attr) for attr in quota_helper.RESOURCE_ATTRS])
        rows.append(row)
    print(tabulate.tabulate(rows, headers=headers, tablefmt='github'))


def print_quota_mql_all(quota_config):
    """Print quota metric usage using MQL query."""
    for project in _projects(quota_config):
        results = list(quota_helper.limit_mql_all(project))
        _print_counts(project, 'quota_limit', results)
        # _print_results(project, 'quota_limit', results)

        results = quota_helper.usage_mql_all(project)
        _print_counts(project, 'quota_usage', results)
        # _print_results(project, 'quota_limit', results)


def print_quota_limits_mql(quota_config):
    """Print quota metric limits using MQL query."""
    for project, quota_metric in _project_metric_map(quota_config):
        results = quota_helper.limit_mql(project, quota_metric)
        _print_counts(project, quota_metric, results)
        # _print_results(project, quota_metric, results)


def print_quota_usage_mql(quota_config):
    """Print quota metric usage using MQL query."""
    for project, quota_metric in _project_metric_map(quota_config):
        results = quota_helper.usage_mql(project, quota_metric)
        _print_counts(project, quota_metric, results)
        # _print_results(project, quota_metric, results)


def print_quota_limits_api(quota_config):
    """Print quota metric limits using timeseries query."""
    for project, quota_metric in _project_metric_map(quota_config):
        results = quota_helper.limit_api(project, quota_metric)
        _print_counts(project, quota_metric, results)
        # _print_results(project, quota_metric, results)


def print_quota_usage_api(quota_config):
    """Print quota metric usage using timeseries query."""
    for project, quota_metric in _project_metric_map(quota_config):
        results = quota_helper.usage_api(project, quota_metric)
        _print_counts(project, quota_metric, results)
        # _print_results(project, quota_metric, results)


def run_import():
    """Use config data to read metrics and export to BQ."""
    quota_config = config_helper.config(_CONFIG_FILEPATH)
    table_id = quota_config.metrics_table_id
    timestamp = common_utils.zulu_timestamp()

    for project, quota_metric in _project_metric_map(quota_config):
        logging.info('Checking details for project %s and metric %s',
                     project.id, quota_metric)
        project.timestamp = timestamp
        if quota_metric == _ALL:
            rows = quota_helper.mql_all(project)
            bigquery_lib.write_rows(table_id, rows)
        else:
            rows = quota_helper.mql_single(project, quota_metric)
            bigquery_lib.write_rows(table_id, rows)


def run():
    """Debug quota metric limits and usages."""
    quota_config = config_helper.config(_CONFIG_FILEPATH)

    print('\nQuota MQL ALL\n')
    print_quota_mql_all(quota_config)

    print('\nQuota limits MQL\n')
    print_quota_limits_mql(quota_config)
    print('\nQuota limits API\n')
    print_quota_limits_api(quota_config)

    print('\nQuota Usage MQL\n')
    print_quota_usage_mql(quota_config)
    print('\nQuota Usage API\n')
    print_quota_usage_api(quota_config)


if __name__ == '__main__':
    common_utils.log_to_console()
    run_import()
