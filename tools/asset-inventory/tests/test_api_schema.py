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
from asset_inventory.api_schema  import APISchema


# pylint:disable=protected-access
class TestApiSchema(unittest.TestCase):

    def tearDown(self):
        APISchema._discovey_documents_map = None

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
        schema = APISchema._properties_map_to_field_list(api_properties, {},
                                                             {})
        schema.sort()
        self.assertEqual(schema, [{'name': 'property-1',
                                   'field_type': 'STRING',
                                   'description': 'description-1.',
                                   'mode': 'NULLABLE'},
                                  {'name': 'property-2',
                                   'field_type': 'NUMERIC',
                                   'description': 'description-2.',
                                   'mode': 'NULLABLE'
                                  }])

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
                                   }]
                                  }])

    def test_for_for_asset_type(self):
        APISchema._discovey_documents_map = {
            'compute': [{
                'id': 'compute.v1',
                'schemas': {
                    'Instance': {
                        'properties': {
                            'property-1': {
                                'type': 'string',
                                'description': 'description-1.'
                            }
                        }
                    }
                }
            }]}

        schema = APISchema.bigquery_schema_for_asset_type(
            'google.compute.Instance',
            True, True)
        self.assertEqual(len(schema), 4)

    def test_recursive_properties(self):
        resources = {
            'Object-1': {
                'properties': {
                    'property-1': {
                        'type': 'object',
                        '$ref': 'Object-2',
                    }
                }
            },
            'Object-2': {
                'properties': {
                    'property-2': {
                        'type': 'object',
                        '$ref': 'Object-1',
                    }
                }
            }
        }
        schema = APISchema._properties_map_to_field_list(
            resources['Object-1']['properties'],
            resources, {})
        schema.sort()
        self.assertEqual(schema, [])
