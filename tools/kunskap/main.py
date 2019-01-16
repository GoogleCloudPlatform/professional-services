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


def get_usage_dates(partition_ids, bq_client):
    """Queries for each usage date that is stored within a partition.
    Args:
        partition_ids: List of timestamp strings denoting partition times.
        bq_client: Object representing a reference to a BigQuery Client
    Returns:
         List of strings representing dates
    """
    job_config = bigquery.QueryJobConfig()
    sql = Template(
        'SELECT distinct(TIMESTAMP_TRUNC(usage_start_time, DAY, "UTC")) '
        'AS usage_date, _PARTITIONTIME as pt '
        'FROM `$project_id.$dataset.$billing_table` '
        'WHERE _PARTITIONTIME IN ("$partitions") '
        'GROUP BY pt, usage_start_time;'
    ).substitute(project_id=config.billing_project_id,
                 dataset=config.billing_dataset_id,
                 billing_table=config.billing_table_name,
                 partitions='","'.join(partition_ids))
    query_job = bq_client.query(sql, job_config=job_config)
    date_list = []
    for row in query_job.result():
        date_list.append(row.usage_date.strftime('%Y-%m-%d'))
    return set(date_list)


def get_changed_partitions(bq_client):
    """Queries bigquery table to return partitions that have been updated.
    Args:
        bq_client: Object representing a reference to a BigQuery Client
     Returns:
        List of timestamp strings representing partition ids
    """
    job_config = bigquery.QueryJobConfig()
    # Obtaining partitions metadeta via the client API requires legacy SQL
    job_config.use_legacy_sql = True
    sql = Template(
        'SELECT TIMESTAMP(partition_id) AS partition_timestamp '
        'FROM [$project_id:$dataset.$billing_table$suffix] '
    ).substitute(project_id=config.billing_project_id,
                 dataset=config.billing_dataset_id,
                 billing_table=config.billing_table_name,
                 suffix='$__PARTITIONS_SUMMARY__')

    query_job = bq_client.query(sql, job_config=job_config)
    updated_partitions = []
    for row in query_job.result():
        updated_partitions.append(row.partition_timestamp.strftime(
            '%Y-%m-%d %H:%M:%S'))
    return set(updated_partitions)


def create_query_string(sql_path):
    """Converts a SQL file holding a SQL query to a string.
    Args:
        sql_path: String in the form of a file path
    Returns:
        String representation of a file
    """
    with open(sql_path, 'r') as sql_file:
        lines = sql_file.read()
    return lines


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
        job_config = bigquery.QueryJobConfig()
        job_config.destination = table_ref
        job_config.write_disposition = bigquery.WriteDisposition().WRITE_TRUNCATE
        job_config.time_partitioning = bigquery.TimePartitioning(
            field='usage_start_time',
            expiration_ms=None)
        sql = Template(create_query_string(config.sql_file_path))
        log_message = Template('Attempting query on usage from dates $date')
        sql = sql.safe_substitute(billing_table=config.billing_project_id +
                                  '.' + config.billing_dataset_id +
                                  '.' + config.billing_table_name,
                                  modified_usage_start_time_list='","'.join(
                                      date_list),
                                  allocation_method=config.allocation_method
                                 )

        logging.info(log_message.safe_substitute(date=date_list))
        # Execute Query
        query_job = bq_client.query(
            sql,
            job_config=job_config)

        query_job.result()  # Waits for the query to finish
        log_message = Template('Transformation query complete. Partitions from '
                               'dates $date have been updated.')
        logging.info(log_message.safe_substitute(date=date_list))

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

    try:
        current_time = datetime.datetime.utcnow()
        log_message = Template('Daily Cloud Function was triggered on $time')
        logging.info(log_message.safe_substitute(time=current_time))
        partitions_to_update = get_changed_partitions(bq_client)


        # Verify that partitions have changed/require transformation
        if partitions_to_update:
            dates_to_update = get_usage_dates(partitions_to_update, bq_client)

            try:
                execute_transformation_query(dates_to_update, bq_client)

            except Exception as error:
                log_message = Template('Transformation query failed due to '
                                       '$message.')
                logging.error(log_message.safe_substitute(message=error))

    except Exception as error:
        log_message = Template('$error').substitute(error=error)
        logging.error(log_message)

if __name__ == '__main__':
    main('data', 'context')
