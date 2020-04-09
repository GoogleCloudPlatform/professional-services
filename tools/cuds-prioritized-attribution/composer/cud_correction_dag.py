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
from typing import Dict, Union
from airflow import models
from airflow.contrib.operators import bigquery_operator, bigquery_table_delete_operator
from airflow.operators import python_operator
from dependencies import (billingoutput, commitment_intervals,
                          commitments_schema, distribute_commitment,
                          helper_function,
                          project_label_credit_data)


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


DEFAULT_DAG_ARGS = {'start_date': datetime.datetime.now()}

with models.DAG('cud_correction_dag',
                schedule_interval=datetime.timedelta(days=1),
                default_args=DEFAULT_DAG_ARGS) as dag:

    # Obtain values for all of the environment variables
    KEY_LIST = [
        'project_id', 'billing_export_table_name', 'corrected_dataset_id',
        'corrected_table_name', 'commitments_table_name',
        'enable_cud_cost_attribution', 'cud_cost_attribution_option'
    ]
    ENV_VARS = helper_function.get_env_variables(KEY_LIST)
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

    FORMAT_COMMITMENT_TABLE = python_operator.PythonOperator(
        task_id='format_commitment_table',
        python_callable=format_commitment_table,
        op_kwargs={'env_vars': ENV_VARS})

    PROJECT_LABEL_CREDIT_QUERY = bigquery_operator.BigQueryOperator(
        task_id='project_label_credit_query',
        sql=project_label_credit_data.query.format(**ENV_VARS),
        destination_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['project_label_credit_breakout_table']}",
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False
    )

    DISTRIBUTE_COMMITMENTS_QUERY = bigquery_operator.BigQueryOperator(
        task_id='distribute_commitments',
        sql=distribute_commitment.query.format(**ENV_VARS),
        destination_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['distribute_commitments_table']}",
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False
    )

    BILLING_OUTPUT_QUERY = bigquery_operator.BigQueryOperator(
        task_id='billing_output',
        sql=billingoutput.query.format(**ENV_VARS),
        destination_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['corrected_table_name']}",
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False,
        time_partition={
            "type": "DAY",
            "field": "usage_start_time",
            "expiration_ms": None
        }
    )

    DELETE_TEMP_COMMITMENT_TABLE = bigquery_table_delete_operator.BigQueryTableDeleteOperator(
        task_id='end_delete_temp_commitment_table',
        deletion_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['temp_commitments_table_name']}"
    )

    DELETE_DIST_COMMITMENT_TABLE = bigquery_table_delete_operator.BigQueryTableDeleteOperator(
        task_id='end_delete_temp_distribute_commitment_table',
        deletion_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['distribute_commitments_table']}"
    )

    DELETE_TEMP_PROJECT_BREAKDOWN_TABLE = bigquery_table_delete_operator.BigQueryTableDeleteOperator(
        task_id='end_delete_temp_project_breakdown_table',
        deletion_dataset_table=f"{ENV_VARS['project_id']}.{ENV_VARS['corrected_dataset_id']}.{ENV_VARS['project_label_credit_breakout_table']}"
    )

    FORMAT_COMMITMENT_TABLE >> PROJECT_LABEL_CREDIT_QUERY >> DISTRIBUTE_COMMITMENTS_QUERY >> BILLING_OUTPUT_QUERY >> DELETE_TEMP_COMMITMENT_TABLE >> DELETE_DIST_COMMITMENT_TABLE >> DELETE_TEMP_PROJECT_BREAKDOWN_TABLE
