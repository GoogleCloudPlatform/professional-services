from airflow import DAG, configuration
from airflow.utils.module_loading import import_string

from dagfactory import utils

# these are params only used in the DAG factory, not in the tasks
SYSTEM_PARAMS = ["operator", "dependencies"]


class DagBuilder(object):
    def __init__(self, dag_name, dag_config, default_config):
        self.dag_name = dag_name
        self.dag_config = dag_config
        self.default_config = default_config

    def get_dag_params(self):
        """
        Merges default config with dag config, sets dag_id, and extropolates dag_start_date

        :returns: dict of dag parameters
        """
        try:
            dag_params = utils.merge_configs(self.dag_config, self.default_config)
        except Exception as e:
            raise Exception(f"Failed to merge config with default config, err: {e}")
        dag_params["dag_id"] = self.dag_name
        try:
            dag_params["default_args"]["start_date"] = utils.get_start_date(
                dag_params["default_args"]["start_date"]
            )
        except KeyError as e:
            raise Exception(f"{self.dag_name} config is missing start_date, err: {e}")

        return dag_params

    @staticmethod
    def make_task(operator, task_params):
        """
        Takes an operator and params and creates an instance of that operator.

        :returns: instance of operator object
        """
        try:
            operator_obj = import_string(operator)
        except Exception as e:
            raise Exception(f"Failed to import operator: {operator}. err: {e}")
        try:
            task = operator_obj(**task_params)
        except Exception as e:
            raise Exception(f"Failed to create {operator_obj} task. err: {e}")
        return task

    def build(self):
        """
        Generates a DAG from the DAG parameters.

        :returns: dict with dag_id and DAG object
        """
        dag_params = self.get_dag_params()

        dag = DAG(
            dag_params["dag_id"],
            schedule_interval=dag_params["schedule_interval"],
            description=dag_params.get("description"),
            max_active_runs=dag_params.get(
                "max_active_runs",
                configuration.conf.getint("core", "max_active_runs_per_dag"),
            ),
            default_args=dag_params.get("default_args", {}),
        )

        tasks = dag_params["tasks"]

        # create dictionary to track tasks and set dependencies
        tasks_dict = {}

        for task_name, task_conf in tasks.items():
            task_conf["task_id"] = task_name
            operator = task_conf["operator"]
            task_conf["dag"] = dag
            params = {k: v for k, v in task_conf.items() if k not in SYSTEM_PARAMS}
            task = self.make_task(operator, params)
            tasks_dict[task.task_id] = task
        # set task dependencies after creating tasks
        for task_name, task_conf in tasks.items():
            if task_conf.get("dependencies"):
                source_task = tasks_dict[task_name]
                for dep in task_conf["dependencies"]:
                    dep_task = tasks_dict[dep]
                    source_task.set_upstream(dep_task)

        return {"dag_id": dag_params["dag_id"], "dag": dag}
