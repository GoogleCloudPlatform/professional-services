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

"""
This project is a automatic DAGS generator which is used to create workload
into an composer environmnet and to test differents airflows configurations
or to do fine tune using the airflow metrics.
Steps to run:
 a) modify config.json file to adjust size and type of tasks for the workload
 b) run $python main.py
 c) move dags folder generated to the dag buckets in composer like:
        gsutil cp -r out  gs://BUCKET_NAME/dags
NOTE: the "number_of_operators_defined" variable in the configuration file
        (config.json) allows to create up to 5 differents kind of task,
        none has complex functionallity:
        a) bash_operator_echo
        b) bash_operator_sleep
        c) bash_operator_task_ping
        d) python_operator_task_sleep
        e) python_operator_task_print
"""

import json
import math
import random

import modules.initDag
import modules.operators


def get_config():
    """module to read configs"""
    f = open("config.json", "r")
    data = json.loads(f.read())
    f.close()
    return data


def get_init_content(i):
    """Initialise test DAG with headers"""
    modules.initDag.get_init_dag(i)


def get_task_dag(min_number_of_task_in_dag):
    """Create task for test  dags"""

    print(min_number_of_task_in_dag)
    file = open("modules/python-operator.py")
    data = file.read()
    file.close()
    return data


# build the dags
def main():
    """main function to create test DAGs"""
    # read config file
    data = get_config()

    number_of_dags_to_generate = data["number_of_dags_to_generate"]
    min_number_of_task_in_dag = data["min_number_of_task_in_dag"]
    max_number_of_task_in_dag = data["max_number_of_task_in_dag"]
    task_min_time_in_sec = data["task_min_time_in_sec"]
    task_max_time_in_sec = data["task_max_time_in_sec"]
    percentage_of_job_in_parallel = data["percentage_of_job_in_parallel"]
    number_of_operators_defined = data["number_of_operators_defined"]
    file_index = data["file_start_index"]
    schedules = data["schedules"]

    # creatting DAG's files
    for i in range(number_of_dags_to_generate):
        task_list = []
        dagf = open(f"out/dagFile_{file_index+i}.py", "w+")
        dagf.write(
            modules.initDag.get_init_dag(
                file_index + i, schedules[random.randrange(0, len(schedules) - 1)]
            )
        )
        dagf.write(modules.operators.start_task())
        dagf.write(modules.operators.stop_task())
        for task_index in range(
            random.randrange(min_number_of_task_in_dag, max_number_of_task_in_dag)
        ):
            task_list.append("task_{index}".format(index=task_index))
            if task_index % number_of_operators_defined == 0:
                dagf.write(modules.operators.bash_operator_echo(task_index))
            elif task_index % number_of_operators_defined == 1:
                dagf.write(
                    modules.operators.bash_operator_sleep(
                        task_index,
                        random.randrange(task_min_time_in_sec, task_max_time_in_sec),
                    )
                )
            elif task_index % number_of_operators_defined == 2:
                dagf.write(
                    modules.operators.python_operator_task_sleep(
                        task_index,
                        random.randrange(task_min_time_in_sec, task_max_time_in_sec),
                    )
                )
            elif task_index % number_of_operators_defined == 3:
                dagf.write(modules.operators.bash_operator_task_ping(task_index))
            else:
                dagf.write(modules.operators.python_operator_task_print(task_index))
        no_tasks_in_parallel = math.ceil(
            percentage_of_job_in_parallel / 100 * len(task_list)
        )
        parallel_tasks = []
        if no_tasks_in_parallel > 1:
            for parallel_task_index in range(no_tasks_in_parallel):
                parallel_tasks.append(task_list.pop())
            task_list.insert(
                random.randrange(1, len(task_list) - 2),
                "[{task}]".format(task=",".join(parallel_tasks)),
            )
        dagf.write(
            "\n\tchain(start_task,{tasks},stop_task)".format(tasks=",".join(task_list))
        )
        dagf.close()


if __name__ == "__main__":
    main()
