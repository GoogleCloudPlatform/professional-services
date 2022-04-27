# Copyright 2022 Google LLC
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
"""
Set of unit tests for testing the xsd2bq module
"""
import os
import unittest
import xmlschema
from xsd2bq import xsd2bq


class TestMapType(unittest.TestCase):
    """
    Set of test for lookup_element_type function
    """
    def setUp(self):
        self.types_schema = xmlschema.XMLSchema(
            f'{os.path.dirname(__file__)}/sample_data/types.xsd')

    def test_simple_types_lookup(self):
        expected_types = {
            'StringMax64': 'STRING',
            'CustomDate': 'DATE',
            'MyPercent': 'DECIMAL',
            'MyTime': 'TIME',
        }

        for type in self.types_schema.simple_types:
            self.assertEqual(xsd2bq.lookup_element_type(type),
                             expected_types[type.name])

    def test_built_in_types_lookup_on_elements(self):
        expected_element_types = {
            'someString': 'STRING',
            'someDateTimeElement': 'DATETIME',
            'someOtherString': 'STRING',
            'someFloat': 'FLOAT64'
        }

        root = self.types_schema.elements['document']
        for element in root:
            self.assertEqual(xsd2bq.lookup_element_type(element.type),
                             expected_element_types[element.name])


class TestConvertXsd(unittest.TestCase):
    """
    Set of test for convert_xsd function
    """
    def setUp(self) -> None:
        self.test_files_dir = f'{os.path.dirname(__file__)}/sample_data'

    def test_path_fail(self):
        doesnt_exist = f'{self.test_files_dir}/doesnt-exist.xsd'

        with self.assertRaises(ValueError) as ctx:
            xsd2bq.convert_xsd('document', doesnt_exist)
        self.assertEqual('Invalid or unreadable XSD file path',
                         str(ctx.exception))

    def test_invalid_xsd_file(self):
        invalid_xsd = f'{self.test_files_dir}/invalid.xsd'

        with self.assertRaises(ValueError) as ctx:
            xsd2bq.convert_xsd('document', invalid_xsd)
        self.assertEqual('Invalid XSD file content', str(ctx.exception))

    def test_missing_root_element(self):
        types_xsd = f'{self.test_files_dir}/types.xsd'
        with self.assertRaises(ValueError) as ctx:
            xsd2bq.convert_xsd('nonexistant', types_xsd)
        self.assertEqual('Selected root element doesnt exist',
                         str(ctx.exception))

    def test_missing_elements(self):
        no_elements_xsd = f'{self.test_files_dir}/no-elements.xsd'

        with self.assertRaises(ValueError) as ctx:
            xsd2bq.convert_xsd('document', no_elements_xsd)
        self.assertEqual('Selected root element is empty', str(ctx.exception))

    def test_simple_xsd(self):
        types_xsd = f'{self.test_files_dir}/simple.xsd'
        result = xsd2bq.convert_xsd('document', types_xsd)
        expected = [
            {
                'name': 'someDateTimeElement',
                'type': 'DATETIME'
            },
            {
                'name': 'someOtherString',
                'type': 'STRING'
            },
            {
                'name': 'someFloat',
                'type': 'FLOAT64',
                'mode': 'REPEATED'
            },
            {
                'name': 'someString',
                'type': 'STRING',
                'mode': 'REPEATED'
            },
        ]
        self.assertListEqual(expected, result)

    def test_nested_xsd(self):
        types_xsd = f'{self.test_files_dir}/nested.xsd'
        result = xsd2bq.convert_xsd('document', types_xsd)
        expected = [{
            'name': 'simpleFieldDate',
            'type': 'DATE'
        }, {
            'name':
                'firstNestedField',
            'type':
                'RECORD',
            'fields': [{
                'name': 'simpleFieldStr1',
                'type': 'STRING'
            }, {
                'name': 'simpleFieldStr2',
                'type': 'STRING'
            }]
        }, {
            'name':
                'secondNestedField',
            'type':
                'RECORD',
            'mode':
                'REPEATED',
            'fields': [{
                'name': 'simpleNumberField1',
                'type': 'STRING'
            }, {
                'name': 'simpleNumberField2',
                'type': 'STRING'
            }, {
                'name':
                    'thirdNestedField',
                'type':
                    'RECORD',
                'mode':
                    'REPEATED',
                'fields': [{
                    'name': 'percentField1',
                    'type': 'DECIMAL'
                }, {
                    'name': 'percentField2',
                    'type': 'DECIMAL'
                }]
            }]
        }]

        self.assertListEqual(expected, result)


if __name__ == '__main__':
    unittest.main()
