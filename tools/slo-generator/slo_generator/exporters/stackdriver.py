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
from google.cloud import monitoring_v3
from slo_generator.exporters.base import Exporter

LOGGER = logging.getLogger(__name__)
DEFAULT_METRIC_TYPE = "custom.googleapis.com/error_budget_burn_rate"
DEFAULT_METRIC_DESCRIPTION = ("Speed at which the error budget for a given"
                              "aggregation window is consumed")


class StackdriverExporter(Exporter):
    """Stackdriver Monitoring exporter class."""

    def __init__(self):
        self.client = monitoring_v3.MetricServiceClient()

    def export(self, data, **config):
        """Export data to Stackdriver Monitoring.

        Args:
            data (dict): Data to send to Stackdriver Monitoring.
            config (dict): Stackdriver Monitoring metric config.
                project_id (str): Stackdriver host project id.
                custom_metric_type (str): Custom metric type.
                custom_metric_unit (str): Custom metric unit.

        Returns:
            object: Stackdriver Monitoring API result.
        """
        self.create_metric_descriptor(data, **config)
        self.create_timeseries(data, **config)

    def create_timeseries(self, data, **config):
        """Create Stackdriver Monitoring timeseries.

        Args:
            data (dict): Data to send to Stackdriver Monitoring.
            config (dict): Metric config.

        Returns:
            object: Metric descriptor.
        """
        series = monitoring_v3.types.TimeSeries()
        series.metric.type = config.get('metric_type', DEFAULT_METRIC_TYPE)

        # Write timeseries metric labels.
        series.metric.labels['error_budget_policy_step_name'] = str(
            data['error_budget_policy_step_name'])
        series.metric.labels['window'] = str(data['window'])
        series.metric.labels['service_name'] = data['service_name']
        series.metric.labels['feature_name'] = data['feature_name']
        series.metric.labels['slo_name'] = data['slo_name']
        series.metric.labels['alerting_burn_rate_threshold'] = str(
            data['alerting_burn_rate_threshold'])

        # Use the generic resource 'global'.
        series.resource.type = 'global'
        series.resource.labels['project_id'] = config['project_id']

        # Create a new data point.
        point = series.points.add()

        # Define end point timestamp.
        timestamp = data['timestamp']
        point.interval.end_time.seconds = int(timestamp)
        point.interval.end_time.nanos = int(
            (timestamp - point.interval.end_time.seconds) * 10**9)

        # Set the metric value.
        point.value.double_value = data['error_budget_burn_rate']

        # Record the timeseries to Stackdriver Monitoring.
        project = self.client.project_path(config['project_id'])
        result = self.client.create_time_series(project, [series])
        labels = series.metric.labels
        LOGGER.debug(
            f"timestamp: {timestamp} burnrate: {point.value.double_value}"\
            f"{labels['service_name']}-{labels['feature_name']}-"\
            f"{labels['slo_name']}-{labels['error_budget_policy_step_name']}")
        return result

    def create_metric_descriptor(self, data, **config):
        """Create Stackdriver Monitoring metric descriptor.

        Args:
            config (dict): Metric config.

        Returns:
            object: Metric descriptor.
        """
        project = self.client.project_path(config['project_id'])
        descriptor = monitoring_v3.types.MetricDescriptor()
        descriptor.type = config.get('metric_type', DEFAULT_METRIC_TYPE)
        descriptor.metric_kind = (
            monitoring_v3.enums.MetricDescriptor.MetricKind.GAUGE)
        descriptor.value_type = (
            monitoring_v3.enums.MetricDescriptor.ValueType.DOUBLE)
        descriptor.description = config.get('metric_description',
                                            DEFAULT_METRIC_DESCRIPTION)
        self.client.create_metric_descriptor(project, descriptor)
        return descriptor
