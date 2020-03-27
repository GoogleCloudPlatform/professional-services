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

import datetime
import logging
import os
from typing import List, Dict, Optional, Union
from airflow import models
from airflow.operators import python_operator
from google.cloud import bigquery
from dependencies import billingoutput
from dependencies import commitment_intervals
from dependencies import commitments_schema
from dependencies import distribute_commitment
from dependencies import helper_function
from dependencies import project_label_credit_data


def get_env_variables(
        key_list: List[str]) -> Dict[str, Union[Optional[str], bool]]:
    """Creates a Dictionary object to hold all of the environment variables.

    Args:
        key_list: List of strings of environment variable keys.

    Returns:
        Dictionary holding key-value pairs of environment variables.
    """
    return {key: os.environ.get(key) for key in key_list}


def execute_query(bq_client: bigquery.Client,
                  env_vars: Dict[str, Union[str, bool]], query_path: object,
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
    sql = query_path.query
    sql = sql.format(**env_vars)
    logging.info('Attempting query...')

    # Execute Query
    query_job = bq_client.query(query=sql, job_config=job_config)

    query_job.result()  # Waits for the query to finish


DEFAULT_DAG_ARGS = {'start_date': datetime.datetime.now()}

with models.DAG('cud_correction_dag',
                schedule_interval=datetime.timedelta(days=1),
                default_args=DEFAULT_DAG_ARGS) as dag:

    def format_commitment_table(env_vars: Dict[str, Union[str, bool]]) -> None:
        """Recreates commitment table to have non-overlapping commitments.

        Args:
            env_vars: Dictionary of key-value pairs of environment vars.

        Returns:
            None
        """
        gcs_bucket = '{project}-cud-correction-commitment-data'
        gcs_bucket = gcs_bucket.format(project=env_vars['project_id'])
        schema = commitments_schema.schema
        commitment_intervals.main(env_vars['commitments_table_name'],
                                  env_vars['corrected_dataset_id'],
                                  env_vars['temp_commitments_table_name'],
                                  gcs_bucket, schema)

    def project_label_credit(bq_client: bigquery.Client,
                             env_vars: Dict[str, Union[str, bool]]) -> None:
        """Executes first query to break out lines into project and credits.

        Args:
            bq_client: bigquery.Client object
            env_vars: Dictionary of string key-value pairs of environment vars.

        Returns:
             None
        """
        execute_query(bq_client, env_vars, project_label_credit_data,
                      env_vars['project_label_credit_breakout_table'], False)

    def distribute_commitments(bq_client: bigquery.Client,
                               env_vars: Dict[str, Union[str, bool]]) -> None:
        """Executes second query to compute commitments per SKU.

        Args:
            bq_client: bigquery.Client object
            env_vars: Dictionary of string key-value pairs of environment vars.

        Returns:
             None
        """
        execute_query(bq_client, env_vars, distribute_commitment,
                      env_vars['distribute_commitments_table'], False)

    def billing_output(bq_client: bigquery.Client,
                       env_vars: Dict[str, Union[str, bool]]) -> None:
        """Executes third query to format output schema.

        Args:
            bq_client: bigquery.Client object
            env_vars: Dictionary of string key-value pairs of environment vars.

        Returns:
             None
        """
        execute_query(bq_client, env_vars, billingoutput,
                      env_vars['corrected_table_name'], True)

    def delete_temp_tables(bq_client: bigquery.Client,
                           env_vars: Dict[str, Union[str, bool]]) -> None:
        """Deletes the three temporary tables that were created by the DAG.

        Args:
            bq_client: bigquery.Client object
            env_vars: Dictionary holding key-value pair of environment vars.

        Returns:
            None
        """
        helper_function.delete_table(bq_client,
                                     env_vars['corrected_dataset_id'],
                                     env_vars['temp_commitments_table_name'])
        helper_function.delete_table(bq_client,
                                     env_vars['corrected_dataset_id'],
                                     env_vars['distribute_commitments_table'])
        helper_function.delete_table(
            bq_client, env_vars['corrected_dataset_id'],
            env_vars['project_label_credit_breakout_table'])

    # Obtain values for all of the environment variables
    KEY_LIST = [
        'project_id', 'billing_export_table_name', 'corrected_dataset_id',
        'corrected_table_name', 'commitments_table_name',
        'enable_cud_cost_attribution', 'cud_cost_attribution_option'
    ]
    ENV_VARS = get_env_variables(KEY_LIST)
    # Create temp tables for each of the three queries
    ENV_VARS[
        'distribute_commitments_table'] = 'temp_distribute_commitments_table'
    ENV_VARS[
        'project_label_credit_breakout_table'] = 'temp_project_label_credit_data_table'
    ENV_VARS['temp_commitments_table_name'] = 'temp_commitments_table'
    # Convert string to bool because environment variables are strings.
    ENV_VARS['enable_cud_cost_attribution'] = (
        ENV_VARS['enable_cud_cost_attribution'].lower() == 'true')
    ENV_VARS['cud_cost_attribution_option'] = 'b' if ENV_VARS[
        'cud_cost_attribution_option'].lower() == 'b' else 'a'
    bq_client = bigquery.Client()

    FORMAT_COMMITMENT_TABLE = python_operator.PythonOperator(
        task_id='format_commitment_table',
        python_callable=format_commitment_table,
        op_kwargs={'env_vars': ENV_VARS})

    PROJECT_LABEL_CREDIT_QUERY = python_operator.PythonOperator(
        task_id='project_label_credit_query',
        python_callable=project_label_credit,
        op_kwargs={
            'bq_client': bq_client,
            'env_vars': ENV_VARS
        })

    DISTRIBUTE_COMMITMENTS_QUERY = python_operator.PythonOperator(
        task_id='distribute_commitments',
        python_callable=distribute_commitments,
        op_kwargs={
            'bq_client': bq_client,
            'env_vars': ENV_VARS
        })

    BILLING_OUTPUT_QUERY = python_operator.PythonOperator(
        task_id='billing_output',
        python_callable=billing_output,
        op_kwargs={
            'bq_client': bq_client,
            'env_vars': ENV_VARS
        })

    DELETE_TEMP_TABLES = python_operator.PythonOperator(
        task_id='end_delete_temp_tables',
        python_callable=delete_temp_tables,
        op_kwargs={
            'bq_client': bq_client,
            'env_vars': ENV_VARS
        })

    FORMAT_COMMITMENT_TABLE >> PROJECT_LABEL_CREDIT_QUERY >> DISTRIBUTE_COMMITMENTS_QUERY >> BILLING_OUTPUT_QUERY >> DELETE_TEMP_TABLES
