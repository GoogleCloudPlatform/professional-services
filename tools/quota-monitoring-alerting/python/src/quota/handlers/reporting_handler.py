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
"""Handle reporting related endpoint request."""

import functools
import logging

from src.common.lib import bigquery_lib
from src.common.lib import monitoring_lib

from src.common.utils import common_utils
from src.common.utils import config_utils


def _threshold_custom_metrics(unused_project):
    """Yield threshold related custom metric."""
    resource_type = 'global'
    resource_labels = {}
    metric_type = 'custom.googleapis.com/quota/alert'
    message = 'Some projects & quotas are above the given threshold'
    metric_labels = {
        'message': message,
        'report_timestamp': common_utils.timestamp()
    }
    yield (resource_type, resource_labels, metric_type, metric_labels, 1)


def _build_and_write_timeseries(host_project_id, helper):
    """Build and write a custom metric to timeseries.

    Args:
        host_project_id: str, project id where the metric should be written.
        helper: functools.partial obj, the func that returns custom metrics.
    """
    for custom_metric in helper():
        series = monitoring_lib.gauge_int_timeseries(*custom_metric)
        res = monitoring_lib.write_time_series(host_project_id, series)
        if res:
            logging.info('Successfully wrote to custom timeseries for: %s',
                         custom_metric[-3])


def publish(config_filepath):
    """Check if there are quota(s) above threshold and publish a custom metric.

    Args:
        config_filepath: str, path for config file.
    """
    logging.info('Timeseries: Publishing timeseries for project')
    config = config_utils.config(config_filepath)

    project_id = config.value('project')
    dataset_id = config.value('export.bigquery.dataset')
    table_id = config.value('export.bigquery.tables.thresholds_table_id')
    full_table_id = '.'.join((project_id, dataset_id, table_id))

    query = ('select count(*) from `{full_table_id}` '
             'where timestamp like "{today}%"')
    query = query.format(full_table_id=full_table_id,
                         today=common_utils.today())
    logging.info('Checking: %s', query)
    result = bigquery_lib.query(query)
    if result and len(result) > 0 and result[0][0]:
        helper = functools.partial(_threshold_custom_metrics, None)
        _build_and_write_timeseries(config.value('project'), helper)
    else:
        logging.info('Nothing to report')


def create_custom_metric_descriptors(host_project_id):
    """Create custom metric descriptors.

    Args:
        host_project_id: str, project id where the metric should be written.
    """
    # Creating an empty metric as CloudMonitoring doesn't like creating alerts
    # without metric definitions.
    for custom_metric in _threshold_custom_metrics(None):
        series = monitoring_lib.gauge_int_timeseries(*custom_metric)
        res = monitoring_lib.write_time_series(host_project_id, series)
        if res:
            logging.info('Successfully wrote Metric descriptor: %s',
                         custom_metric[-3])
