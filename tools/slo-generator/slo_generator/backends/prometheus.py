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
            LOGGER.debug(f'Prometheus URL: {url}')
            LOGGER.debug(f'Prometheus headers: {headers}')
            self.client = Prometheus()

    def query_sli(self, **kwargs):
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

    def good_bad_ratio(self, **kwargs):
        """Compute good bad ratio from two metric filters.

        Args:
            kwargs (dict):
                window (str): Query window.
                measurement (dict): Measurement config
                    filter_good (str): PromQL query for good events.
                    filter_bad (str, optional): PromQL query for bad events.
                    filter_valid (str, optional): PromQL query for valid events.

        Note:
            At least one of `filter_bad` or `filter_valid` is required.

        Returns:
            tuple: A tuple of (good_event_count, bad_event_count).
        """
        window = kwargs['window']
        filter_good = kwargs['measurement']['filter_good']
        filter_bad = kwargs['measurement'].get('filter_bad')
        filter_valid = kwargs['measurement'].get('filter_valid')

        # Replace window by its value in the error budget policy step
        expr_good = filter_good.replace('[window]', f'[{window}s]')
        res_good = self.query(expr_good)
        good_event_count = PrometheusBackend.count(res_good)

        if filter_bad:
            expr_bad = filter_bad.replace('[window]', f'[{window}s]')
            res_bad = self.query(expr_bad)
            bad_event_count = PrometheusBackend.count(res_bad)
        elif filter_valid:
            expr_valid = filter_valid.replace('[window]', f'[{window}s]')
            res_valid = self.query(expr_valid)
            bad_event_count = \
                PrometheusBackend.count(res_valid) - good_event_count
        else:
            raise Exception(
                "Oneof `filter_bad` or `filter_valid` is needed in your SLO",
                "configuration file")

        LOGGER.debug(f'Good events: {good_event_count} | '
                     f'Bad events: {bad_event_count}')

        return (good_event_count, bad_event_count)

    def query(self, filter):
        timeseries = self.client.query(metric=filter)
        timeseries = json.loads(timeseries)
        LOGGER.debug(pprint.pformat(timeseries))
        return timeseries

    @staticmethod
    def count(timeseries):
        """Count event in Prometheus timeseries.

        Args:
            timeseries (dict): Prometheus query response.

        Returns:
            int: Event count.
        """
        # Note: this function could be replaced by using the `count_over_time`
        # function that Prometheus provides.
        try:
            return len(timeseries['data']['result'][0]['values'])
        except (IndexError, KeyError) as exception:
            LOGGER.warning("Couldn't find any values in timeseries response")
            LOGGER.debug(exception)
            return 0  # no events in timeseries
