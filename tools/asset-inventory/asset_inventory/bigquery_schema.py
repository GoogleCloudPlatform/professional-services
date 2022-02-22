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

    `merge_schemas` - Combines multiple BigQuery schmas and returns a new schema
    that is a union of both.

    `get_field_by_name` - Returns a field with the supplied name from a list of
    BigQuery field.

This module helps import json documents into BigQuery.

"""

import copy
from collections import defaultdict
from numbers import Number
import re

from six import string_types

CLEAN_UP_REGEX = re.compile(r'[\W]+')
TIMESTAMP_REGEX = re.compile(
    r'^\d\d\d\d-\d\d-\d\d[T ]\d\d:\d\d:\d\d'
    r'(?:\.\d{1,6})?(?: ?Z| ?[\+-]\d\d:\d\d| [A-Z]{3})?$')
DATE_REGEX = re.compile(r'^\d\d\d\d-\d\d-\d\d$')
BQ_MAX_NUMERIC = 99999999999999999999999999999.999999999
BQ_MIN_NUMERIC = -99999999999999999999999999999.999999999
BQ_MAX_COL_NAME_LENGTH = 128
BQ_NUMERIC_SCALE_DIGITS = 9
BQ_MAX_DEPTH = 15
BQ_MAX_COLUMNS = 10000


def is_number(s):
    return isinstance(s, Number)


def _get_bigquery_type_for_property_value(property_value):
    """Convert json value into a BigQuery data type.

    Recgonizes BOOL, RECORD and returns NUMERIC for all numbers.
    Doesn't try to determine if a string is formatted as a timestamp.
    Args:
        property_value: Value of the json property.
    Returns:
        String for the BigQuery datatype.
    """
    if isinstance(property_value, bool):
        return 'BOOL'
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


def get_field_by_name(fields, field_name):
    for i, field in enumerate(fields):
        # BigQuery column names are case insensitive.
        if field['name'].lower() == field_name.lower():
            return i, field
    return None, None


def is_additonal_properties(fields):
    return fields and len(fields) == 2 and all(
        (f.get('name', None) == 'name'
         and f.get('description', None) == 'additionalProperties name')
        or (f.get('name', None) == 'value') for f in fields)


def _merge_fields(destination_field, source_field):
    """Combines two SchemaField like dicts.

    The same field can exist in both the destination and source schemas when
    trying to combine schemas. To handle this we try to choose a more specific
    type if there is a conflict and merge any encosed fields.

    Args:
        destination_field:  `google.cloud.bigquery.SchemaField` dict.
        source_field: `google.cloud.bigquery.SchemaField` dict.
    Returns:
        A `google.cloud.bigquery.SchemaField` dict.
    """
    field = copy.deepcopy(destination_field)

    dd = destination_field.get('description', None)
    sd = source_field.get('description', None)
    dft = destination_field.get('field_type', None)
    sft = source_field.get('field_type', None)
    # use the field with more information.
    if ((not dd and sd) or (sd and dd and len(dd) < len(sd))):
        field['description'] = sd
        field['field_type'] = sft
    # use the less specific type. and join fields
    elif ((dft != 'RECORD' and dft != 'STRING') and sft == 'STRING'):
        field['field_type'] = sft

    # https://github.com/GoogleCloudPlatform/professional-services/issues/614
    # Use the schema with the additonalProperties overrides. See
    # api_schema._get_properties_map_field_list which creates the
    # additionalProperties RECORD type and enforce_schema_data_types for where
    # documents of type RECORD are converted to the REPEATED additonalProperties
    # name value pairs.
    def merge_additional_properties_fields(apf, fields):
        i, value_field = get_field_by_name(apf, 'value')
        for f in fields:
            if f.get('name', None) not in ('name', 'value'):
                value_field = _merge_fields(value_field, f)
        apf[i] = value_field

    sf = source_field.get('fields', [])
    df = destination_field.get('fields', [])
    if is_additonal_properties(sf) and not is_additonal_properties(df):
        field['mode'] = 'REPEATED'
        sf = copy.deepcopy(sf)
        merge_additional_properties_fields(sf, df)
        field['fields'] = sf
    elif is_additonal_properties(df) and not is_additonal_properties(sf):
        field['mode'] = 'REPEATED'
        merge_additional_properties_fields(df, sf)
        field['fields'] = df
    elif is_additonal_properties(df) and is_additonal_properties(sf):
        field['mode'] = 'REPEATED'
        merge_additional_properties_fields(df, sf)
        field['fields'] = df
    else:
        mf = _merge_schema(df, sf)
        if mf:
            field['fields'] = mf
    return field


def _merge_schema(destination_schema, source_schema):
    """Add source_schema fields to the the destination_schema.

    Modifies the destination_schema list argument with fields from
    source_schema. Calls _merge_fields when a field exists in both with the same
    name.
    Args:
        destination_schema: List of `google.cloud.bigquery.SchemaField`.
        source_schema: List of `google.cloud.bigquery.SchemaField`.
    Returns:
        The modified destination_schema list.

    """
    # short circuit if schemas are the same.
    if destination_schema == source_schema:
        return destination_schema
    destination_schema_list = list(destination_schema)
    for source_field in source_schema:
        i, destination_field = get_field_by_name(destination_schema_list,
                                                 source_field['name'])
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
    field must have defined fields and we can't determine those fields from an
    empty dictionary.

    4. Remove duplicate properties. BigQuery is case insensitive in property,
    names yet we want to keep the input case of the column for human readers. To
    columns with the same name but different case can result in a failure to
    load.

    Args:
        property_name: Name of the property in the json oject.
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

    # check if property was changed.
    if property_name != new_property_name:
        property_value = parent.pop(property_name)
        parent[new_property_name] = property_value

    # handle labels (condition #1).
    if (new_property_name == 'labels' and
        isinstance(parent[new_property_name], dict)):
        _convert_labels_dict_to_list(parent)

    property_value = parent[new_property_name]

    # recursivly descend.
    sanitized = sanitize_property_value(property_value, depth=depth + 1,
                                        num_properties=num_properties)

    # else the value could have changed.
    parent[new_property_name] = sanitized

    # remove empty dicts or list of empty dicts (condition #3)
    if ((isinstance(sanitized, list) or
         isinstance(sanitized, dict)) and
        not any(sanitized)):
        # BigQuery doesn't deal well with empty records.
        # prune the value.
        parent.pop(new_property_name)


def remove_duplicates(properties):
    """Ensure no two property in properties share the same name.

    Args:
        properties: dictionary to modify.

    BigQuery is case insensitive, remove any lexically greater property
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
            for p in duplicate_properties:
                if p != selected_property:
                    properties.pop(p)


