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

"""Generates BigQuery schema from a json object and cleans it up.

The entry points are:

    `translate_json_to_schema`- Returns a list of
    `google.cloud.bigquery.SchemaField` like dict objects that describe the
    provided document

    `sanitize_property_value`- Modifies the supplied json object to conform to
    BigQuery standards such as nesting depth, column name format.

    `merge_schemas` - Combines multiple BigQuery schemas and returns a new schema
    that is a union of both.

    `get_field_by_name` - Returns a field with the supplied name from a list of
    BigQuery field.

This module helps import json documents into BigQuery.

"""

from collections import defaultdict
import copy
from numbers import Number
import re

from six import string_types

CLEAN_UP_REGEX = re.compile(r'\W+')
TIMESTAMP_REGEX = re.compile(
    r'^\d\d\d\d-\d\d-\d\d[T ]\d\d:\d\d:\d\d'
    r'(?:\.\d{1,6})?(?: ?Z| ?[+-]\d\d:\d\d| [A-Z]{3})?$')
DATE_REGEX = re.compile(r'^\d\d\d\d-\d\d-\d\d$')
BQ_MAX_NUMERIC = 9999999999999999999999999999.999999999
BQ_MIN_NUMERIC = -9999999999999999999999999999.999999999
BQ_MAX_COL_NAME_LENGTH = 128
BQ_NUMERIC_SCALE_DIGITS = 9
BQ_MAX_DEPTH = 15
BQ_MAX_COLUMNS = 10000
BQ_FORBIDDEN_PREFIXES = ['_partition', '_table_', '_file_', '_row_timestamp', '__root__', '_colidentifier']


def _get_bigquery_type_for_property_value(property_value):
    """Convert json value into a BigQuery data type.

    Recognizes BOOL, RECORD and returns NUMERIC for all numbers.
    Doesn't try to determine if a string is formatted as a timestamp.
    Args:
        property_value: Value of the json property.
    Returns:
        String for the BigQuery datatype.
    """
    if isinstance(property_value, bool):
        return 'BOOL'
    if isinstance(property_value, Number):
        return 'NUMERIC'
    if isinstance(property_value, dict):
        return 'RECORD'
    if isinstance(property_value, list):
        for element in property_value:
            return _get_bigquery_type_for_property_value(element)
        # no elements, but string is a good guess?
        return 'STRING'

    # we don't know the type, but string is a good guess.
    return 'STRING'


def translate_json_to_schema(document):
    """Convert a json object to a BigQuery schema.

    Traverses the json object collecting `google.cloud.bigquery.SchemaField`
    like dict objects for each value.

    Args:
        document: A json object. It's not modified.
    Returns:
        List of `google.cloud.bigquery.SchemaField` like dict objects.

    """
    schema = []
    if isinstance(document, list):
        schemas = [translate_json_to_schema(element) for element in document]
        return merge_schemas(schemas)
    for property_name, property_value in document.items():
        field = {'name': property_name}
        bigquery_type = _get_bigquery_type_for_property_value(property_value)
        field['field_type'] = bigquery_type
        if isinstance(property_value, list):
            field['mode'] = 'REPEATED'
        else:
            field['mode'] = 'NULLABLE'
        if bigquery_type == 'RECORD':
            field['fields'] = translate_json_to_schema(property_value)
        schema.append(field)
    schema.reverse()
    return schema


def contains_resource_data_schema(schema):
    """True if the resource data schema contains fields.
    Args:
        schema: list of fields (a schema).
    Returns:
        True if the schema contains resource. data with non-empty fields.
    """
    _, resource_field = get_field_by_name(schema, 'resource')
    if resource_field is not None:
        _, data_field = get_field_by_name(resource_field['fields'], 'data')
        # if we have any fields from the api schema call.
        # ignore the artificial 'lastModifiedTime' field.
        return (
                (data_field is not None) and (data_field['fields'] is not None) and
                (len(data_field['fields']) > 0) and
                (not (len(data_field['fields']) == 1 and
                      data_field['fields'][0]['name'] == 'lastModifiedTime')))
    return False


