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
        self.assertEqual(len(schema), 1)
        record_field = schema[0]
        self.assertEqual(record_field.name, 'record_field')
        self.assertEqual(record_field.field_type, 'RECORD')
        self.assertEqual(record_field.mode, 'NULLABLE')
        self.assertEqual(len(record_field.fields), 1)
        string_field = record_field.fields[0]
        self.assertEqual(string_field.name, 'string_field')
        self.assertEqual(string_field.field_type, 'STRING')
        self.assertEqual(string_field.mode, 'NULLABLE')

    def test_array(self):
        document = {'array_field': [{'string_field': 'string_value'}]}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(len(schema), 1)
        array_field = schema[0]
        self.assertEqual(array_field.name, 'array_field')
        self.assertEqual(array_field.field_type, 'RECORD')
        self.assertEqual(array_field.mode, 'REPEATED')
        self.assertEqual(len(array_field.fields), 1)
        string_field = array_field.fields[0]
        self.assertEqual(string_field.name, 'string_field')
        self.assertEqual(string_field.field_type, 'STRING')
        self.assertEqual(string_field.mode, 'NULLABLE')

    def test_numeric(self):
        document = {'integer_field': 111, 'float_field': 22.0}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(len(schema), 2)
        _, integer_field = bigquery_schema._get_field_by_name(
            schema,
            'integer_field')
        self.assertEqual(integer_field.name, 'integer_field')
        self.assertEqual(integer_field.field_type, 'NUMERIC')
        self.assertEqual(integer_field.mode, 'NULLABLE')
        _, float_field = bigquery_schema._get_field_by_name(
            schema,
            'float_field')
        self.assertEqual(float_field.name, 'float_field')
        self.assertEqual(float_field.field_type, 'NUMERIC')
        self.assertEqual(float_field.mode, 'NULLABLE')

    def test_bool(self):
        document = {'bool_array_field': [True, False], 'bool_field': False}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(len(schema), 2)
        _, bool_array_field = bigquery_schema._get_field_by_name(
            schema,
            'bool_array_field')
        self.assertEqual(bool_array_field.name, 'bool_array_field')
        self.assertEqual(bool_array_field.field_type, 'BOOL')
        self.assertEqual(bool_array_field.mode, 'REPEATED')
        _, bool_field = bigquery_schema._get_field_by_name(
            schema,
            'bool_field')
        self.assertEqual(bool_field.name, 'bool_field')
        self.assertEqual(bool_field.field_type, 'BOOL')
        self.assertEqual(bool_field.mode, 'NULLABLE')

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
        self.assertEqual(len(merged_schema), 2)
        _, field1 = bigquery_schema._get_field_by_name(
            merged_schema, 'field1')
        self.assertEqual(field1.field_type, 'STRING')
        _, field2 = bigquery_schema._get_field_by_name(
            merged_schema, 'field2')
        self.assertEqual(field2.field_type, 'NUMERIC')

    def test_merge_array_schemas_records(self):
        schema = bigquery_schema.translate_json_to_schema(
            [{'field1': 'value1'}, {'field2': 'value1'}])
        self.assertEqual(len(schema), 2)
        fields_found = [False, False]
        for field in schema:
            if field.name == 'field1':
                fields_found[0] = True
            if field.name == 'field2':
                fields_found[1] = True
            assert field.field_type == 'STRING'
        self.assertTrue(fields_found[0] and fields_found[1])

    def test_merge_schemas_records(self):
        schemas = [
            bigquery_schema.translate_json_to_schema({
                'record_field': {
                    'field1': 'string'
                }
            }),
            bigquery_schema.translate_json_to_schema({
                'record_field': {
                    'field1': 'string',
                    'field2': [2]
                }
            })
        ]
        merged_schema = bigquery_schema.merge_schemas(schemas)
        self.assertEqual(len(merged_schema), 1)
        record_field = merged_schema[0]
        self.assertEqual(record_field.field_type, 'RECORD')
        self.assertEqual(len(record_field.fields), 2)
        _, field1 = bigquery_schema._get_field_by_name(
            record_field.fields, 'field1')
        self.assertEqual(field1.field_type, 'STRING')
        self.assertEqual(field1.mode, 'NULLABLE')
        _, field2 = bigquery_schema._get_field_by_name(
            record_field.fields, 'field2')
        self.assertEqual(field2.field_type, 'NUMERIC')
        self.assertEqual(field2.mode, 'REPEATED')

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
