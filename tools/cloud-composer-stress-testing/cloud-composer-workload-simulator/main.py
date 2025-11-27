# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import getopt
import random
import sys
from pathlib import Path

from local_utils import helper_functions
from taskflow_collections.base_taskflows import BaseTaskFlows
from taskflow_collections.custom_taskflows import CustomTaskFlows
from taskflow_collections.google_cloud_taskflows import GoogleCloudTaskFlows


def generate_dag_string(
    experiment_id: str,
    dag_id: str,
    start_date: str,
    schedule: str,
    default_settings: dict,
    taskflow_collections: list,
    taskflows: dict,
    num_tasks: int,
    is_paused: bool,
):
    """Generates a string representation of an Airflow DAG with random taskflows."""

    dag_string = ""

    ################################################################################################
    # Add Your Additional Task Flow Imports Below.
    ################################################################################################

    for taskflow_collection in taskflow_collections:
        if taskflow_collection == "base":
            dag_string += BaseTaskFlows.add_imports()
        elif taskflow_collection == "google_cloud":
            dag_string += GoogleCloudTaskFlows.add_imports()
        elif taskflow_collection == "custom":
            dag_string += CustomTaskFlows.add_imports()

    dag_string += f"""

# -------------------------------------------------
# Begin DAG
# -------------------------------------------------

with DAG(
    dag_id="{dag_id}",
    description="This DAG was auto-generated for experimentation purposes.",
    schedule="{schedule}",
    default_args={{
        "retries": {default_settings['retries']},
        "retry_delay": timedelta(minutes={default_settings['retry_delay']}),
        "execution_timeout": timedelta(minutes={default_settings['execution_timeout']}),
        "sla": timedelta(minutes={default_settings['sla']}),
        "deferrable": {default_settings['deferrable']},
    }},
    start_date=datetime.strptime("{start_date}", "%m/%d/%Y"),
    catchup={default_settings['catchup']},
    dagrun_timeout=timedelta(minutes={default_settings['dagrun_timeout']}),
    is_paused_upon_creation={is_paused},
    tags=['generated_workload', '{experiment_id}']
) as dag:

"""

    dag_string += generate_tasks_string(
        taskflows=taskflows,  # merge all taskflows into a single dictionary of taskflows and weights.
        num_tasks=num_tasks,
        dag_id=dag_id,
        project_id=default_settings["project_id"],
        region=default_settings["region"],
    )

    # Set up dependencies
    dependencies = " >> ".join([f"task_{task_id}" for task_id in range(num_tasks)])
    dag_string += f"""
    {dependencies}
"""

    return dag_string


def generate_tasks_string(
    taskflows: dict, dag_id: str, project_id: str, region: str, num_tasks: int
):
    """Generates task definitions for various taskflows and returns as a string."""

    base = BaseTaskFlows(dag_id=dag_id)
    google_cloud = GoogleCloudTaskFlows(
        dag_id=dag_id, region=region, project_id=project_id
    )
    custom = CustomTaskFlows(dag_id=dag_id, region=region, project_id=project_id)

    tasks_string = ""

    for task_number in range(num_tasks):
        taskflow_name = random.choices(
            list(taskflows.keys()), weights=list(taskflows.values())
        )[0]

        if taskflow_name in base.taskflows:
            tasks_string += base.generate_tasks(
                task_number=task_number,
                taskflow_name=taskflow_name,
            )
        elif taskflow_name in google_cloud.taskflows:
            tasks_string += google_cloud.generate_tasks(
                task_number=task_number,
                taskflow_name=taskflow_name,
            )
        elif taskflow_name in custom.taskflows:
            tasks_string += custom.generate_tasks(
                task_number=task_number,
                taskflow_name=taskflow_name,
            )
        else:
            raise ValueError(f"Unsupported task flow: {taskflow_name}")

    return tasks_string


def main(argv):
    """Reads configuration, generates DAGs, and writes them to files."""

    config_file = ""
    output_dir = ""
    upload = False

    try:
        opts, args = getopt.getopt(
            argv, "ho:v", ["help", "config-file=", "output-dir=", "upload-to-composer"]
        )
    except getopt.GetoptError:
        print(
            "main.py -config-file=<configfile> --output-dir=<outputdir> --upload-to-composer"
        )
        sys.exit(2)
    for opt, arg in opts:
        if opt == "-h":
            print(
                "main.py -config-file=<configfile> --output-dir=<outputdir> --upload-to-composer"
            )
            sys.exit()
        elif opt in ("--config-file"):
            config_file = arg
            print("-- Using config file:", config_file)
        elif opt in ("--output-dir"):
            output_dir = arg
            print("-- Generating output in:", output_dir)
        elif opt in ("--upload-to-composer"):
            upload = True
            print("-- Uploading generated dags to Composer environment.")

    # Load configuration
    load_config = helper_functions.load_config_from_file(config_file)

    validated = helper_functions.validate_config(load_config)

    if validated:
        num_dags = load_config["number_of_dags"]
        min_tasks_per_dag = load_config["min_tasks_per_dag"]

        # merge taskflow collections into single map of taskflows and weights
        taskflows = {}
        taskflow_collections = []
        for key in load_config["taskflows"]:
            taskflow_collections.append(key)
            nested_dict = load_config["taskflows"][key]
            taskflows.update(nested_dict)

        # Get paused weight configuration (default to 50/50 if not provided)
        paused_weight = load_config.get("paused", 0.5)

        # Generate DAGs
        for i in range(num_dags):
            experiment_id = load_config["experiment_id"]
            dag_id = f"{experiment_id}_dag_{i}".replace("-", "_")
            schedule = random.choices(
                list(load_config["schedules"].keys()),
                weights=list(load_config["schedules"].values()),
            )[0]
            start_date = random.choices(
                list(load_config["start_dates"].keys()),
                weights=list(load_config["start_dates"].values()),
            )[0]
            default_settings = load_config["default_settings"].copy()
            default_settings["owner"] = "airflow"

            # Determine if the DAG is paused based on the weight

            if default_settings["is_paused_upon_creation"]:
                is_paused = True
            else:
                is_paused = random.random() < paused_weight
            print(is_paused)

            dag = generate_dag_string(
                experiment_id=experiment_id,
                dag_id=dag_id,
                start_date=start_date,
                schedule=schedule,
                default_settings=default_settings,
                taskflow_collections=taskflow_collections,
                taskflows=taskflows,
                num_tasks=min_tasks_per_dag,
                is_paused=is_paused,
            )

            if not output_dir:
                output_dir = "dags/"

            Path(f"{output_dir}/{experiment_id}").mkdir(parents=True, exist_ok=True)
            with open(f"{output_dir}/{experiment_id}/dag_{i}.py", "w") as file:
                file.write(dag)

        # Upload DAGS to Composer Environment if specified.
        if upload:
            dag_folder = helper_functions.get_composer_environment_bucket(
                default_settings["project_id"],
                default_settings["region"],
                default_settings["composer_environment"],
            )
            helper_functions.upload_directory(
                source_folder=f"{output_dir}/{experiment_id}/",
                target_gcs_path=f"{dag_folder}/{experiment_id}",
            )

        print(
            f"> Generated {num_dags} dags with at least {min_tasks_per_dag} tasks per dag"
        )
        print(f"> Check dags/{experiment_id} directory for generated output")
        if upload:
            print(
                f"> Uploaded dags/{experiment_id} contents to {dag_folder}/{experiment_id}"
            )


if __name__ == "__main__":
    main(sys.argv[1:])
