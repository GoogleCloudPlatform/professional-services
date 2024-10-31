"""
A DAG to pause all other dags.
"""

from datetime import datetime, timedelta
from airflow import models
from airflow.providers.postgres.operators.postgres import (
    PostgresOperator,)

default_args = {
    "owner": "auditing",
    "depends_on_past": False,
    "email": [""],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
}

with models.DAG(
        "pause_all_dags",
        tags=["airflow_db"],
        description="Pause all dags.",
        is_paused_upon_creation=False,
        catchup=False,
        start_date=datetime(2024, 1, 1),
        dagrun_timeout=timedelta(minutes=30),
        max_active_runs=1,
        default_args=default_args,
        schedule_interval=None,
) as dag:

    pause_all_dags = PostgresOperator(task_id='pause_all_dags',
                                      postgres_conn_id='airflow_db',
                                      sql="""
            UPDATE dag
            SET is_paused = true 
            WHERE 
                dag_id != 'airflow_monitoring' AND 
                dag_id != 'pause_all_dags';
            """)
