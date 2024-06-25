from datetime import datetime

from airflow import DAG
from airflow.operators.dummy_operator import DummyOperator

dag = DAG(
        dag_id='simple_dag',
        start_date=datetime(2020, 1, 1),
        schedule_interval='@once'
)

start = DummyOperator(
        task_id="start",
        dag=dag
)

end = DummyOperator(
        task_id="end",
        dag=dag
)

start >> end
