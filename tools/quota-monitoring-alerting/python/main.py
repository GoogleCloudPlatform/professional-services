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
"""Export quota related metrics from Cloud Monitoring to Bigquery."""

import logging

from flask import Flask, request

from src.common.lib import pubsub_lib
from src.common.utils import common_utils

from src.quota.handlers import metrics_handler
from src.quota.handlers import projects_handler
from src.quota.handlers import reporting_handler

_CONFIG_FILEPATH = 'config.yaml'

app = Flask(__name__)
common_utils.log_to_console()


def publish_projects(unused_req):
    """Publish projects data to pubsub topic."""
    try:
        projects_handler.publish(_CONFIG_FILEPATH)
    except Exception as ex:  # pylint: disable=broad-except
        logging.exception(ex)
    return '\n'


def publish_metrics(req):
    """Publish metrics data to Cloud Monitoring.

    Args:
        req: obj, flask request object.
    """
    try:
        data, metadata = pubsub_lib.process_envelope(req.get_data())
        metrics_handler.publish(_CONFIG_FILEPATH, data, metadata)
    except Exception as ex:  # pylint: disable=broad-except
        logging.exception(ex)
    return '\n'


def publish_metric_thresholds(req):
    """Publish metric(s) threshold data to Cloud Monitoring.

    Args:
        req: obj, flask request object.
    """
    try:
        data, metadata = pubsub_lib.process_envelope(req.get_data())
        metrics_handler.publish_thresholds(_CONFIG_FILEPATH, data, metadata)
    except Exception as err:  # pylint: disable=broad-except
        logging.exception(err)
    return '\n'


def save_metrics(req):
    """Save metric(s) data to Cloud Monitoring.

    Args:
        req: obj, flask request object.
    """
    try:
        data, metadata = pubsub_lib.process_envelope(req.get_data())
        metrics_handler.save(_CONFIG_FILEPATH, data, metadata)
    except Exception as err:  # pylint: disable=broad-except
        logging.exception(err)
    return '\n'


def report_thresholds(unused_req):
    """Trigger threshold report.

    Args:
        req: obj, flask request object.
    """
    try:
        reporting_handler.publish(_CONFIG_FILEPATH)
    except Exception as err:  # pylint: disable=broad-except
        logging.exception(err)
    return '\n'


# Below logic is for Cloud Run deployments.


@app.route('/message')
def message():
    """Hello end point."""
    return 'Hello\n'


@app.route('/project/list')
def projects_list():
    """Endpoint to recieve project scan request(s)."""
    return publish_projects(request)


@app.route('/project/metric/list', methods=['POST'])
def metrics_list():
    """Endpoint to recieve metric scan/publish request(s)."""
    return publish_metrics(request)


@app.route('/project/metric/threshold/list', methods=['POST'])
def metric_thresholds_list():
    """Endpoint to recieve metric threshold scan/publish requests(s)."""
    return publish_metric_thresholds(request)


@app.route('/project/metric/save', methods=['POST'])
def metrics_save():
    """Endpoint to recieve metric save request(s)."""
    return save_metrics(request)


@app.route('/report/thresholds')
def thresholds_report():
    """Endpoint to recieve metric threshold report request(s)."""
    return report_thresholds(request)
