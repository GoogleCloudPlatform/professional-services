# Copyright 2017 Google Inc.
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


import logging
import unittest

from dataflow_python_examples.data_transformation import DataTransformation
from dataflow_python_examples.data_ingestion import DataIngestion


class TestHandlers(unittest.TestCase):
    """The test cases are focused on the business logic.  In this case this is how we parse the data, transform the types 
    and join datasets."""

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_parsing_data_ingestion(self):
        """Test the parsing logic in data_ingestion.py"""

        data_ingestion = DataIngestion()
        csv_input = 'KS,F,1923,Dorothy,654,11/28/2016'

        expected_dict_output = {u'state': u'KS',
                                u'gender': u'F',
                                u'year': u'1923',  # This is the same format as the source file, with no transformation.
                                u'name': u'Dorothy',
                                u'number': u'654',
                                u'created_date': u'11/28/2016'
                                }
        actual_dict_outut = data_ingestion.parse_method(csv_input)
        self.assertEquals(actual_dict_outut, expected_dict_output)

    def test_parsing_data_transformation(self):
        """Test the parsing logic in data_transformation.py"""

        data_ingestion = DataTransformation()
        csv_input = 'KS,F,1923,Dorothy,654,11/28/2016'

        expected_dict_output = {u'state': u'KS',
                                u'gender': u'F',
                                u'year': u'1923-01-01',  # This is the BigQuery format.
                                u'name': u'Dorothy',
                                u'number': u'654',
                                u'created_date': u'11/28/2016'
                                }
        actual_dict_outut = data_ingestion.parse_method(csv_input)
        self.assertEquals(actual_dict_outut, expected_dict_output)


if __name__ == '__main__':
    unittest.main()
