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
import os
from typing import Dict, Union
from airflow import models
from airflow.contrib.operators import bigquery_operator, bigquery_table_delete_operator
from airflow.operators import python_operator
from composer.dependencies import (commitments_schema, commitment_intervals)


DEFAULT_DAG_ARGS = {'start_date': datetime.datetime.now()}
SQL_PREFIX = 'dependencies'
BILLING_OUTPUT_SQL = os.path.join(SQL_PREFIX, 'billingoutput.sql')
DISTRIBUTE_COMMIT_SQL = os.path.join(SQL_PREFIX, 'distribute_commitment.sql')
PROJECT_LABEL_CREDIT_SQL = os.path.join(SQL_PREFIX,
                                        'project_label_credit_data.sql')


def get_enable_cud_cost() -> bool:
    """Converts string to bool because environment variables are strings.

    Return:
         Boolean denoting whether or not to enable CUD cost attribution.
    """
    return os.environ.get('enable_cud_cost_attribution').lower() == 'true'


def get_cud_cost_option() -> str:
    """Ensures environment variable is lower-case for choosing option.

    Returns:
         'a' or 'b' depending on option
    """
    if os.environ.get('cud_cost_attribution_option').lower() == 'b':
        return 'b'
    else:
        return 'a'


def format_commitment_table(templates_dict: Dict[str, Union[str, bool]], **kwargs) -> None:
    """Recreates commitment table to have non-overlapping commitments.

    Args:
        templates_dict: key-value pairs of environment variables

    Returns:
        None
    """
    gcs_bucket = '{project}-cud-correction-commitment-data'
    gcs_bucket = gcs_bucket.format(project=templates_dict['project_id'])
    schema = commitments_schema.schema
    commitment_intervals.main(templates_dict['commitment_table_name'],
                              templates_dict['corrected_dataset_id'],
                              templates_dict['temp_commitments_table_name'],
                              gcs_bucket, schema)


with models.DAG('cud_correction_dag',
                schedule_interval=datetime.timedelta(days=1),
                catchup=False,
                default_args=DEFAULT_DAG_ARGS,
                params={
                    'billing_export_table_name': os.environ.get('billing_export_table_name'),
                    'project_id': os.environ.get('project_id'),
                    'corrected_dataset_id': os.environ.get('corrected_dataset_id'),
                    'corrected_table_name': os.environ.get('corrected_table_name'),
                    'commitments_table_name': os.environ.get('commitments_table_name'),
                    'enable_cud_cost_attribution': get_enable_cud_cost(),
                    'cud_cost_attribution_option': get_cud_cost_option(),
                    'project_label_credit_breakout_table': 'temp_project_label_credit_data_table',
                    'temp_commitments_table_name': 'temp_commitments_table',
                    'distribute_commitments_table': 'temp_distribute_commitments_table'
                }) as dag:

    FORMAT_COMMITMENT_TABLE = python_operator.PythonOperator(
        task_id='format_commitment_table',
        python_callable=format_commitment_table,
        provide_context=True,
        templates_dict={'project_id': '{{params.project_id}}',
                       'commitment_table_name': '{{params.commitments_table_name}}',
                       'corrected_dataset_id': '{{params.corrected_dataset_id}}',
                       'temp_commitments_table_name': '{{params.temp_commitments_table_name}}'
                   })

    PROJECT_LABEL_CREDIT_QUERY = bigquery_operator.BigQueryOperator(
        task_id='project_label_credit_query',
        sql=PROJECT_LABEL_CREDIT_SQL,
        destination_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.project_label_credit_breakout_table}}',
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False
    )

    DISTRIBUTE_COMMITMENTS_QUERY = bigquery_operator.BigQueryOperator(
        task_id='distribute_commitments',
        sql=DISTRIBUTE_COMMIT_SQL,
        destination_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.distribute_commitments_table}}',
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False
    )

    BILLING_OUTPUT_QUERY = bigquery_operator.BigQueryOperator(
        task_id='billing_output',
        sql=BILLING_OUTPUT_SQL,
        destination_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.corrected_table_name}}',
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
        deletion_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.temp_commitments_table_name}}'
    )

    DELETE_DIST_COMMITMENT_TABLE = bigquery_table_delete_operator.BigQueryTableDeleteOperator(
        task_id='end_delete_temp_distribute_commitment_table',
        deletion_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.distribute_commitments_table}}'
    )

    DELETE_TEMP_PROJECT_BREAKDOWN_TABLE = bigquery_table_delete_operator.BigQueryTableDeleteOperator(
        task_id='end_delete_temp_project_breakdown_table',
        deletion_dataset_table='{{params.project_id}}.{{params.corrected_dataset_id}}.{{params.project_label_credit_breakout_table}}'
    )

    FORMAT_COMMITMENT_TABLE >> PROJECT_LABEL_CREDIT_QUERY >> DISTRIBUTE_COMMITMENTS_QUERY >> BILLING_OUTPUT_QUERY >> DELETE_TEMP_COMMITMENT_TABLE >> DELETE_DIST_COMMITMENT_TABLE >> DELETE_TEMP_PROJECT_BREAKDOWN_TABLE
