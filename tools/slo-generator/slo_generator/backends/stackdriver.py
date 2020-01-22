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
Stackdriver Monitoring backend implementation.
"""
from collections import OrderedDict
import logging
import math
import pprint

from google.cloud import monitoring_v3
from slo_generator.backends.base import MetricBackend

LOGGER = logging.getLogger(__name__)


class StackdriverBackend(MetricBackend):
    """Backend for querying metrics from Stackdriver Monitoring.

    Args:
        obj:`monitoring_v3.MetricServiceClient` (optional): A Stackdriver
            Monitoring client. Initialize a new client if omitted.
    """

    def __init__(self, client=None, **kwargs):  # pylint: disable=W0613
        self.client = client
        if client is None:
            self.client = monitoring_v3.MetricServiceClient()

    def query(self, project_id, timestamp, window, filter):
        """Query timeseries from Stackdriver Monitoring.

        Args:
            project_id (str): GCP project id.
            timestamp (int): Current timestamp.
            window (int): Window size (in seconds).
            filter (str): Query filter.

        Returns:
            list: List of timeseries objects.
        """
        measurement_window = StackdriverBackend._get_window(timestamp, window)
        aggregation = StackdriverBackend._get_aggregation(window)
        project = self.client.project_path(project_id)
        timeseries = self.client.list_time_series(
            project, filter, measurement_window,
            monitoring_v3.enums.ListTimeSeriesRequest.TimeSeriesView.FULL,
            aggregation)
        LOGGER.debug(pprint.pformat(timeseries))
        return timeseries

    @staticmethod
    def count(timeseries):
        """Count events in time serie assuming it was aligned with ALIGN_SUM
        and reduced with REDUCE_SUM (default).

        Args:
            :obj:`monitoring_v3.TimeSeries`: Timeseries object.

        Returns:
            int: Event count.
        """
        try:
            return timeseries[0].points[0].value.int64_value
        except (IndexError, AttributeError) as exception:
            logging.debug(exception)
            return 0  # no events in timeseries

    def good_bad_ratio(self, timestamp, window, **kwargs):
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
        project_id = kwargs['project_id']
        measurement = kwargs['measurement']
        filter_good = measurement['filter_good']
        filter_bad = measurement['filter_bad']

        # Query 'good events' timeseries
        good_ts = self.query(project_id=project_id,
                             timestamp=timestamp,
                             window=window,
                             filter=filter_good)

        # Query 'bad events' timeseries
        bad_ts = self.query(project_id=project_id,
                            timestamp=timestamp,
                            window=window,
                            filter=filter_bad)
        good_ts = list(good_ts)
        bad_ts = list(bad_ts)

        # Count number of events
        good_event_count = StackdriverBackend.count(good_ts)
        bad_event_count = StackdriverBackend.count(bad_ts)

        return (good_event_count, bad_event_count)

    def exponential_distribution_cut(self, timestamp, window, **kwargs):
        """Query one timeserie of type 'exponential'.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window size (in seconds).
            kwargs (dict): Extra arguments needed by this computation method.
                project_id (str): Project id.
                measurement (dict): Measurement config.
                    filter (str): Query filter for 'valid' events.
                    threshold_bucket (int): Bucket number that is the threshold
                        for good / bad events.
                    good_below_threshold (bool, optional): If good events are
                    below the threshold (True) or above it (False). Defaults to
                    True.

        Returns:
            tuple: A tuple (good_event_count, bad_event_count).
        """
        project_id = kwargs['project_id']
        measurement = kwargs['measurement']
        filter_valid = measurement['filter_valid']
        threshold_bucket = int(measurement['threshold_bucket'])
        good_below_threshold = measurement.get('good_below_threshold', True)

        # Query 'valid' events
        series = self.query(project_id=project_id,
                            timestamp=timestamp,
                            window=window,
                            filter=filter_valid)
        series = list(series)

        if not series:
            return (0, 0)  # no timeseries

        distribution_value = series[0].points[0].value.distribution_value
        bucket_options = distribution_value.bucket_options
        bucket_counts = distribution_value.bucket_counts
        valid_events_count = distribution_value.count
        growth_factor = bucket_options.exponential_buckets.growth_factor
        scale = bucket_options.exponential_buckets.scale

        # Explicit the exponential distribution result
        count_sum = 0
        distribution = OrderedDict()
        for i, bucket_count in enumerate(bucket_counts):
            count_sum += bucket_count
            upper_bound = scale * math.pow(growth_factor, i)
            distribution[i] = {
                'upper_bound': upper_bound,
                'bucket_count': bucket_count,
                'count_sum': count_sum
            }
        LOGGER.debug(pprint.pformat(distribution))

        if len(distribution) - 1 < threshold_bucket:
            # maximum measured metric is below the cut after bucket number
            lower_events_count = valid_events_count
            upper_events_count = 0
        else:
            lower_events_count = distribution[threshold_bucket]['count_sum']
            upper_events_count = valid_events_count - lower_events_count

        if good_below_threshold:
            good_event_count = lower_events_count
            bad_event_count = upper_events_count
        else:
            good_event_count = upper_events_count
            bad_event_count = lower_events_count

        return (good_event_count, bad_event_count)

    @staticmethod
    def _get_window(timestamp, window):
        """Helper for measurement window.

        Args:
            timestamp (int): Current timestamp.
            window (int): Window size (in seconds).

        Returns:
            :obj:`monitoring_v3.types.TimeInterval`: Measurement window object.
        """
        measurement_window = monitoring_v3.types.TimeInterval()
        measurement_window.end_time.seconds = int(timestamp)
        measurement_window.end_time.nanos = int(
            (timestamp - measurement_window.end_time.seconds) * 10**9)
        measurement_window.start_time.seconds = int(timestamp - window)
        measurement_window.start_time.nanos = measurement_window.end_time.nanos
        LOGGER.debug(pprint.pformat(measurement_window))
        return measurement_window

    @staticmethod
    def _get_aggregation(window, aligner='ALIGN_SUM', reducer='REDUCE_SUM'):
        """Helper for aggregation object.

        Default aggregation is `ALIGN_SUM`.
        Default reducer is `REDUCE_SUM`.

        Args:
            window (int): Window size (in seconds).
            aligner (str): Aligner type.
            reducer (str): Reducer type.

        Returns:
            :obj:`monitoring_v3.types.Aggregation`: Aggregation object.
        """
        aggregation = monitoring_v3.types.Aggregation()
        aggregation.alignment_period.seconds = window
        aggregation.per_series_aligner = (getattr(
            monitoring_v3.enums.Aggregation.Aligner, aligner))
        aggregation.cross_series_reducer = (getattr(
            monitoring_v3.enums.Aggregation.Reducer, reducer))
        LOGGER.debug(pprint.pformat(aggregation))
        return aggregation
