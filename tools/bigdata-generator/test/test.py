#   Copyright 2023 Google LLC All Rights Reserved
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

from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to
import apache_beam as beam

import re
import uuid
import os, sys
import unittest
from datetime import datetime
#include the parent folder to load the lib module
current = os.path.dirname(os.path.realpath(__file__))
parent_directory = os.path.dirname(current)

sys.path.append(parent_directory)

from lib import PipelineHelper, RowGenerator

expected_number_of_rows = 1002
expected_number_of_rows_per_batch = 100
expected_batches = [100,100,100,100,100,100,100,100,100,100,2]

class Test_RowGenerator(unittest.TestCase):

    def test_generated_rows(self):
        config_file_path = "./config.json"
        pipeline_helper = PipelineHelper(
            config_file_path=config_file_path
        )

        with TestPipeline() as p:
    
            batches = p | 'CreateBatches' >> beam.Create(pipeline_helper.get_batches())

            #check the batches
            assert_that(batches, equal_to(expected_batches))

            elements = (
                batches
                | 'GenerateRows' >> beam.ParDo(
                    RowGenerator(
                        config=pipeline_helper.get_config()
                        )
                    )
            )

            # check the amount of rows generated
            total_generated_rows = elements | 'Count' >> beam.combiners.Count.Globally()
            assert_that(total_generated_rows, equal_to([expected_number_of_rows]), label='CheckOutput')


            # check the values of field 'id'
            def is_valid_uuid(val):
                try:
                    uuid.UUID(str(val))
                    return True
                except ValueError:
                    return False

            def validate_uuid(val):
                self.assertTrue(is_valid_uuid(val))

            elements | "GetIds" >> beam.Map(lambda x: x["id"]) | "ValidateUUID" >> beam.Map(validate_uuid)

            # check the values of field 'date'
            def validate_date(val):
                date_in_scope = datetime.strptime(val, '%Y-%m-%d %H:%M:%S')
                min_date = datetime.strptime("2018-01-01T00:00:00Z", '%Y-%m-%dT%H:%M:%SZ')
                max_date = datetime.strptime("2023-01-01T00:00:00Z", '%Y-%m-%dT%H:%M:%SZ')

                self.assertTrue(min_date <= date_in_scope <= max_date)

            elements | "GetDate" >> beam.Map(lambda x: x["date"]) | "ValidateDate" >> beam.Map(validate_date)

            # check the values of field 'name'
            def validate_name(val):
                is_ascii = all(ord(c) < 128 for c in val)
                is_length_met = len(val) == 10

                self.assertTrue(is_ascii and is_length_met)

            elements | "GetName" >> beam.Map(lambda x: x["name"]) | "ValidateName" >> beam.Map(validate_name)

            # check the values of field 'phone_number'
            def validate_phone_number(val):
                pattern = re.compile("\\d{4}-\\d{4}-\\d{4}-[0-9]{4}")

                self.assertTrue(pattern.match(val))

            elements | "GetPhoneNumber" >> beam.Map(lambda x: x["phone_number"]) | "ValidatePhoneNumber" >> beam.Map(validate_phone_number)

            # check the values of field 'product_id'
            def validate_product_id(val):
                self.assertTrue(val in ["product1","product2","product3"])

            elements | "GetProductIds" >> beam.Map(lambda x: x["product_id"]) | "ValidateProductId" >> beam.Map(validate_product_id)

            # check the values of field 'country'
            def validate_country(val):
                self.assertTrue(val in ["Argentina","Brazil","Chile","France"])

            elements | "GetCountry" >> beam.Map(lambda x: x["country"]) | "ValidateCountry" >> beam.Map(validate_country)

            # check the values of field 'amount'
            def validate_amount(val):
                self.assertTrue(5<= val <=100)

            elements | "GetAmount" >> beam.Map(lambda x: x["amount"]) | "ValidateAmount" >> beam.Map(validate_amount)

            # check the values of field 'price'
            def validate_price(val):
                mapping = {
                    "product1":15,
                    "product2":30,
                    "product3":70
                }

                self.assertTrue(val[1] == mapping[val[0]])

            elements | "GetPrice" >> beam.Map(lambda x: [x["product_id"], x["price"]]) | "ValidatePrice" >> beam.Map(validate_price)

            # check the values of field 'customer_satisfaction'
            def validate_customer_satisfaction(val):
                self.assertTrue(51.5<=val<=100)

            elements | "GetCustomerSatisfaction" >> beam.Map(lambda x: x["customer_satisfaction"]) | "ValidateCustomerSatisfaction" >> beam.Map(validate_customer_satisfaction)


class Test_PipelineHelper(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config_file_path = "./config.json"
        cls.pipeline_helper = PipelineHelper(
            config_file_path=config_file_path
        )

    def test_batches(self):
        self.assertEqual(
            self.pipeline_helper.get_batches(),
            expected_batches
        )

    def test_config(self):
        self.assertEqual(
            self.pipeline_helper.config.total_number_of_rows,
            expected_number_of_rows
        )

        self.assertEqual(
            self.pipeline_helper.config.number_of_rows_per_batch,
            expected_number_of_rows_per_batch
        )

        self.assertEqual(
            len(self.pipeline_helper.config.sinks),
            1
        )

        self.assertEqual(
            len(self.pipeline_helper.config.lookup_fields),
            1
        )

        self.assertEqual(
            len(self.pipeline_helper.config.fields),
            9
        )

if __name__ == '__main__':
    unittest.main()