import os
import datetime

import pytest

from dagfactory import dagfactory

here = os.path.dirname(__file__)


class TestDagFactory(object):
    test_dag_factory = os.path.join(here, "fixtures/dag_factory.yml")
    invalid_yaml = os.path.join(here, "fixtures/invalid_yaml.yml")
    invalid_dag_factory = os.path.join(here, "fixtures/invalid_dag_factory.yml")

    def test_validate_config_filepath_valid(self):
        dagfactory.DagFactory._validate_config_filepath(self.test_dag_factory)

    def test_validate_config_filepath_invalid(self):
        with pytest.raises(Exception):
            dagfactory.DagFactory._validate_config_filepath("config.yml")

    def test_load_config_valid(self):
        expected = {
            "default": {
                "default_args": {
                    "owner": "default_owner",
                    "start_date": datetime.date(2018, 3, 1),
                },
                "max_active_runs": 1,
                "schedule_interval": "0 1 * * *",
            },
            "example_dag": {
                "default_args": {"owner": "custom_owner", "start_date": "2 days"},
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
            },
            "example_dag2": {
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
                }
            },
        }
        actual = dagfactory.DagFactory._load_config(self.test_dag_factory)
        assert actual == expected

    def test_load_config_invalid(self):
        with pytest.raises(Exception):
            dagfactory.DagFactory._load_config(self.invalid_yaml)

    def test_get_dag_configs(self):
        td = dagfactory.DagFactory(self.test_dag_factory)
        expected = {
            "example_dag": {
                "default_args": {"owner": "custom_owner", "start_date": "2 days"},
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
            },
            "example_dag2": {
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
                }
            },
        }
        actual = td.get_dag_configs()
        assert actual == expected

    def test_get_default_config(self):
        td = dagfactory.DagFactory(self.test_dag_factory)
        expected = {
            "default_args": {
                "owner": "default_owner",
                "start_date": datetime.date(2018, 3, 1),
            },
            "max_active_runs": 1,
            "schedule_interval": "0 1 * * *",
        }
        actual = td.get_default_config()
        assert actual == expected

    def test_generate_dags_valid(self):
        td = dagfactory.DagFactory(self.test_dag_factory)
        td.generate_dags(globals())
        assert "example_dag" in globals()
        assert "example_dag2" in globals()
        assert "fake_example_dag" not in globals()

    def test_generate_dags_invalid(self):
        td = dagfactory.DagFactory(self.invalid_dag_factory)
        with pytest.raises(Exception):
            td.generate_dags(globals())