def get_field_by_name(fields, field_name):
    """Find index and field with input name.

    Args:
        fields: list of fields (a schema).
        field_name: name of field to search for.
    Returns:
        tuple of index and field[
    """
    for i, field in enumerate(fields):
        # BigQuery column names are case-insensitive.
        if field['name'].lower() == field_name.lower():
            return i, field
    return None, None


def is_additional_property_fields(fields):
    """True if the input fields are part of an 'additionalProperties' field."""
    return fields and len(fields) == 2 and all(
        (f.get('name', None) == 'name'
         and f.get('description', None) == 'additionalProperties name')
        or (f.get('name', None) == 'value') for f in fields)


def merge_additional_properties_fields(apf, fields):
    """Adds "fields" into the "value" property of apf.
    This is to match the specific type of additional property in the new schema.
    Args:
        apf: the additional property field
        fields: list of schema json documents to merge into the value field.
    """
    i, value_field = get_field_by_name(apf, 'value')
    for f in fields:
        if f.get('name', None) not in ('name', 'value'):
            value_field = _merge_fields(value_field, f)
    apf[i] = value_field


def _merge_fields(destination_field, source_field, num_properties=0):
    """Combines two SchemaField like dicts.

    The same field can exist in both the destination and source schemas when
    trying to combine schemas. To handle this we try to choose a more specific
    type if there is a conflict and merge any enclosed fields.

    Args:
        destination_field:  `google.cloud.bigquery.SchemaField` dict.
        source_field: `google.cloud.bigquery.SchemaField` dict.
    Returns:
        A `google.cloud.bigquery.SchemaField` dict.
    """
    dst_desc = destination_field.get('description', None)
    src_desc = source_field.get('description', None)
    dst_field_type = destination_field.get('field_type', None)
    src_field_type = source_field.get('field_type', None)
    # use the field with more information.
    if ((not dst_desc and src_desc) or
            (src_desc and dst_desc and len(dst_desc) < len(src_desc))):
        destination_field['description'] = src_desc
        destination_field['field_type'] = src_field_type

    # use the less specific type. and join fields
    # but don't overwrite the timestamp field as per
    # https://github.com/GoogleCloudPlatform/professional-services/issues/900
    elif (source_field.get('name', None) != 'timestamp' and
          (dst_field_type not in ('RECORD', 'STRING')) and
          src_field_type == 'STRING'):
        destination_field['field_type'] = src_field_type

    # https://github.com/GoogleCloudPlatform/professional-services/issues/614
    # Use the schema with the additionalProperties overrides. See
    # api_schema._get_properties_map_field_list which creates the
    # additionalProperties RECORD type and enforce_schema_data_types for where
    # documents of type RECORD are converted to the REPEATED
    # additionalProperties name value pairs.

    src_fields = source_field.get('fields', [])
    dst_fields = destination_field.get('fields', [])

    if (is_additional_property_fields(src_fields) and not
        is_additional_property_fields(dst_fields)):
        destination_field['mode'] = 'REPEATED'
        merge_additional_properties_fields(src_fields, dst_fields)
        destination_field['fields'] = copy.deepcopy(src_fields)

    elif (is_additional_property_fields(dst_fields) and not
          is_additional_property_fields(src_fields)):
        destination_field['mode'] = 'REPEATED'
        merge_additional_properties_fields(dst_fields, src_fields)
        destination_field['fields'] = dst_fields
    elif (is_additional_property_fields(dst_fields) and
          is_additional_property_fields(src_fields)):
        destination_field['mode'] = 'REPEATED'
        merge_additional_properties_fields(dst_fields, src_fields)
        destination_field['fields'] = dst_fields
    else:
        merged_fields = _merge_schema(dst_fields, src_fields, num_properties)
        if merged_fields:
            destination_field['fields'] = merged_fields
    return destination_field


def contains_additional_properties(schema):
    """True if the schema contains an 'additionalProperties' field."""
    return get_field_by_name(schema, 'additionalProperties')[0] is not None


