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

"""Test BigQuey schema generation."""

import unittest
from asset_inventory import bigquery_schema


class TestBigQuerySchema(unittest.TestCase):

    def test_record(self):
        document = {'record_field': {'string_field': 'string_value'}}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        assert len(schema) == 1
        record_field = schema[0]
        assert record_field.name == 'record_field'
        assert record_field.field_type == 'RECORD'
        assert record_field.mode == 'NULLABLE'
        assert len(record_field.fields) == 1
        string_field = record_field.fields[0]
        assert string_field.name == 'string_field'
        assert string_field.field_type == 'STRING'
        assert string_field.mode == 'NULLABLE'

    def test_array(self):
        document = {'array_field': [{'string_field': 'string_value'}]}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        assert len(schema) == 1
        array_field = schema[0]
        assert array_field.name == 'array_field'
        assert array_field.field_type == 'RECORD'
        assert array_field.mode == 'REPEATED'
        assert len(array_field.fields) == 1
        string_field = array_field.fields[0]
        assert string_field.name == 'string_field'
        assert string_field.field_type == 'STRING'
        assert string_field.mode == 'NULLABLE'

    def test_numeric(self):
        document = {'integer_field': 111, 'float_field': 22.0}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        assert len(schema) == 2
        _, integer_field = bigquery_schema._get_field_by_name(
            schema,
            'integer_field')
        assert integer_field.name == 'integer_field'
        assert integer_field.field_type == 'NUMERIC'
        assert integer_field.mode == 'NULLABLE'
        _, float_field = bigquery_schema._get_field_by_name(
            schema,
            'float_field')
        assert float_field.name == 'float_field'
        assert float_field.field_type == 'NUMERIC'
        assert float_field.mode == 'NULLABLE'

    def test_bool(self):
        document = {'bool_array_field': [True, False], 'bool_field': False}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        assert len(schema) == 2
        _, bool_array_field = bigquery_schema._get_field_by_name(
            schema,
            'bool_array_field')
        assert bool_array_field.name == 'bool_array_field'
        assert bool_array_field.field_type == 'BOOL'
        assert bool_array_field.mode == 'REPEATED'
        _, bool_field = bigquery_schema._get_field_by_name(
            schema,
            'bool_field')
        assert bool_field.name == 'bool_field'
        assert bool_field.field_type == 'BOOL'
        assert bool_field.mode == 'NULLABLE'

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
        assert len(merged_schema) == 2
        _, field1 = bigquery_schema._get_field_by_name(
            merged_schema, 'field1')
        assert field1.field_type == 'STRING'
        _, field2 = bigquery_schema._get_field_by_name(
            merged_schema, 'field2')
        assert field2.field_type == 'NUMERIC'

    def test_merge_array_schemas_records(self):
        schema = bigquery_schema.translate_json_to_schema(
            [{'field1': 'value1'}, {'field2': 'value1'}])
        assert(len(schema)) == 2
        fields_found = [False, False]
        for field in schema:
            if field.name == 'field1':
                fields_found[0] = True
            if field.name == 'field2':
                fields_found[1] = True
            assert field.field_type == 'STRING'
        assert fields_found[0] and fields_found[1]

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
        assert len(merged_schema) == 1
        record_field = merged_schema[0]
        assert record_field.field_type == 'RECORD'
        assert len(record_field.fields) == 2
        _, field1 = bigquery_schema._get_field_by_name(
            record_field.fields, 'field1')
        assert field1.field_type == 'STRING'
        assert field1.mode == 'NULLABLE'
        _, field2 = bigquery_schema._get_field_by_name(
            record_field.fields, 'field2')
        assert field2.field_type == 'NUMERIC'
        assert field2.mode == 'REPEATED'

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
        assert len(sanitized) == 4
        assert 'empty_dict' not in sanitized
        assert 'empty_dict_list' not in sanitized
        assert sanitized['a'* 128] == 'value0'
        assert sanitized['invalid_numeric'] == 9.300000192
        assert sanitized['_2_3'] == 'value1'
        labels = sanitized['labels']
        assert len(labels) == 2
        labels_found = [False, False]
        for label in labels:
            if label['name'] == 'label1':
                labels_found[0] = True
                assert label['value'] == 'value1'
            if label['name'] == 'label2':
                labels_found[1] = True
                assert label['value'] == 'value2'
        assert labels_found[0] and labels_found[1]
