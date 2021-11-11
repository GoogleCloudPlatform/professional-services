# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""This script contains various tests to validate the pipeline end to end"""

import functools
import time
import unittest
from datetime import datetime
from typing import Tuple
from unittest import mock

import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.test_stream import TestStream
from apache_beam.testing.util import assert_that, equal_to, equal_to_per_window
from apache_beam.transforms import window

from sideinput_refresh import main
from tests import static_data


class TestCompletePipeline(unittest.TestCase):

    def test_enrichment_allevents(self):
        """Tests the pipeline by creating mock data and invoking respective transforms"""

        with TestPipeline() as pipeline:
            sideinput_filepath = (
                pipeline | 'Read side Input file path' >> beam.Create(
                    ["gs://bucketname/input/sideinput/20200503".encode()]) |
                "Add Timestamp" >> beam.Map(
                    lambda e: beam.window.TimestampedValue(e, int(time.time())))
            )

            sideinput_collections = main.get_sideinput_collections(
                sideinput_filepath, static_data.ReadStaticSideInput())

            sales_events = (
                pipeline | 'Read primary events' >> beam.Create(
                    static_data.get_maininput_events()) |
                'Attach timestamp' >> beam.Map(
                    lambda e: beam.window.TimestampedValue(e, int(time.time())))
                | "Add Fixed window" >> beam.WindowInto(
                    beam.window.FixedWindows(10)))

            enriched_events = main.get_enriched_events(sales_events,
                                                       sideinput_collections)

            results = enriched_events | "UnPack the events" >> beam.FlatMap(
                lambda x: x)

            assert_that(results,
                        equal_to(static_data.get_expected_enriched_events()))

    def test_enrichment_windowedevents(self):
        """Tests the pipeline end to end by mocking inputs and transforms"""

        def _get_window_intervals(
            window_duration: int
        ) -> Tuple[window.IntervalWindow, window.IntervalWindow]:
            """Builds two Fixed size windows based on window_duration with following assumptions:

            1. For tests windows duration cannot exceed 30 seconds. For larger size windows the datetime_format can be adjusted to remove minute component
            2. Test is still considered as flaky and can potentially fail to match expected enriched events when executed in last 5 seconds of an hour since
               main input and side input falls into different hour intervals.
            """
            datetime_format = '%Y-%m-%dT%H:%M'
            seconds_since_epoch = datetime.strptime(
                datetime.now().strftime(datetime_format),
                datetime_format).timestamp() + window_duration
            return (window.IntervalWindow(seconds_since_epoch - window_duration,
                                          seconds_since_epoch),
                    window.IntervalWindow(seconds_since_epoch,
                                          seconds_since_epoch +
                                          window_duration))

        def _mock_ReadFromPubSub(subscription, input_events):
            """Mocks pubsub input and returns the values based on the subscription name (i.e whether side input
               subscription or main input subscription)
            """
            if subscription == 'projects/test-project/subscriptions/sidesub':
                return TestStream().add_elements([
                    beam.window.TimestampedValue(
                        "path/to/sideinput/yyyymmddd".encode(),
                        int(time.time()))
                ])

            return TestStream().add_elements(input_events)

        @beam.ptransform_fn
        def assertion_matcher(pcol, expected_values):
            """Assertion matcher to match the pipeline output to expected output"""
            assert_that(pcol,
                        equal_to_per_window(expected_values),
                        use_global_window=False,
                        label='Assert events per window.')

        window_duration = 10  # Events are distributed between 2 windows each of 10 seconds duration
        window_intervals = _get_window_intervals(window_duration)
        windowed_events = static_data.get_windowedevents(window_intervals)
        main.transforms.LogEvents = functools.partial(
            assertion_matcher,
            expected_values=static_data.get_expected_enriched_windowevents(
                window_intervals))

        with mock.patch('apache_beam.io.ReadFromPubSub',
                        new=functools.partial(_mock_ReadFromPubSub,
                                              input_events=windowed_events)):
            with mock.patch(
                    'sideinput_refresh.main.transforms.ReadSideInputData',
                    new=static_data.ReadStaticSideInput):
                main.run([
                    '--project',
                    'test-project',
                    '--runner',
                    'DirectRunner',
                    '--sideinput-notification-subscription',
                    'projects/test-project/subscriptions/sidesub',
                    '--maininput-subscription',
                    'projects/test-project/subscriptions/mainsub',
                    '--sideinput-window-duration',
                    "3600",
                    '--maininput-window-duration',
                    str(window_duration),
                    '--demorun',
                ],
                         save_main_session=False)


if __name__ == '__main__':
    unittest.main()
