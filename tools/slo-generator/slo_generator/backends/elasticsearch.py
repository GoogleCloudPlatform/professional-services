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

LOGGER = logging.getLogger(__name__)

DEFAULT_DATE_FIELD = '@timestamp'


class ElasticsearchBackend:
    """Backend for querying metrics from ElasticSearch.

    Args:
        client (elasticsearch.ElasticSearch): Existing ES client.
        es_config (dict): ES client configuration.
    """

    def __init__(self, client=None, **es_config):
        self.client = client
        if self.client is None:
            self.client = Elasticsearch(**es_config)

    # pylint: disable=unused-argument
    def good_bad_ratio(self, timestamp, window, slo_config):
        """Query two timeseries, one containing 'good' events, one containing
        'bad' events.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window size (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            tuple: A tuple (good_event_count, bad_event_count)
        """
        measurement = slo_config['backend']['measurement']
        index = measurement['index']
        query_good = measurement['query_good']
        query_bad = measurement.get('query_bad')
        query_valid = measurement.get('query_valid')
        date_field = measurement.get('date_field', DEFAULT_DATE_FIELD)

        # Build ELK request bodies
        good = ES.build_query(query_good, window, date_field)
        bad = ES.build_query(query_bad, window, date_field)
        valid = ES.build_query(query_valid, window, date_field)

        # Get good events count
        response = self.query(index, good)
        good_events_count = ES.count(response)

        # Get bad events count
        if query_bad is not None:
            response = self.query(index, bad)
            bad_events_count = ES.count(response)
        elif query_valid is not None:
            response = self.query(index, valid)
            bad_events_count = ES.count(response) - good_events_count
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
    def build_query(query, window, date_field=DEFAULT_DATE_FIELD):
        """Build ElasticSearch query.

        Add window to existing query.
        Replace window for different error budget steps on-the-fly.

        Args:
            body (dict): Existing query body.
            window (int): Window in seconds.
            date_field (str): Field to filter time on (must be an ElasticSearch
                field of type `date`. Defaults to `@timestamp` (Logstash-
                generated date field).

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


ES = ElasticsearchBackend
