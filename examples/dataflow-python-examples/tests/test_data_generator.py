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
import datetime
import unittest
import os
import re

from faker_schema.faker_schema import FakerSchema

from dataflow_python_examples.data_generation_for_benchmarking import DataGenerator, FakeRowGen


class TestDataGenerator(unittest.TestCase):
    """The test cases are focused on the business logic.  In this case this is how we parse the
    schemas, generate data and label images.

    Execution Note:
        This script is stored in professional-services/data-analytics/dataflow-python-examples/tests
        but should be copied to professional-services/data-analytics/dataflow-python-examples/ and
        run from there.
    """

    def setUp(self):
        # User parser to define default data_args.

        # Note changed default for schema_file for ease of testing.
        dir_path = os.path.dirname(os.path.realpath(''))
        schema_file = os.path.join(dir_path, 'dataflow-python-examples', 'dataflow_python_examples',
                                   'resources', 'lineorder-schema.json')

        self.data_gen = DataGenerator(bq_schema_filename=schema_file,
                                      p_null=0.0, n_keys=1000, min_date='2000-01-01',
                                      max_date=datetime.date.today().strftime('%Y-%m-%d'),
                                      only_pos=True, max_int=10**11, max_float=float(10**11),
                                      float_precision=2, write_disp='WRITE_APPEND')


        self.fakerowgen = FakeRowGen(self.data_gen)


        logging.basicConfig(level=logging.DEBUG)

    def test_get_bq_schema_string(self):
        """
        This tests the get_bq_schema_string method of the DataGenerator class which parses
        a 'fieldname:field_type' string defining a the schema from a
        [{name,type,mode}] schema dictionary.
        """
        expected_bq_schema_string = "lo_order_key:STRING,lo_linenumber:INTEGER,lo_part_key:STRING,lo_cust_key:STRING,lo_orderdate:DATE,lo_revenue:FLOAT,lo_supp_key:STRING,lo_quantity:INTEGER,lo_extendedprice:FLOAT,lo_discount:FLOAT,lo_supplycost:FLOAT,lo_ordpriority:INTEGER,lo_ordtotalprice:FLOAT,lo_shippriority:INTEGER,lo_tax:FLOAT,lo_shipmode:FLOAT,lo_recieptfile:STRING"
        actual_bq_schema_string = self.data_gen.get_bq_schema_string()
        self.assertEquals(actual_bq_schema_string, expected_bq_schema_string)

    def test_get_faker_schema(self):
        """
        This tests the get_faker_schema method of the DataGenerator class.
        """
        expected_faker_schema = {
            u'lo_recieptfile': 'file_name',  # This tests a field from special_map.
            u'lo_cust_key': 'word',  # The rest of the fields test type_map.
            u'lo_order_key': 'word',
            u'lo_ordpriority': 'random_number',
            u'lo_supp_key': 'word',
            u'lo_quantity': 'random_number',
            u'lo_revenue': 'pyfloat',
            u'lo_orderdate': 'date_this_century',
            u'lo_extendedprice': 'pyfloat',
            u'lo_supplycost': 'pyfloat',
            u'lo_part_key': 'word',
            u'lo_discount': 'pyfloat',
            u'lo_shippriority': 'random_number',
            u'lo_shipmode': 'pyfloat',
            u'lo_ordtotalprice': 'pyfloat',
            u'lo_linenumber': 'random_number',
            u'lo_tax': 'pyfloat'}
        actual_faker_schema = self.data_gen.get_faker_schema()
        self.assertDictEqual(actual_faker_schema, expected_faker_schema)

    def test_generate_fake(self):
        """
        This tests the generate_Fake function of the FakeRowGen class which is called py process
        an instance of the DataGenerator class and returns fake json record that abides to the
        rules specified in the attributes of the DataGenerator instance. Note that this is a
        non-deterministic function so the best we can do is spot-check values obey the rules
        for this call for thoroughness we could run the unit test many many times.
        """
        faker_schema = self.fakerowgen.data_gen.get_faker_schema()
        actual_row = self.fakerowgen.generate_fake(faker_schema)

        # Check returns a dict representing a single record.
        self.assertIsInstance(actual_row, dict)

        # # Check the schema is correct.
        # self.assertEquals(actual_row.keys(), faker_schema.keys())

        # Check the date in range.
        self.assertGreaterEqual(
            datetime.datetime.strptime(actual_row[u'lo_orderdate'], '%Y-%m-%d').date(),
            self.data_gen.min_date)
        self.assertLessEqual(
            datetime.datetime.strptime(actual_row[u'lo_orderdate'], '%Y-%m-%d').date(),
            self.data_gen.max_date)

        # Check the integer is in range.
        self.assertLessEqual(actual_row[u'lo_linenumber'], self.data_gen.max_int)

        # Check the float is in range.
        self.assertLessEqual(actual_row[u'lo_tax'], self.data_gen.max_float)

        # Check int strictly positive
        self.assertGreaterEqual(actual_row[u'lo_linenumber'], 0)

        # Check float strictly positive
        self.assertGreaterEqual(actual_row[u'lo_tax'], 0.0)

        # Check key formatting.
        r = re.compile(r'^\d{4}$')
        self.assertTrue(r.match(actual_row[u'lo_part_key']) is not None)

    def test_get_field_dict(self):
        """
        This tests the ability of the FakeRowGen.get_field_dict method to extract a single field
        dictionary from a FakeRowGen.data_gen.schema
        """
        expected_field_dict = {u'type': u'DATE', u'name':u'lo_orderdate', u'mode': u'NULLABLE'}
        actual_field_dict = self.fakerowgen.get_field_dict(field_name=u'lo_orderdate')
        self.assertDictEqual(actual_field_dict, expected_field_dict)

    def test_sanity_check(self):
        fschema = self.data_gen.get_faker_schema()
        schema_faker = FakerSchema()
        data = schema_faker.generate_fake(fschema, 1)  # Generate one record.

        # Note at this point data[u'lo_orderdate'] is a datetime.date object while Biguery expects
        # a string
        self.assertIsInstance(data[u'lo_orderdate'], datetime.date)

        data = self.fakerowgen.sanity_check(record=data, fieldname=u'lo_orderdate')

        # Check that the date was converted to a string
        self.assertIsInstance(data[u'lo_orderdate'], unicode)

        # Check that the date is in the correct format
        _ = datetime.datetime.strptime(data[u'lo_orderdate'], '%Y-%m-%d')

        # Check if sanity check enforces integers < data_args.max_int
        data[u'lo_linenumber'] = 10**12  # Note that max_int is 10**11

        data = self.fakerowgen.sanity_check(record=data, fieldname=u'lo_linenumber')

        self.assertLessEqual(data[u'lo_linenumber'], self.data_gen.max_int)


if __name__ == '__main__':
    unittest.main()
