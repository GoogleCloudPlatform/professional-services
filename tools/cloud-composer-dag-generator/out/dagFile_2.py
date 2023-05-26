import time
from datetime import datetime
from airflow.models import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.models.baseoperator import chain

default_args = {
    'owner': 'Airflow',
    'start_date': datetime(2023, 5, 26),
}

with DAG(
    dag_id='test_dag_2',
    schedule_interval='5 * * * *',
    default_args=default_args,
    catchup=False
) as dag:
    
	start_task = EmptyOperator(task_id="start")

	stop_task = EmptyOperator(task_id="stop")

	task_0 = BashOperator(task_id='task_0', bash_command="echo 'command executed from BashOperator'")

	task_1 = BashOperator(task_id='task_1', bash_command="sleep 14s")

	task_2 = BashOperator(task_id='task_2', bash_command="echo 'command executed from BashOperator'")

	task_3 = BashOperator(task_id='task_3', bash_command="sleep 10s")

	task_4 = BashOperator(task_id='task_4', bash_command="echo 'command executed from BashOperator'")

	task_5 = BashOperator(task_id='task_5', bash_command="sleep 7s")

	task_6 = BashOperator(task_id='task_6', bash_command="echo 'command executed from BashOperator'")

	task_7 = BashOperator(task_id='task_7', bash_command="sleep 13s")

	task_8 = BashOperator(task_id='task_8', bash_command="echo 'command executed from BashOperator'")

	task_9 = BashOperator(task_id='task_9', bash_command="sleep 8s")

	task_10 = BashOperator(task_id='task_10', bash_command="echo 'command executed from BashOperator'")

	task_11 = BashOperator(task_id='task_11', bash_command="sleep 7s")

	task_12 = BashOperator(task_id='task_12', bash_command="echo 'command executed from BashOperator'")

	task_13 = BashOperator(task_id='task_13', bash_command="sleep 14s")

	task_14 = BashOperator(task_id='task_14', bash_command="echo 'command executed from BashOperator'")

	chain(start_task,task_0,task_1,task_2,[task_14,task_13,task_12],task_3,task_4,task_5,task_6,task_7,task_8,task_9,task_10,task_11,stop_task)