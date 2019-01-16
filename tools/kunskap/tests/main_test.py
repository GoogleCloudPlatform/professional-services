# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Executes tests on functions created in main.py."""
import datetime
from string import Template
import unittest
import unittest.mock as mock
import config
import main
from unittest.mock import mock_open
import pytz
from google.cloud import bigquery


class MockQueryResult():
    """Class to create Mock Objects resembling query results."""

    def __init__(self, usage_date=None, partition_timestamp=None):
        self.usage_date = usage_date
        self.partition_timestamp = partition_timestamp


class TestMain(unittest.TestCase):
    """Class to test main.py functions."""

    def setUp(self):
        self.mocked_datastore = mock.Mock()
        self.mocked_bq = mock.Mock()


    def testGetUsageDates(self):
        """Tests that a list of usage dates is created from a mock query result."""
        mock_query_result = MockQueryResult(
            usage_date=datetime.datetime(2018, 3, 24, 0, 0, tzinfo=pytz.utc))
        self.mocked_bq().query().result.return_value = iter([mock_query_result])
        mocked_usage_dates = main.get_usage_dates(['2018-03-24 00:00:00'],
                                                  self.mocked_bq())
        expected_usage_dates = set(['2018-03-24'])
        self.mocked_bq().query().result.called
        self.assertEqual(expected_usage_dates, mocked_usage_dates)

    def testGetChangedPartitionsNoDate(self):
        """Tests that partitions are returned."""
        mock_query_result = MockQueryResult(
            partition_timestamp=datetime.datetime(2018, 3, 24, 0, 0,
                                                  tzinfo=pytz.utc))
        self.mocked_bq().query().result.return_value = iter([mock_query_result])
        mocked_partitions = main.get_changed_partitions(self.mocked_bq())
        expected_partitions = set(['2018-03-24 00:00:00'])
        self.mocked_bq().query().result.called
        self.assertEqual(expected_partitions, mocked_partitions)

    @mock.patch('builtins.open', new_callable=mock_open)
    def testCreateQueryString(self, mock_file):
        """Tests that creating a string from a SQL file executes on correct file."""
        main.create_query_string(config.sql_file_path)
        mock_file.assert_called_with(config.sql_file_path, 'r')

    def testExecuteTransformationQuery(self):
        """Tests that transformation query will execute."""
        mocked_dates = ['2018-03-24', '2018-03-23']
        mocked_table_list = [mock.Mock()]
        self.mocked_bq().list_tables.return_value = mocked_table_list
        main.execute_transformation_query(mocked_dates, self.mocked_bq())
        self.mocked_bq().query().result().called

    def testExecuteTransformationQueryWithNull(self):
        """Tests that query will not execute if there are no usage dates."""
        main.execute_transformation_query([], self.mocked_bq())
        self.mocked_bq().query.assert_not_called()

    def testPartitionsAndUsageDates(self):
        """Tests that the # of partitions is equal to the # of usage_start_times."""
        bq_client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()
        usage_query = Template('SELECT COUNT(DISTINCT(DATE(usage_start_time))) '
                               'AS cnt '
                               'FROM `$project.$output_dataset.$output_table`'
                              ).safe_substitute(
                                  project=config.billing_project_id,
                                  output_dataset=config.output_dataset_id,
                                  output_table=config.output_table_name)
        query_job = bq_client.query(usage_query, job_config=job_config)
        for row in query_job.result():
            output_result = row.cnt

        partition_query = Template('SELECT COUNT(DISTINCT(partition_id)) AS cnt '
                                   'FROM '
                                   '[$project.$output_dataset.'
                                   '$output_table$suffix] '
                                  ).safe_substitute(
                                      project=config.billing_project_id,
                                      output_dataset=config.output_dataset_id,
                                      output_table=config.output_table_name,
                                      suffix='$__PARTITIONS_SUMMARY__')
        job_config = bigquery.QueryJobConfig()
        job_config.use_legacy_sql = True
        query_job = bq_client.query(partition_query, job_config=job_config)
        for row in query_job.result():
            partition_result = row.cnt
        assert output_result == partition_result

    def tearDown(self):
        self.mocked_datastore.dispose()
        self.mocked_bq.dispose()


if __name__ == '__main__':
    unittest.main()
