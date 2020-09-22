from datadog import initialize, api
"""
`datadog.py`
Prometheus backend implementation.
"""

import json
import logging
import os
import pprint
import datadog

LOGGER = logging.getLogger(__name__)
logging.getLogger('datadog.api').setLevel(logging.ERROR)


class DatadogBackend:
    """Backend for querying metrics from Datadog."""
    def __init__(self, client=None, url=None, api_key=None, app_key=None):
        self.client = client
        if not self.client:
            options = {'api_key': api_key, 'app_key': app_key}
            datadog.initialize(**options)
            self.client = datadog.api

    def good_bad_ratio(self, timestamp, window, slo_config):
        """Query SLO value from good and valid queries.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            tuple: Good event count, Bad event count.
        """
        conf = slo_config['backend']
        measurement = conf['measurement']
        start = timestamp - window
        end = timestamp
        query_good = measurement['good_query']
        query_valid = measurement['valid_query']
        good_event_query = self.client.Metric.query(start=start,
                                                    end=end,
                                                    query=query_good)
        valid_event_query = self.client.Metric.query(start=start,
                                                     end=end,
                                                     query=query_valid)
        LOGGER.debug(f"Result good: {pprint.pformat(good_event_query)}")
        LOGGER.debug(f"Result valid: {pprint.pformat(valid_event_query)}")
        good_event_count = DatadogBackend.count(good_event_query)
        valid_event_count = DatadogBackend.count(valid_event_query)
        bad_event_count = valid_event_count - good_event_count
        LOGGER.debug(f'{good_event_count},{valid_event_count}')
        return (good_event_count, bad_event_count)

    def query_sli(self, timestamp, window, slo_config):
        """Query SLI value directly.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            float: SLI value.
        """
        conf = slo_config['backend']
        measurement = conf['measurement']
        start = timestamp - window
        end = timestamp
        query = measurement['query']
        sli_query = self.client.Metric.query(start=start, end=end, query=query)
        LOGGER.debug(f"Result good: {pprint.pformat(sli_query)}")
        return sli_query['series'][0]['pointlist'][-1][1]

    def query_slo(self, timestamp, window, slo_config):
        """Query SLO value from a given Datadog SLO.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            tuple: Good event count, bad event count.
        """
        conf = slo_config['backend']
        slo_id = slo_config['slo_id']
        from_ts = timestamp - window
        slo_data = self.client.ServiceLevelObjective.get(id=slo_id)
        LOGGER.debug(
            f"SLO data: {slo_id} | Result: {pprint.pformat(slo_data)}")
        data = self.client.ServiceLevelObjective.history(id=slo_id,
                                                         from_ts=from_ts,
                                                         to_ts=timestamp)
        LOGGER.debug(
            f"Timeseries data: {slo_id} | Result: {pprint.pformat(data)}")
        good_event_count = data['data']['series']['numerator']['sum']
        valid_event_count = data['data']['series']['denominator']['sum']
        bad_event_count = valid_event_count - good_event_count
        return (good_event_count, bad_event_count)

    @staticmethod
    def count(timeseries):
        """Count events in time series assuming it was aligned with ALIGN_SUM
        and reduced with REDUCE_SUM (default).

        Args:
            :dict: Timeseries response from Datadog Metrics API endpoint.

        Returns:
            int: Event count.
        """
        try:
            return timeseries['series'][0]['pointlist'][0][1]
        except (IndexError, AttributeError) as exception:
            LOGGER.warning("Couldn't find any values in timeseries response")
            LOGGER.debug(exception)
            return 0  # no events in timeseries
