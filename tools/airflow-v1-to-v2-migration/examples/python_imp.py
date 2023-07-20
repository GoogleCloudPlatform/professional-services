from airflow import DAG
from airflow.operators.python_operator import ShortCircuitOperator
from datetime import datetime

default_args = {
    'start_date': datetime(2023, 5, 20),
}

def condition_func():
    # Define your condition logic here
    # Return True or False based on the condition
    return True

with DAG('my_dag', default_args=default_args, schedule_interval=None) as dag:
    check_condition = ShortCircuitOperator(
        task_id='check_condition',
        python_callable=condition_func
    )

    task_a = ...
    task_b = ...
    task_c = ...

    check_condition >> task_a
    check_condition >> task_b
    task_a >> task_c
    task_b >> task_c
