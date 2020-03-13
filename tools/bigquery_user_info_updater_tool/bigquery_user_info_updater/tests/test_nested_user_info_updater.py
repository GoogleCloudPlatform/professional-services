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

import json
import os
import pandas as pd

from google.api_core import exceptions
from google.cloud import bigquery

from bigquery_user_info_updater.updater_tools import query_creator
from bigquery_user_info_updater.updater_tools import user_info_updater
from bigquery_user_info_updater.updater_tools import user_schema


class TestNestedUserInfoUpdater(object):
    """Tests functionality of scripts.UserInfoUpdater.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        dataset_id(str): ID of the dataset that holds the test table.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the test table.
        dataset(google.cloud.bigquery.dataset.Dataset): Dataset that holds the
            test table.
        user_info_updates_id(str): The ID of the historical table that holds
            all rows and updates for all users.
        temp_user_info_updates_id(str): ID of the intermediary temp table.
        user_info_final_id(str): The ID of table that holds one up-to-date row
            per user.

    """

    def setup(self):
        """Sets up resources for tests.
        """
        self.bq_client = bigquery.Client()
        self.dataset_id = 'user_updater_test'
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        try:
            self.dataset = self.bq_client.get_dataset(self.dataset_ref)
        except exceptions.NotFound:
            dataset = bigquery.Dataset(self.dataset_ref)
            self.dataset = self.bq_client.create_dataset(dataset)
        schema_path = 'test_schemas/test_nested_schema.json'
        abs_path = os.path.abspath(os.path.dirname(__file__))
        self.schema_path = os.path.join(abs_path, schema_path)
        schema = user_schema.UserSchema(self.schema_path)
        self.bq_schema = schema.translate_json_schema()
        self.user_info_updates_id = 'test_nested_user_info_updates'
        self.user_info_updates_table = self.create_table(
            self.user_info_updates_id)
        self.temp_user_info_updates_id = 'test_nested_temp_user_info_updates'
        self.temp_user_info_updates_table = self.create_table(
            self.temp_user_info_updates_id)
        self.user_info_final_id = 'test_nested_user_info_final'
        self.user_info_final_table = self.create_table(self.user_info_final_id)

    def create_table(self, table_id):
        """Creates test user tables.

         Args:
             table_id(str): ID of the user table to be created.

         Returns:
             The created table (google.cloud.bigquery.table.Table).
         """
        table_ref = self.dataset_ref.table(table_id)
        table = bigquery.Table(table_ref, schema=self.bq_schema)
        try:
            self.bq_client.delete_table(table)
            return self.bq_client.create_table(table)
        except exceptions.NotFound:
            return self.bq_client.create_table(table)

    def load_json_to_bq(self, filename, table):
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON

        abs_path = os.path.abspath(os.path.dirname(__file__))
        data_file = os.path.join(abs_path, filename)
        with open(data_file, 'rb') as file_obj:
            load_job = self.bq_client.load_table_from_file(
                file_obj=file_obj, destination=table, job_config=job_config)
        return load_job.result()

    def test_nested_data_user_update(self, project_id):
        """Tests UserInfoUpdater ability to run an update on nested user data.

         Args:
             project_id(str): ID of the project that holds the test BQ tables.

         Returns:
             True if test passes, else False.
         """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        # Load a set of user updates to nested user_info_updates table.

        self.load_json_to_bq(
            filename='test_data/nested_data/user_info_updates_data.json',
            table=self.dataset_ref.table(self.user_info_updates_id))

        # Load data into the temp table and final table to simulate a previous
        #  run.
        self.load_json_to_bq(filename='test_data/nested_data/'
                             'temp_user_info_updates_initial.json',
                             table=self.dataset_ref.table(
                                 self.temp_user_info_updates_id))
        self.load_json_to_bq(
            filename='test_data/nested_data/user_info_final_initial.json',
            table=self.dataset_ref.table(self.user_info_final_id))

        # Run the UserInfoUpdater on the second set of updates.
        test_updater = user_info_updater.UserInfoUpdater(
            project_id, self.dataset_id, self.user_info_updates_id,
            self.temp_user_info_updates_id, self.user_info_final_id)
        update_query_creator = query_creator.QueryCreator(
            schema_path=self.schema_path,
            user_id_field_name='userId',
            ingest_timestamp_field_name='ingestTimestamp',
            project_id=project_id,
            dataset_id=self.dataset_id,
            updates_table_id=self.user_info_updates_id,
            temp_updates_table_id=self.temp_user_info_updates_id,
            final_table_id=self.user_info_final_id)

        gather_updates_query = update_query_creator.create_gather_updates_query(
        )
        test_updater.gather_updates(gather_updates_query)
        merge_udpates_query = update_query_creator.create_merge_query()
        test_updater.merge_updates(merge_udpates_query)

        # Query the temp table to test that the gather_updates() function worked
        temp_table_query_config = bigquery.QueryJobConfig()
        temp_table_query_config.use_legacy_sql = False
        temp_table_query = self.bq_client.query(
            query='SELECT * FROM `{0:s}.{1:s}.{2:s}`'.format(
                project_id, self.dataset_id, self.temp_user_info_updates_id),
            job_config=temp_table_query_config,
            location='US')
        temp_table_query.result()
        temp_table_results_df = temp_table_query.to_dataframe() \
            .sort_values(by=['userId']).reset_index(drop=True)

        # Gather expected results for comparison
        abs_path = os.path.abspath(os.path.dirname(__file__))
        expected_temp_data_file = os.path.join(
            abs_path,
            'test_data/nested_data/temp_user_info_updates_expected.json')
        expected_temp_table_df = pd.read_json(expected_temp_data_file)
        # Reorder columns since read_json() reads them alphabetically
        with open(self.schema_path, 'r') as f:
            json_schema = json.loads(f.read())
        col_list = [str(col['name']) for col in json_schema['fields']]
        expected_temp_table_df = expected_temp_table_df[col_list]

        # convert ingestTimestamp to datetime
        expected_temp_table_df['ingestTimestamp'] = pd.to_datetime(
            expected_temp_table_df['ingestTimestamp'])

        # Compare results
        pd.testing.assert_frame_equal(temp_table_results_df,
                                      expected_temp_table_df)

        # Query the final table to test that the merge_updates() function worked
        final_table_query_config = bigquery.QueryJobConfig()
        final_table_query_config.use_legacy_sql = False
        final_table_query = self.bq_client.query(
            query='SELECT * FROM `{0:s}.{1:s}.{2:s}`'.format(
                project_id, self.dataset_id, self.user_info_final_id),
            job_config=final_table_query_config,
            location='US')
        final_table_query.result()
        final_table_results_df = final_table_query.to_dataframe() \
            .sort_values(by=['userId']).reset_index(drop=True)
        # Gather expected results for comparison
        expected_final_data_file = os.path.join(
            abs_path, 'test_data/nested_data/user_info_final_expected.json')
        expected_final_table_df = pd.read_json(expected_final_data_file)

        # Reorder columns since read_json() reads them alphabetically
        with open(self.schema_path, 'r') as f:
            json_schema = json.loads(f.read())
        col_list = [str(col['name']) for col in json_schema['fields']]
        expected_final_table_df = expected_final_table_df[col_list]

        # convert ingestTimestamp to datetime
        expected_final_table_df['ingestTimestamp'] = pd.to_datetime(
            expected_final_table_df['ingestTimestamp'])

        # Compare results
        pd.testing.assert_frame_equal(final_table_results_df,
                                      expected_final_table_df)

    def teardown(self):
        """Deletes any resources used by tests.
        """
        self.bq_client.delete_dataset(self.dataset_ref, delete_contents=True)
