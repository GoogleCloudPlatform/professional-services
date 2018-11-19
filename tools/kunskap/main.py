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

bq_client = bigquery.Client()
datastore_client = datastore.Client()


def store_query_timestamp(current_time):
  """Creates a datastore entity object to record current time.

  Args:
      current_time: datetime object representing current time

  """
  time_as_string = current_time.strftime('%Y-%m-%d %H:%M:%S')
  key = datastore_client.key('QueryData', time_as_string)
  date_entity = datastore.Entity(key=key)
  date_entity.update({
      'time_queried': time_as_string
  })
  datastore_client.put(date_entity)


def get_last_query_time():
  """Creates query to datastore to fetch the last time a query was executed.

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


def get_usage_dates(partition_ids):
  """Queries for each usage date that is stored within a partition.

  Args:
    partition_ids: List of timestamp strings denoting partition ingestion times.

  Returns:
     List of dates
  """
  job_config = bigquery.QueryJobConfig()
  sql = Template(
      'SELECT distinct(TIMESTAMP_TRUNC(usage_start_time, DAY, "UTC")) '
      'AS usage_date, _PARTITIONTIME as pt '
      'FROM `' + '$dataset.$billing_table' + '` '
      'WHERE _PARTITIONTIME IN ("$partitions") '
      'GROUP BY pt, usage_start_time;'
  ).substitute(dataset=config.dataset_id,
               billing_table=config.billing_table_name,
               partitions='","'.join(partition_ids))
  query_job = bq_client.query(sql, job_config=job_config)
  date_list = []
  for row in query_job.result():
    date_list.append(row.usage_date.strftime('%Y-%m-%d %H:%M:%S'))
  return date_list


def get_changed_partitions():
  """Queries bigquery table to return partitions that have been updated.

  Returns:
    List of timestamp strings representing partition ids
  """
  last_query_time = get_last_query_time()
  job_config = bigquery.QueryJobConfig()
  # Obtaining partitions metadeta via the client API requires legacy SQL
  job_config.use_legacy_sql = True

  if last_query_time:
    sql = Template(
        'SELECT TIMESTAMP(partition_id) AS partition_timestamp '
        'FROM [$dataset.$billing_table$suffix] '
        'WHERE FORMAT_UTC_USEC(last_modified_time * 1000) > "$time";'
    ).substitute(dataset=config.dataset_id,
                 billing_table=config.billing_table_name,
                 suffix='$__PARTITIONS_SUMMARY__',
                 time=last_query_time)

    query_job = bq_client.query(sql, job_config=job_config)
    updated_partitions = []
    for row in query_job.result():
      updated_partitions.append(row.partition_timestamp.strftime('%Y-%m-%d %H:%M:%S'))
    return updated_partitions
  else:
    return None


def create_query_string(sql_path):
  """Converts file holding SQL query to a string.

  Args:
    sql_path: String in form of file path

  Returns:
    String representation of file
  """
  with open(sql_path, 'r') as file:
    lines = file.read()
  return lines


def execute_transformation_query(date):
  """Executes transformation query to a new destination table.

  Args:
    date: Strings representing a datetime object
  """
  # Set the destination table
  table_ref = bq_client.dataset(config.dataset_id).table(config.output_table_name)
  table_ref.time_partitioning = bigquery.TimePartitioning(field='usage_start_time')
  job_config = bigquery.QueryJobConfig()
  job_config.destination = table_ref
  job_config.write_disposition = bigquery.WriteDisposition().WRITE_APPEND
  job_config.time_partitioning = bigquery.TimePartitioning(field='usage_start_time')
  sql = Template(create_query_string(config.sql_file_path))
  try:
    #for date in dates_to_update:
    log_message = Template('Attempting query on usages from date $date')
    sql = sql.safe_substitute(BILLING_TABLE=config.dataset_id + '.' + config.billing_table_name,
                              modified_usage_start_time=date)
    logging.info(log_message.safe_substitute(date=date))
    # Execute Query
    query_job = bq_client.query(
        sql,
        job_config=job_config)

    query_job.result()  # Waits for the query to finish
    log_message = Template('Transformation query complete. Partitions from date '
                           '$date has been updated.')
    logging.info(log_message.safe_substitute(date=date))
  except Exception as e:
    log_message = Template('Transformation query failed due to $message.')
    logging.error(log_message.safe_substitute(message=e))


def main(data, context):
  """Triggered from a message on a Cloud Pub/Sub topic.

  Args:
    data (dict): Event payload.
    context (google.cloud.functions.Context): Metadata for the event.
  """
  try:
    current_time = datetime.datetime.utcnow()
    log_message = Template('Daily Cloud Function was triggered on $time')
    logging.info(log_message.safe_substitute(time=current_time))
    partitions_to_update = get_changed_partitions()

    # Verify that partitions have changed/require transformation
    if partitions_to_update:
      dates_to_update = get_usage_dates(partitions_to_update)
      for date in dates_to_update:
        execute_transformation_query(date)
      store_query_timestamp(current_time)

  except Exception as e:
    log_message = Template('$error').substitute(error=e.message)
    logging.error(log_message)

if __name__ == '__main__':
  main('data', 'context')
