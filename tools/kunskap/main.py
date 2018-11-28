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

"""Function called by PubSub trigger to execute  cron jon tasks."""
import datetime
import logging
from string import Template
import config
from google.cloud import bigquery
from google.cloud import datastore
from google.cloud.exceptions import NotFound


def store_query_timestamp(current_time, datastore_client):
  """Creates a datastore entity object to store the current time.

  Args:
      current_time: datetime object representing current time
      datastore_client: Object representing a reference to a Datastore client

  """
  try:
    time_as_string = current_time.strftime('%Y-%m-%d %H:%M:%S')
    key = datastore_client.key('QueryData', time_as_string)
    date_entity = datastore.Entity(key=key)
    date_entity.update({
        'time_queried': time_as_string
    })
    datastore_client.put(date_entity)
  except Exception:
    log_message = Template('Storing current time: $time failed')
    logging.error(log_message.safe_substitute(time=current_time))


def get_last_query_time(datastore_client):
  """Queries Datastore to fetch the last time a transformation query was executed.

  Args:
    datastore_client: Object representing a reference to a Datastore client

  Returns:
    String representing UTC-time or None
  """
  date_query = datastore_client.query(kind='QueryData')
  date_query.order = ['-time_queried']
  query_results = list(date_query.fetch())
  if query_results:
    return query_results[0]['time_queried']
  else:
    return None


def get_usage_dates(partition_ids, bq_client):
  """Queries for each usage date that is stored within a partition.

  Args:
    partition_ids: List of timestamp strings denoting partition ingestion times.
    bq_client: Object representing a reference to a BigQuery Client

  Returns:
     List of strings representing dates
  """
  job_config = bigquery.QueryJobConfig()
  sql = Template(
      'SELECT distinct(TIMESTAMP_TRUNC(usage_start_time, DAY, "UTC")) '
      'AS usage_date, _PARTITIONTIME as pt '
      'FROM `' + '$dataset.$billing_table' + '` '
      'WHERE _PARTITIONTIME IN ("$partitions") '
      'GROUP BY pt, usage_start_time;'
  ).substitute(dataset=config.billing_dataset_id,
               billing_table=config.billing_table_name,
               partitions='","'.join(partition_ids))
  query_job = bq_client.query(sql, job_config=job_config)
  date_list = []
  for row in query_job.result():
    date_list.append(row.usage_date.strftime('%Y-%m-%d'))
  return set(date_list)


def get_changed_partitions(bq_client, last_query_time):
  """Queries bigquery table to return partitions that have been updated.

  Args:
    bq_client: Object representing a reference to a BigQuery Client
    last_query_time: String representing UTC-time or None

  Returns:
    List of timestamp strings representing partition ids
  """
  job_config = bigquery.QueryJobConfig()
  # Obtaining partitions metadeta via the client API requires legacy SQL
  job_config.use_legacy_sql = True

  if last_query_time:
    sql = Template(
        'SELECT TIMESTAMP(partition_id) AS partition_timestamp '
        'FROM [$dataset.$billing_table$suffix] '
        'WHERE FORMAT_UTC_USEC(last_modified_time * 1000) > "$time";'
    ).substitute(dataset=config.billing_dataset_id,
                 billing_table=config.billing_table_name,
                 suffix='$__PARTITIONS_SUMMARY__',
                 time=last_query_time)
  # This is the first time that a query has been executed.
  else:
    sql = Template(
        'SELECT TIMESTAMP(partition_id) AS partition_timestamp '
        'FROM [$dataset.$billing_table$suffix] '
    ).substitute(dataset=config.billing_dataset_id,
                 billing_table=config.billing_table_name,
                 suffix='$__PARTITIONS_SUMMARY__')

  query_job = bq_client.query(sql, job_config=job_config)
  updated_partitions = []
  for row in query_job.result():
    updated_partitions.append(row.partition_timestamp.strftime('%Y-%m-%d %H:%M:%S'))
  return set(updated_partitions)


