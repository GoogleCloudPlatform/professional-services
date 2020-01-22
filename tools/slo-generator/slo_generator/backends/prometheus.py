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
`prometheus.py`
Prometheus backend implementation.
"""

import json
import logging
import os
import pprint
from prometheus_http_client import Prometheus

from slo_generator.backends.base import MetricBackend

LOGGER = logging.getLogger(__name__)


class PrometheusBackend(MetricBackend):
    """Backend for querying metrics from Prometheus."""

    def __init__(self, **kwargs):
        self.client = kwargs.pop('client')
        if not self.client:
            url = kwargs.get('url')
            headers = kwargs.get('headers')
            if url:
                os.environ['PROMETHEUS_URL'] = url
            if headers:
                os.environ['PROMETHEUS_HEAD'] = json.dumps(headers)
            self.client = Prometheus()

    def sli(self, **kwargs):
        """Query SLI value from a given PromQL expression.

        Args:
            kwargs (dict):
                timestamp (int): Timestamp to query.
                window (int): Window to query (in seconds).
                measurement (dict):
                    expression (str): PromQL expression.

        Returns:
            float: SLI value.
        """
        window = kwargs['window']
        measurement = kwargs['measurement']
        expr = measurement['expression']
        expression = expr.replace("[window]", f"[{window}s]")
        data = self.query(expression)
        LOGGER.debug(
            f"Expression: {expression} | Result: {pprint.pformat(data)}")
        try:
            sli_value = float(data['data']['result'][0]['value'][1])
        except IndexError:
            sli_value = 0
        LOGGER.debug(f"SLI value: {sli_value}")
        return sli_value

    def query(self, filter):
        timeseries = self.client.query(metric=filter)
        timeseries = json.loads(timeseries)
        LOGGER.debug(pprint.pformat(timeseries))
        return timeseries