def _merge_schema(destination_schema, source_schema, num_properties=0):
    """Add source_schema fields to the destination_schema.

    Modifies the destination_schema list argument with fields from
    source_schema. Calls _merge_fields when a field exists in both with the same
    name.
    Args:
        destination_schema: List of `google.cloud.bigquery.SchemaField`.
        source_schema: List of `google.cloud.bigquery.SchemaField`.
    Returns:
        The modified destination_schema list.

    """
    # short circuit.
    if num_properties > BQ_MAX_COLUMNS:
        return destination_schema

    # short circuit if schemas are the same.
    if destination_schema == source_schema:
        return destination_schema
    # if we have a schema with 'additionalProperties', don't merge field by
    # field, just take the schema that contains it as it's the API schema and
    # authoritative.
    if contains_additional_properties(destination_schema):
        return destination_schema
    if contains_additional_properties(source_schema):
        return copy.deepcopy(source_schema)

    # modify the destination_schema_list for efficiency
    for source_field in source_schema:
        # short circuit.
        if num_properties > BQ_MAX_COLUMNS:
            return destination_schema
        i, destination_field = get_field_by_name(destination_schema,
                                                 source_field['name'])
        # field with same name exists, merge them.
        if destination_field:
            destination_schema[i] = _merge_fields(destination_field,
                                                  source_field,
                                                  num_properties)
            num_properties = num_properties + len(destination_schema[i].get('fields', [])) + 1
        else:
            destination_schema.append(copy.deepcopy(source_field))
            num_properties = num_properties + len(source_field.get('fields', [])) + 1
    return destination_schema


def merge_schemas(schemas):
    """Combines BigQuery schemas.

    Unions all input schemas into one. This is not be a safe operation if two
    schemas defines a different type for the same field.

    Args:
        schemas: List of lists of `google.cloud.bigquery.SchemaField` objects.
    Returns:
        List of `google.cloud.bigquery.SchemaField` objects.

    """
    destination_schema = []
    for source_schema in schemas:
        destination_schema = _merge_schema(destination_schema, source_schema)
    return destination_schema


def _convert_labels_dict_to_list(parent):
    """Covert "labels" from dictionary into list of "name", "value" pairs.

    This makes the resulting BigQuery schema more consistent when the json
    object has arbitrary user supplied fields.

    Args:
        parent: dict object.
    Returns:
        The modified dict object.

    """
    labels_dict = parent['labels']
    labels_list = [{'name': key, 'value': val}
                   for (key, val) in labels_dict.items()]
    parent['labels'] = labels_list
    return parent


def _sanitize_property(property_name, parent, depth, num_properties):
    """Clean up json property for import into BigQuery.

    Enforces some BigQuery requirements (see _sanitize_property_value for some
    others):

    1. Covert all properties named "labels" from maps into list of "name",
    "value" pairs. Giving user supplied labels on documents have a more
    consistent schema.

    2. A column name must contain only letters (a-z, A-Z), numbers (0-9), or
    underscores (_), and it must start with a letter or underscore. The
    maximum column name length is 128 characters.

    3. Removes empty dictionary or list of empty dictionaries as any RECORD type
    field must have defined fields, and we can't determine those fields from an
    empty dictionary.

    4. Remove duplicate properties. BigQuery is case-insensitive in property,
    names, yet we want to keep the input case of the column for human readers. To
    columns with the same name but different case can result in a failure to
    load.

    Args:
        property_name: Name of the property in the json object.
        parent: The json object containing the property.
        depth: How nested within the original document we are.
        num_properties: How many properties into the document we are.
    """
    # if property was removed earlier, nothing to sanitize.
    if property_name not in parent:
        return

    # enforce column name requirements (condition #2).
    new_property_name = CLEAN_UP_REGEX.sub('', property_name)
    # contains only non-word characters. just drop the property.
    if not new_property_name:
        parent.pop(property_name)
        return
    first_character = new_property_name[0]
    if not first_character.isalpha() and first_character != '_':
        new_property_name = '_' + new_property_name
    new_property_name = new_property_name[:BQ_MAX_COL_NAME_LENGTH]

    # Some prefixes aren't allowed as field names; prefix with '_' again
    if any([new_property_name.lower().startswith(x) for x in BQ_FORBIDDEN_PREFIXES]):
        new_property_name = '_' + new_property_name

    # check if property was changed.
    if property_name != new_property_name:
        property_value = parent.pop(property_name)
        parent[new_property_name] = property_value

    # handle labels (condition #1).
    if (new_property_name == 'labels' and
            isinstance(parent[new_property_name], dict)):
        _convert_labels_dict_to_list(parent)

    property_value = parent[new_property_name]

    # recursively descend.
    sanitized = sanitize_property_value(property_value, depth=depth + 1,
                                        num_properties=num_properties)

    # else the value could have changed.
    parent[new_property_name] = sanitized

    # remove empty dicts or list of empty dicts (condition #3)
    if isinstance(sanitized, (list, dict)) and not any(sanitized):
        # BigQuery doesn't deal well with empty records.
        # prune the value.
        parent.pop(new_property_name)


