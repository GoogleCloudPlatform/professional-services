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
`stackdriver.py`
Stackdriver Monitoring exporter class.
"""
import logging
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway
from prometheus_client.exposition import basic_auth_handler, default_handler

from slo_generator.exporters.base import Exporter

LOGGER = logging.getLogger(__name__)
DEFAULT_METRIC_TYPE = "error_budget_burn_rate"
DEFAULT_METRIC_DESCRIPTION = ("Speed at which the error budget for a given"
                              "aggregation window is consumed")
DEFAULT_PUSHGATEWAY_URL = "http://localhost:9091"
DEFAULT_PUSHGATEWAY_JOB = "slo-generator"


class PrometheusExporter(Exporter):
    """Prometheus exporter class."""

    def __init__(self):
        self.username = None
        self.password = None

    def export(self, data, **config):
        """Export data to Prometheus.

        Args:
            data (dict): Data to send to Prometheus.
            config (dict): Prometheus config.
                url (str, optional): Prometheus URL.
                custom_metric_type (str, optional): Custom metric type.
                custom_metric_unit (str, optional): Custom metric unit.
                custom_metric_description (str, optional): Custom metric
                    description.

        Returns:
            object: Prometheus API result.
        """
        self.create_timeseries(data, **config)

    def create_timeseries(self, data, **config):
        """Create Prometheus timeseries.

        Args:
            data (dict): Data to send to Prometheus.
            config (dict): Metric / exporter config.

        Returns:
            object: Metric descriptor.
        """
        metric_type = config.get('metric_type', DEFAULT_METRIC_TYPE)
        metric_description = config.get('metric_description',
                                        DEFAULT_METRIC_DESCRIPTION)
        prometheus_push_url = config.get('url', DEFAULT_PUSHGATEWAY_URL)
        prometheus_push_job_name = config.get('job', DEFAULT_PUSHGATEWAY_JOB)
        burn_rate = data['error_budget_burn_rate']

        # Write timeseries w/ metric labels.
        labels = {
            'service_name':
                data['service_name'],
            'feature_name':
                data['feature_name'],
            'slo_name':
                data['slo_name'],
            'window':
                str(data['window']),
            'error_budget_policy_step_name':
                str(data['error_budget_policy_step_name']),
            'alerting_burn_rate_threshold':
                str(data['alerting_burn_rate_threshold']),
        }
        registry = CollectorRegistry()
        gauge = Gauge(metric_type,
                      metric_description,
                      registry=registry,
                      labelnames=labels.keys())
        gauge.labels(*labels.values()).set(burn_rate)

        # Handle headers
        handler = default_handler
        if 'username' in config and 'password' in config:
            self.username = config['username']
            self.password = config['password']
            handler = PrometheusExporter.auth_handler

        return push_to_gateway(prometheus_push_url,
                               job=prometheus_push_job_name,
                               grouping_key=labels,
                               registry=registry,
                               handler=handler)

    def auth_handler(self, url, method, timeout, headers, data):
        """Handles authentication for pushing to Prometheus gateway.

        Args:
            url (str): Prometheus gateway URL.
            method (str): Prometheus query method.
            timeout (int): Prometheus timeout.
            headers (dict): Headers.
            data (dict): Data to send.

        Returns:
            func: Auth handler function.
        """
        username = self.username
        password = self.password
        return basic_auth_handler(url, method, timeout, headers, data, username,
                                  password)
