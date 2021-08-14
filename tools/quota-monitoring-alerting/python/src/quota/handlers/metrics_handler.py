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
"""Handle metrics related endpoint requests."""

import logging

from src.common.lib import bigquery_lib
from src.common.lib import projects_lib
from src.common.lib import pubsub_lib
from src.common.utils import config_utils

from src.quota.helpers import quota_helper

_ALL = 'ALL'
_DEFAULT_THRESHOLD = 80


def _publish_details(project, data, metadata, config):
    """Public metric(s) data to pubsub topic.

    Args:
        project: project_utils._Project obj.
        data: dict, data that needs to be published.
        metadata: dict, attributes that need to be passed.
        config: config_utils._Config obj.
    """
    if not project:
        logging.debug('Metrics: No project details found')
        return False

    logging.info('Metrics: publishing data for project %s', project.id)
    message = pubsub_lib.build_message(data, **metadata)
    res = pubsub_lib.publish_message(
        config.value('project'), config.value('export.pubsub.bigquery_topic'),
        message)

    if not res:
        logging.debug('Metrics: Failed to publish results for project %s',
                      project.id)
        return False
    logging.debug('Metrics: Publish results %s', res)
    return True


def publish(config_filepath, data, metadata):
    """List metric(s) for a project and publish data to pubsub topic.

    Args:
        config_filepath: str, path for config file.
        data: dict, that can be passed as input to project_utils._Project obj.
        metadata: dict, attributes that need to be passed.
    """
    config = config_utils.config(config_filepath)
    project = projects_lib.Project.from_dict(data)

    logging.info('Metrics: Listing metrics for project %s', project.id)
    data = {
        'rows': [],
        'table_id': config.value('export.bigquery.tables.metrics_table_id'),
    }
    if _ALL in config.value('export.metrics'):
        logging.debug('Metrics: Checking %s metric(s) for project %s', _ALL,
                      project.id)
        data['rows'].extend(quota_helper.mql_all(project))
    else:
        for quota_metric in config.value('export.metrics', default=[]):
            logging.debug('Metrics: Checking %s metric(s) for project %s',
                          quota_metric, project.id)
            data['rows'].extend(quota_helper.mql_single(project, quota_metric))
    _publish_details(project, data, metadata, config)


def publish_thresholds(config_filepath, data, metadata):
    """List metric(s) threshold data for a project and publish it to pubsub topic.

    Args:
        config_filepath: str, path for config file.
        data: dict, that can be passed as input to project_utils._Project obj.
        metadata: dict, attributes that need to be passed.
    """
    config = config_utils.config(config_filepath)
    project = projects_lib.Project.from_dict(data)

    logging.info('Metrics: Listing metric(s) threshold(s) for project %s',
                 project.id)
    data = {
        'rows': [],
        'table_id': config.value('export.bigquery.tables.thresholds_table_id')
    }

    thresholds = config.value('thresholds') or {}
    if _ALL in thresholds:
        logging.info('Checking %s threshold(s) for project %s', _ALL,
                     project.id)
        threshold = thresholds.get(_ALL, _DEFAULT_THRESHOLD)
        data['rows'].extend(quota_helper.mql_thresholds_all(
            project, threshold))
    else:
        for quota_metric in config.value('quota.metrics', default=[]):
            threshold = thresholds.get(quota_metric, _DEFAULT_THRESHOLD)
            logging.info('Checking %s threshold(s) for project %s',
                         quota_metric, project.id)
            data['rows'].extend(
                quota_helper.mql_thresholds_single(project, quota_metric,
                                                   threshold))
    _publish_details(project, data, metadata, config)


def save(config_filepath, data, unused_metadata):
    """Save metric data to bigquery table.

    Args:
        config_filepath: str, path for config file.
        data: dict, with key 'rows' that needs to be saved to bigquery table.
    """
    logging.info('Metrics: Saving metrics to bigquery')
    config = config_utils.config(config_filepath)
    table_id, rows = data.get('table_id'), data.get('rows', [])
    project_id = config.value('project')
    dataset_id = config.value('export.bigquery.dataset')
    full_table_id = '.'.join((project_id, dataset_id, table_id))
    bigquery_lib.write_rows(full_table_id, rows)