def sanitize_property_value(property_value, depth=0, num_properties=0):
    """Modifies supplied json object for BigQuery load.

    Traverses the json object and modifies it to conform to BigQuery
    requirements.

    1. Will prune any value with more then 15 layers of nesting as that's the
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

    # sanitize each nested list element.
    if isinstance(property_value, list):
        for i in range(len(property_value)):
            if isinstance(property_value[i], (dict, list)):
                sanitize_property_value(property_value[i], depth, num_properties)
            else:
                # if the list element has a primitive type, we need to re-affect the sanitized value
                property_value[i] = sanitize_property_value(property_value[i], depth, num_properties)
    
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


def enforce_schema_data_type_on_property(field, property_value):
    """Ensure property values are the correct type.

    Tries to convert property_value into the field's type. If we can't, then
    return None.
    Args:
      field: BigQuery schema field dict.
      property_value: object to try to coerce.
    Returns:
      The properly typed property_value, or None if it can't be convered.
    """
    field_type = field['field_type']
    if field_type == 'RECORD':
        if isinstance(property_value, dict):
            return enforce_schema_data_types(property_value, field['fields'])
        else:
            return None
    if field_type == 'STRING':
        if not isinstance(property_value, string_types):
            return str(property_value)
    if field_type == 'BOOL':
        if not isinstance(property_value, bool):
            if property_value:
                return True
            else:
                return False
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

    # apply datatype of each field.
    for field in schema:
        field_name = field['name']
        if field_name in resource:
            resource_value = resource[field_name]
            if field.get('mode', 'NULLABLE') == 'REPEATED':
                # satisfy array condition by converting dict into
                # repeated name value records.
                # this handles any 'additonalProperties' types.
                if (field['field_type'] == 'RECORD' and
                    isinstance(resource_value, dict)):
                    resource_value = [{'name': key, 'value': val}
                                      for (key, val) in resource_value.items()]
                elif not isinstance(resource_value, list):
                    resource_value = [resource_value]
                new_array = []
                for value in resource_value:
                    value = enforce_schema_data_type_on_property(
                        field, value)
                    if value is not None:
                        new_array.append(value)
                if any(new_array):
                    resource[field_name] = new_array
                else:
                    del resource[field_name]
            else:
                value = enforce_schema_data_type_on_property(
                    field, resource_value)
                if value is not None:
                    resource[field_name] = value
                else:
                    del resource[field_name]
    return resource
