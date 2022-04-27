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
from ml_preproc.pipeline.beam_classes.parse_csv import ParseCSVDoFn
from ml_preproc.pipeline.model.data_classes import Record
from apache_beam.testing.test_pipeline import TestPipeline
import apache_beam as beam
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to

class ParseCSVTest(unittest.TestCase):

  #### Example DoFn Test ###
  def test_parse_CSV_DoFn(self):

    HEADER_LINE = 'source_address;source_city;target_address;target_city'

    ACCEPTED_RECORD = 'street1;city1;street2;city2'
    REJECTED_RECORD = 'street1;city1;street2'
    INPUT_DATA = [ACCEPTED_RECORD, REJECTED_RECORD]

    EXPECTED_SUCCESSFUL= [Record(source_address='street1', source_city='city1', target_address='street2', target_city='city2')]

    EXPECTED_REJECTED= [{
        'error': "__new__() missing 1 required positional argument: 'target_city'",
        'line': REJECTED_RECORD
    }]

    with TestPipeline() as p:
        # 1. Create a PCollection from static input data.
        # 2. Apply PTransform under test
        output = (p
                | beam.Create(INPUT_DATA)
                | beam.ParDo(ParseCSVDoFn(header_line=HEADER_LINE)).with_outputs())

        # 3. Assert that the output PCollection matches the expected output.
        assert_that(output[ParseCSVDoFn.CORRECT_OUTPUT_TAG], equal_to(EXPECTED_SUCCESSFUL), label='CheckSuccess')
        assert_that(output[ParseCSVDoFn.WRONG_OUTPUT_TAG], equal_to(EXPECTED_REJECTED), label='CheckError')


if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  unittest.main()