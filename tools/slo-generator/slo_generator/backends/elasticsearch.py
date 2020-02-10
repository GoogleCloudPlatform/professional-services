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

from elasticsearch import Elasticsearch

from slo_generator.backends.base import MetricBackend

LOGGER = logging.getLogger(__name__)


class ElasticsearchBackend(MetricBackend):
    """Backend for querying metrics from ElasticSearch."""

    def __init__(self, **kwargs):
        self.client = kwargs.get('client')
        if self.client is None:
            self.client = Elasticsearch(**kwargs)

    def good_bad_ratio(self, **kwargs):
        """Query two timeseries, one containing 'good' events, one containing
        'bad' events.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window size (in seconds).
            kwargs (dict): Extra arguments needed by this computation method.
                project_id (str): GCP project id to fetch metrics from.
                measurement (dict): Measurement config.
                    filter_good (str): Query filter for 'good' events.
                    filter_bad (str): Query filter for 'bad' events.

        Returns:
            tuple: A tuple (good_event_count, bad_event_count)
        """
        window = kwargs['window']
        index = kwargs['measurement']['index']
        date = kwargs['measurement'].get('date_field', 'timestamp')
        query_good = kwargs['measurement']['query_good']
        query_bad = kwargs['measurement'].get('query_bad')
        query_valid = kwargs['measurement'].get('query_valid')

        # Build ELK request bodies
        good = ElasticsearchBackend._build_query_body(query_good, window, date)
        bad = ElasticsearchBackend._build_query_body(query_bad, window, date)
        valid = ElasticsearchBackend._build_query_body(query_valid, window,
                                                       date)

        # Get good events count
        response = self.query(index, good)
        good_events_count = ElasticsearchBackend.count(response)

        # Get bad events count
        if query_bad is not None:
            response = self.query(index, bad)
            bad_events_count = ElasticsearchBackend.count(response)
        elif query_valid is not None:
            response = self.query(index, valid)
            bad_events_count = \
                ElasticsearchBackend.count(response) - good_events_count
        else:
            raise Exception("`filter_bad` or `filter_valid` is required.")

        return (good_events_count, bad_events_count)

    def query(self, index, body):
        """Query ElasticSearch server.

        Args:
            index (str): Index to query.
            body (dict): Query body.

        Returns:
            dict: Response.
        """
        return self.client.search(index=index, body=body)

    @staticmethod
    def count(response):
        """Count event in Prometheus response.

        Args:
            response (dict): Prometheus query response.

        Returns:
            int: Event count.
        """
        try:
            return response['hits']['total']['value']
        except KeyError as exception:
            LOGGER.warning("Couldn't find any values in timeseries response")
            LOGGER.debug(exception)
            return 0

    @staticmethod
    def _build_query_body(query, window, date_field='timestamp'):
        """Add window to existing query. Replace window for different error
        budget steps on-the-fly.

        Args:
            body (dict): Existing query body.
            window (int): Window in seconds.
            field (str): Field to filter time on (must be an ELK `date` field)

        Returns:
            dict: Query body with range clause added.
        """
        if query is None:
            return None
        body = {"query": {"bool": query}, "track_total_hits": True}
        range_query = {
            f"{date_field}": {
                "gte": f"now-{window}s/s",
                "lt": "now/s"
            }
        }

        # If a 'filter' clause already exist, add the range query on top,
        # otherwise create the 'filter' clause.
        if "filter" in body["query"]["bool"]:
            body["query"]["bool"]["filter"]["range"] = range_query
        else:
            body["query"]["bool"] = {"filter": {"range": range_query}}

        return body
