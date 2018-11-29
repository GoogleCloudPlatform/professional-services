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
import unittest
from unittest import mock
import config
import main
from string import Template
from mock import mock_open
import pytz
from google.cloud import bigquery
from google.cloud.exceptions import NotFound


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

  def testStoreQueryTimestamp(self):
    """Tests ability to create a datetime entity in Datastore."""
    mocked_time = datetime.datetime(2018, 11, 25, 0, 0, 0, tzinfo=pytz.utc)
    main.store_query_timestamp(mocked_time, self.mocked_datastore())
    self.mocked_datastore().put.called

  def testStoreQueryTimestampWithNoData(self):
    """Tests that Datastore will not store an entity if the time is null."""
    main.store_query_timestamp(None, self.mocked_datastore)
    self.mocked_datastore.assert_not_called()
    self.assertRaises(Exception)

  def testGetLastQueryTime(self):
    """Tests retrieval of most recent Datastore entity with mocked result."""
    mocked_query_times = [
        {'time_queried': '2018-03-24 00:00:00'},
        {'time_queried': '2018-03-23 00:00:00'},
        {'time_queried': '2018-03-22 00:00:00'}
    ]
    self.mocked_datastore().query().fetch.return_value = iter(
        mocked_query_times)
    last_time = main.get_last_query_time(self.mocked_datastore())
    self.mocked_datastore().query().fetch.called
    self.assertEqual(last_time, '2018-03-24 00:00:00')

  def testGetLastQueryTimeWithNoData(self):
    """Tests that Datastore returns None if it fetches an empty result."""
    self.mocked_datastore().query().fetch.return_value = iter([])
    last_time = main.get_last_query_time(self.mocked_datastore())
    self.mocked_datastore().query().fetch.called
    self.assertEqual(last_time, None)

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

  def testGetChangedPartitionsWithDate(self):
    """Tests that list is created if query has been executed in past."""
    mock_query_result = MockQueryResult(
        partition_timestamp=datetime.datetime(2018, 3, 24, 0, 0,
                                              tzinfo=pytz.utc))
    self.mocked_bq().query().result.return_value = iter([mock_query_result])
    mocked_partitions = main.get_changed_partitions(self.mocked_bq(),
                                                    '2018-03-23 00:00:00')
    expected_partitions = set(['2018-03-24 00:00:00'])
    self.mocked_bq().query().result.called
    self.assertEqual(expected_partitions, mocked_partitions)

  def testGetChangedPartitionsNoDate(self):
    """Tests that partitions are returned if first time running a query."""
    mock_query_result = MockQueryResult(
        partition_timestamp=datetime.datetime(2018, 3, 24, 0, 0,
                                              tzinfo=pytz.utc))
    self.mocked_bq().query().result.return_value = iter([mock_query_result])
    mocked_partitions = main.get_changed_partitions(self.mocked_bq(), None)
    expected_partitions = set(['2018-03-24 00:00:00'])
    self.mocked_bq().query().result.called
    self.assertEqual(expected_partitions, mocked_partitions)

  @mock.patch('builtins.open', new_callable=mock_open)
  def testCreateQueryString(self, mock_file):
    """Tests that creating a string from a SQL file executes on correct file."""
    main.create_query_string(config.sql_file_path)
    mock_file.assert_called_with(config.sql_file_path, 'r')

  def testPartitionExistsUsesTableName(self):
    """Tests that get_table is called with given table name."""
    mocked_table_name = 'dummy_table'
    main.partition_exists(self.mocked_bq(), mocked_table_name)
    self.mocked_bq().get_table.assert_called_with(mocked_table_name)

  def testPartitionExistsRaisesError(self):
    """Tests that error is raised/False returned if given fake table name."""
    mocked_table_name = 'project.dataset.table'
    bq_client = bigquery.Client()
    return_val = main.partition_exists(bq_client, mocked_table_name)
    self.assertRaises(NotFound)
    self.assertEqual(return_val, False)

  def testDeletePartitionWithoutData(self):
    """Tests that partitions are not deleted when given blank list."""
    mocked_partition_list = []
    main.delete_partitions(mocked_partition_list, self.mocked_bq())
    self.mocked_bq().delete_table.assert_not_called()

  def testStringReplacement(self):
    """Tests that partition string is correct format."""
    mock_partition_date = ['2018-11-18']
    main.delete_partitions(mock_partition_date, self.mocked_bq())
    self.mocked_bq().delete_table.called
    mocked_table_name = Template(
        '$project.$output_dataset.$table$suffix').safe_substitute(
        project=config.billing_project_id,
        output_dataset=config.output_dataset_id,
        table=config.output_table_name,
        suffix='$' + mock_partition_date[0].replace('-','')
    )
    self.mocked_bq().delete_table.assert_called_with(mocked_table_name)

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
                               '[$project.$output_dataset.$output_table$suffix] '
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
