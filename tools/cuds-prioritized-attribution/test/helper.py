# Copyright 2020 Google LLC
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

from jinja2 import Environment, FileSystemLoader
from google.cloud import bigquery
import os
import json
import sys
import datetime
import logging
sys.path.append('..')
from composer.dependencies import commitment_intervals
from composer.dependencies import commitments_schema
from composer.dependencies import helper_function
from composer.dependencies import (commitment_intervals,
                                    commitments_schema, helper_function)
SQL_LOCATION = '../composer/dependencies'
BILLING_OUTPUT_SQL = 'billingoutput.sql'
DISTRIBUTE_COMMIT_SQL = 'distribute_commitment.sql'
PROJECT_LABEL_CREDIT_SQL = 'project_label_credit_data.sql'

def render_template(template_path, params):
    file_loader = FileSystemLoader(SQL_LOCATION)
    env = Environment(loader=file_loader)
    template = env.get_template(template_path)
    return template.render(params=params)


def execute_query(bq_client: bigquery.Client, env_vars: {}, query_path: object,
                  output_table_name: str, time_partition: bool) -> None:
    """Executes transformation query to a new destination table.
    Args:
        bq_client: bigquery.Client object
        env_vars: Dictionary of key: value, where value is environment variable
        query_path: Object representing location of SQL query to execute
        output_table_name: String representing name of table that holds output
        time_partition: Boolean indicating whether to time-partition output
    """
    dataset_ref = bq_client.get_dataset(
        bigquery.DatasetReference(project=bq_client.project,
                                  dataset_id=env_vars['corrected_dataset_id']))
    table_ref = dataset_ref.table(output_table_name)
    job_config = bigquery.QueryJobConfig()
    job_config.destination = table_ref
    job_config.write_disposition = bigquery.WriteDisposition().WRITE_TRUNCATE

    # Time Partitioning table is only needed for final output query
    if time_partition:
        job_config.time_partitioning = bigquery.TimePartitioning(
            field='usage_start_time', expiration_ms=None)
    logging.info('Attempting query...')
    # Execute Query
    query_job = bq_client.query(query=render_template(query_path, env_vars), job_config=job_config)

    query_job.result()  # Waits for the query to finish


def project_label_credit(bq_client: bigquery.Client, env_vars: {}) -> None:
    """Executes first query to break out lines into project and credits.
    Args:
        bq_client: bigquery.Client object
        env_vars: Dictionary of string key-value pairs of environment vars.
    Returns:
            None
    """
    execute_query(bq_client, env_vars, PROJECT_LABEL_CREDIT_SQL,
                  env_vars['project_label_credit_breakout_table'], False)


def distribute_commitments(bq_client: bigquery.Client, env_vars: {}) -> None:
    """Executes second query to compute commitments per SKU.
    Args:
        bq_client: bigquery.Client object
        env_vars: Dictionary of string key-value pairs of environment vars.
    Returns:
            None
    """
    execute_query(bq_client, env_vars, DISTRIBUTE_COMMIT_SQL,
                  env_vars['distribute_commitments_table'], False)


def billing_output(bq_client: bigquery.Client, env_vars: {}) -> None:
    """Executes third query to format output schema.
    Args:
        bq_client: bigquery.Client object
        env_vars: Dictionary of string key-value pairs of environment vars.
    Returns:
            None
    """
    execute_query(bq_client, env_vars, BILLING_OUTPUT_SQL,
                  env_vars['corrected_table_name'], True)


def generateData(dataset, export_table, commitment_table, dir):
    myCmd = 'sh tests/load_test_data_bq_table.sh ' + dataset + " " + export_table + " " + commitment_table + " " + dir
    os.system(myCmd)


def delete_table(dataset, table):
    myCmd = 'sh tests/delete_table.sh ' + dataset + " " + table
    logging.info("Deleted table... " + dataset + " " + table)
    os.system(myCmd)


def delete_file(dir):
    myCmd = 'sh tests/delete_file.sh ' + dir
    logging.info("Cleaned Files from /tests directory for testcase - " + dir)
    os.system(myCmd)


def create_dataset(dataset):
    myCmd = 'sh tests/create_dataset.sh ' + dataset
    logging.info("created test environment dataset " + dataset)
    os.system(myCmd)


def delete_tables(data):
    delete_table(data['corrected_dataset_id'],
                 data['distribute_commitments_table'])
    delete_table(data['corrected_dataset_id'], data['corrected_table_name'])
    delete_table(data['corrected_dataset_id'], data['project_label_credit_breakout_table'])
    delete_table(data['billing_export_dataset_id'],
                 data['load_billing_export_table_name'])
    delete_table(data['billing_export_dataset_id'],
                 data['commitment_table_name'])


def clean(dir, data):
    delete_file(dir)
    delete_tables(data)


def prepare_consolidated_billing(dir, data):

    generateData(data['billing_export_dataset_id'],
                 data['load_billing_export_table_name'],
                 data['commitment_table_name'], dir)
    bq_client = bigquery.Client()

    project_label_credit(bq_client, data)
    logging.info('...' + dir + '_project_label_credit created ... ')
    distribute_commitments(bq_client, data)
    logging.info('...' + dir + '_distribute_commitment created ... ')
    billing_output(bq_client, data)
    logging.info('...' + dir + '_corrected created ... ')


def dump_result(project, dataset, consolidated_billing_table, local_output):
    myCmd = 'sh tests/extract.sh ' + project + " " + dataset + " " + consolidated_billing_table + " " + local_output
    os.system(myCmd)
