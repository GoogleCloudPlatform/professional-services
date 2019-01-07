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
    `google.cloud.bigquery.SchemaField` objects that describe the provided
    document

    `sanitize_property_value`- Modifies the supplied json object to conform to
    BigQuery standards such as nesting depth, column name format.

    `merge_schemas` - Combines multiple BigQuery schmas and returns a new schema
    that is a union of both.

This module helps import json documents into BigQuery.
"""

from numbers import Number
import re

from six import string_types

from google.cloud import bigquery

CLEAN_UP_REGEX = re.compile(r'[\W]+')
TIMESTAMP_REGEX = re.compile(
    r'^\d\d\d\d-\d\d-\d\d[T ]\d\d:\d\d:\d\d'
    r'(?:\.\d{1,6})?(?: ?Z| ?[\+-]\d\d:\d\d| [A-Z]{3})?$')
DATE_REGEX = re.compile(r'^\d\d\d\d-\d\d-\d\d$')
MAX_NUMERIC = 99999999999999999999999999999.999999999
MIN_NUMERIC = -99999999999999999999999999999.999999999


def is_number(s):
    return isinstance(s, Number)


def _get_bigquery_type_for_property_value(property_value):
    """Convert json value into a BigQuery data type.

    Recgonizes timestamp and dates, returns NUMERIC for all numbers.
    Args:
        property_value: Value of the json property.
    Returns:
        String for the BigQuery datatype.
    """
    if isinstance(property_value, bool):
        return 'BOOL'
    elif isinstance(property_value, string_types):
        if re.match(TIMESTAMP_REGEX, property_value):
            return 'TIMESTAMP'
        if re.match(DATE_REGEX, property_value):
            return 'DATE'
        return 'STRING'
    elif isinstance(property_value, Number):
        return 'NUMERIC'
    elif isinstance(property_value, dict):
        return 'RECORD'
    elif isinstance(property_value, list):
        for element in property_value:
            return _get_bigquery_type_for_property_value(element)
        # no elements, but string is a good guess?
        return 'STRING'

    # we don't know the type, but string is a good guess.
    return 'STRING'


def translate_json_to_schema(document):
    """Convert a json object to a BigQuery schema.

    Traverses the json object collecting
    `google.cloud.bigquery.SchemaField` objects for each value.

    Args:
        document: A json object. It's not modified.
    Returns:
        List of `google.cloud.bigquery.SchemaField` objects.

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
        schema.append(bigquery.SchemaField(**field))
    return schema


def _get_field_by_name(fields, field_name):
    for i, field in enumerate(fields):
        if field.name == field_name:
            return i, field
    return None, None


def _merge_fields(destination_field, source_field):
    """Combines two SchemaField objects.

    The same field can exist in both the destination and source schemas when
    trying to combine schemas. To handle this we try to choose a more specific
    type if there is a conflict and merge any encosed fields.

    Args:
        destination_field:  `google.cloud.bigquery.SchemaField` object.
        source_field: `google.cloud.bigquery.SchemaField` object.
    Returns:
        A `google.cloud.bigquery.SchemaField` object.
    """
    field = destination_field
    # use the more specific type if destination is just a STRING.
    if (destination_field.field_type == 'STRING' and
        source_field.field_type != 'STRING'):
        # modify SchemaField.type by copying
        field = bigquery.SchemaField(
            name=field.name,
            fields=field.fields,
            field_type=source_field.field_type,
            description=field.description,
            mode=field.mode)
    merged_fields = _merge_schema(destination_field.fields,
                                  source_field.fields)
    # modify SchemaField.fields property by copying
    if merged_fields != destination_field.fields:
        field = bigquery.SchemaField(
            name=field.name,
            fields=merged_fields,
            field_type=field.field_type,
            description=field.description,
            mode=field.mode)
    return field


