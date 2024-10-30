# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


def start_task():
    return """
\tstart_task = EmptyOperator(task_id="start")
"""


def stop_task():
    return """
\tstop_task = EmptyOperator(task_id="stop")
"""


def bash_operator_echo(index):
    return """
\ttask_{index} = BashOperator(task_id='task_{index}', bash_command="echo 'command executed from BashOperator'")
""".format(index=index)


def bash_operator_sleep(index, sleep_time_in_sec):
    return """
\ttask_{index} = BashOperator(task_id='task_{index}', bash_command="sleep {sleep_time}s")
""".format(index=index, sleep_time=sleep_time_in_sec)


def bash_operator_task_ping(index):
    return """
\ttask_{index} = BashOperator(task_id='task_{index}', bash_command="curl 'google.com'")
""".format(index=index)


def python_operator_task_sleep(index, sleep_time_in_sec):
    return """
\ttask_{index} = PythonOperator(
\ttask_id='task_{index}',
\tpython_callable=lambda: time.sleep({sleep_time}),
\t)
""".format(index=index, sleep_time=sleep_time_in_sec)


def python_operator_task_print(index):
    return """
\ttask_{index} = PythonOperator(
\ttask_id='task_{index}',
\tpython_callable=lambda: print('Hello from Python operator'))
""".format(index=index)
