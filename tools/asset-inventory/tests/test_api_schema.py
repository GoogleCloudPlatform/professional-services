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
"""Test construction of a BigQuery schema from an API discovery document.."""

import unittest
from asset_inventory.api_schema import APISchema


# pylint:disable=protected-access
# pylint: disable=line-too-long
class TestApiSchema(unittest.TestCase):
    maxDiff = None

    def get_schema_data_field(self, fields):
        return self.get_field_by_name(
            self.get_field_by_name(fields, 'resource')['fields'],
            'data')['fields']

    @staticmethod
    def get_field_by_name(fields, field_name):
        for field in fields:
            if field['name'].lower() == field_name.lower():
                return field
        return None

    def tearDown(self):
        APISchema._discovery_document_cache = {}

    def test_simple_properties(self):
        api_properties = {
            'property-1': {
                'type': 'string',
                'description': 'description-1.'
            },
            'property-2': {
                'type': 'integer',
                'description': 'description-2.'
            }

        }
        schema = APISchema._properties_map_to_field_list(api_properties, {}, {})
        schema.sort(key=lambda x: x['name'])
        self.assertEqual(schema, [{'name': 'property-1',
                                   'field_type': 'STRING',
                                   'description': 'description-1.',
                                   'mode': 'NULLABLE'},
                                  {'name': 'property-2',
                                   'field_type': 'NUMERIC',
                                   'description': 'description-2.',
                                   'mode': 'NULLABLE'}])

    def test_record_properties(self):
        api_properties = {
            'property-1': {
                'type': 'object',
                '$ref': 'NestedObject',
                'description': 'description-1.'
            },
        }
        resources = {
            'NestedObject': {
                'properties': {
                    'property-2': {
                        'type': 'string',
                        'description': 'description-2.'
                    }
                }
            }
        }
        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(schema, [{'name': 'property-1',
                                   'field_type': 'RECORD',
                                   'mode': 'NULLABLE',
                                   'description': 'description-1.',
                                   'fields': [{
                                       'name': 'property-2',
                                       'field_type': 'STRING',
                                       'description': 'description-2.',
                                       'mode': 'NULLABLE'
                                   }]
                                   }])

    def test_repeated_properties(self):
        api_properties = {
            'property-1': {
                'type': 'array',
                'items': {
                    '$ref': 'NestedObject',
                },
                'description': 'description-1.'
            },
        }
        resources = {
            'NestedObject': {
                'properties': {
                    'property-2': {
                        'type': 'string',
                        'description': 'description-2.'
                    }
                }
            }
        }
        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(schema, [{'name': 'property-1',
                                   'field_type': 'RECORD',
                                   'mode': 'REPEATED',
                                   'description': 'description-1.',
                                   'fields': [{
                                       'name': 'property-2',
                                       'field_type': 'STRING',
                                       'description': 'description-2.',
                                       'mode': 'NULLABLE'
                                   }]}])

    def test_for_swagger_type(self):
        APISchema._discovery_document_cache = {
            'https://raw.githubusercontent.com/kubernetes/kubernetes/master/api/openapi-spec/swagger.json': {
                'info': {
                    'title': 'Kubernetes',
                    'version': 'v1.15.0'
                },
                'definitions': {
                    'io.k8s.api.rbac.v1.ClusterRole': {
                        'properties': {
                            'aggregationRule': {
                                '$ref': '#/definitions/io.k8s.api.rbac.v1.AggregationRule',
                            }}},
                    'io.k8s.api.rbac.v1.AggregationRule': {
                        'properties': {
                            'name': {'type': 'string'}}}}},
            'https://content.googleapis.com/discovery/v1/apis': {
                'items': []}}

        schema = APISchema.bigquery_schema_for_resource(
            'io.k8s.authorization.rbac.ClusterRoleBinding',
            'io.k8s.api.rbac.v1.ClusterRole',
            'https://raw.githubusercontent.com/kubernetes/kubernetes/master/api/openapi-spec/swagger.json',
            True, True)
        data_fields = self.get_schema_data_field(schema)
        self.assertEqual(
            [{'field_type': 'RECORD',
              'name': 'aggregationRule',
              'fields': [{'field_type': 'STRING',
                          'name': 'name',
                          'mode': 'NULLABLE'}],
              'mode': 'NULLABLE'},
             {'field_type': 'STRING',
              'description': 'Last time resource was changed.',
              'name': 'lastModifiedTime',
              'mode': 'NULLABLE'}],
            data_fields)

    def test_for_asset_type(self):
        APISchema._discovery_document_cache = {
            'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest': {
                'id': 'compute.v1',
                'schemas': {
                    'Instance': {
                        'properties': {
                            'property-1': {
                                'type': 'string',
                                'description': 'description-1.'
                            }}}}},
            'https://content.googleapis.com/discovery/v1/apis': {
                'items': [{
                    'name': 'compute',
                    'version': 'v1',
                    'discoveryRestUrl': 'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest'}]}}

        schema = APISchema.bigquery_schema_for_resource(
            'google.compute.Instance',
            'Instance',
            'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest',
            True, True)
        data_fields = self.get_schema_data_field(schema)
        self.assertEqual(
            [{'field_type': 'STRING',
              'name': 'property-1',
              'description': 'description-1.',
              'mode': 'NULLABLE'},
             {'field_type': 'STRING',
              'description': 'Last time resource was changed.',
              'name': 'lastModifiedTime',
              'mode': 'NULLABLE'}],
            data_fields)
        # name, asset_type, timestamp, resource, iam_policy, update_time, ancestors
        self.assertEqual(len(schema), 7)

    def test_resource_last_modified(self):
        # Test that resource lastModifiedTime takes precedence.
        APISchema._discovery_document_cache = {
            'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest': {
                'id': 'compute.v1',
                'schemas': {
                    'Machine': {
                        'properties': {
                            'lastModifiedTime': {
                                'type': 'string',
                                'description': 'Track time of last change.'
                            }}}}},
            'https://content.googleapis.com/discovery/v1/apis': {
                'items': [{
                    'name': 'compute',
                    'version': 'v1',
                    'discoveryRestUrl': 'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest'}]}}
        schema = APISchema.bigquery_schema_for_resource(
            'google.compute.Machine',
            'Machine',
            'https://www.googleapis.com/discovery/v1/apis/compute/v1/rest',
            True, True)
        data_fields = self.get_schema_data_field(schema)
        self.assertEqual(
            [{'field_type': 'STRING',
              'name': 'lastModifiedTime',
              'description': 'Track time of last change.',
              'mode': 'NULLABLE'}],
            data_fields)

    def test_self_recursive_properties(self):
        discovery_doc = {
            'id': 'recursive#api',
            'schemas': {
                'Object-1': {
                    'properties': {
                        'property-1': {
                            'type': 'object',
                            '$ref': 'Object-2'}}},
                'Object-2': {
                    'properties': {
                        'property-1': {
                            'type': 'object',
                            '$ref': 'Object-2'}}}}}
        schema = APISchema._translate_resource_to_schema(
            'Object-1',
            discovery_doc)
        schema.sort()
        self.assertEqual(schema, [])

    def test_recursive_properties(self):
        discovery_doc = {
            'id': 'recursive#api',
            'schemas': {
                'Object-1': {
                    'properties': {
                        'property-1': {
                            'type': 'object',
                            '$ref': 'Object-2'}}},
                'Object-2': {
                    'properties': {
                        'property-2': {
                            'type': 'object',
                            '$ref': 'Object-1'}}}}}
        schema = APISchema._translate_resource_to_schema(
            'Object-1',
            discovery_doc)
        schema.sort()
        self.assertEqual(schema, [])

    def test_string_additional_properties(self):
        api_properties = {
            'property-1': {
                'type': 'object',
                'additionalProperties': {
                    'type': 'string',
                    'description': 'description-1.'
                },
                'description': 'description-1'
            },
        }
        resources = {}
        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(
            schema,
            [{'name': 'property-1',
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
                          'mode': 'NULLABLE'}]}])

    def test_additional_properties_with_properties(self):
        api_properties = {
            'property-1': {
                'type': 'object',
                'properties': {
                    'property-nested': {
                        'type': 'string'
                    }
                },
                'additionalProperties': {
                    'type': 'string',
                    'description': 'description-1.'
                },
                'description': 'description-1'
            },
        }
        resources = {}
        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(
            schema,
            [{'name': 'property-1',
              'field_type': 'RECORD',
              'fields': [{'name': 'property-nested',
                          'field_type': 'STRING',
                          'mode': 'NULLABLE'},
                         {'name': 'additionalProperties',
                          'description': 'additionalProperties',
                          'field_type': 'RECORD',
                          'fields': [{'description': 'additionalProperties name',
                                      'field_type': 'STRING',
                                      'mode': 'NULLABLE',
                                      'name': 'name'},
                                     {'description': 'description-1.',
                                      'field_type': 'STRING',
                                      'mode': 'NULLABLE',
                                      'name': 'value'}],
                          'mode': 'REPEATED'}],
              'description': 'description-1',
              'mode': 'NULLABLE'}])

    def test_nested_additional_properties(self):
        api_properties = {
            'property-1': {
                'type': 'object',
                'additionalProperties': {
                    '$ref': 'NestedObject',
                    'description': 'description-1.'
                },
                'description': 'description-1'
            },
        }
        resources = {
            'NestedObject': {
                'properties': {
                    'property-2': {
                        'type': 'string',
                        'description': 'description-2.'
                    }
                }
            }
        }
        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(
            schema,
            [{'name': 'property-1',
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
                          'fields': [{'name': 'property-2',
                                      'field_type': 'STRING',
                                      'description': 'description-2.',
                                      'mode': 'NULLABLE'}]}]}])

    def test_array_additional_properties(self):
        resources = {
            'Status': {
                'type': 'object',
                'properties': {
                    'code': {
                        'format': 'int32',
                        'description': 'The status code, which should be an enum value of google.rpc.Code.',
                        'type': 'integer'
                    },
                    'details': {
                        'type': 'array',
                        'description': 'A list of messages that carry the error details. There is a common set of '
                                       'message types for APIs to use.',
                        'items': {
                            'additionalProperties': {
                                'description': 'Properties of the object. Contains field @type with type URL.',
                                'type': 'any'
                            },
                            'type': 'object'
                        }
                    }
                }
            }
        }

        api_properties = {
            'error': {
                '$ref': 'Status',
                'readOnly': True,
                'description': 'Output only. The error details in case of state FAILED.'
            },
        }

        schema = APISchema._properties_map_to_field_list(api_properties,
                                                         resources, {})
        schema.sort()
        self.assertEqual(
            schema,
            [{'description': 'Output only. The error details in case of state FAILED.',
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
              'name': 'error'}])

# "error":{"code":13,"details":[{"@type":"type.googleapis.com/google.rpc.DebugInfo",
# "detail":"generic::DEADLINE_EXCEEDED: deadline=9.223372036854776E15s","stackEntries":[
# "com.google.spanner.SpannerException: generic::DEADLINE_EXCEEDED:
