import os
import datetime

import pytest
from airflow import DAG
from airflow.operators.bash_operator import BashOperator

from dagfactory import dagbuilder

here = os.path.dirname(__file__)


class TestDagBuilder(object):
    default_config = {
        "default_args": {
            "owner": "default_owner",
            "start_date": datetime.date(2018, 3, 1),
        },
        "max_active_runs": 1,
        "schedule_interval": "0 1 * * *",
    }
    dag_config = {
        "default_args": {"owner": "custom_owner"},
        "description": "this is an example dag",
        "schedule_interval": "0 3 * * *",
        "tasks": {
            "task_1": {
                "operator": "airflow.operators.bash_operator.BashOperator",
                "bash_command": "echo 1",
            },
            "task_2": {
                "operator": "airflow.operators.bash_operator.BashOperator",
                "bash_command": "echo 2",
                "dependencies": ["task_1"],
            },
            "task_3": {
                "operator": "airflow.operators.bash_operator.BashOperator",
                "bash_command": "echo 3",
                "dependencies": ["task_1"],
            },
        },
    }

    def test_get_dag_params(self):
        td = dagbuilder.DagBuilder("test_dag", self.dag_config, self.default_config)
        expected = {
            "dag_id": "test_dag",
            "default_args": {
                "owner": "custom_owner",
                "start_date": datetime.datetime(2018, 3, 1, 0, 0),
            },
            "description": "this is an example dag",
            "schedule_interval": "0 3 * * *",
            "max_active_runs": 1,
            "tasks": {
                "task_1": {
                    "operator": "airflow.operators.bash_operator.BashOperator",
                    "bash_command": "echo 1",
                },
                "task_2": {
                    "operator": "airflow.operators.bash_operator.BashOperator",
                    "bash_command": "echo 2",
                    "dependencies": ["task_1"],
                },
                "task_3": {
                    "operator": "airflow.operators.bash_operator.BashOperator",
                    "bash_command": "echo 3",
                    "dependencies": ["task_1"],
                },
            },
        }
        actual = td.get_dag_params()
        assert actual == expected

    def test_get_dag_params_no_start_date(self):
        td = dagbuilder.DagBuilder("test_dag", {}, {})
        with pytest.raises(Exception):
            td.get_dag_params()

    def test_make_task_valid(self):
        td = dagbuilder.DagBuilder("test_dag", self.dag_config, self.default_config)
        operator = "airflow.operators.bash_operator.BashOperator"
        task_params = {"task_id": "test_task", "bash_command": "echo 1"}
        actual = td.make_task(operator, task_params)
        assert actual.task_id == "test_task"
        assert actual.bash_command == "echo 1"
        assert isinstance(actual, BashOperator)

    def test_make_task_bad_operator(self):
        td = dagbuilder.DagBuilder("test_dag", self.dag_config, self.default_config)
        operator = "not_real"
        task_params = {"task_id": "test_task", "bash_command": "echo 1"}
        with pytest.raises(Exception):
            td.make_task(operator, task_params)

    def test_make_task_missing_required_param(self):
        td = dagbuilder.DagBuilder("test_dag", self.dag_config, self.default_config)
        operator = "airflow.operators.bash_operator.BashOperator"
        task_params = {"task_id": "test_task"}
        with pytest.raises(Exception):
            td.make_task(operator, task_params)

    def test_build(self):
        td = dagbuilder.DagBuilder("test_dag", self.dag_config, self.default_config)
        actual = td.build()
        assert actual["dag_id"] == "test_dag"
        assert isinstance(actual["dag"], DAG)
        assert len(actual["dag"].tasks) == 3
        assert actual["dag"].task_dict["task_1"].downstream_task_ids == {
            "task_2",
            "task_3",
        }
