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
from dataflow_python_examples.data_lake_to_mart import DataLakeToDataMart
from dataflow_python_examples.data_lake_to_mart_cogroupbykey import DataLakeToDataMartCGBK


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

    def test_joining_data_lake_to_data_mart(self):
        """Test the parsing logic in data_lake_to_data_mart.py"""

        data_lake_to_data_mart = DataLakeToDataMart()
        orders_input = {u'acct_number': u'8675309',
                        u'quantity': u'1',
                        u'date': u'2017-01-01',  # This is the BigQuery format.
                        u'item': u'Boots',
                        }

        account_details = {u'8675309':
                               {u'acct_number': u'8675309',
                                u'name': u'Jenny',
                                u'city': u'Springfield',
                                u'address': u'42 Main Street',
                                }
                           }
        joined_data_results = data_lake_to_data_mart.add_account_details(orders_input, account_details)

        expected_results = {u'acct_number': u'8675309',
                            u'quantity': u'1',
                            u'date': u'2017-01-01',
                            u'item': u'Boots',
                            u'name': u'Jenny',
                            u'city': u'Springfield',
                            u'address': u'42 Main Street',
                            }

        self.assertEquals(joined_data_results, expected_results)

    def test_joining_data_lake_to_data_mart_co_group_by_key(self):
        """Test the parsing logic in data_lake_to_data_mart.py"""

        data_lake_to_data_mart = DataLakeToDataMartCGBK()
        orders_input = [{u'acct_number': u'8675309',
                         u'quantity': u'1',
                         u'date': u'2017-01-01',  # This is the BigQuery format.
                         u'item': u'Boots',
                         }]

        account_details = [
            {u'acct_number': u'8675309',
             u'name': u'Jenny',
             u'city': u'Springfield',
             u'address': u'42 Main Street',
             }
        ]

        input_data = {'orders': orders_input, 'account_details': account_details}
        joined_data_results = data_lake_to_data_mart.add_account_details((u'8675309', input_data))

        expected_results = [{u'acct_number': u'8675309',
                             u'quantity': u'1',
                             u'date': u'2017-01-01',
                             u'item': u'Boots',
                             u'name': u'Jenny',
                             u'city': u'Springfield',
                             u'address': u'42 Main Street',
                             }]

        self.assertEquals(joined_data_results, expected_results)


if __name__ == '__main__':
    unittest.main()
