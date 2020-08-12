#
# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import logging
import sys
import random
import unittest

import apache_beam as beam

from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to

sys.path.insert(0, '../')

import pipeline
import static_data


class TestParseJSON(unittest.TestCase):
    def test_parse_json(self):
        """Tests parse_json(bytestring) from pipeline.py"""
        input_tweets, expected_output = static_data.get_static_parse_json_data()

        with TestPipeline() as p:
            actual_output = (p | "create_test_data" >> beam.Create(input_tweets)
                               | "run_func" >> beam.Map(pipeline.parse_json))

            assert_that(actual_output, equal_to(expected_output))


class TestWindowingInfo(unittest.TestCase):
    def test_add_windowing_information(self):
        """Tests AddWindowingInformation() from pipeline.py"""
        input_tweets, expected_output = static_data.get_static_windowing_information_data()
        window_size = 10

        with TestPipeline() as p:
            actual_output = (p | "create_test_data" >> beam.Create(input_tweets)
                               | "add_time" >> beam.Map(lambda e: beam.window.TimestampedValue(e, random.randrange(window_size)))
                               | "add_window" >> beam.WindowInto(beam.window.FixedWindows(window_size))
                               | "run_parDo" >> beam.ParDo(pipeline.AddWindowingInformation()))

            assert_that(actual_output, equal_to(expected_output))


class TestNLPClients(unittest.TestCase):
    def test_nlp_batched(self):
        """Tests NlpClient_Batched() from pipeline.py"""
        input_tweets, expected_output, random_scores = static_data.get_static_b_nlp_tweets()

        with TestPipeline() as p:
            actual_output = (p | "test_data" >> beam.Create(input_tweets)
                               | "groupByKey" >> beam.GroupByKey()
                               | "run_parDo" >> beam.ParDo(pipeline.NlpClient_Batched(static_data.StaticNLPClient(random_scores, nlp_batching=True))))

            assert_that(actual_output, equal_to(expected_output))

    def test_nlp_element_wise(self):
        """Tests NlpClient_ElementWise() from pipeline.py"""
        input_tweets, expected_output, random_scores = static_data.get_static_ew_nlp_tweets()

        with TestPipeline() as p:
            actual_output = (p | "test_data" >> beam.Create(input_tweets)
                               | "run_parDo" >> beam.ParDo(pipeline.NlpClient_ElementWise(static_data.StaticNLPClient(random_scores))))

            assert_that(actual_output, equal_to(expected_output))


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    unittest.main()
