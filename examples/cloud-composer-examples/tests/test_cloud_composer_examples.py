# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""test_cloud_composer_examples.py contains unit tests for cloud-composer-examples."""

import logging
import unittest

from composer_dataflow_examples.dataflow.process_delimited import RowTransformer


class ComposerDataflowTests(unittest.TestCase):
    """Test class for composer_dataflow_examples."""

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_row_transformer_parse(self):
        """Test the parsing logic in process_delimited.py"""

        test_filename = 'simple-test-file.test'
        test_load_dt = '2018-06-06'

        row_transformer = RowTransformer(delimiter=',',
                                         header='state,gender,year,name,number,created_date',
                                         filename=test_filename,
                                         load_dt=test_load_dt)
        csv_input = 'KS,F,1923,Dorothy,654,11/28/2016'

        expected_dict_output = {u'state': u'KS',
                                u'gender': u'F',
                                u'year': u'1923',
                                u'name': u'Dorothy',
                                u'number': u'654',
                                u'created_date': u'11/28/2016',
                                'filename': test_filename,
                                'load_dt': test_load_dt}
        actual_dict_output = row_transformer.parse(csv_input)
        self.assertEqual(actual_dict_output, expected_dict_output)


if __name__ == '__main__':
    unittest.main()