def create_query_string(sql_path):
  """Converts a SQL file holding a SQL query to a string.

  Args:
    sql_path: String in the form of a file path

  Returns:
    String representation of a file
  """
  with open(sql_path, 'r') as file:
    lines = file.read()
  return lines


def partition_exists(bq_client, table_name):
  """Verifies that the partition exists in the output table

  Args:
    bq_client: Object representing a reference to a BigQuery Client
    table_name: String representing a table name

  Returns:
    True if the partition exists
    False if the partition does not exist
  """
  try:
    bq_client.get_table(table_name)
    return True
  except NotFound:
    return False


def delete_partitions(partition_list, bq_client):
  """Deletes changed partitions from dataset to overwrite with new data.

  Args:
    partition_list: List of strings representing datetime objects.
    bq_client: Object representing a reference to a BigQuery Client

  """
  for partition in partition_list:
    partition_name = partition.replace('-', '')
    table_name = Template('$project.$output_dataset_id.$output_table_name$partition').safe_substitute(
        project=config.billing_project_id,
        output_dataset_id=config.output_dataset_id,
        output_table_name=config.output_table_name,
        partition='$' + partition_name
    )
    # Only delete the partition if it exists
    if partition_exists(bq_client, table_name):
      bq_client.delete_table(table_name)


def execute_transformation_query(date_list, bq_client):
  """Executes transformation query to a new destination table.

  Args:
    date_list: List of strings representing datetime objects
    bq_client: Object representing a reference to a BigQuery Client
  """
  if date_list:
    dataset_ref = bq_client.get_dataset(bigquery.DatasetReference(
        project=config.billing_project_id,
        dataset_id=config.output_dataset_id))
    table_ref = dataset_ref.table(config.output_table_name)
    table_list = [table.full_table_id for table in list(
        bq_client.list_tables(dataset_ref))]
    if table_ref in table_list:
      delete_partitions(date_list, bq_client)

    job_config = bigquery.QueryJobConfig()
    job_config.destination = table_ref
    job_config.write_disposition = bigquery.WriteDisposition().WRITE_APPEND
    job_config.time_partitioning = bigquery.TimePartitioning(field='usage_start_time',
                                                             expiration_ms=None)
    sql = Template(create_query_string(config.sql_file_path))
    try:
      log_message = Template('Attempting query on usage from dates $date')
      sql = sql.safe_substitute(BILLING_TABLE=config.billing_dataset_id + '.' + config.billing_table_name,
                                modified_usage_start_time_list='","'.join(date_list))
      logging.info(log_message.safe_substitute(date=date_list))
      # Execute Query
      query_job = bq_client.query(
          sql,
          job_config=job_config)

      query_job.result()  # Waits for the query to finish
      log_message = Template('Transformation query complete. Partitions from '
                             'dates $date have been updated.')
      logging.info(log_message.safe_substitute(date=date_list))
    except Exception as e:
      log_message = Template('Transformation query failed due to $message.')
      logging.error(log_message.safe_substitute(message=e))

  else:
    log_message = Template('There are no usage dates for this partition -- '
                           'so the transformation query will not execute.')
    logging.info(log_message)


def main(data, context):
  """Triggered from a message on a Cloud Pub/Sub topic.

  Args:
    data (dict): Event payload.
    context (google.cloud.functions.Context): Metadata for the event.
  """
  bq_client = bigquery.Client()
  datastore_client = datastore.Client()

  try:
    current_time = datetime.datetime.utcnow()
    log_message = Template('Daily Cloud Function was triggered on $time')
    logging.info(log_message.safe_substitute(time=current_time))
    partitions_to_update = get_changed_partitions(bq_client,
                                                  get_last_query_time(datastore_client))

    # Verify that partitions have changed/require transformation
    if partitions_to_update:
      dates_to_update = get_usage_dates(partitions_to_update, bq_client)
      execute_transformation_query(dates_to_update, bq_client)
      store_query_timestamp(current_time, datastore_client)

  except Exception as e:
    log_message = Template('$error').substitute(error=e)
    logging.error(log_message)

if __name__ == '__main__':
  main('data', 'context')
