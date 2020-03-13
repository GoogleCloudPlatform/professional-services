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
import logging

from google.cloud import bigquery

from updater_tools import user_schema


class BigQueryResourceUtil(object):
    """Util class for initializing BigQuery resources.

    Contains methods to create a dataset and user tables that must be created
    before the ingest and update process can start.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        project_id(str): Id of project holding BQ resources.
        dataset_id(str): Id of dataset holding Identity BQ user tables.
        updates_table_id(str): The ID of the historical table that holds
            all rows and updates for all users.
        temp_updates_table_id(str): ID of the intermediary temp table.
        final_table_id(str): The ID of table that holds one up-to-date row
            per user.

    """

    def __init__(self, project_id, dataset_id, updates_table_id,
                 temp_updates_table_id, final_table_id, schema_path):
        self.bq_client = bigquery.Client(project=project_id)
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        self.dataset = None
        self.updates_table_id = updates_table_id
        self.temp_updates_table_id = temp_updates_table_id
        self.final_table_id = final_table_id
        self.schema_path = schema_path

    def create_resources(self):
        """Creates dataset and all three user tables.
        """
        dataset = bigquery.Dataset(self.dataset_ref)
        self.dataset = self.bq_client.create_dataset(dataset)
        logging.info('{0:s} Created Dataset {1:s}'.format(
            str(datetime.datetime.now()), self.dataset_id))
        schema = user_schema.UserSchema(self.schema_path)
        user_tables_schema = schema.translate_json_schema()
        self.create_table(self.updates_table_id, user_tables_schema)
        self.create_table(self.temp_updates_table_id, user_tables_schema)
        self.create_table(self.final_table_id, user_tables_schema)

    def create_table(self, table_id, schema):
        """Creates a table in BigQuery.

        Args:
            table_id(str): Id of the table to be created.
            schema(List[google.cloud.bigquery.schema.SchemaField]): The
                schema of the table to be created in BigQuery format.

        Returns: The created table (google.cloud.bigquery.table.Table).
        """
        table_ref = self.dataset_ref.table(table_id)
        table = bigquery.Table(table_ref, schema=schema)
        created_table = self.bq_client.create_table(table)
        logging.info('{0:s} Created Table {1:s}'.format(
            str(datetime.datetime.now()), table_id))
        return created_table
