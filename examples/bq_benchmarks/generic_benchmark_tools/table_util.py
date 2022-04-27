# Copyright 2018 Google Inc.
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

from collections import Counter
import json
import logging

from google.cloud import bigquery

BYTES_IN_MB = 10**6


class TableUtil(object):
    """Assists with BigQuery table interaction.

    Contains methods for creating the table, getting/setting table properties,
    and creating table schemas.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        num_columns(int): Number of columns in the BigQuery table.
        num_rows(int): Number of rows in the BigQuery table.
        column_types(str): Representation of the types of columns in the
            benchmark table(50_STRING_50_NUMERIC, 100_STRING, etc).
        table_size(int): Size of the BigQuery table in bytes.
        table_id(str): The name of the table.
        dataset_id(str): ID of the dataset that holds the table.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the table.
        table_ref(google.cloud.bigquery.table.TableReference): Pointer to
            the table in BigQuery.
        table(google.cloud.bigquery.table.Table): The actual table in
            BigQuery.
        bq_schema(List[google.cloud.bigquery.schema.SchemaField]): Schema of
            the table in BigQuery format. This is an optional parameter
            that can be added if the schema is already known when creating
            the TableUtil instance.
        json_schema_filename(str): Path to a json file containing a table
            schema in json format. This is an optional parameter that can be
            passed if the schema if the bq_schema is not already known.

    """

    def __init__(
            self,
            table_id,
            dataset_id,
            bq_schema=None,
            json_schema_filename=None,
            project=None,
    ):
        self.bq_client = bigquery.Client(project=project)
        self.num_columns = None
        self.num_rows = None
        self.column_types = None
        self.table_size = None
        self.size_in_mb = None
        self.table_id = table_id
        self.dataset_id = dataset_id
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        self.table_ref = self.dataset_ref.table(self.table_id)
        if self.check_if_table_exists():
            self.table = self.bq_client.get_table(self.table_ref)

        else:
            self.table = None
        self.bq_schema = bq_schema
        self.json_schema_filename = json_schema_filename
        # If a json_schema_filename is passed and a bq_schema is not passed,
        # use the json_schema_filename to generate a bq_schema.
        if self.json_schema_filename and not self.bq_schema:
            self.bq_schema = self.get_bq_translated_schema()
        # If both a bq_schema and a json_schema_filename are passed, use the
        # bq_schema for self.bq_schema, and notify the user that the json
        # schema will not be used.
        if bq_schema and json_schema_filename:
            logging.warn('Both a bigquery schema and a json schema were '
                         'provided when creating a TableUtil instance for '
                         'table {0:s}. The bigquery schema will be '
                         'used.'.format(self.table_id))

    def check_if_table_exists(self):
        """Checks if a table exists in self.dataset_ref.

        Returns:
            True if table does exist in self.dataset_ref, else False.
        """
        if self.table_id in [
                table.table_id
                for table in (self.bq_client.list_tables(self.dataset_ref))
        ]:
            exists = True
        else:
            exists = False
        return exists

    def get_bq_translated_schema(self):
        """Translates a schema in json format into BigQuery format.

        Returns:
            A BigQuery schema in List[google.cloud.bigquery.schema.SchemaField]
            format.
        """

        def _process_field(field):
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
                fields = []
                for sub_field in field['fields']:
                    fields.append(_process_field(sub_field))
                return bigquery.SchemaField(field['name'], field['type'],
                                            field['mode'], field['description'],
                                            tuple(fields))
            else:
                return bigquery.SchemaField(field['name'], field['type'],
                                            field['mode'], field['description'])

        schema = []
        with open(self.json_schema_filename, 'r') as json_file:
            json_str = json_file.read()
            json_schema = json.loads(json_str)

        for item in json_schema['fields']:
            schema.append(_process_field(item))

        return schema

    def create_table(self):
        """Creates the table in BigQuery.
        """
        self.table = bigquery.Table(self.table_ref, self.bq_schema)
        self.table = self.bq_client.create_table(self.table)
        logging.info('Created new table: {0:s}'.format(self.table.table_id))

    def set_table_properties(self):
        """Sets properties for the table.

        Uses self.table to obtain useful table properties.
        """
        self.table = self.bq_client.get_table(self.table_ref)
        self.num_columns = len(self.table.schema)
        self.num_rows = self.table.num_rows
        self.table_size = self.table.num_bytes
        self.column_types = self.get_column_types()
        self.size_in_mb = self.table.num_bytes / BYTES_IN_MB

    def get_column_types(self):
        """Generates a parameter for column types using the table schema.

        Returns:
            A column types parameter in string format (for example '100_STRING'
            or 50_STRING_50_NUMERIC).
        """

        schema = self.table.schema
        field_types = [field.field_type for field in schema]
        field_type_counts = Counter(field_types)

        column_types = ''
        counter = 1
        for field_type in field_type_counts:
            percent = (
                (field_type_counts[field_type] / float(self.num_columns)) * 100)
            column_types = column_types + '{0:.0f}_{1:s}'.format(
                percent,
                field_type,
            )
            if counter < len(field_type_counts):
                column_types = column_types + '_'
            counter += 1

        return column_types
