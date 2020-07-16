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
import pprint
import warnings

from google.cloud import monitoring_v3

LOGGER = logging.getLogger(__name__)


class StackdriverBackend:
    """Backend for querying metrics from Stackdriver Monitoring.

    Args:
        project_id (str): Stackdriver host project id.
        client (google.cloud.monitoring_v3.MetricServiceClient, optional):
            Existing Stackdriver Service Monitoring client. Initialize a new
            client if omitted.
    """

    def __init__(self, project_id, client=None):
        self.client = client
        if client is None:
            self.client = monitoring_v3.MetricServiceClient()
        self.parent = self.client.project_path(project_id)

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
        conf = slo_config['backend']
        measurement = conf['measurement']
        filter_good = measurement['filter_good']
        filter_bad = measurement.get('filter_bad')
        filter_valid = measurement.get('filter_valid')

        # Query 'good events' timeseries
        good_ts = self.query(timestamp=timestamp,
                             window=window,
                             filter=filter_good)
        good_ts = list(good_ts)
        good_event_count = SD.count(good_ts)

        # Query 'bad events' timeseries
        if filter_bad:
            bad_ts = self.query(timestamp=timestamp,
                                window=window,
                                filter=filter_bad)
            bad_ts = list(bad_ts)
            bad_event_count = SD.count(bad_ts)
        elif filter_valid:
            valid_ts = self.query(timestamp=timestamp,
                                  window=window,
                                  filter=filter_valid)
            valid_ts = list(valid_ts)
            bad_event_count = SD.count(valid_ts) - good_event_count
        else:
            raise Exception("Oneof `filter_bad` or `filter_valid` is required.")

        LOGGER.debug(f'Good events: {good_event_count} | '
                     f'Bad events: {bad_event_count}')

        return (good_event_count, bad_event_count)

    def distribution_cut(self, timestamp, window, slo_config):
        """Query one timeserie of type 'exponential'.

        Args:
            timestamp (int): UNIX timestamp.
            window (int): Window size (in seconds).
            slo_config (dict): SLO configuration.

        Returns:
            tuple: A tuple (good_event_count, bad_event_count).
        """
        conf = slo_config['backend']
        measurement = conf['measurement']
        filter_valid = measurement['filter_valid']
        threshold_bucket = int(measurement['threshold_bucket'])
        good_below_threshold = measurement.get('good_below_threshold', True)

        # Query 'valid' events
        series = self.query(timestamp=timestamp,
                            window=window,
                            filter=filter_valid)
        series = list(series)

        if not series:
            return (0, 0)  # no timeseries

        distribution_value = series[0].points[0].value.distribution_value
        # bucket_options = distribution_value.bucket_options
        bucket_counts = distribution_value.bucket_counts
        valid_events_count = distribution_value.count
        # growth_factor = bucket_options.exponential_buckets.growth_factor
        # scale = bucket_options.exponential_buckets.scale

        # Explicit the exponential distribution result
        count_sum = 0
        distribution = OrderedDict()
        for i, bucket_count in enumerate(bucket_counts):
            count_sum += bucket_count
            # upper_bound = scale * math.pow(growth_factor, i)
            distribution[i] = {
                # 'upper_bound': upper_bound,
                # 'bucket_count': bucket_count,
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

    def exponential_distribution_cut(self, *args, **kwargs):
        """Alias for `distribution_cut` method to allow for backwards
        compatibility.
        """
        warnings.warn(
            'exponential_distribution_cut will be deprecated in version 2.0, '
            'please use distribution_cut instead', PendingDeprecationWarning)
        return self.distribution_cut(*args, **kwargs)

    def query(self,
              timestamp,
              window,
              filter,
              aligner='ALIGN_SUM',
              reducer='REDUCE_SUM',
              group_by=[]):
        """Query timeseries from Stackdriver Monitoring.

        Args:
            timestamp (int): Current timestamp.
            window (int): Window size (in seconds).
            filter (str): Query filter.
            aligner (str, optional): Aligner to use.
            reducer (str, optional): Reducer to use.
            group_by (list, optional): List of fields to group by.

        Returns:
            list: List of timeseries objects.
        """
        measurement_window = SD.get_window(timestamp, window)
        aggregation = SD.get_aggregation(window,
                                         aligner=aligner,
                                         reducer=reducer,
                                         group_by=group_by)
        timeseries = self.client.list_time_series(
            self.parent, filter, measurement_window,
            monitoring_v3.enums.ListTimeSeriesRequest.TimeSeriesView.FULL,
            aggregation)
        LOGGER.debug(pprint.pformat(timeseries))
        return timeseries

    @staticmethod
    def count(timeseries):
        """Count events in time series assuming it was aligned with ALIGN_SUM
        and reduced with REDUCE_SUM (default).

        Args:
            :obj:`monitoring_v3.TimeSeries`: Timeseries object.

        Returns:
            int: Event count.
        """
        try:
            return timeseries[0].points[0].value.int64_value
        except (IndexError, AttributeError) as exception:
            LOGGER.warning("Couldn't find any values in timeseries response")
            LOGGER.debug(exception)
            return 0  # no events in timeseries

    @staticmethod
    def get_window(timestamp, window):
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
    def get_aggregation(window,
                        aligner='ALIGN_SUM',
                        reducer='REDUCE_SUM',
                        group_by=[]):
        """Helper for aggregation object.

        Default aggregation is `ALIGN_SUM`.
        Default reducer is `REDUCE_SUM`.

        Args:
            window (int): Window size (in seconds).
            aligner (str): Aligner type.
            reducer (str): Reducer type.
            group_by (list): List of fields to group by.

        Returns:
            :obj:`monitoring_v3.types.Aggregation`: Aggregation object.
        """
        aggregation = monitoring_v3.types.Aggregation()
        aggregation.alignment_period.seconds = window
        aggregation.per_series_aligner = (getattr(
            monitoring_v3.enums.Aggregation.Aligner, aligner))
        aggregation.cross_series_reducer = (getattr(
            monitoring_v3.enums.Aggregation.Reducer, reducer))
        aggregation.group_by_fields.extend(group_by)
        LOGGER.debug(pprint.pformat(aggregation))
        return aggregation


SD = StackdriverBackend
