#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
""" Generates BigQuery schema from API discovery documents.


"""
from asset_inventory import bigquery_schema
import requests
from collections import defaultdict
from requests_futures.sessions import FuturesSession
from google.cloud import bigquery


# Map CAI asset types to the Google API they come from.
# Used to download the API discovery document for each asset.
ASSET_TYPE_PREFIX_TO_API = {
    'google.cloud.kms': 'cloudkms',
    'google.cloud.resourcemanager': 'cloudresourcemanager',
    'google.compute': 'compute',
    'google.appengine': 'appengine',
    'google.cloud.billing': 'cloudbilling',
    'google.cloud.storage': 'storage',
    'google.cloud.dns': 'dns',
    'google.spanner': 'spanner',
    'google.cloud.bigquery': 'bigquery',
    'google.iam': 'iam',
    'google.pubsub': 'pubsub',
    'google.cloud.dataproc': 'dataproc',
    'google.cloud.sql': 'sqladmin',
    'google.container': 'container'
}


class APISchemas(object):
    """Convert a CAI asset type to a BigQuery table schema.

    When the import_pipeline uses a group_by of ASSET_TYPE or ASSET_TYPE_VERSION
    we'll use a BigQuery schema generated from API discovery documents. This
    gives us all the type, names and description of every asset type property.
    Will union all API versions into a single schema.
    """

    discovey_documents_map = None
    schema_cache = {}

    @classmethod
    def _get_discovery_documents_map(cls):
        """Download discovery documents.

        Caches downloaded documents in the `discovey_documents_map` map.

        Returns:
            Dict of API names to their Discovery document.
        """
        if cls.discovey_documents_map:
            return cls.discovey_documents_map

        discovery_docs = requests.get(
            'https://content.googleapis.com/discovery/v1/apis').json()

        session = FuturesSession()
        api_to_discovery_docs_requests = defaultdict(list)
        for discovery_doc in discovery_docs['items']:
            for api_name in ASSET_TYPE_PREFIX_TO_API.values():
                if api_name == discovery_doc['name']:
                    api_to_discovery_docs_requests[api_name].append(
                        session.get(discovery_doc['discoveryRestUrl']))
        cls.discovey_documents_map = {
            api_name:
                [f.result().json() for f in fl if f.result().status_code == 200]
            for api_name, fl in api_to_discovery_docs_requests.items()
        }
        return cls.discovey_documents_map

    @classmethod
    def get_api_name_for_asset_type(cls, asset_type):
        """Given an asset type, return it's api name."""
        for prefix, api_name in ASSET_TYPE_PREFIX_TO_API.items():
            if asset_type.startswith(prefix):
                return api_name
        raise Exception('no api for type name {}'.format(asset_type))

    @classmethod
    def _get_bigquery_type_for_property(cls, property_value):
        """Map API type to a BigQuery type."""
        bigquery_type = 'STRING'
        property_type = property_value.get('type', None)
        if '$ref' in property_value or property_type == 'object':
            bigquery_type = 'RECORD'
        elif property_type == 'array':
            return cls._get_bigquery_type_for_property(property_value['items'])
        if property_type in ('number', 'integer'):
            bigquery_type = 'NUMERIC'
        elif property_type == 'boolean':
            bigquery_type = 'BOOL'
        return bigquery_type

    @classmethod
    def _get_properties_map_from_value(cls, property_name, property_value,
                                       resources, seen_resources):
        """Return the properties of the nested type of a `RECORD` property."""
        if 'properties' in property_value:
            return property_value['properties']
        property_resource_name = property_value.get('$ref', None)
        if property_resource_name:
            # not handling recursive fields.
            if property_resource_name in seen_resources:
                return None
            seen_resources[property_resource_name] = True
            return cls._get_properties_map_from_value(
                property_resource_name, resources[property_resource_name],
                resources, seen_resources)
        if 'items' not in property_value:
            # we can't safely process labels or additionalProperties fields so
            # skip them
            return None
        return cls._get_properties_map_from_value(
            property_name, property_value['items'], resources, seen_resources)

    @classmethod
    def _properties_map_to_field_list(cls, properties_map, resources,
                                      seen_resources):
        """Convert API resource properties to BigQuery schema."""
        fields = []
        for property_name, property_value in properties_map.items():
            field = {'name': property_name}
            property_type = property_value.get('type', None)
            bigquery_type = cls._get_bigquery_type_for_property(property_value)
            field['field_type'] = bigquery_type
            if 'description' in property_value:
                field['description'] = property_value['description'][:1024]
            if property_type == 'array':
                field['mode'] = 'REPEATED'
            else:
                field['mode'] = 'NULLABLE'
            if bigquery_type == 'RECORD':
                property_properties_map = cls._get_properties_map_from_value(
                    property_name, property_value, resources, seen_resources)
                if not property_properties_map:
                    continue
                fields_list = cls._properties_map_to_field_list(
                    property_properties_map, resources, seen_resources)
                if not fields_list:
                    continue
                field['fields'] = fields_list
            fields.append(bigquery.SchemaField(**field))
        return fields

    @classmethod
    def _translate_resource_to_schema(cls, resource_name, document):
        """Expands the $ref properties of a reosurce definition."""
        api_id = document['id']
        resource_cache_key = api_id + resource_name
        if resource_cache_key in cls.schema_cache:
            return cls.schema_cache[resource_cache_key]
        resources = document['schemas']
        field_list = []
        if resource_name in resources:
            resource = resources[resource_name]
            properties_map = resource['properties']
            field_list = cls._properties_map_to_field_list(
                properties_map, resources, {})
        cls.schema_cache[resource_cache_key] = field_list
        return field_list

    @classmethod
    def _get_field_by_name(cls, fields, field_name):
        for i, field in enumerate(fields):
            if field.name == field_name:
                return i, field
        return None, None

    @classmethod
    def _convert_to_asset_schema(cls,
                                 schema,
                                 include_resource=True,
                                 include_iam_policy=True):
        """Add the fields that the asset export adds to each resource.

        Args:
            schema: list of google.cloud.bigquery.SchemaField objects.
            include_resource: to include resource schema.
            include_iam_policy: to include iam policy schema.
        Returns:
            list of google.cloud.bigquery.SchemaField objects.
        """
        asset_schema = [{
            'name': 'name',
            'field_type': 'STRING',
            'description': 'URL of the asset.',
            'mode': 'REQUIRED'
        }, {
            'name': 'asset_type',
            'field_type': 'STRING',
            'description': 'Asset name.',
            'mode': 'REQUIRED'
        }]
        if include_resource:
            resource_schema = list(schema)
            last_modified, _ = cls._get_field_by_name(resource_schema,
                                                      'lastModifiedTime')
            if not last_modified:
                resource_schema.append({
                    'name': 'lastModifiedTime',
                    'field_type': 'STRING',
                    'mode': 'NULLABLE',
                    'description': 'Last time resource was changed.'
                })
            asset_schema.append({
                'name': 'resource',
                'field_type': 'RECORD',
                'description': 'Resource properties.',
                'fields': [{
                    'name': 'version',
                    'field_type': 'STRING',
                    'description': 'Api version of resource.',
                    'mode': 'REQUIRED'
                }, {
                    'name': 'discovery_document_uri',
                    'field_type': 'STRING',
                    'description': 'Discovery document uri.',
                    'mode': 'REQUIRED'
                }, {
                    'name': 'parent',
                    'field_type': 'STRING',
                    'description': 'Parent resource.',
                    'mode': 'NULLABLE'
                }, {
                    'name': 'discovery_name',
                    'field_type': 'STRING',
                    'description': 'Name in discovery document.',
                    'mode': 'REQUIRED'
                }, {
                    'name': 'data',
                    'field_type': 'RECORD',
                    'description': 'Resource properties.',
                    'mode': 'REQUIRED',
                    'fields': resource_schema
                }],
                'mode': 'NULLABLE'
            })
        if include_iam_policy:
            asset_schema.append({
                'name': 'iam_policy',
                'field_type': 'RECORD',
                'description': 'IAM Policy',
                'fields': [{
                    'name': 'etag',
                    'field_type': 'STRING',
                    'description': 'Etag.',
                    'mode': 'NULLABLE'
                }, {
                    'name': 'audit_configs',
                    'field_type': 'RECORD',
                    'description': 'Logging of each type of permission.',
                    'mode': 'REPEATED',
                    'fields': [{
                        'name': 'service',
                        'field_type': 'STRING',
                        'description':
                            'Service that will be enabled for audit logging.',
                        'mode': 'NULLABLE'
                    }, {
                        'name': 'audit_log_configs',
                        'field_type': 'RECORD',
                        'description': 'Logging of each type of permission.',
                        'mode': 'REPEATED',
                        'fields': [{
                            'name': 'log_type',
                            'field_type': 'NUMERIC',
                            'mode': 'NULLABLE',
                            'description':
                            ('1: Admin reads. Example: CloudIAM getIamPolicy',
                             '2: Data writes. Example: CloudSQL Users create',
                             '3: Data reads. Example: CloudSQL Users list')
                        }]
                    }]
                }, {
                    'name': 'bindings',
                    'field_type': 'RECORD',
                    'mode': 'REPEATED',
                    'description': 'Bindings',
                    'fields': [{
                        'name': 'role',
                        'field_type': 'STRING',
                        'mode': 'NULLABLE',
                        'description': 'Assigned role.'
                    }, {
                        'name': 'members',
                        'field_type': 'STRING',
                        'mode': 'REPEATED',
                        'description': 'Principles assigned the role.'
                    }]
                }]
            })

        # convert dict structure into bigquery.SchemaField objects
        def to_bigquery_schema(fields):
            for field in fields:
                if 'fields' in field:
                    field['fields'] = to_bigquery_schema(fields['fields'])
            return [bigquery.SchemaField(**field) for field in fields]

        return to_bigquery_schema(asset_schema)

    @classmethod
    def bigquery_schema_for_asset_type(cls, asset_type, include_resource,
                                       include_iam_policy):
        """Returns the BigQuery schema for the asset type.

        Args:
            asset_type: CAI asset type.
            include_resource: if resource schema should be included.
            include_iam_policy: if IAM policy schema should be included.
        """
        cache_key = '{}.{}.{}'.format(asset_type, include_resource,
                                      include_iam_policy)
        if cache_key in cls.schema_cache:
            return cls.schema_cache[cache_key]
        api_name = cls.get_api_name_for_asset_type(asset_type)
        discovery_documents_map = cls._get_discovery_documents_map()
        discovery_documents = discovery_documents_map[api_name]
        resource_name = resource_name_for_asset_type(
            asset_type)
        # merge all asset versions into a single schema.
        schemas = [
            cls._translate_resource_to_schema(resource_name, document)
            for document in discovery_documents
        ]
        merged_schema = bigquery_schema.merge_schemas(schemas)
        asset_type_schema = cls._convert_to_asset_schema(
            merged_schema, include_resource, include_iam_policy)
        cls.schema_cache[cache_key] = asset_type_schema
        return asset_type_schema


def resource_name_for_asset_type(asset_type):
    """Return the resource name for the asset_type.

    Args:
        asset_type: the asset type like 'google.compute.Instance'
    Returns:
        a resource name like 'Instance'
    """
    return asset_type.split('.')[-1]
