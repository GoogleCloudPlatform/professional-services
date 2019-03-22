#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
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

"""Test BigQuery schema translation from JSON objects."""

import unittest
from asset_inventory import bigquery_schema


class TestBigQuerySchema(unittest.TestCase):

    def test_record(self):
        document = {'record_field': {'string_field': 'string_value'}}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(schema, [{'name': 'record_field',
                                   'field_type': 'RECORD',
                                   'mode': 'NULLABLE',
                                   'fields': [
                                       {'name': 'string_field',
                                        'field_type': 'STRING',
                                        'mode': 'NULLABLE'
                                       }]}])

    def test_array(self):
        document = {'array_field': [{'string_field': 'string_value'}]}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(schema, [{'name': 'array_field',
                                   'field_type': 'RECORD',
                                   'mode': 'REPEATED',
                                   'fields': [
                                       {'name': 'string_field',
                                        'field_type': 'STRING',
                                        'mode': 'NULLABLE'
                                       }]}])

    def test_numeric(self):
        document = {'integer_field': 111, 'float_field': 22.0}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(schema, [{'name': 'integer_field',
                                   'field_type': 'NUMERIC',
                                   'mode': 'NULLABLE'},
                                  {'name': 'float_field',
                                   'field_type': 'NUMERIC',
                                   'mode': 'NULLABLE'},
                                 ])

    def test_bool(self):
        document = {'bool_array_field': [True, False], 'bool_field': False}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(schema, [{'name': 'bool_array_field',
                                   'field_type': 'BOOL',
                                   'mode': 'REPEATED'},
                                  {'name': 'bool_field',
                                   'field_type': 'BOOL',
                                   'mode': 'NULLABLE'}
                                 ])

    def test_merge_schemas_basic(self):
        schemas = [
            bigquery_schema.translate_json_to_schema({
                'field1':
                'string'
            }),
            bigquery_schema.translate_json_to_schema({
                'field2': 3
            })
        ]
        merged_schema = bigquery_schema.merge_schemas(schemas)
        self.assertEqual(merged_schema,
                         [{'name': 'field1',
                           'field_type': 'STRING',
                           'mode': 'NULLABLE'},
                          {'name': 'field2',
                           'field_type': 'NUMERIC',
                           'mode': 'NULLABLE'},
                         ])

    def test_merge_array_schemas_records(self):
        schemas = [
            bigquery_schema.translate_json_to_schema(
                {'field1': [{'nested1': 'value1'}]}),
            bigquery_schema.translate_json_to_schema(
                {'field1': [{'nested2': 'value1'}]})
        ]
        merged_schema = bigquery_schema.merge_schemas(schemas)
        self.assertEqual(merged_schema,
                         [{'name': 'field1',
                           'field_type': 'RECORD',
                           'mode': 'REPEATED',
                           'fields': [
                               {'name': 'nested1',
                                'field_type': 'STRING',
                                'mode': 'NULLABLE'},
                               {'name': 'nested2',
                                'field_type': 'STRING',
                                'mode': 'NULLABLE'}]}])

    def test_merge_schemas_records(self):
        schemas = [
            bigquery_schema.translate_json_to_schema({
                'recordField': {
                    'field1': 'string'
                }
            }),
            bigquery_schema.translate_json_to_schema({
                'recordfield': {
                    'field1': 'string',
                    'field2': [2]
                }
            })
        ]
        merged_schema = bigquery_schema.merge_schemas(schemas)
        self.assertEqual(merged_schema,
                         [{'name': 'recordField',
                           'field_type': 'RECORD',
                           'mode': 'NULLABLE',
                           'fields': [
                               {'name': 'field1',
                                'field_type': 'STRING',
                                'mode': 'NULLABLE'},
                               {'name': 'field2',
                                'field_type': 'NUMERIC',
                                'mode': 'REPEATED'}]}])

    def test_sanitize_property_value(self):
        doc = {
            'empyty_dict': {},
            'empyty_dict_list': [{}, {}],
            'a' * 200: 'value0',
            '@2_3': 'value1',
            'invalid_numeric': 9.300000191734863,
            'labels': {
                'label1': 'value1',
                'label2': 'value2',
            }
        }
        sanitized = bigquery_schema.sanitize_property_value(doc)
        self.assertEqual(len(sanitized), 4)
        self.assertNotIn('empty_dict', sanitized)
        self.assertNotIn('empty_dict_list', sanitized)
        self.assertEqual(sanitized['a'* 128], 'value0')
        self.assertEqual(sanitized['invalid_numeric'], 9.300000192)
        self.assertEqual(sanitized['_2_3'], 'value1')
        labels = sanitized['labels']
        self.assertEqual(len(labels), 2)
        labels_found = [False, False]
        for label in labels:
            if label['name'] == 'label1':
                labels_found[0] = True
                assert label['value'] == 'value1'
            if label['name'] == 'label2':
                labels_found[1] = True
                assert label['value'] == 'value2'
        self.assertTrue(labels_found[0] and labels_found[1])

if __name__ == '__main__':
    unittest.main()
