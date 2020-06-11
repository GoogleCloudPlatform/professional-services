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

import os

from bigquery_user_info_updater.updater_tools import query_creator


class TestQueryCreator(object):
    """Tests functionality of update_tools.QueryCreator.

    Attributes:
        dataset_id(str): ID of the dataset that holds the user tables.
        schema_path(str): Path to the user tables schema in JSON format.
        user_info_updates_id(str): The ID of the historical table that holds
            all rows and updates for all users.
        temp_user_info_updates_id(str): The ID of the temp table used as an
            intermediary for the update process.
        user_info_final_id(str): The ID of table that holds one up-to-date row
            per user.
        user_id_field_name(str): Name of the field that identifies unique users.
        ingest_timestamp_field_name(str): Name of the timestamp field that marks
            the ingestion.

    """

    def setup(self):
        """Sets up resources for tests.
        """
        self.dataset_id = 'user_updater_test'
        self.user_info_updates_id = 'test_user_info_updates'
        self.temp_user_info_updates_id = 'test_temp_user_info_updates'
        self.user_info_final_id = 'test_user_info_final'
        self.user_id_field_name = "userId"
        self.ingest_timestamp_field_name = "ingestTimestamp"

    @staticmethod
    def _write_query(query_path, query):
        with open(query_path, 'w') as output:
            output.write(query)

    def test_create_gather_updates_query(self, project_id):
        """Tests QueryCreator's ability to create a query to gather updates.

         Args:
             project_id(str): ID of the project that holds the test BQ tables.

         Returns:
             True if test passes, else False.
         """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        schema_path = os.path.join(abs_path, 'test_schemas/test_schema.json')
        test_query_creator = query_creator.QueryCreator(
            schema_path=schema_path,
            user_id_field_name=self.user_id_field_name,
            ingest_timestamp_field_name=self.ingest_timestamp_field_name,
            project_id=project_id,
            dataset_id=self.dataset_id,
            updates_table_id=self.user_info_updates_id,
            temp_updates_table_id=self.temp_user_info_updates_id,
            final_table_id=self.user_info_final_id)

        gather_updates_query = test_query_creator.create_gather_updates_query()
        abs_path = os.path.abspath(os.path.dirname(__file__))
        test_gather_updates_query_path = os.path.join(
            abs_path, 'test_queries/test_gather_updates_query.txt')
        with open(test_gather_updates_query_path, 'r') as input_file:
            expected_gather_updates_query = input_file.read().format(
                project_id, '{0:s}')
            print(project_id)
            print(type(expected_gather_updates_query))
        assert gather_updates_query == expected_gather_updates_query

    def test_nested_create_gather_updates_query(self, project_id):
        """Tests QueryCreator's ability to create a query with nested fields
            to gather updates.

         Args:
             project_id(str): ID of the project that holds the test BQ tables.

         Returns:
             True if test passes, else False.
         """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        schema_path = os.path.join(abs_path,
                                   'test_schemas/test_nested_schema.json')
        test_query_creator = query_creator.QueryCreator(
            schema_path=schema_path,
            user_id_field_name=self.user_id_field_name,
            ingest_timestamp_field_name=self.ingest_timestamp_field_name,
            project_id=project_id,
            dataset_id=self.dataset_id,
            updates_table_id=self.user_info_updates_id,
            temp_updates_table_id=self.temp_user_info_updates_id,
            final_table_id=self.user_info_final_id)

        gather_updates_query = test_query_creator.create_gather_updates_query()
        abs_path = os.path.abspath(os.path.dirname(__file__))
        test_gather_updates_query_path = os.path.join(
            abs_path, 'test_queries/test_nested_gather_updates_query.txt')
        with open(test_gather_updates_query_path, 'r') as input_file:
            expected_gather_updates_query = input_file.read().format(
                project_id, '{0:s}')
        assert gather_updates_query == expected_gather_updates_query

    def test_create_merge_query(self, project_id):
        """Tests QueryCreator's ability to create a query to merge updates.

        Args:
            project_id(str): ID of the project that holds the test BQ tables.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        schema_path = os.path.join(abs_path, 'test_schemas/test_schema.json')

        test_query_creator = query_creator.QueryCreator(
            schema_path=schema_path,
            user_id_field_name=self.user_id_field_name,
            ingest_timestamp_field_name=self.ingest_timestamp_field_name,
            project_id=project_id,
            dataset_id=self.dataset_id,
            updates_table_id=self.user_info_updates_id,
            temp_updates_table_id=self.temp_user_info_updates_id,
            final_table_id=self.user_info_final_id)

        merge_updates_query = test_query_creator.create_merge_query()
        self._write_query('merge.txt', merge_updates_query)
        abs_path = os.path.abspath(os.path.dirname(__file__))
        test_merge_updates_query_path = os.path.join(
            abs_path, 'test_queries/test_merge_updates_query.txt')
        with open(test_merge_updates_query_path, 'r') as input_file:
            expected_merge_updates_query = input_file.read().format(project_id)
        assert merge_updates_query == expected_merge_updates_query

    def test_nested_create_merge_updates_query(self, project_id):
        """Tests QueryCreator's ability to create a query with nested fields
            to merge updates.

         Args:
             project_id(str): ID of the project that holds the test BQ tables.

         Returns:
             True if test passes, else False.
         """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        schema_path = os.path.join(abs_path,
                                   'test_schemas/test_nested_schema.json')
        test_query_creator = query_creator.QueryCreator(
            schema_path=schema_path,
            user_id_field_name=self.user_id_field_name,
            ingest_timestamp_field_name=self.ingest_timestamp_field_name,
            project_id=project_id,
            dataset_id=self.dataset_id,
            updates_table_id=self.user_info_updates_id,
            temp_updates_table_id=self.temp_user_info_updates_id,
            final_table_id=self.user_info_final_id)

        merge_updates_query = test_query_creator.create_merge_query()
        with open('merge_nested.txt', 'w') as output:
            output.write(merge_updates_query)
        abs_path = os.path.abspath(os.path.dirname(__file__))
        test_merge_updates_query_path = os.path.join(
            abs_path, 'test_queries/test_nested_merge_updates_query.txt')
        with open(test_merge_updates_query_path, 'r') as input_file:
            expected_merge_updates_query = input_file.read().format(project_id)

        assert merge_updates_query == expected_merge_updates_query
