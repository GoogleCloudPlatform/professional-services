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

import logging
import pprint
from slo_generator.backends.base import MetricBackend
from prometheus_http_client import Prometheus

LOGGER = logging.getLogger(__name__)


class PrometheusBackend(MetricBackend):
    """Backend for querying metrics from Prometheus."""

    def __init__(self, **kwargs):
        self.client = kwargs.get('client')
        if not self.client:
            self.client = Prometheus(**kwargs)

    def query(self, window, filter):
        metric = filter.format(window=window + 's')  # add resolution to filter
        timeseries = self.client.query(metric=metric)
        LOGGER.debug(pprint.pformat(timeseries))
        return timeseries

    def count(self, timeseries):
        """Count events in time serie.

        Args:
            dict: Timeserie results.

        Returns:
            int: Event count.
        """
        try:
            return timeseries["data"]["result"][0].points[0].value.int64_value
        except Exception as e:
            logging.debug(e)
            return 0  # no events in timeserie


"""
Example query response:

>>> prometheus.query(metric='irate(node_cpu{job="static_nodes"}[5m])')
u'{"status":"success","data":
{
    "resultType":"vector",
    "result":[
        {
            "metric":
                {
                    "cpu":"cpu0",
                    "device_ID":
                    "static_node",
                    "instance":"127.0.0.1:9100",
                    "job":"static_nodes",
                    "mode":"idle"
                },
            "value":[
                1533779660.16,
                "0.9340000000001358"
            ]
        },
        {
            "metric":
                {
                    "cpu":"cpu0",
                    "device_ID":"static_node",
                    "instance":"127.0.0.1:9100",
                    "job":"static_nodes",
                    "mode":"iowait"
                },
            "value":[
                1533779660.16,
                "0.003333333333334091"
            ]
        },
        {
            "metric":
                {"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"irq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"nice"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"softirq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"steal"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"system"},"value":[1533779660.16,"0.016666666666666666"]},{"metric":{"cpu":"cpu0","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"user"},"value":[1533779660.16,"0.025333333333340608"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"idle"},"value":[1533779660.16,"0.9373333333333297"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"iowait"},"value":[1533779660.16,"0.025333333333333503"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"irq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"nice"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"softirq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"steal"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"system"},"value":[1533779660.16,"0.0073333333333304536"]},{"metric":{"cpu":"cpu1","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"user"},"value":[1533779660.16,"0.02333333333332727"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"idle"},"value":[1533779660.16,"0.9486666666666679"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"iowait"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"irq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"nice"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"softirq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"steal"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"system"},"value":[1533779660.16,"0.009333333333332423"]},{"metric":{"cpu":"cpu2","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"user"},"value":[1533779660.16,"0.0319999999999709"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"idle"},"value":[1533779660.16,"0.9540000000000267"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"iowait"},"value":[1533779660.16,"0.0006666666666670077"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"irq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"nice"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"softirq"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"steal"},"value":[1533779660.16,"0"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"system"},"value":[1533779660.16,"0.008666666666666363"]},{"metric":{"cpu":"cpu3","device_ID":"static_node","instance":"127.0.0.1:9100","job":"static_nodes","mode":"user"},"value":[1533779660.16,"0.03266666666665211"]}]}}'
"""
