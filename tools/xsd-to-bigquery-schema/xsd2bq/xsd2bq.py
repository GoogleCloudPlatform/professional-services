# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
The main module that runs the tool. All other modules are expected to call
convert_xsd, the rest of the functions are mostly considered internal.
"""
import re
from urllib.error import URLError
from xmlschema import XMLSchema, XsdElement, XsdType
from xmlschema.validators.exceptions import XMLSchemaParseError


def lookup_element_type(element_type: XsdType) -> str:
    """
    Given an instance of an element, lookup the closest type relative
    to it in BigQuery. Elements received can have a base type
    (based on a native XSD type) or might already be a native XSD type.
    Note: The following mapping patterns are dependent on the xmlns:xsd
    definition in the header.
    """
    base_xsd_type_patterns = [
        (r'^({.*})?(integer|nonPositiveInteger|negativeInteger|long|int)$',
         'NUMERIC'),
        (r'^({.*})?(short|byte|nonNegativeInteger|unsignedLong|unsignedInt)$',
         'NUMERIC'),
        (r'^({.*})?(unsignedShort|unsignedByte|positiveInteger)$', 'NUMERIC'),
        (r'^({.*})?(double|decimal)$', 'DECIMAL'),
        (r'({.*})?float', 'FLOAT64'),
        (r'({.*})?dateTime', 'DATETIME'),
        (r'({.*})?time', 'TIME'),
        (r'({.*})?date', 'DATE'),
        (r'({.*})?string', 'STRING'),
        (r'({.*})?duration', 'STRING'),
        (r'^({.*})?(binary|base64binary)$', 'STRING'),
        (r'({.*})?boolean', 'STRING'),
    ]

    if element_type.base_type is not None:
        base_xsd_type = element_type.base_type.name
    else:
        base_xsd_type = element_type.name

    for pattern in base_xsd_type_patterns:
        if re.match(pattern[0], base_xsd_type):
            return pattern[1]

    return 'STRING'


def process_complex_element(complex_element: XsdElement,
                            repeated: bool) -> dict:
    struct_elem = {'name': complex_element.name, 'type': 'RECORD', 'fields': []}

    if repeated:
        struct_elem['mode'] = 'REPEATED'

    for element in complex_element.type.content.iter_elements():
        repeated_element = (element.occurs[1] is None or element.occurs[1] > 1)

        if element.type.has_complex_content():
            struct_elem['fields'].append(
                process_complex_element(element, repeated_element))
        else:
            simple_element = {
                'name': element.name,
                'type': lookup_element_type(element.type)
            }

            if element.nillable:
                simple_element['mode'] = 'NULLABLE'
            if repeated_element:
                simple_element['mode'] = 'REPEATED'

            struct_elem['fields'].append(simple_element)

    return struct_elem


def convert_xsd(root_tag_name: str, xsd_path: str) -> list:
    try:
        my_schema = XMLSchema(xsd_path)
        root = my_schema.elements[root_tag_name]
    except URLError as e:
        raise ValueError('Invalid or unreadable XSD file path') from e
    except XMLSchemaParseError as e:
        raise ValueError('Invalid XSD file content') from e
    except KeyError as e:
        raise ValueError('Selected root element doesnt exist') from e

    if len(list(root.elem)) == 0:
        raise ValueError('Selected root element is empty')
    else:
        fields = []
        for element in root:
            is_repeated_element = (element.occurs[1] is None or
                                   element.occurs[1] > 1)
            if element.type.has_complex_content():
                fields.append(
                    process_complex_element(element, is_repeated_element))
            else:
                simple_element = {
                    'name': element.name,
                    'type': lookup_element_type(element.type)
                }

                if element.nillable:
                    simple_element['mode'] = 'NULLABLE'
                if is_repeated_element:
                    simple_element['mode'] = 'REPEATED'

                fields.append(simple_element)

        return fields
