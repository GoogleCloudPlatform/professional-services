# Copyright 2019 Google LLC
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

import datetime
import json
import logging
import os


class QueryCreator(object):
    """Class for creating customized queries based off of a schema.

    Attributes:
        schema_path(str): Path to the user tables schema in JSON format.
        user_id_field_name(str): Name of the field that identifies unique users.
        ingest_timestamp_field_name(str): Name of the timestamp field that marks
            the ingestion.
        project_id(str): Id of project holding BQ resources.
        dataset_id(str): Id of dataset holding Identity BQ user tables.
        updates_table_id(str): The ID of the historical table that holds
            all rows and updates for all users.
        temp_updates_table_id(str): ID of the intermediary temp table.
        final_table_id(str): The ID of table that holds one up-to-date row
            per user.


    """

    def __init__(self, schema_path, user_id_field_name,
                 ingest_timestamp_field_name, project_id, dataset_id,
                 updates_table_id, temp_updates_table_id, final_table_id):
        self.schema_path = schema_path
        self.user_id_field_name = user_id_field_name
        self.ingest_timestamp_field_name = ingest_timestamp_field_name
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.updates_table_id = updates_table_id
        self.temp_updates_table_id = temp_updates_table_id
        self.final_table_id = final_table_id

    def create_gather_updates_query(self):
        """Creates a query for gathering updates.

        Utilized query templates and parses the schema in self.schema_path to
        create a customized query.

        Returns: The created query in string format.
        """

        def _determine_name_alias(field, record_name, record_alias):
            """Determines the name and alias of a field.

            Args:
                field(dict): Represents a field in the user schema.
                record_name(str): The name of the record that the field belongs
                    to if the field variable is a nested field. None if the
                    field is not a nested field.
                record_alias(str): The alias of the record that the field
                    belongs to if the field variable is a nested field. None
                    if the field is not a nested field.
            Returns: The name and alias of the field in string format.
            """
            if record_name:
                name = '{0:s}.{1:s}'.format(record_name, field['name'])
                alias = '{0:s}_{1:s}'.format(record_alias, field['name'])

            else:
                name = field['name']
                alias = field['name']
            return name, alias

        def _process_inner_string_field(field,
                                        record_name=None,
                                        record_alias=None):
            """Creates a list of strings to be used as the inner portion of the
                gather updates query by recursively processing fields and
                nested fields.

            Args:
                field(dict): Represents a field in the user schema.
                record_name(str): The name of the record that the field belongs
                    to if the field variable is a nested field. None if the
                    field is not a nested field.
                record_alias(str): The alias of the record that the field
                    belongs to if the field variable is a nested field. None if
                    the field is not a nested field.
            """
            if field['type'] == 'RECORD':
                for sub_field in field['fields']:
                    name, alias = _determine_name_alias(field, record_name,
                                                        record_alias)
                    _process_inner_string_field(sub_field, name, alias)
            else:
                name, alias = _determine_name_alias(field, record_name,
                                                    record_alias)
                field_str = inner_string.format(name, alias)
                inner_string_list.append(field_str)

        def _process_select_string_field(field, record_alias=None):
            """Creates a list of fields to be selected as part of the
                gather_updates query by recursively processing fields and nested
                fields.

            Args:
                field(dict): Represents a field in the user schema.
                record_alias(str): The alias of the record that the field
                    belongs to if the field variable is a nested field. None
                    if the field is not a nested field.
                        """
            if field['type'] == 'RECORD':
                struct_str = 'STRUCT({0:s}) as {1:s}'
                sub_field_list = []
                for sub_field in field['fields']:
                    alias_string = '{0:s}_{1:s}'
                    if record_alias:
                        alias = alias_string.format(record_alias,
                                                    sub_field['name'])
                    else:
                        alias = alias_string.format(field['name'],
                                                    sub_field['name'])
                    sub_field_list.append(
                        _process_select_string_field(sub_field, alias))
                sub_field_str = ', '.join(sub_field_list)

                return struct_str.format(sub_field_str, field['name'])
            else:
                if record_alias:
                    return '{0:s} as {1:s}'.format(record_alias, field['name'])
                else:
                    return field['name']

        # Get the templates to build the queries
        abs_path = os.path.abspath(os.path.dirname(__file__))
        outer_string_path = os.path.join(
            abs_path, '../query_templates/gather_updates_outer_string.txt')
        with open(outer_string_path, 'r') as input_file:
            outer_string = input_file.read()

        inner_string_list = []
        field_list = []
        inner_string_path = os.path.join(
            abs_path, '../query_templates/gather_updates_inner_string.txt')
        with open(inner_string_path, 'r') as input_file:
            inner_string = input_file.read()

        # Transform the user schema into a dict for processing
        with open(self.schema_path, 'r') as f:
            json_schema = json.loads(f.read())

        ignore_fields = [
            self.user_id_field_name, self.ingest_timestamp_field_name
        ]

        for item in json_schema["fields"]:
            if item["name"] not in ignore_fields:
                _process_inner_string_field(item)
                field_list.append(_process_select_string_field(item))

        # Join all components together to build the final query
        concat_select_string = ",\n".join(ignore_fields + field_list)
        concat_inner_string = ",\n".join(inner_string_list)
        full_string = outer_string.format(concat_select_string,
                                          self.user_id_field_name,
                                          self.ingest_timestamp_field_name,
                                          concat_inner_string, self.project_id,
                                          self.dataset_id,
                                          self.updates_table_id, '{0:s}')
        logging.info('{0:s} Created query for gathering updates:\n{1:s}'.format(
            str(datetime.datetime.now()), full_string))

        return full_string

    def create_merge_query(self):
        """Creates a query for merging updates.

        Utilized query templates and parses the schema in self.schema_path to
        create a customized query.

        Returns: The created query in string format.
        """

        def _determine_name(field, record_name):
            """Determines the name  of a field.

            Args:
                field(dict): Represents a field in the user schema.
                record_name(str): The name of the record that the field belongs
                    to if the field variable is a nested field. None if the
                    field is not a nested field.
            Returns: The name and alias of the field in string format.
            """
            if record_name:
                name = '{0:s}.{1:s}'.format(record_name, field['name'])

            else:
                name = field['name']
            return name

        def _process_inner_string_field(field, record_name=None):
            """Creates a list of strings to be used as the inner portion of the
                merge updates query by recursively processing fields and
                nested fields.

            Args:
                field(dict): Represents a field in the user schema.
                record_name(str): The name of the record that the field belongs
                    to if the field variable is a nested field. None if the
                    field is not a nested field.
            """
            if field['type'] == 'RECORD':
                for sub_field in field['fields']:
                    name = _determine_name(field, record_name)
                    _process_inner_string_field(sub_field, name)
            else:
                name = _determine_name(field, record_name)
                field_str = inner_string.format(name)
                inner_string_list.append(field_str)

        abs_path = os.path.abspath(os.path.dirname(__file__))
        outer_string_path = os.path.join(
            abs_path, '../query_templates/merge_updates_outer_string.txt')
        with open(outer_string_path, 'r') as input_file:
            outer_string = input_file.read()

        inner_string_list = []
        inner_string_path = os.path.join(
            abs_path, '../query_templates/merge_updates_inner_string.txt')

        with open(inner_string_path, 'r') as input_file:
            inner_string = input_file.read()

        json_file = open(self.schema_path)
        json_str = json_file.read()
        json_schema = json.loads(json_str)

        ignore_fields = [
            self.user_id_field_name, self.ingest_timestamp_field_name
        ]

        for item in json_schema["fields"]:
            if item["name"] not in ignore_fields:
                _process_inner_string_field(item)

        inner_string = ",\n".join(inner_string_list)

        full_string = outer_string.format(self.project_id, self.dataset_id,
                                          self.final_table_id,
                                          self.temp_updates_table_id,
                                          self.user_id_field_name,
                                          self.ingest_timestamp_field_name,
                                          inner_string)
        logging.info('{0:s} Created query for merging updates:\n{1:s}'.format(
            str(datetime.datetime.now()), full_string))
        return full_string
