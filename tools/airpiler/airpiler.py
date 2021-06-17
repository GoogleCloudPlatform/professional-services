#!/usr/bin/env python3
# encoding: utf-8

#    Copyright 2021 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
"""
Script to convert Autosys JIL files into dag-factory yaml format
"""

import argparse
import re
from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor
import yaml


class JilVisitor(NodeVisitor):
    """
    Instance of Class inhereting the library's Class to customize each element of
    what the parser found.
    """

    def visit_expr(self, _node, visited_children):
        """ Returns the overall output. """
        value = None
        key = None

        def setup_default_args():
            """ Add the default args section to the result dictionary"""
            default_arg_keys = ["owner"]
            if "default_args" not in value.keys():
                value["default_args"] = dict()
                value["default_args"]["start_date"] = "1 days"
            for def_arg in default_arg_keys:
                if def_arg in value.keys():
                    value["default_args"][def_arg] = value[def_arg]
                    del value[def_arg]

        def setup_task_group():
            """ Adds a taskgroup section"""
            if not value.get("task_groups"):
                value["task_groups"] = dict()

            if value.get("description"):
                value["task_groups"][f'task_group_{key}'] = {
                    "tooltip": value["description"]
                }
            else:
                value["task_groups"][f'task_group_{key}'] = {"tooltip": key}

            # This creates a dependency if you have a nested box within a box
            if value.get("box_name"):
                dependency = value.get("box_name")
                for val in result.values():
                    if val.get('task_groups'):
                        if val['task_groups'].get(f"task_group_{dependency}"):
                            if value["task_groups"][f'task_group_{key}'].\
                                get('dependencies'):
                                value["task_groups"][f'task_group_{key}']['dependencies'].\
                                    append(f"task_group_{dependency}")
                            else:
                                value["task_groups"][f'task_group_{key}'].\
                                    update({'dependencies': [f"task_group_{dependency}"]})

            # check if a condition statement exists to set it as a dependency
            if value.get("condition"):
                create_dependencies()

        def setup_task():
            """ Adds a task section"""
            if not value.get("tasks"):
                value.update({"tasks": {f'task_{key}': dict()}})

            cmd_dict = {
                "operator": "airflow.operators.bash_operator.BashOperator",
                "bash_command": f'echo [{value["command"]}]'
            }
            value["tasks"][f'task_{key}'].update(cmd_dict)

            # check if a condition statement exists to set it as a dependency
            if value.get("condition"):
                create_dependencies()

            if value.get("box_name"):
                value["tasks"][f'task_{key}']["task_group_name"] = \
                    f'task_group_{value.get("box_name")}'

            # tasks can't have descriptions only dags/top level boxes can
            if value.get("description"):
                del value["description"]

            # clean up the converted field
            del value["command"]

        def create_dependencies():
            """ Converts condition statement to dependencies"""
            condition_pattern = r"s\((\w+)\)"
            mat = re.findall(condition_pattern, value["condition"])
            if mat:
                for dep in mat:
                    for val in result.values():
                        # check if the dependency is one of the tasks
                        if val.get('tasks'):
                            if val['tasks'].get(f"task_{dep}"):
                                if value["tasks"][f'task_{key}'].get(
                                        'dependencies'):
                                    value["tasks"][f'task_{key}']['dependencies'].\
                                        append(f"task_{dep}")
                                else:
                                    value["tasks"][f'task_{key}'].\
                                       update({'dependencies': [f"task_{dep}"]})

                        # check if the dependency is one of the tasksgroups
                        if val.get('task_groups'):
                            if val['task_groups'].get(f"task_group_{dep}"):
                                if value["task_groups"][
                                        f'task_group_{key}'].get(
                                            'dependencies'):
                                    value["task_groups"][f'task_group_{key}']['dependencies'].\
                                        append(f"task_group_{dep}")
                                else:
                                    value["task_groups"][f'task_group_{key}'].\
                                        update({'dependencies': [f"task_group_{dep}"]})

                # clean up the converted field
                del value["condition"]

        # create the result dictionary
        result = {}
        for child in visited_children:
            for key, value in child[0].items():
                ## Convert top level Box to DAG
                if value['job_type'] == "box" and not value.get("box_name"):

                    setup_default_args()
                    setup_task_group()

                    # Clean Up
                    if value.get("description"):
                        del value["description"]
                    del value["job_type"]

                    result[f"{key}_DAG"] = value
                ## Convert Box inside a box into a TaskGroup
                elif value['job_type'] == "box" and value.get('box_name'):
                    dag_name = list(result.keys())[0]
                    setup_task_group()
                    result[dag_name]["task_groups"].update(value["task_groups"])

                ## Convert Commands inside Boxes into Tasks of the TaskGroups
                elif value.get("box_name") and value['job_type'] == "cmd":
                    dag_name = list(result.keys())[0]
                    setup_task()
                    if result[dag_name].get("tasks"):
                        result[dag_name]["tasks"].update(value["tasks"])
                    else:
                        result[dag_name]["tasks"] = value["tasks"]

                    # clean up
                    del value["box_name"]
                    del value["job_type"]
                    if value["owner"]:
                        del value["owner"]

                ## Convert Stand Alone Commands into a DAG
                elif 'box_name' not in value.keys(
                ) and value['job_type'] == "cmd":
                    # Populate the Default Args
                    setup_default_args()

                    # Populate the Task
                    value['tasks'] = {
                        f"task_cmd_{key}": {
                            "operator":
                                "airflow.operators.bash_operator.BashOperator",
                            "bash_command":
                                f'echo [{value["command"]}]'
                        }
                    }

                    if value.get("condition"):
                        create_dependencies()

                    # Clean Up
                    del value["command"]
                    del value["job_type"]
                    result[f"{key}"] = value

        return result

    def visit_entry(self, _node, visited_children):
        """ Makes a dict of the job (as key) and the key/value pairs. """
        key, values = visited_children
        clean_values = [x for x in values if x is not None]
        return {f"{key}": dict(clean_values)}

    def visit_job(self, _node, visited_children):
        """ Gets the job name. """
        _, _, job, *_ = visited_children
        return job.text

    def visit_box(self, _node, visited_children):
        """ Gets the box name and task. """
        _, _, box, *_ = visited_children
        return box.text

    def visit_pair(self, node, _visited_children):
        """ Gets each key/value pair, returns a tuple. """
        key, _, value, *_ = node.children
        converted_fields = ("start_times")
        unsupported_fields = ("permission", "std_err_file", "std_out_file",
                              "date_conditions", "machine", "alarm_if_fail",
                              "alarm_if_terminated", "avg_runtime",
                              "max_run_alarm", "notification_alarm_types",
                              "notification_template", "notification_id",
                              "send_notification", "notification_emailaddress",
                              "days_of_week", "notification_msg")
        if key.text not in unsupported_fields:
            if key.text in converted_fields:
                if key.text == "start_times":
                    converted_key = "schedule_interval"
                    hour, minute = value.text.strip('\"').split(":")
                    converted_value = f"{minute} {hour} * * *"
                return converted_key, converted_value
            else:
                return key.text, value.text

    def generic_visit(self, node, visited_children):
        """ The generic visit method. """
        return visited_children or node


