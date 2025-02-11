#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

"""Test for the ML data preprocessing pipeline."""

import logging
import unittest
from ml_preproc.pipeline.beam_classes.preprocess import PreprocessingTransform
from ml_preproc.pipeline.model.data_classes import Record
from apache_beam.testing.test_pipeline import TestPipeline
import apache_beam as beam
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to

class PreprocessingTest(unittest.TestCase):

  ### Example PTransform Test ###
  # Integration test; testing all transformation steps end-to-end with static input, excluding Read and Write steps.
  def test_transform_integration_test(self):

    INPUT_DATA = [Record(source_address='street1', source_city='city1', target_address='road1', target_city='city1')]

    EXPECTED_OUTPUT = [{
      'source_address': 'street1',
      'source_city': 'city1',
      'target_address': 'road1',
      'target_city': 'city1',
      'address_similarity': 0,
      'city_similarity': 1}]

    with TestPipeline() as p:

      # 1. Create a PCollection from static input data
      abbrev = {}

      # 2. Apply PTransform under test
      output = (p
        | "Create test input data" >> beam.Create(INPUT_DATA)
        | "Apply transformations" >> PreprocessingTransform(abbrev))

      # 3. Assert that the output PCollection matches the expected output.
      assert_that(output, equal_to(EXPECTED_OUTPUT), label='CheckOutput')


if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  unittest.main()