# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Simple tests for label generation."""

from __future__ import absolute_import

import logging
import unittest
import datetime
import copy

import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to

from . import preprocess


class PreprocessTest(unittest.TestCase):
    """Tests showcasing Dataflow label generation."""

    # BigQuery data in Beam is ingested as a list of dicts
    SOURCE_DATA = [
        {
            'start_date': datetime.datetime(2019, 2, 1),
            'end_date': datetime.datetime(2019, 7, 1),
            'active': False
        },
        {
            'start_date': datetime.datetime(2019, 7, 1),
            'end_date': None,
            'active': True
        }
    ]

    # Generate expected data after _append_lifetime_duration step
    DURATION_DATA = copy.deepcopy(SOURCE_DATA)
    DURATION_DATA[0].update(duration=150)
    duration_diff = datetime.datetime.now() - DURATION_DATA[1]['start_date']
    DURATION_DATA[1].update(duration=duration_diff.days)

    LABEL_DATA = copy.deepcopy(DURATION_DATA)
    LABEL_DATA[0].update(label='4-6M')
    # label for LABEL_DATA[1] should be updated as time from 7/1/2019 to
    # current data results in later lifetime intervals
    LABEL_DATA[1].update(label='0-2M')

    LABEL_ARRAY_DATA = copy.deepcopy(LABEL_DATA)
    LABEL_ARRAY_DATA[0].update(labelArray=[1, 1, 0, 0, 0, 0, 1, 0])
    LABEL_ARRAY_DATA[1].update(labelArray=[0, 0, 0, 0, 0, 0, 0, 0])


    def test_append_lifetime_duration(self):
        """Test _append_life_duration step.

        Expected behavior is that the pipeline appends the calculated lifetime
        duration (in days) of each user to a list of dicts containing BigQuery
        output.
        """
        with TestPipeline() as p:
            input_data = (
                p
                | 'CreateSourceData' >> beam.Create(
                    PreprocessTest.SOURCE_DATA))

            duration_data = (
                input_data
                | 'AppendLifetime' >> beam.Map(
                    preprocess.append_lifetime_duration))

            assert_that(duration_data, equal_to(
                PreprocessTest.DURATION_DATA))


    def test_append_label(self):
        """Test _append_label step.

        Expected behavior is that the pipeline appends the String label (i.e.
        '0-2M') of each user to a list of dicts containing BigQuery output.
        """
        with TestPipeline() as p:
            input_data = (
                p
                | 'CreateDurationData' >> beam.Create(
                    PreprocessTest.DURATION_DATA))

            label_data = (
                input_data
                | 'AppendLabel' >> beam.Map(
                    preprocess.append_label))

            assert_that(label_data, equal_to(
                PreprocessTest.LABEL_DATA))


    def test_combine_censorship_duration(self):
        """Test _combine_censorship_duration step.

        Expected behavior is that the pipeline appends the array representing
        which lifetime intervals the user survived and which interval they died
        in (if uncensored).
        """
        with TestPipeline() as p:
            input_data = (
                p
                | 'CreateLabelData' >> beam.Create(
                    PreprocessTest.LABEL_DATA))

            label_array_data = (
                input_data
                | 'AppendLabelArray' >> beam.Map(
                    preprocess.combine_censorship_duration))

            assert_that(label_array_data, equal_to(
                PreprocessTest.LABEL_ARRAY_DATA))


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    unittest.main()