def remove_duplicates(properties):
    """Ensure no two property in properties share the same name.

    Args:
        properties: dictionary to modify.

    BigQuery is case-insensitive, remove any lexically greater property
    in the dictionary that differ only by case.
    """
    duplicates = defaultdict(list)
    # find duplicate properties
    for k in properties:
        duplicates[k.casefold()] += [k]

    for k in duplicates:
        duplicate_properties = duplicates[k]
        # remove any properties that are duplicate
        if len(duplicate_properties) > 1:
            selected_property = min(duplicate_properties)
            for prop in duplicate_properties:
                if prop != selected_property:
                    properties.pop(prop)


def sanitize_property_value(property_value, depth=0, num_properties=0):
    """Modifies supplied json object for BigQuery load.

    Traverses the json object and modifies it to conform to BigQuery
    requirements.

    1. Will prune any value with more than 15 layers of nesting as that's the
    most BigQuery will handle. See `_sanitize_property` for description of other
    rules enforced.

    2. rounds/truncates numeric values to be between BigQuery limits for NUMERIC
    values.

    3. Prunes any value after the 10,000'th property.

    Args:
        property_value: Json object.
        depth: Level of embedding within the document.
        num_properties: Number of properties processed within the document.
    Returns:
        Modified json object.

    """

    # BigQuery can't deal with too many nested fields.
    # prune it.
    if depth > BQ_MAX_DEPTH:
        return {}

    # BigQuery can't handle too many columns.
    if num_properties > BQ_MAX_COLUMNS:
        return {}

    # NUMERIC data type is an exact numeric value with 38 digits of precision
    # and 9 decimal digits of scale.
    if isinstance(property_value, Number):
        if isinstance(property_value, float):
            property_value = round(property_value, BQ_NUMERIC_SCALE_DIGITS)
        property_value = max(property_value, BQ_MIN_NUMERIC)
        property_value = min(property_value, BQ_MAX_NUMERIC)

    # Some records report numbers with values of "Infinity" and "-Infinity"
    # convert them to respective numeric values.
    if property_value == 'Infinity':
        property_value = BQ_MAX_NUMERIC
    if property_value == '-Infinity':
        property_value = BQ_MIN_NUMERIC
    if property_value == 'NaN':
        property_value = BQ_MIN_NUMERIC

    # sanitize each nested list element.
    if isinstance(property_value, list):
        for i, item in enumerate(property_value):
            num_properties += 1
            if isinstance(item, (dict, list)):
                sanitize_property_value(item, depth, num_properties)
            else:
                # if the list element has a primitive type, we need to
                # re-affect the sanitized value
                property_value[i] = sanitize_property_value(
                    item, depth, num_properties)

    # and each nested json object.
    if isinstance(property_value, dict):
        remove_duplicates(property_value)
        for child_property in dict(property_value):
            # count it.
            num_properties += 1
            # sanitize each property.
            _sanitize_property(child_property, property_value, depth,
                               num_properties)
    return property_value


def sanitize_bigquery_schema(schema, depth=0, num_properties=0):
    """Enforces BigQuery property and table restrictions on the json schema documents
    Args:
      schema: BigQuery schema field dict.
      depth: The nested depth of the schema.
      num_properties: Number of properties in the table.
    Returns:
      BigQuery schema field dict with BigQuery validation rules applied.
    """
    result_fields = []
    for field in schema:
        num_properties += 1
        # if we are over the max number of columns, truncate the schema.
        if num_properties > BQ_MAX_COLUMNS or depth > BQ_MAX_DEPTH:
            return result_fields

        property_name = field['name']
        parent = {property_name: "value"}
        _sanitize_property(property_name, parent, depth, num_properties)
        # if the property was invalid, just continue.
        if len(parent) == 0:
            continue
        # it's possible the field name changed, store it.
        field['name'] = list(parent.keys())[0]
        # sanitize any nested fields?
        sanitize_bigquery_schema(field.get('fields', []), depth + 1, num_properties)


