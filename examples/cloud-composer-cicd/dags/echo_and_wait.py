# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
"""
This DAG is trivial, it has a sequence of two tasks that simply wait 10 seconds each.
"""

from datetime import timedelta
from airflow.models import DAG
from airflow.operators.bash_operator import BashOperator

import airflow

VERSION = 1
DEFAULT_ARGS = {
    'owner': 'airflow',
    'start_date': airflow.utils.dates.days_ago(7)
}

with DAG(dag_id='echo_and_wait',
         default_args=DEFAULT_ARGS,
         schedule_interval='@daily',
         dagrun_timeout=timedelta(minutes=60)) as dag:
    TASK1 = BashOperator(task_id='echo_and_wait1',
                         bash_command=f"""
            echo DAG echo_and_wait1 version = {VERSION}
            echo start;
            sleep 10;
            echo stop;
        """)
    TASK2 = BashOperator(task_id='echo_and_wait2',
                         bash_command=f"""
            echo DAG echo_and_wait2 version = {VERSION}
            echo start;
            sleep 10;
            echo stop;
        """)
    TASK1.set_downstream(TASK2)

if __name__ == "__main__":
    dag.cli()