def parse_jil(input_file):
    """Parse Jil file and return a python dictionary of the parsed data"""
    grammar = Grammar(r"""
        expr        = (entry / emptyline)*
        entry       = job pair*

        job         = jobstart colon jobname ws
        pair        = key colon value ws?

        key         = !jobstart word+
        value       = (word / quoted)+
        word        = ~r"[- ,\w\(\)\@\.\/\$\*\'\&\<\>]+"
        wordwild    = ~r"(.*)"
        quoted      = ~'"+[^\"]+"+'
        colon       = ws? ":" ws?
        jobname     = ~r"[\w]+"
        jobstart    = "insert_job"
        ws          = ~"\s*"
        emptyline   = ws+
        """)
    with open(input_file, 'r') as rfh:
        jil_data = rfh.read()

    tree = grammar.parse(jil_data)
    jil_vis = JilVisitor()
    output = jil_vis.visit(tree)
    return output


if __name__ == "__main__":
    CMD_DESC = "Convert JIL File to dag-factory yaml and airflow dag python"
    parser = argparse.ArgumentParser(description=CMD_DESC)
    parser.add_argument(
        "-p",
        "--prefix",
        help='specify prefix to be used for converted files',
        required=True,
    )
    parser.add_argument("-i",
                        "--input",
                        help='specify input JIL file',
                        required=True)
    args = parser.parse_args()
    output_dict = parse_jil(args.input)

    dag_factory_yaml_file = f"{args.prefix}.yaml"
    airflow_py_file = f"{args.prefix}-dag.py"

    # write out the dag-factory yaml file
    with open(dag_factory_yaml_file, 'w') as dfy_wfh:
        yaml.safe_dump(output_dict, dfy_wfh)

    # write out the dag-factory yaml file
    airflow_py_script = f"""from airflow import DAG
import dagfactory

config_file = "/home/airflow/gcsfuse/data/{dag_factory_yaml_file}"
example_dag_factory = dagfactory.DagFactory(config_file)

# Creating task dependencies
example_dag_factory.clean_dags(globals())
example_dag_factory.generate_dags(globals())
"""

    with open(airflow_py_file, 'w') as afp_wfh:
        afp_wfh.write(airflow_py_script)

    ENV_TEMPL = "<YOUR_ENV>"
    gcloud_uri_command = (
        f"gcloud composer environments describe {ENV_TEMPL}"
        f" --location us-central1 --format=\"get(config.airflowUri)\"")
    gcloud_gcs_command = (
        f"gcloud composer environments describe {ENV_TEMPL}"
        f" --location us-central1 --format=\"get(config.dagGcsPrefix)\"")
    gsutil_cp_command = (
        f"gsutil cp {dag_factory_yaml_file} gs://{ENV_TEMPL}/data")

    gcloud_upload_command = (
        f"gcloud composer environments storage dags import --environment"
        f" <YOUR_ENV> --location us-central1 --source {airflow_py_file}")

    mesg = (f"dag-factory yaml written to: {dag_factory_yaml_file}\n"
            f"airflow python file written to: {airflow_py_file}\n\n"
            f"Run the following to get your GCS Bucket \n"
            f"{gcloud_gcs_command}\n\n"
            f"Run the following to upload the dag-factory yaml file to the "
            f"bucket:\n{gsutil_cp_command}\n\n"
            f"Then run the following to upload the airflow dag python"
            f" script to your composer environment: \n"
            f"{gcloud_upload_command}\n\n"
            f"Then run the following to get the URL of the Airflow UI:\n"
            f"{gcloud_uri_command} \n\n"
            f"Then visit the URL and trigger your DAG")
    print(mesg)
