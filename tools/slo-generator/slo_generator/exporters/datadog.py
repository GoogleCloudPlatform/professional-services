# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`datadog.py`
Datadog exporter class.
"""
import logging
import pprint
import datadog

LOGGER = logging.getLogger(__name__)
logging.getLogger('datadog.api').setLevel(logging.ERROR)
DEFAULT_METRIC_TYPE = "slo.error_budget_burn_rate"
DEFAULT_METRIC_DESCRIPTION = ("Speed at which the error budget for a given"
                              "aggregation window is consumed")
DEFAULT_METRIC_LABELS = [
    'error_budget_policy_step_name', 'window', 'service_name', 'slo_name',
    'alerting_burn_rate_threshold'
]


class DatadogExporter:
    """Datadog exporter class."""
    def __init__(self, client=None, url=None, api_key=None, app_key=None):
        self.client = client
        if not self.client:
            options = {'api_key': api_key, 'app_key': app_key}
            datadog.initialize(**options)
            self.client = datadog.api

    def export(self, data, **config):
        """Export results to Datadog.

        Args:
            data (dict): Data to export.
                service_name (str): Service name.
                feature_name (str): Feature name.
                slo_name (str): SLO name.
                timestamp_human (str): Timestamp in human-readable format.
                measurement_window_seconds (int): Measurement window (in s).

            config (dict): Exporter config.
                url (str): Datadog url.

        Raises:
            DatadogError (object): Datadog exception object.
        """
        labelnames = config.get('metric_labels', DEFAULT_METRIC_LABELS)
        tags = [
            f'{key}:{value}' for key, value in data.items()
            if key in labelnames
        ]
        metric_type = config.get('metric_type', DEFAULT_METRIC_TYPE)
        timestamp = data['timestamp']
        value = data['error_budget_burn_rate']
        return api.Metric.send(metric=metric_type,
                               points=[(timestamp, value)],
                               tags=tags)
