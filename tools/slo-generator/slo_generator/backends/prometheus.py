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

LOGGER = logging.getLogger(__name__)


class PrometheusBackend:
    """Backend for querying metrics from Prometheus."""

    def __init__(self, client=None, url=None, headers=None):
        self.client = client
        if not self.client:
            if url:
                os.environ['PROMETHEUS_URL'] = url
            if headers:
                os.environ['PROMETHEUS_HEAD'] = json.dumps(headers)
            LOGGER.debug(f'Prometheus URL: {url}')
            LOGGER.debug(f'Prometheus headers: {headers}')
            self.client = Prometheus()

    def query_sli(self, timestamp, window, slo_config):
        """Query SLI value from a given PromQL expression.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            float: SLI value.
        """
        conf = slo_config['backend']
        measurement = conf['measurement']
        expr = measurement['expression']
        expression = expr.replace("[window", f"[{window}s")
        data = self.query(expression, timestamp)
        LOGGER.debug(
            f"Expression: {expression} | Result: {pprint.pformat(data)}")
        try:
            sli_value = float(data['data']['result'][0]['value'][1])
        except IndexError:
            sli_value = 0
        LOGGER.debug(f"SLI value: {sli_value}")
        return sli_value

    def good_bad_ratio(self, timestamp, window, slo_config):
        """Compute good bad ratio from two metric filters.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window (in seconds).
            slo_config (dict): SLO configuration.

        Note:
            At least one of `filter_bad` or `filter_valid` is required.

        Returns:
            tuple: A tuple of (good_count, bad_count).
        """
        conf = slo_config['backend']
        filter_good = conf['measurement']['filter_good']
        filter_bad = conf['measurement'].get('filter_bad')
        filter_valid = conf['measurement'].get('filter_valid')

        # Replace window by its value in the error budget policy step
        expr_good = filter_good.replace('[window', f'[{window}s')
        res_good = self.query(expr_good)
        good_count = PrometheusBackend.count(res_good)

        if filter_bad:
            expr_bad = filter_bad.replace('[window', f'[{window}s')
            res_bad = self.query(expr_bad, timestamp)
            bad_count = PrometheusBackend.count(res_bad)
        elif filter_valid:
            expr_valid = filter_valid.replace('[window', f'[{window}s')
            res_valid = self.query(expr_valid, timestamp)
            bad_count = PrometheusBackend.count(res_valid) - good_count
        else:
            raise Exception("`filter_bad` or `filter_valid` is required.")

        LOGGER.debug(f'Good events: {good_count} | ' f'Bad events: {bad_count}')

        return (good_count, bad_count)

    def query(self, filter, timestamp=None):  # pylint: disable=unused-argument
        """Query Prometheus server.

        Args:
            filter (str): Query filter.
            timestamp (int): UNIX timestamp.

        Returns:
            dict: Response.
        """
        response = self.client.query(metric=filter)
        response = json.loads(response)
        LOGGER.debug(pprint.pformat(response))
        return response

    @staticmethod
    def count(response):
        """Count events in Prometheus response.

        Args:
            response (dict): Prometheus query response.

        Returns:
            int: Event count.
        """
        # Note: this function could be replaced by using the `count_over_time`
        # function that Prometheus provides.
        try:
            return len(response['data']['result'][0]['values'])
        except (IndexError, KeyError) as exception:
            LOGGER.warning("Couldn't find any values in timeseries response")
            LOGGER.debug(exception)
            return 0  # no events in timeseries