def enforce_schema_data_type_on_property(field, property_value):
    """Ensure property values are the correct type.

    Tries to convert property_value into the field's type. If we can't, then
    return None.
    Args:
      field: BigQuery schema field dict.
      property_value: object to try to coerce.
    Returns:
      The properly typed property_value, or None if it can't be converted.
    """
    field_type = field['field_type']
    if field_type == 'RECORD':
        if isinstance(property_value, dict):
            return enforce_schema_data_types(property_value, field['fields'])
        return None
    if field_type == 'STRING':
        if not isinstance(property_value, string_types):
            return str(property_value)
    if field_type == 'BOOL':
        if not isinstance(property_value, bool):
            return bool(property_value)
    if field_type == 'TIMESTAMP':
        if not re.match(TIMESTAMP_REGEX, property_value):
            return None
    if field_type == 'DATE':
        if not re.match(DATE_REGEX, property_value):
            return None
    if field_type == 'DATETIME':
        if not re.match(TIMESTAMP_REGEX, property_value):
            return None
    if field_type == 'NUMERIC':
        if not isinstance(property_value, Number):
            try:
                return float(property_value)
            except (ValueError, TypeError):
                return None
    return property_value


def push_down_additional_properties(resource, schema):
    """Move additional properties to name value array.

    If the schema contains an 'additionalProperties' field, then move any
    properties not in the defined schema's fields into the child
    additionalProperties name value pair.
    Args:
        resource: json dict to be modified.
        schema: BigQuery schema.

    """
    _, ap_field = get_field_by_name(schema, 'additionalProperties')
    if ap_field:
        known_fields = [f['name'] for f in schema]
        for property_name in list(resource):
            if property_name not in known_fields:
                ap_property = resource.get('additionalProperties', [])
                resource['additionalProperties'] = ap_property
                ap_property.append({'name': property_name,
                                    'value': resource[property_name]})
                del resource[property_name]


def enforce_schema_data_types(resource, schema):
    """Enforce schema's data types.

    Kubernetes doesn't reject config resources with data of the wrong type.
    BigQuery however is typesafe and rejects the load if value is a
    different type then declared by the table's schema. This function
    attempts to correct the invalid Kubernetes data and if that not
    possible, just removes the property value, the json data will always
    have the original data.
    Args:
        resource: Dictionary, will be modified.
        schema: BigQuery schema.
    Returns:
        Modified resource.
    """

    # if the schema contains an 'additionalProperties' field, then move
    # any properties not in the defined schema's fields into the child
    # additionalProperties name value pair.
    push_down_additional_properties(resource, schema)

    # apply datatype of each field.
    for field in schema:
        field_name = field['name']
        # nothing to sanitize if there is no property value.
        if field_name not in resource:
            continue

        resource_value = resource[field_name]

        # if this is an additional_property, convert to name value pair.
        if (is_additional_property_fields(field.get('fields', None)) and
                isinstance(resource_value, dict)):
            resource_value = [{'name': key, 'value': val}
                              for (key, val) in resource_value.items()]

        # if it's a list, convert to list sanitize each element of the array.
        if field.get('mode', 'NULLABLE') == 'REPEATED':
            if not isinstance(resource_value, list):
                resource_value = [resource_value]
            new_array = []
            for value in resource_value:
                value = enforce_schema_data_type_on_property(
                    field, value)
                if value is not None:
                    new_array.append(value)
            # if all values are invalid, delete the array.
            if any(new_array):
                resource[field_name] = new_array
            else:
                del resource[field_name]
        else:
            # We are RECORD or other scalar value, sanitize it
            # if it's not valid, delete the property.
            value = enforce_schema_data_type_on_property(
                field, resource_value)
            if value is not None:
                resource[field_name] = value
            else:
                del resource[field_name]

    return resource
