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
        schema.sort(key=lambda x: x['name'])
        self.assertEqual(schema, [{'name': 'float_field',
                                   'field_type': 'NUMERIC',
                                   'mode': 'NULLABLE'},
                                  {'name': 'integer_field',
                                   'field_type': 'NUMERIC',
                                   'mode': 'NULLABLE'}
                                  ])

    def test_bool(self):
        document = {'bool_array_field': [True, False], 'bool_field': False}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        schema.sort(key=lambda x: x['name'])
        self.assertEqual(schema, [{'name': 'bool_array_field',
                                   'field_type': 'BOOL',
                                   'mode': 'REPEATED'},
                                  {'name': 'bool_field',
                                   'field_type': 'BOOL',
                                   'mode': 'NULLABLE'}
                                  ])

    def test_timestamp(self):
        document = {'timestamp': '2019-01-01T00:01:00'}
        schema = bigquery_schema.translate_json_to_schema(
            document)
        self.assertEqual(schema, [{'name': 'timestamp',
                                   'field_type': 'STRING',
                                   'mode': 'NULLABLE'},
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
        merged_schema.sort(key=lambda x: x['name'])
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
            'empty_dict': {},
            'empty_dict_list': [{}, {}],
            'a' * 200: 'value0',
            '@!@': 'delete_me',
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
        self.assertEqual(sanitized['a' * 128], 'value0')
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

    def test_enforce_schema_data_types(self):
        schema = [{'name': 'property_1',
                   'field_type': 'NUMERIC',
                   'mode': 'NULLABLE'},
                  {'name': 'property_2',
                   'field_type': 'STRING',
                   'mode': 'NULLABLE'},
                  {'name': 'property_3',
                   'field_type': 'DATE',
                   'mode': 'NULLABLE'},
                  {'name': 'property_4',
                   'field_type': 'DATETIME',
                   'mode': 'NULLABLE'},
                  {'name': 'property_5',
                   'field_type': 'BOOL',
                   'mode': 'NULLABLE'},
                  {'name': 'property_6',
                   'field_type': 'NUMERIC',
                   'mode': 'REPEATED'},
                  {'name': 'property_7',
                   'field_type': 'RECORD',
                   'mode': 'REPEATED',
                   'fields': [
                       {'name': 'property_1',
                        'field_type': 'NUMERIC',
                        'mode': 'NULLABLE'},
                       {'name': 'property_2',
                        'field_type': 'STRING',
                        'mode': 'NULLABLE'}]}]
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_1': '333'}, schema), {'property_1': 333})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_1': 333}, schema), {'property_1': 333})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_1': 'notanumber'}, schema), {})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_2': 33}, schema), {'property_2': '33'})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_2': 'astring'}, schema), {'property_2': 'astring'})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_3': '2019-01-01'}, schema),
            {'property_3': '2019-01-01'})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_3': 'invaliddate'}, schema), {})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_4': '2019-01-01T00:01:00'}, schema),
            {'property_4': '2019-01-01T00:01:00'})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_4': 'invalid'}, schema), {})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_5': False}, schema), {'property_5': False})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_5': 'True'}, schema), {'property_5': True})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_5': 0}, schema), {'property_5': False})

        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_6': 33}, schema), {'property_6': [33]})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_6': '33'}, schema), {'property_6': [33]})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_6': {'33'}}, schema), {})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_6': [33]}, schema), {'property_6': [33]})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_7': [{'property_1': 'invalid',
                             'property_2': 'valid'}]}, schema),
            {'property_7': [{'property_2': 'valid'}]})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_7': [{'property_1': 'invalid'}]}, schema), {})
        self.assertEqual(bigquery_schema.enforce_schema_data_types(
            {'property_7': [{'property_1': 'invalid'}, 33]}, schema), {})

    def test_additional_properties_repeated_string(self):
        schema = [
            {'name': 'property_1',
             'field_type': 'RECORD',
             'description': 'description-1',
             'mode': 'REPEATED',
             'fields': [{'name': 'name',
                         'field_type': 'STRING',
                         'description': 'additionalProperties name',
                         'mode': 'NULLABLE'},
                        {'name': 'value',
                         'field_type': 'STRING',
                         'description': 'description-1.',
                         'mode': 'NULLABLE'}]}]
        self.assertEqual(
            bigquery_schema.enforce_schema_data_types(
                {'property_1': {'key1': 'a', 'key2': 'b'}}, schema),
            {'property_1': [{'name': 'key1', 'value': 'a'},
                            {'name': 'key2', 'value': 'b'}]})

    def test_additional_properties_repeated_record(self):
        schema = [
            {'name': 'property_1',
             'field_type': 'RECORD',
             'description': 'description-1',
             'mode': 'REPEATED',
             'fields': [{'name': 'name',
                         'field_type': 'STRING',
                         'description': 'additionalProperties name',
                         'mode': 'NULLABLE'},
                        {'name': 'value',
                         'field_type': 'RECORD',
                         'description': 'description-1.',
                         'mode': 'NULLABLE',
                         'fields': [{'name': 'property_2',
                                     'field_type': 'STRING',
                                     'description': 'description-2.',
                                     'mode': 'NULLABLE'}]}]}]
        self.assertEqual(
            bigquery_schema.enforce_schema_data_types(
                {'property_1': {'key1': {'property_2': 'a'},
                                'key2': {'property_2': 'b'}}}, schema),
            {'property_1': [{'name': 'key1', 'value': {'property_2': 'a'}},
                            {'name': 'key2', 'value': {'property_2': 'b'}}]})

    def test_additional_properties_push_down(self):
        schema = [
            {'name': 'property_1',
             'field_type': 'STRING',
             'description': 'a property',
             'mode': 'NULLABLE'},
            {'name': 'additionalProperties',
             'field_type': 'RECORD',
             'description': 'description-1',
             'mode': 'REPEATED',
             'fields': [{'name': 'name',
                         'field_type': 'STRING',
                         'description': 'additionalProperties name',
                         'mode': 'NULLABLE'},
                        {'name': 'value',
                         'field_type': 'STRING',
                         'description': 'description-1.',
                         'mode': 'NULLABLE'}]}]
        self.assertEqual(
            bigquery_schema.enforce_schema_data_types(
                {'property_1': 'value_1',
                 'property_2': {'key1': {'property_2': 'a'},
                                'key2': {'property_2': 'b'}}}, schema),
            {'property_1': 'value_1',
             'additionalProperties': [
                 {'name': 'property_2',
                  'value': "{'key1': {'property_2': 'a'}, 'key2': {'property_2': 'b'}}"}]})

    def test_enforce_additional_properties_list(self):
        schema = [
            {'description': 'Output only. The error details in case of state FAILED.',
             'field_type': 'RECORD',
             'fields': [{'description': 'The status code, which should be an enum value '
                                        'of google.rpc.Code.',
                         'field_type': 'NUMERIC',
                         'mode': 'NULLABLE',
                         'name': 'code'},
                        {'description': 'A list of messages that carry the error details. '
                                        'There is a common set of message types for APIs '
                                        'to use.',
                         'field_type': 'RECORD',
                         'fields': [{'description': 'additionalProperties',
                                     'field_type': 'RECORD',
                                     'fields': [{'description': 'additionalProperties '
                                                                'name',
                                                 'field_type': 'STRING',
                                                 'mode': 'NULLABLE',
                                                 'name': 'name'},
                                                {'description': 'additionalProperties '
                                                                'value',
                                                 'field_type': 'STRING',
                                                 'mode': 'NULLABLE',
                                                 'name': 'value'}],
                                     'mode': 'REPEATED',
                                     'name': 'additionalProperties'}],
                         'mode': 'REPEATED',
                         'name': 'details'}],
             'mode': 'NULLABLE',
             'name': 'error'}]
        self.assertEqual(
            bigquery_schema.enforce_schema_data_types(
                {'error': {'code': 13, 'details': [{'@type': 'type.googleapis.com/google.rpc.DebugInfo',
                                                    'detail': 'generic::DEADLINE_EXCEEDED: '
                                                              'deadline=9.223372036854776E15s',
                                                    'stackEntries': [
                                                        'com.google.spanner.SpannerException: '
                                                        'generic::DEADLINE_EXCEEDED:']}]}},
                schema),
            {'error': {'code': 13,
                       'details': [{'additionalProperties': [{'name': '@type',
                                                              'value': 'type.googleapis.com/google.rpc.DebugInfo'},
                                                             {'name': 'detail',
                                                              'value': 'generic::DEADLINE_EXCEEDED: '
                                                                       'deadline=9.223372036854776E15s'},
                                                             {'name': 'stackEntries',
                                                              'value': "['com.google.spanner.SpannerException: "
                                                                       "generic::DEADLINE_EXCEEDED:']"}]}]}})

    def test_remove_duplicate_property(self):
        doc = {
            'ipAddress': 'value',
            'IPAddress': 'other_value',
            'array': [{
                'ipAddress': 'value',
                'IPAddress': 'other_value'}],
        }
        sanitized = bigquery_schema.sanitize_property_value(doc)
        self.assertEqual(len(sanitized), 2)
        self.assertIn('IPAddress', sanitized)
        self.assertEqual(sanitized['IPAddress'], 'other_value')
        self.assertEqual(sanitized['array'], [{'IPAddress': 'other_value'}])

    def test_prune_max_properties(self):
        doc = {'prop-' + str(i): 'value' for i in range(0, 10000)}
        sanitized = bigquery_schema.sanitize_property_value(doc)
        self.assertEqual(len(sanitized), 10000)

        # prune the 10,000'th
        doc['prop-10001'] = 'value'
        sanitized = bigquery_schema.sanitize_property_value(doc)
        self.assertEqual(len(sanitized), 10000)

        # prune last added property
        doc['z'] = 'value'
        sanitized = bigquery_schema.sanitize_property_value(doc)
        self.assertEqual(len(sanitized), 10000)
        self.assertNotIn('z', sanitized)

    def test_additional_properties_merge_schema_simple(self):
        rest_schema = [
            {'name': 'property_1',
             'field_type': 'STRING',
             'description': 'description-1',
             'mode': 'NULLABLE'
             },
            {'name': 'property_2',
             'field_type': 'RECORD',
             'description': 'description-2',
             'mode': 'REPEATED',
             'fields': [{'name': 'name',
                         'field_type': 'STRING',
                         'description': 'additionalProperties name',
                         'mode': 'NULLABLE'},
                        {'name': 'value',
                         'field_type': 'STRING',
                         'description': 'description-2.',
                         'mode': 'NULLABLE'}]}]

        document = {
            'property_1': 'value_1',
            'property_2': {
                'add_prop_1': 'add_value_1',
                'add_prop_2': 'add_value_2'
            },
            'property_3': 'value_3'
        }

        document_schema = bigquery_schema.translate_json_to_schema(
            document)

        self.assertEqual(
            bigquery_schema.merge_schemas(
                [rest_schema, document_schema]
            ),
            rest_schema + [{'name': 'property_3',
                            'field_type': 'STRING',
                            'mode': 'NULLABLE'
                            }])

    def test_additional_properties_merge_schema_object(self):
        self.maxDiff = None
        rest_schema = [
            {'name': 'property_1',
             'field_type': 'STRING',
             'description': 'description-1',
             'mode': 'NULLABLE'
             },
            {'name': 'property_2',
             'field_type': 'RECORD',
             'description': 'description-2',
             'mode': 'REPEATED',
             'fields': [{'name': 'name',
                         'field_type': 'STRING',
                         'description': 'additionalProperties name',
                         'mode': 'NULLABLE'},
                        {'name': 'value',
                         'field_type': 'RECORD',
                         'mode': 'NULLABLE'}]}]

        document = {
            'property_1': 'value_1',
            'property_2': {
                'add_prop_1': {'key_1': 1},
                'add_prop_2': {'key_1': 2}
            },
            'property_3': 'value_3'
        }

        document_schema = bigquery_schema.translate_json_to_schema(
            document)

        self.assertEqual(
            bigquery_schema.merge_schemas(
                [rest_schema, document_schema]
            ),
            [{'name': 'property_1',
              'field_type': 'STRING',
              'description': 'description-1',
              'mode': 'NULLABLE'
              },
             {'name': 'property_2',
              'field_type': 'RECORD',
              'description': 'description-2',
              'mode': 'REPEATED',
              'fields': [{'name': 'name',
                          'field_type': 'STRING',
                          'description': 'additionalProperties name',
                          'mode': 'NULLABLE'},
                         {'name': 'value',
                          'field_type': 'RECORD',
                          'mode': 'NULLABLE',
                          'fields': [{'name': 'key_1',
                                      'field_type': 'NUMERIC',
                                      'mode': 'NULLABLE'}]}]
              },
             {'name': 'property_3',
              'field_type': 'STRING',
              'mode': 'NULLABLE'}])


if __name__ == '__main__':
    unittest.main()