def _merge_schema(destination_schema, source_schema):
    """Add source_schema fields to the the destination_schema.

    Modifies the destination_schema list argument with fields from
    source_schema. Calls _merge_fields when a field exists in both with the same
    name.
    Args:
        destination_schema: List of `google.cloud.bigquery.SchemaField`, this
        list is modified.
        source_schema: List of `google.cloud.bigquery.SchemaField`.
    Returns:
        The modified destination_schema list.

    """

    destination_schema_list = list(destination_schema)
    for source_field in source_schema:
        i, destination_field = _get_field_by_name(destination_schema_list,
                                                  source_field.name)
        # field with same name exists, merge them.
        if destination_field:
            destination_schema_list[i] = _merge_fields(destination_field,
                                                       source_field)
        # otherwise append at the end.
        else:
            destination_schema_list.append(source_field)
    return destination_schema_list


def merge_schemas(schemas):
    """Combines BigQuery schemas.

    Unions all input scheams into one. This is not be a safe operation if two
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
        parent: Json object.
    Returns:
        The modified json object.

    """
    labels_dict = parent['labels']
    labels_list = [{
        'name': label_name,
        'value': labels_dict[label_name]
    } for label_name in labels_dict]
    parent['labels'] = labels_list
    return parent


def _sanitize_property(property_name, parent, depth):
    """Clean up json property for import into BigQuery.

    Enforces some BigQuery requirements (see _santize_property_value for some
    others):

    1. Covert all properties named "labels" from maps into list of "name",
    "value" pairs. Giving user supplied labels on documents have a more
    consistent schema.

    2. A column name must contain only letters (a-z, A-Z), numbers (0-9), or
    underscores (_), and it must start with a letter or underscore. The
    maximum column name length is 128 characters.

    3. Removes empty dictionary or list of empty dictionaries as any RECORD type
    field must have defined fields and we can't determine those fields from an
    empty dictionary.

    Args:
        property_name: Name of the property in the json oject.
        parent: The json object containing the property.
        depth: How nested within the original document we are.
    """
    # enforce column name requirements (condition #2)
    new_property_name = CLEAN_UP_REGEX.sub('', property_name)
    first_character = new_property_name[0]
    if not first_character.isalpha() and first_character != '_':
        new_property_name = '_' + new_property_name
    new_property_name = new_property_name[:128]

    # did the property name change?
    if property_name != new_property_name:
        property_value = parent.pop(property_name)
        parent[new_property_name] = property_value

    # handle labels (condition #1)
    if new_property_name == 'labels':
        _convert_labels_dict_to_list(parent)

    property_value = parent[new_property_name]

    # recursivly descend.
    sanitized = sanitize_property_value(property_value, depth=depth + 1)

    # else the value could have changed.
    parent[new_property_name] = sanitized

    # remove empty dicts or list of empty dicts (condition #3)
    if is_empty_dict_list_or_empty_dict(sanitized):
        # BigQuery doesn't deal well with empty records.
        # prune the value.
        parent.pop(new_property_name)


def is_empty_dict_list_or_empty_dict(property_value):
    """True if is an empty dict or a list of empty dicts."""

    if isinstance(property_value, dict) and not property_value:
        return True

    if isinstance(property_value, list):
        for property_element in property_value:
            if ((not isinstance(property_element, dict)) or property_element):
                return False
        return True
    return False


def sanitize_property_value(property_value, depth=0):
    """Modifies supplied json object for BigQuery load.

    Traverses the json object and modifies it to conform to BigQuery
    requirements.

    1. Will prune any value with more then 15 layers of nesting as that's the
    most BigQuery will handle. See `_sanitize_property` for description of other
    rules enforced.

    2. rounds/truncates numeric values to be between BigQuery limits for NUMERIC
    values.

    Args:
        property_value: Json object.
        depth: Level of embedding within the json document.
    Returns:
        Modified json object.

    """

    # BigQuery can't deal with more then 15 nested fields.
    # prune it.
    if depth > 15:
        return {}

    # NUMERIC data type is an exact numeric value with 38 digits of precision
    # and 9 decimal digits of scale.
    if isinstance(property_value, Number):
        if isinstance(property_value, float):
            property_value = round(property_value, 9)
        property_value = max(property_value, MIN_NUMERIC)
        property_value = min(property_value, MAX_NUMERIC)

    # sanitize each nested list element.
    if isinstance(property_value, list):
        for array_item in property_value:
            sanitize_property_value(array_item, depth)

    # and each nested json object.
    if isinstance(property_value, dict):
        for child_property in dict(property_value):
            _sanitize_property(child_property, property_value, depth)

    return property_value
