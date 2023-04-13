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

import re
import uuid
import os
import sys
import unittest
from datetime import datetime
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to
import apache_beam as beam

# include the parent folder to load the lib module
current = os.path.dirname(os.path.realpath(__file__))
parent_directory = os.path.dirname(current)

sys.path.append(parent_directory)

from lib import PipelineHelper, RowGenerator

EXPECTED_NUMBER_OF_ROWS = 1002
EXPECTED_NUMBER_OF_ROWS_PER_BATCH = 100
EXPECTED_BATCHES = [100,100,100,100,100,100,100,100,100,100,2]


class Test_RowGenerator(unittest.TestCase):

    def is_valid_uuid(self,val):
        """check the values of field 'id'"""
        try:
            uuid.UUID(str(val))
            return True
        except ValueError:
            return False

    def validate_uuid(self,val):
        self.assertTrue(self.is_valid_uuid(val))


    def validate_date(self, val):
        """check the values of field 'date'"""
        date_in_scope = datetime.strptime(val, '%Y-%m-%d %H:%M:%S')
        min_date = datetime.strptime("2018-01-01T00:00:00Z", '%Y-%m-%dT%H:%M:%SZ')
        max_date = datetime.strptime("2023-01-01T00:00:00Z", '%Y-%m-%dT%H:%M:%SZ')

        self.assertTrue(min_date <= date_in_scope <= max_date)

    def validate_name(self,val):
        """check the values of field 'name'"""
        is_ascii = all(ord(c) < 128 for c in val)
        is_length_met = len(val) == 10

        self.assertTrue(is_ascii and is_length_met)

    def validate_phone_number(self, val):
        """check the values of field 'phone_number'"""
        pattern = re.compile("\\d{4}-\\d{4}-\\d{4}-[0-9]{4}")

        self.assertTrue(pattern.match(val))

    def validate_product_id(self, val):
        """check the values of field 'product_id'"""
        self.assertTrue(val in ["product1","product2","product3"])

    def validate_country(self, val):
        """check the values of field 'country'"""
        self.assertTrue(val in ["Argentina","Brazil","Chile","France"])

    def validate_amount(self, val):
        """check the values of field 'amount'"""
        self.assertTrue(5<= val <=100)

    def validate_price(self, val):
        """check the values of field 'price'"""
        mapping = {
            "product1":15,
            "product2":30,
            "product3":70
        }

        self.assertTrue(val[1] == mapping[val[0]])

    def validate_customer_satisfaction(self, val):
        """check the values of field 'customer_satisfaction'"""
        self.assertTrue(51.5<=val<=100)

    def test_generated_rows(self):
        config_file_path = "./config.json"
        pipeline_helper = PipelineHelper(
            config_file_path=config_file_path
        )

        with TestPipeline() as p:

            batches = p | 'CreateBatches' >> beam.Create(pipeline_helper.get_batches())

            #check the batches
            assert_that(batches, equal_to(EXPECTED_BATCHES))

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
            assert_that(total_generated_rows, equal_to([EXPECTED_NUMBER_OF_ROWS]), label='CheckOutput')

            elements | "GetIds" >> beam.Map(lambda x: x["id"]) | "ValidateUUID" >> beam.Map(self.validate_uuid)
            elements | "GetDate" >> beam.Map(lambda x: x["date"]) | "ValidateDate" >> beam.Map(self.validate_date)
            elements | "GetName" >> beam.Map(lambda x: x["name"]) | "ValidateName" >> beam.Map(self.validate_name)
            elements | "GetPhoneNumber" >> beam.Map(lambda x: x["phone_number"]) | "ValidatePhoneNumber" >> beam.Map(self.validate_phone_number)
            elements | "GetProductIds" >> beam.Map(lambda x: x["product_id"]) | "ValidateProductId" >> beam.Map(self.validate_product_id)
            elements | "GetCountry" >> beam.Map(lambda x: x["country"]) | "ValidateCountry" >> beam.Map(self.validate_country)
            elements | "GetAmount" >> beam.Map(lambda x: x["amount"]) | "ValidateAmount" >> beam.Map(self.validate_amount)
            elements | "GetPrice" >> beam.Map(lambda x: [x["product_id"], x["price"]]) | "ValidatePrice" >> beam.Map(self.validate_price)
            elements | "GetCustomerSatisfaction" >> beam.Map(lambda x: x["customer_satisfaction"]) | "ValidateCustomerSatisfaction" >> beam.Map(self.validate_customer_satisfaction)


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
            EXPECTED_BATCHES
        )

    def test_config(self):
        self.assertEqual(
            self.pipeline_helper.config.total_number_of_rows,
            EXPECTED_NUMBER_OF_ROWS
        )

        self.assertEqual(
            self.pipeline_helper.config.number_of_rows_per_batch,
            EXPECTED_NUMBER_OF_ROWS_PER_BATCH
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