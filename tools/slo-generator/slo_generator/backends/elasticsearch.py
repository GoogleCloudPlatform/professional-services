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
`elasticsearch.py`
ElasticSearch backend implementation.
"""

import logging
from slo_generator.backends.base import MetricBackend
from elasticsearch import Elasticsearch

LOGGER = logging.getLogger(__name__)


class ElasticsearchBackend(MetricBackend):
    """Backend for querying metrics from Elasticsearch."""

    def __init__(self, **kwargs):
        self.client = kwargs.get('client')
        if self.client is None:
            self.client = Elasticsearch(**kwargs)

    def query(self, window, filter):
        raise NotImplementedError()

    def count(self, timeseries):
        """Count events in time serie.

        Args:
            dict: Timeserie results.

        Returns:
            int: Event count.
        """
        raise NotImplementedError()
